const assert = require('assert');

const originalWx = global.wx;
const originalSetTimeout = global.setTimeout;
const storage = new Map();

global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'release' } }; },
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};
// 本测试只验证立即完成的接口响应；不运行第 2 项才会调整的超时逻辑。
global.setTimeout = () => 1;

const config = require('../../config/v2');
const runtime = require('../runtime-context');
const cloudApi = require('../cloud-api');
const postHatch = require('../post-hatch-companion');
const chatService = require('../chat-service');
const originalBackendEnabled = config.backendEnabled;
const originalChatReply = cloudApi.chatReply;
const originalMode = runtime.getMode();
let capturedPayload = null;

config.backendEnabled = true;
runtime.setMode('live');
cloudApi.chatReply = payload => {
  capturedPayload = payload;
  const isCrisis = payload.message === '我不想活了';
  return Promise.resolve({
    ok: true,
    mode: 'live',
    request_id: payload.client_message_id,
    result_type: isCrisis ? 'CRISIS_REPLY' : 'REPLY',
    user_message: {
      message_id: isCrisis ? 'user-crisis-1' : 'user-server-1',
      client_message_id: payload.client_message_id,
      role: 'user',
      created_at: '2026-08-10T12:00:00+08:00'
    },
    reply: {
      message_id: isCrisis ? 'reply-crisis-1' : 'reply-server-1',
      role: 'assistant',
      text: isCrisis ? '这是服务端审核后的危机安全结果。' : '收到啦。',
      safety_result: isCrisis ? 'crisis' : 'passed',
      fallback_used: false,
      created_at: '2026-08-10T12:00:01+08:00'
    }
  });
};

(async () => {
  try {
    const clientMessageId = 'chat-stable-message-1';
    const result = await postHatch.sendSceneMessage(
      { id: 'egg-live-1' },
      { currentState: { atHome: true, canTalk: true, major: 'home', key: 'reading' }, chatAccess: { status: 'available' } },
      '这句话只处理一次',
      clientMessageId
    );

    assert.equal(result.ok, true, '正式聊天适配层应接受有效安全回复');
    assert.equal(capturedPayload.client_message_id, clientMessageId, '服务请求必须携带稳定客户端消息 ID');
    assert.equal(capturedPayload.request_id, clientMessageId, '重试幂等键必须复用客户端消息 ID');
    assert.equal(result.messageId, 'reply-server-1', '回复消息 ID 必须返回页面用于去重');
    assert.equal(result.userMessageId, 'user-server-1', '用户消息 ID 必须返回页面用于确认');
    assert.equal(result.createdAt, '2026-08-10T12:00:01+08:00', '回复时间必须读取服务端 reply.created_at');
    assert.equal(result.userCreatedAt, '2026-08-10T12:00:00+08:00', '用户消息时间必须读取服务端 user_message.created_at');

    const crisisResult = await postHatch.sendSceneMessage(
      { id: 'egg-live-1' },
      { currentState: { atHome: true, canTalk: true, major: 'home', key: 'reading' }, chatAccess: { status: 'available' } },
      '我不想活了',
      'chat-crisis-message-1'
    );
    assert.equal(capturedPayload.message, '我不想活了', '危机表达必须原样发送至服务端');
    assert.equal(crisisResult.ok, true, '服务端危机安全结果必须可以展示');
    assert.equal(crisisResult.safety, 'crisis', '危机状态必须来自服务端');
    assert.equal(crisisResult.text, '这是服务端审核后的危机安全结果。', 'App 不得改写服务端危机安全文案');
    assert.equal(Object.prototype.hasOwnProperty.call(capturedPayload, 'history'), false, 'App 不得上传历史作为模型上下文');
    assert.equal(Object.prototype.hasOwnProperty.call(capturedPayload, 'scene_context'), false, 'App 不得上传场景作为权威模型上下文');

    cloudApi.chatReply = () => Promise.resolve({
      ok: true,
      mode: 'live',
      request_id: 'chat-missing-id',
      result_type: 'REPLY',
      user_message: { message_id: 'user-missing-reply-id', client_message_id: 'chat-missing-id', role: 'user', created_at: '2026-08-10T12:00:00+08:00' },
      reply: { role: 'assistant', text: '缺少消息 ID 的响应不能展示。', safety_result: 'passed', fallback_used: false, created_at: '2026-08-10T12:00:01+08:00' }
    });
    const invalid = await chatService.requestReply({ eggId: 'egg-live-1', text: '测试无 ID 响应', clientMessageId: 'chat-missing-id' });
    assert.equal(invalid.ok, false, '缺少服务端权威消息 ID 的成功响应必须视为无效，不能写入聊天记录页面');

    function validContractResponse() {
      return {
        ok: true,
        mode: 'live',
        request_id: 'chat-contract-invalid',
        result_type: 'REPLY',
        user_message: {
          message_id: 'contract-user',
          client_message_id: 'chat-contract-invalid',
          role: 'user',
          text: '合同校验',
          created_at: '2026-08-10T12:00:00+08:00'
        },
        reply: {
          message_id: 'contract-reply',
          role: 'assistant',
          text: '合同完整时才能展示。',
          safety_result: 'passed',
          fallback_used: false,
          created_at: '2026-08-10T12:00:01+08:00'
        }
      };
    }
    const invalidMutations = [
      response => { delete response.result_type; },
      response => { response.result_type = 'CRISIS_REPLY'; },
      response => { delete response.reply.created_at; },
      response => { response.user_message.client_message_id = 'another-message'; },
      response => { response.request_id = 'another-request'; },
      response => { delete response.reply.fallback_used; },
      response => { response.reply.role = 'user'; }
    ];
    for (const mutate of invalidMutations) {
      const response = validContractResponse();
      mutate(response);
      cloudApi.chatReply = () => Promise.resolve(response);
      const rejected = await chatService.requestReply({ eggId: 'egg-live-1', text: '合同校验', clientMessageId: 'chat-contract-invalid' });
      assert.equal(rejected.ok, false, '成功响应的类型、安全结果、角色、幂等回显、消息 ID 与服务端时间必须全部有效');
    }
    cloudApi.chatReply = () => Promise.resolve({
      ok: false,
      code: 'NEW_INPUT_POLICY',
      message: '服务端审核后的拒绝提示。',
      resultType: 'INPUT_REJECTED',
      requestId: 'chat-input-rejected-contract'
    });
    const inputRejected = await chatService.requestReply({ eggId: 'egg-live-1', text: '服务端拒绝', clientMessageId: 'chat-input-rejected-contract' });
    assert.equal(inputRejected.resultType, 'INPUT_REJECTED', '正式适配层必须保留服务端 INPUT_REJECTED 结果类型，供页面按输入拒绝处理');
    assert.equal(inputRejected.code, 'NEW_INPUT_POLICY', '正式适配层不得把服务端拒绝码改写为网络失败');
    console.log('聊天稳定消息 ID 与请求幂等键传递校验通过。');
  } finally {
    config.backendEnabled = originalBackendEnabled;
    cloudApi.chatReply = originalChatReply;
    runtime.setMode(originalMode);
    global.setTimeout = originalSetTimeout;
    global.wx = originalWx;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
