const assert = require('assert');

const originalWx = global.wx;
const originalPage = global.Page;
const storage = new Map();

global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

let chatPage;
global.Page = definition => { chatPage = definition; };
require('../../pages/chat/chat');

const postHatch = require('../post-hatch-companion');
const originalSendSceneMessage = postHatch.sendSceneMessage;
const chatService = require('../chat-service');
const originalRequestReply = chatService.requestReply;
const analytics = require('../analytics');
const originalTrack = analytics.track;
const config = require('../../config/v2');
const runtime = require('../runtime-context');
const originalBackendEnabled = config.backendEnabled;
const originalMode = runtime.getMode();
const originalGetMode = runtime.getMode;
let requestCount = 0;
const serverResults = new Map();
function confirmedResult(clientMessageId, replyText) {
  return {
    ok: true,
    mode: 'live',
    resultType: 'REPLY',
    requestId: clientMessageId,
    messageId: `reply-${clientMessageId}`,
    userMessageId: `user-${clientMessageId}`,
    clientMessageId,
    userCreatedAt: '2026-08-10T12:00:00+08:00',
    createdAt: '2026-08-10T12:00:01+08:00',
    text: replyText || '收到。',
    safety: 'passed',
    fallbackUsed: false
  };
}
postHatch.sendSceneMessage = (pet, snapshot, text, clientMessageId) => {
  requestCount += 1;
  return Promise.resolve(serverResults.get(text) || confirmedResult(clientMessageId));
};
analytics.track = () => ({ ok: true });

function contextFor(draft) {
  return Object.assign({}, chatPage, {
    pageActive: true,
    data: Object.assign({}, chatPage.data, {
      pet: { id: 'egg-input-validation' },
      snapshot: { currentState: { key: 'reading' }, chatAccess: { status: 'available' } },
      chatAvailable: true,
      messages: [{ id: 'opening', role: 'assistant', text: '我在看书。', status: 'sent' }],
      draft,
      busy: false,
      error: ''
    }),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    }
  });
}

(async () => {
  try {
    const blankInputs = ['', '   \n  '];
    for (const text of blankInputs) {
      const context = contextFor(text);
      chatPage.onSend.call(context);
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(context.data.messages.length, 1, '空白草稿不应生成临时消息气泡');
      assert.equal(requestCount, 0, '空白草稿不应通过页面发送按钮发出');
    }

    const rejectedInputs = [
      ['你'.repeat(121), 'INPUT_TOO_LONG', '最多 120 个字'],
      ['请联系我 13800138000', 'SENSITIVE_INFO', '请不要发送个人敏感信息'],
      ['赌博怎么下注', 'CONTENT_REJECTED', '换个说法试试']
    ];
    for (const [text, code, serverMessage] of rejectedInputs) {
      serverResults.set(text, { ok: false, code, message: serverMessage });
      const context = contextFor(text);
      chatPage.onSend.call(context);
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(context.data.messages.length, 1, `${code} 必须由服务端拒绝后移除临时消息气泡`);
      assert.equal(context.data.draft, text, `${code} 必须保留原草稿`);
      assert.equal(context.data.error, serverMessage, `${code} 必须展示服务端提示`);
      assert.equal(context.data.serverInputError, true, `${code} 只可根据服务端拒绝结果触发输入框错误态`);
    }
    assert.equal(requestCount, rejectedInputs.length, '超长、敏感信息和一般违规都必须发送至服务端');

    const valid = contextFor('你'.repeat(120));
    chatPage.onSend.call(valid);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(requestCount, rejectedInputs.length + 1, '普通输入必须正常调用聊天服务');
    assert.equal(valid.data.messages.filter(item => item.role === 'user').length, 1, '合法输入必须创建用户消息');
    assert.equal(valid.data.messages.find(item => item.role === 'user').status, 'sent', '合法输入成功后必须确认发送');

    let crisisPayload = null;
    config.backendEnabled = true;
    runtime.setMode('live');
    chatService.requestReply = payload => {
      crisisPayload = payload;
      return Promise.resolve({ ok: true, text: '由服务端审核后的回复。', safety: 'passed' });
    };
    const homeSnapshot = { currentState: { atHome: true, canTalk: true, major: 'home', key: 'reading' }, chatAccess: { status: 'available' } };
    const crisis = await originalSendSceneMessage({ id: 'egg-crisis' }, homeSnapshot, '怎么自杀', 'chat-crisis-input-1');
    assert.equal(crisisPayload.text, '怎么自杀', '危机表达必须完整交给服务端判断');
    assert.equal(crisis.text, '由服务端审核后的回复。', 'App 只能展示服务端返回的审核结果');
    const overLimit = await originalSendSceneMessage({ id: 'egg-input-limit' }, homeSnapshot, '你'.repeat(121), 'chat-over-limit-input-1');
    assert.equal(crisisPayload.text, '你'.repeat(121), '超长内容不得由 App 截断或拦截，必须交给服务端校验');
    assert.equal(overLimit.text, '由服务端审核后的回复。', 'App 只展示服务端响应');

    const away = await originalSendSceneMessage(
      { id: 'egg-away' },
      { currentState: { atHome: false, major: 'travel', key: 'away' }, chatAccess: { status: 'available' } },
      '外出时不能发送',
      'chat-away-input-1'
    );
    assert.equal(away.code, 'TALK_NOT_AVAILABLE', '即使 chat_access 错误标记 available，外出状态也必须保守拒绝聊天');

    chatService.requestReply = originalRequestReply;
    config.backendEnabled = false;
    const disconnectedLive = await originalSendSceneMessage({ id: 'egg-live-disconnected' }, homeSnapshot, '不能回退 demo', 'chat-live-disconnected-1');
    assert.equal(disconnectedLive.code, 'BACKEND_NOT_CONNECTED', 'live 后端未配置时必须明确阻断，不能回退 demo fixture');
    assert.notEqual(disconnectedLive.mode, 'demo', 'live 后端未配置时不得返回 demo 环境结果');

    runtime.setMode('demo');
    const missingClientMessageId = await originalSendSceneMessage({ id: 'egg-demo-missing-id' }, homeSnapshot, '缺少消息编号');
    assert.equal(missingClientMessageId.code, 'CHAT_REQUEST_INVALID', 'demo fixture 也必须拒绝缺少 clientMessageId 的请求');

    runtime.getMode = () => 'unsupported';
    const unsupportedMode = await originalSendSceneMessage({ id: 'egg-unsupported-mode' }, homeSnapshot, '未知模式不能聊天', 'chat-unsupported-mode-1');
    assert.equal(unsupportedMode.code, 'BACKEND_REQUIRED', '非 demo/live 模式必须保守阻断，不能进入 fixture');
    console.log('聊天输入与危机表达服务端校验、App 展示路径校验通过。');
  } finally {
    postHatch.sendSceneMessage = originalSendSceneMessage;
    chatService.requestReply = originalRequestReply;
    analytics.track = originalTrack;
    config.backendEnabled = originalBackendEnabled;
    runtime.getMode = originalGetMode;
    runtime.setMode(originalMode);
    global.wx = originalWx;
    global.Page = originalPage;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
