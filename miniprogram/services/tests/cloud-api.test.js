const assert = require('assert');
const config = require('../../config/v2');

config.backendEnabled = true;
config.apiBase = 'https://api.example.com';

let uploadOptions = null;
let requestOptions = null;
let requestMode = 'success';
global.wx = {
  request(options) {
    requestOptions = options;
    if (requestMode === 'http-error') {
      options.success({ statusCode: 503, data: { message: 'unavailable' } });
      return { abort() {} };
    }
    if (requestMode === 'timeout') {
      options.fail({ errMsg: 'request:fail timeout' });
      return { abort() {} };
    }
    options.success({
      statusCode: 200,
      data: {
        success: true,
        request_id: options.data.request_id,
        server_time: '2026-08-03T10:00:00+08:00',
        data: { user: { id: 'user-1' }, session_id: 'server-session-1' },
        error: null
      }
    });
    return { abort() {} };
  },
  uploadFile(options) {
    uploadOptions = options;
    options.success({ statusCode: 200, data: JSON.stringify({ ok: true, mode: 'live', avatar_url: 'https://cdn.example.com/avatar.jpg' }) });
  }
};

const cloudApi = require('../cloud-api');

(async () => {
  const bootstrap = await cloudApi.bootstrap('login-code');
  assert.equal(requestOptions.timeout, 15000, '正式请求必须设置明确超时');
  assert.equal(requestOptions.data.client_version, config.version, '正式请求必须携带客户端版本');
  assert.equal(typeof requestOptions.data.session_id, 'string', '正式请求必须携带会话 ID');
  assert.equal(bootstrap.ok, true, '统一 success/data 响应必须归一化为 ok 结果');
  assert.equal(bootstrap.user.id, 'user-1', '统一响应 data 必须解包给业务层');
  assert.equal(bootstrap.serverTs, Date.parse('2026-08-03T10:00:00+08:00'), '服务端时间必须归一化为毫秒时间戳');

  requestMode = 'http-error';
  const unavailable = await cloudApi.call('health');
  assert.equal(unavailable.code, 'HTTP_503', '非 2xx 响应不得继续按成功数据解析');
  requestMode = 'timeout';
  const timeout = await cloudApi.call('health');
  assert.equal(timeout.code, 'REQUEST_TIMEOUT', '请求超时必须与普通网络错误区分');
  requestMode = 'success';

  const result = await cloudApi.uploadAvatar('wxfile://tmp/avatar.jpg');
  assert.equal(uploadOptions.url, 'https://api.example.com/uploadAvatar', '头像必须上传到独立后端接口');
  assert.equal(uploadOptions.filePath, 'wxfile://tmp/avatar.jpg', '客户端临时文件必须作为上传文件体传输');
  assert.equal(uploadOptions.name, 'avatar', '后端上传字段必须固定为 avatar');
  assert.equal(uploadOptions.formData.mode, 'live', '头像上传必须显式标记 live');
  assert.equal(uploadOptions.formData.client_version, config.version, '头像上传必须携带客户端版本');
  assert.equal(typeof uploadOptions.formData.session_id, 'string', '头像上传必须携带会话 ID');
  assert.equal(result.avatarUrl, 'https://cdn.example.com/avatar.jpg', '头像接口必须归一化返回持久化 URL');
  console.log('独立后端头像上传校验通过。');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
