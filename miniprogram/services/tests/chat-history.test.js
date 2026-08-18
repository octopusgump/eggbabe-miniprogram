const assert = require('assert');

const originalWx = global.wx;
const originalPage = global.Page;
const storage = new Map();
global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'release' } }; },
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const config = require('../../config/v2');
const runtime = require('../runtime-context');
const cloudApi = require('../cloud-api');
const postHatch = require('../post-hatch-companion');
const petStore = require('../../utils/pet-store');
const analytics = require('../analytics');
const originalBackendEnabled = config.backendEnabled;
const originalMode = runtime.getMode();
const originalGetChatHistory = cloudApi.getChatHistory;
const originalGetPet = petStore.getPet;
const originalGetStage = petStore.getStage;
const originalGetSnapshot = postHatch.getSnapshot;
const originalPageHistory = postHatch.getChatHistory;
const originalTrack = analytics.track;
let capturedRequest = null;

config.backendEnabled = true;
runtime.setMode('live');
cloudApi.getChatHistory = (eggId, cursor, limit) => {
  capturedRequest = { eggId, cursor, limit };
  return Promise.resolve({
    ok: true,
    mode: 'live',
    messages: [
      { message_id: 'server-user-1', client_message_id: 'chat-server-user-1', role: 'user', text: '你好', created_at: '2026-08-10T16:30:00Z' },
      { message_id: 'server-assistant-1', role: 'assistant', text: '你好呀', created_at: '2026-08-10T16:30:01Z' }
    ],
    next_cursor: 'cursor-older',
    has_more: true
  });
};

function flush() { return new Promise(resolve => setImmediate(resolve)); }

(async () => {
  try {
    const history = await postHatch.getChatHistory({ id: 'egg-history-1' }, '', 20);
    assert.deepEqual(capturedRequest, { eggId: 'egg-history-1', cursor: '', limit: 20 }, '历史适配层必须按蛋、游标和页大小调用服务端');
    assert.equal(history.messages[0].id, 'server-user-1', '服务端用户消息 ID 必须保留给页面去重');
    assert.equal(history.messages[0].clientMessageId, 'chat-server-user-1', '服务端返回的客户端消息 ID 必须保留，用于前台同步时确认未送达消息');
    assert.equal(history.messages[1].role, 'assistant', '服务端消息角色必须标准化');
    assert.equal(history.nextCursor, 'cursor-older', '服务端游标必须交给页面继续分页');

    function validHistoryPage() {
      return {
        ok: true,
        mode: 'live',
        messages: [
          { message_id: 'strict-user', client_message_id: 'strict-client', role: 'user', text: '第一条', created_at: '2026-08-10T10:00:00+08:00' },
          { message_id: 'strict-reply', role: 'assistant', text: '第二条', created_at: '2026-08-10T10:00:01+08:00' }
        ],
        next_cursor: '',
        has_more: false
      };
    }
    const invalidHistoryMutations = [
      page => { page.messages[0].role = 'system'; },
      page => { delete page.messages[0].created_at; },
      page => { delete page.messages[0].client_message_id; },
      page => { page.messages[1].message_id = page.messages[0].message_id; },
      page => { page.messages.reverse(); },
      page => { page.has_more = true; page.next_cursor = ''; }
    ];
    for (const mutate of invalidHistoryMutations) {
      const page = validHistoryPage();
      mutate(page);
      cloudApi.getChatHistory = () => Promise.resolve(page);
      const rejectedPage = await postHatch.getChatHistory({ id: 'egg-history-1' }, '', 20);
      assert.equal(rejectedPage.ok, false, '角色、时间、用户客户端 ID、顺序、消息 ID 或游标非法时必须拒绝整页历史');
    }

    let chatPage;
    global.Page = definition => { chatPage = definition; };
    require('../../pages/chat/chat');
    const pet = { id: 'egg-history-1', name: '小月', prototype: '玉兔' };
    petStore.getPet = () => pet;
    petStore.getStage = () => 'hatched';
    postHatch.getSnapshot = () => Promise.resolve({
      ok: true,
      mood: { line: '我在呢。' },
      currentState: { atHome: true, canTalk: true, key: 'read', label: '看书' },
      chatAccess: { status: 'available', reason: 'AT_HOME', message: '' }
    });
    let historyCall = 0;
    postHatch.getChatHistory = () => {
      historyCall += 1;
      if (historyCall === 1) return Promise.resolve(history);
      return Promise.resolve({
        ok: true,
        messages: [
          { id: 'server-user-0', clientMessageId: 'chat-server-user-0', role: 'user', text: '更早的一句', createdAt: '2026-08-09T09:00:00+08:00' },
          { id: 'server-user-1', clientMessageId: 'chat-server-user-1', role: 'user', text: '你好', createdAt: '2026-08-10T10:00:00+08:00' }
        ],
        nextCursor: '',
        hasMore: false
      });
    };
    analytics.track = () => ({ ok: true });
    const context = Object.assign({}, chatPage, {
      pageActive: true,
      data: Object.assign({}, chatPage.data),
      setData(patch, callback) {
        Object.assign(this.data, patch);
        if (callback) callback();
      }
    });
    chatPage.loadConversation.call(context);
    await flush();
    await flush();
    assert.deepEqual(context.data.messages.map(item => item.id), ['server-user-1', 'server-assistant-1'], '首次进入必须显示服务端历史，而不是重新生成开场白');
    assert.equal(context.data.hasMoreHistory, true, '首次历史页必须保留服务端分页状态');
    assert.equal(context.data.messages[0].dateLabel, '2026年8月11日', '历史消息日期必须由服务端 created_at 转换为产品东八区');
    assert.equal(context.data.messages[0].compactDateLabel, '8月11日 · 星期二', '紧凑日期的星期必须按东八区跨日结果计算');
    assert.equal(context.data.messages[0].dateDisplayLabel, '2026年8月11日', '默认必须显示东八区完整日期');
    chatPage.onToggleDateFormat.call(context);
    assert.equal(context.data.messages[0].dateDisplayLabel, '8月11日 · 星期二', '点击日期后必须直接更新为东八区月日和星期');
    chatPage.onToggleDateFormat.call(context);
    assert.equal(context.data.messages[0].dateDisplayLabel, '2026年8月11日', '再次点击日期后必须恢复东八区完整日期');
    assert.equal(context.data.messages[0].timeLabel, '00:30', '历史消息时间必须由服务端 created_at 转换为东八区');
    assert.equal(context.data.messages[1].dateLabel, '', '同一天连续消息不应重复显示日期分隔');
    context.data.messages.push({ id: 'user-local-failed', clientMessageId: 'chat-server-user-1', role: 'user', text: '你好', status: 'failed' });
    postHatch.getChatHistory = () => Promise.resolve(history);
    chatPage.refreshLatestHistory.call(context);
    await flush();
    assert.equal(context.data.messages.filter(item => item.id === 'user-local-failed').length, 0, '前台同步发现同一 client_message_id 已被服务端确认时，必须移除本地失败副本');
    assert.equal(context.data.messages.filter(item => item.id === 'server-user-1').length, 1, '前台同步不得重复服务端已确认记录');

    postHatch.getChatHistory = () => Promise.resolve({
      ok: true,
      messages: [
        { id: 'server-user-0', clientMessageId: 'chat-server-user-0', role: 'user', text: '更早的一句', createdAt: '2026-08-09T09:00:00+08:00' },
        { id: 'server-user-1', clientMessageId: 'chat-server-user-1', role: 'user', text: '你好', createdAt: '2026-08-10T10:00:00+08:00' }
      ],
      nextCursor: '',
      hasMore: false
    });
    chatPage.onLoadMoreHistory.call(context);
    await flush();
    assert.deepEqual(context.data.messages.map(item => item.id), ['server-user-0', 'server-user-1', 'server-assistant-1'], '向上分页必须插入更早消息并按 ID 去重');
    assert.equal(context.data.scrollTarget, 'message-server-user-1', '向上分页后必须锚定原第一条消息，避免阅读位置跳动');

    let retryCalls = 0;
    context.data.historyCursor = 'cursor-retry';
    context.data.hasMoreHistory = true;
    postHatch.getChatHistory = () => {
      retryCalls += 1;
      if (retryCalls === 1) return Promise.resolve({ ok: false, message: '更多聊天记录没有加载好，请重试' });
      return Promise.resolve({
        ok: true,
        messages: [{ id: 'server-user--1', clientMessageId: 'chat-server-user--1', role: 'user', text: '最早的一句', createdAt: '2026-08-08T08:00:00+08:00' }],
        nextCursor: '',
        hasMore: false
      });
    };
    chatPage.onLoadMoreHistory.call(context);
    await flush();
    assert.equal(context.data.historyError, '更多聊天记录没有加载好，请重试', '历史分页失败必须显示独立的历史错误提示');
    assert.equal(context.data.historyRetryCursor, 'cursor-retry', '历史分页失败必须记住失败页游标');
    chatPage.onRetryHistory.call(context);
    await flush();
    assert.equal(retryCalls, 2, '点击历史重试必须再次读取失败页，而不是重新加载整个对话');
    assert.equal(context.data.messages[0].id, 'server-user--1', '重试成功后必须保留并插入更早历史');

    postHatch.getChatHistory = () => Promise.resolve({ ok: true, messages: [], nextCursor: '', hasMore: false });
    const emptyContext = Object.assign({}, chatPage, {
      pageActive: true,
      data: Object.assign({}, chatPage.data),
      setData(patch, callback) {
        Object.assign(this.data, patch);
        if (callback) callback();
      }
    });
    petStore.getPet = () => pet;
    chatPage.loadConversation.call(emptyContext);
    await flush();
    await flush();
    assert.deepEqual(emptyContext.data.messages, [], '服务端空历史必须保持空列表，App 不得伪造本地开场白');

    const petA = { id: 'egg-history-a', ownerId: 'owner-1' };
    const petB = { id: 'egg-history-b', ownerId: 'owner-1' };
    let activePet = petA;
    let resolveStaleHistory;
    petStore.getPet = () => activePet;
    postHatch.getChatHistory = () => new Promise(resolve => { resolveStaleHistory = resolve; });
    const staleContext = Object.assign({}, chatPage, {
      pageActive: true,
      data: Object.assign({}, chatPage.data, {
        pet: petA,
        snapshot: { currentState: { key: 'read' } },
        messages: [{ id: 'a-current', role: 'assistant', text: 'A', status: 'sent' }],
        historyLoading: false
      }),
      setData(patch, callback) {
        Object.assign(this.data, patch);
        if (callback) callback();
      }
    });
    chatPage.refreshLatestHistory.call(staleContext);
    activePet = petB;
    staleContext.data.pet = petB;
    staleContext.data.messages = [{ id: 'b-current', role: 'assistant', text: 'B', status: 'sent' }];
    resolveStaleHistory({
      ok: true,
      messages: [{ id: 'a-old', role: 'assistant', text: 'A 旧消息', createdAt: '2026-08-10T10:00:00+08:00' }],
      nextCursor: '',
      hasMore: false
    });
    await flush();
    assert.deepEqual(staleContext.data.messages.map(item => item.id), ['b-current'], '旧宠物的延迟历史回调不得覆盖新对话');

    activePet = petB;
    petStore.getPet = () => activePet;
    postHatch.getChatHistory = () => Promise.resolve({
      ok: true,
      messages: [
        { id: 'old-1', role: 'assistant', text: '正在阅读', createdAt: '2026-08-10T10:00:00+08:00' },
        { id: 'latest-1', role: 'assistant', text: '新消息', createdAt: '2026-08-10T10:01:00+08:00' }
      ],
      nextCursor: '',
      hasMore: false
    });
    const readingContext = Object.assign({}, chatPage, {
      pageActive: true,
      readingAtBottom: false,
      data: Object.assign({}, chatPage.data, {
        pet: petB,
        snapshot: { currentState: { key: 'read' } },
        messages: [{ id: 'old-1', role: 'assistant', text: '正在阅读', status: 'sent' }],
        historyLoading: false,
        scrollTarget: 'message-old-1'
      }),
      setData(patch, callback) {
        Object.assign(this.data, patch);
        if (callback) callback();
      }
    });
    chatPage.refreshLatestHistory.call(readingContext);
    await flush();
    assert.equal(readingContext.data.scrollTarget, 'message-old-1', '前台刷新时必须保留用户的历史阅读位置');
    console.log('聊天历史服务适配、首次加载与向上分页校验通过。');
  } finally {
    config.backendEnabled = originalBackendEnabled;
    runtime.setMode(originalMode);
    cloudApi.getChatHistory = originalGetChatHistory;
    petStore.getPet = originalGetPet;
    petStore.getStage = originalGetStage;
    postHatch.getSnapshot = originalGetSnapshot;
    postHatch.getChatHistory = originalPageHistory;
    analytics.track = originalTrack;
    global.wx = originalWx;
    global.Page = originalPage;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
