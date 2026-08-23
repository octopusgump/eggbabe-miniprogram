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
const analytics = require('../analytics');
const originalSendSceneMessage = postHatch.sendSceneMessage;
const originalTrack = analytics.track;
const requests = [];

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

postHatch.sendSceneMessage = (pet, snapshot, text, clientMessageId) => {
  const pending = deferred();
  requests.push({ pet, snapshot, text, clientMessageId, pending });
  return pending.promise;
};
analytics.track = () => ({ ok: true });

function contextFor(page) {
  return Object.assign({}, page, {
    pageActive: true,
    data: Object.assign({}, page.data, {
      pet: { id: 'egg-chat-retry' },
      snapshot: { currentState: { key: 'reading' }, chatAccess: { status: 'available' } },
      chatAvailable: true,
      messages: [{ id: 'opening', role: 'assistant', text: '我在看书。', status: 'sent' }],
      draft: '这句话请只发送一次',
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

(async () => {
  try {
    const context = contextFor(chatPage);
    chatPage.onSend.call(context);

    assert.equal(requests.length, 1, '首次发送必须只创建一个请求');
    const clientMessageId = requests[0].clientMessageId;
    assert.equal(Boolean(clientMessageId), true, '首次发送必须生成稳定客户端消息 ID');
    assert.equal(Object.prototype.hasOwnProperty.call(requests[0], 'history'), false, 'App 不得把页面历史传给服务端');
    assert.equal(context.data.messages.filter(item => item.role === 'user').length, 1, '首次发送只显示一个用户气泡');
    assert.equal(context.data.messages.find(item => item.clientMessageId === clientMessageId).status, 'pending', '首次发送状态必须为 pending');
    chatPage.onSend.call(context);
    assert.equal(requests.length, 1, '等待服务端确认时第二次点击不得创建重复请求');
    assert.equal(context.data.messages.filter(item => item.role === 'user').length, 1, '等待服务端确认时第二次点击不得创建重复气泡');

    requests[0].pending.resolve({ ok: false, message: '测试失败' });
    await flushPromises();
    assert.equal(context.data.messages.filter(item => item.role === 'user').length, 1, '发送失败不得新增用户气泡');
    assert.equal(context.data.messages.find(item => item.clientMessageId === clientMessageId).status, 'failed', '发送失败必须原地标记 failed');
    assert.equal(context.data.draft, '', '发送失败不得把原文恢复成一条可再次新发送的草稿');
    assert.equal(context.data.error, '', '网络发送失败只保留消息原地重试，不得重复显示输入框错误');

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      chatPage.onRetryMessage.call(context, { currentTarget: { dataset: { clientMessageId } } });
      const request = requests[attempt];
      assert.equal(request.clientMessageId, clientMessageId, '每次重试必须复用同一客户端消息 ID');
      assert.equal(Object.prototype.hasOwnProperty.call(request, 'history'), false, '重试也不得把页面历史传给服务端');
      assert.equal(context.data.messages.filter(item => item.role === 'user').length, 1, '重试必须复用原气泡');
      request.pending.resolve({ ok: false, message: '继续失败' });
      await flushPromises();
      assert.equal(context.data.error, '', '连续网络失败不得在输入框附近重复显示错误');
    }

    chatPage.onRetryMessage.call(context, { currentTarget: { dataset: { clientMessageId } } });
    const successfulRetry = requests[3];
    assert.equal(successfulRetry.clientMessageId, clientMessageId, '成功重试仍必须使用原客户端消息 ID');
    successfulRetry.pending.resolve({
      ok: true,
      mode: 'live',
      resultType: 'REPLY',
      requestId: clientMessageId,
      messageId: 'reply-1',
      userMessageId: 'user-server-1',
      clientMessageId,
      userCreatedAt: '2026-08-10T12:00:00+08:00',
      createdAt: '2026-08-10T12:00:01+08:00',
      text: '我只收到了一次。',
      safety: 'passed',
      fallbackUsed: false
    });
    await flushPromises();

    const userMessages = context.data.messages.filter(item => item.role === 'user');
    const replies = context.data.messages.filter(item => item.role === 'assistant' && item.id === 'reply-1');
    assert.equal(userMessages.length, 1, '连续失败和成功重试后仍只能有一个用户气泡');
    assert.equal(userMessages[0].status, 'sent', '成功后原气泡必须变为 sent');
    assert.equal(userMessages[0].id, 'user-server-1', '成功后用户气泡必须切换为服务端权威消息 ID');
    assert.equal(userMessages[0].serverMessageId, 'user-server-1', '成功后应保存服务端消息 ID');
    assert.equal(replies.length, 1, '成功后只能追加一条蛋宝宝回复');
    assert.equal(context.data.busy, false, '成功后必须释放发送锁');

    context.setData({ draft: '这条消息遇到网络异常', canSend: true });
    chatPage.onSend.call(context);
    const rejectedRequest = requests[4];
    const rejectedClientMessageId = rejectedRequest.clientMessageId;
    rejectedRequest.pending.reject(new Error('NETWORK_ERROR'));
    await flushPromises();
    assert.equal(context.data.messages.find(item => item.clientMessageId === rejectedClientMessageId).status, 'failed', '请求异常也必须原地标记失败');
    assert.equal(context.data.error, '', '请求异常也不得重复显示输入框错误');

    console.log('聊天失败消息原地重试与稳定消息 ID 校验通过。');
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
