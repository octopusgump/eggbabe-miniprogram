const assert = require('assert');

const originalWx = global.wx;
const originalPage = global.Page;
const storage = new Map([
  ['eggbabe_demo_compliance_age_range_v2', 'AGE_15_35']
]);

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
const analytics = require('../analytics');
const petStore = require('../../utils/pet-store');
const originalSendSceneMessage = postHatch.sendSceneMessage;
const originalTrack = analytics.track;
const originalGetPet = petStore.getPet;
const requests = [];

function deferredRequest() {
  let resolve;
  const promise = new Promise(onResolve => { resolve = onResolve; });
  let aborts = 0;
  promise.abort = () => { aborts += 1; };
  return { promise, resolve, get aborts() { return aborts; } };
}

postHatch.sendSceneMessage = () => {
  const request = deferredRequest();
  requests.push(request);
  return request.promise;
};
analytics.track = () => ({ ok: true });
petStore.getPet = () => ({ id: 'egg-lifecycle' });

function contextFor(page) {
  return Object.assign({}, page, {
    pageActive: true,
    data: Object.assign({}, page.data, {
      pet: { id: 'egg-lifecycle' },
      snapshot: { currentState: { key: 'reading' }, chatAccess: { status: 'available' } },
      chatAvailable: true,
      messages: [{ id: 'opening', role: 'assistant', text: '我在看书。', status: 'sent' }],
      draft: '这条消息不能被旧请求覆盖',
      busy: false,
      error: ''
    }),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    }
  });
}

function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

function confirmedResult(clientMessageId, replyId, text) {
  return {
    ok: true,
    mode: 'live',
    resultType: 'REPLY',
    requestId: clientMessageId,
    messageId: replyId,
    userMessageId: `server-${clientMessageId}`,
    clientMessageId,
    userCreatedAt: '2026-08-10T12:00:00+08:00',
    createdAt: '2026-08-10T12:00:01+08:00',
    text,
    safety: 'passed',
    fallbackUsed: false
  };
}

(async () => {
  try {
    const context = contextFor(chatPage);
    chatPage.onSend.call(context);
    const clientMessageId = context.data.messages.find(item => item.role === 'user').clientMessageId;
    const firstRequest = requests[0];

    chatPage.onHide.call(context);
    assert.equal(firstRequest.aborts, 1, '页面隐藏时必须取消当前聊天请求');
    assert.equal(context.data.busy, false, '页面隐藏取消请求后必须释放发送锁');
    assert.equal(context.data.messages.find(item => item.clientMessageId === clientMessageId).status, 'failed', '被取消的发送中消息必须原地标记失败');

    chatPage.onShow.call(context);
    chatPage.onRetryMessage.call(context, { currentTarget: { dataset: { clientMessageId } } });
    const retryRequest = requests[1];
    assert.equal(context.data.messages.filter(item => item.role === 'user').length, 1, '重试不应增加第二个用户气泡');

    firstRequest.resolve(confirmedResult(clientMessageId, 'old-reply', '这是已经过期的回复。'));
    await flushPromises();
    assert.equal(context.data.messages.some(item => item.id === 'old-reply'), false, '旧请求晚到时不得写入回复');
    assert.equal(context.data.messages.find(item => item.clientMessageId === clientMessageId).status, 'pending', '旧请求晚到时不得改变当前重试状态');

    retryRequest.resolve(confirmedResult(clientMessageId, 'new-reply', '这是当前请求的回复。'));
    await flushPromises();
    assert.equal(context.data.messages.filter(item => item.id === 'new-reply').length, 1, '当前请求成功后应写入唯一回复');
    assert.equal(context.data.messages.find(item => item.clientMessageId === clientMessageId).status, 'sent', '当前请求成功后用户消息必须确认发送');
    assert.equal(context.data.busy, false, '当前请求成功后必须释放发送锁');

    chatPage.onUnload.call(context);
    assert.equal(retryRequest.aborts, 0, '已完成请求在页面卸载时不得再次取消');
    console.log('聊天请求取消、旧回调隔离与重试生命周期校验通过。');
  } finally {
    postHatch.sendSceneMessage = originalSendSceneMessage;
    analytics.track = originalTrack;
    petStore.getPet = originalGetPet;
    global.wx = originalWx;
    global.Page = originalPage;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
