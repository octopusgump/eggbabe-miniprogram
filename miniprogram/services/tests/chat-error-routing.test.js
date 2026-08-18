const assert = require('assert');

const originalWx = global.wx;
const originalPage = global.Page;
const storage = new Map();
let navigateBackCount = 0;
global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); },
  navigateBack() { navigateBackCount += 1; },
  reLaunch() {}
};

let chatPage;
global.Page = definition => { chatPage = definition; };
require('../../pages/chat/chat');
const postHatch = require('../post-hatch-companion');
const analytics = require('../analytics');
const originalSendSceneMessage = postHatch.sendSceneMessage;
const originalTrack = analytics.track;
const results = new Map();
postHatch.sendSceneMessage = (pet, snapshot, text) => Promise.resolve(results.get(text));
analytics.track = () => ({ ok: true });

function contextFor(text) {
  return Object.assign({}, chatPage, {
    pageActive: true,
    data: Object.assign({}, chatPage.data, {
      pet: { id: 'routing-egg' },
      snapshot: { currentState: { key: 'read' }, chatAccess: { status: 'available' } },
      chatAccess: { status: 'available', reason: 'AT_HOME', message: '' },
      chatAvailable: true,
      messages: [],
      draft: text,
      canSend: true,
      busy: false,
      error: '',
      composerNotice: ''
    }),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    }
  });
}

function flush() { return new Promise(resolve => setImmediate(resolve)); }

(async () => {
  try {
    results.set('输入拒绝', { ok: false, code: 'NEW_INPUT_POLICY', resultType: 'INPUT_REJECTED', message: '请修改这句话。' });
    const rejected = contextFor('输入拒绝');
    chatPage.onSend.call(rejected);
    await flush();
    assert.equal(rejected.data.messages.length, 0, 'INPUT_REJECTED 必须移除临时气泡');
    assert.equal(rejected.data.draft, '输入拒绝', 'INPUT_REJECTED 必须恢复原草稿');
    assert.equal(rejected.data.serverInputError, true, 'INPUT_REJECTED 必须进入输入拒绝视觉，而非网络失败重试');

    results.set('权限变化', { ok: false, code: 'TALK_NOT_AVAILABLE', message: '蛋宝宝正在休息，晚一点再来。' });
    const unavailable = contextFor('权限变化');
    chatPage.onSend.call(unavailable);
    await flush();
    assert.equal(unavailable.data.messages.length, 0, '权限变化必须移除未确认气泡');
    assert.equal(unavailable.data.chatAvailable, false, '权限变化必须立即关闭输入位');
    assert.equal(unavailable.data.chatAccess.status, 'unavailable', 'App 不得把所有 TALK_NOT_AVAILABLE 猜成 away');
    assert.equal(navigateBackCount, 1, '聊天中权限变化时必须直接返回生活空间，不再展示不可聊天内容区');

    results.set('触发限流', { ok: false, code: 'RATE_LIMITED', message: '现在发送得有点快，请稍后再试。' });
    const limited = contextFor('触发限流');
    chatPage.onSend.call(limited);
    await flush();
    assert.equal(limited.data.messages.length, 0, '限流不得留下可点击重试的 failed 气泡');
    assert.equal(limited.data.draft, '触发限流', '限流必须保留草稿');
    assert.equal(limited.data.composerNotice, '现在发送得有点快，请稍后再试。', '限流必须展示服务端轻提示');

    results.set('会话失效', { ok: false, code: 'AUTH_REQUIRED', message: '登录状态已失效。' });
    const auth = contextFor('会话失效');
    chatPage.onSend.call(auth);
    await flush();
    assert.equal(auth.data.snapshot, null, '会话失效必须退出可输入聊天状态');
    assert.equal(auth.data.messages.length, 0, '会话失效不得保留可重试气泡或旧历史');
    assert.equal(auth.data.fatalErrorAction, 'login', '会话失效必须提供重新登录动作');

    results.set('网络失败', { ok: false, code: 'SERVICE_UNAVAILABLE', message: '服务暂不可用' });
    const retryable = contextFor('网络失败');
    chatPage.onSend.call(retryable);
    await flush();
    assert.equal(retryable.data.messages.length, 1, '服务异常必须保留原消息气泡');
    assert.equal(retryable.data.messages[0].status, 'failed', '服务异常必须允许使用同一消息原地重试');

    results.set('畸形成功', { ok: true, messageId: 'local-looking-id', text: '缺少正式合同字段。', safety: 'passed' });
    const malformed = contextFor('畸形成功');
    chatPage.onSend.call(malformed);
    await flush();
    assert.equal(malformed.data.messages[0].status, 'failed', '页面即使绕过 service mock，也不得确认缺少权威字段的成功响应');
    assert.equal(malformed.data.messages.some(item => item.id === 'local-looking-id'), false, '畸形成功响应不得追加回复');
    console.log('聊天输入拒绝、权限变化、限流、致命错误与可重试错误路由校验通过。');
  } finally {
    postHatch.sendSceneMessage = originalSendSceneMessage;
    analytics.track = originalTrack;
    global.wx = originalWx;
    global.Page = originalPage;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
