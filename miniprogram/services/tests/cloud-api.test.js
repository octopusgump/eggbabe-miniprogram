const assert = require('assert');
const config = require('../../config/v2');

config.backendEnabled = true;
config.apiBase = 'https://api.example.com';

let uploadOptions = null;
global.wx = {
  request() {},
  uploadFile(options) {
    uploadOptions = options;
    options.success({ statusCode: 200, data: JSON.stringify({ ok: true, mode: 'live', avatar_url: 'https://cdn.example.com/avatar.jpg' }) });
  }
};

const cloudApi = require('../cloud-api');

(async () => {
  const result = await cloudApi.uploadAvatar('wxfile://tmp/avatar.jpg');
  assert.equal(uploadOptions.url, 'https://api.example.com/uploadAvatar', '头像必须上传到独立后端接口');
  assert.equal(uploadOptions.filePath, 'wxfile://tmp/avatar.jpg', '客户端临时文件必须作为上传文件体传输');
  assert.equal(uploadOptions.name, 'avatar', '后端上传字段必须固定为 avatar');
  assert.equal(uploadOptions.formData.mode, 'live', '头像上传必须显式标记 live');
  assert.equal(result.avatarUrl, 'https://cdn.example.com/avatar.jpg', '头像接口必须归一化返回持久化 URL');
  console.log('独立后端头像上传校验通过。');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
