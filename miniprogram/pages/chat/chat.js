const petStore = require('../../utils/pet-store');
const lifeScenes = require('../../utils/life-scenes');
const postHatch = require('../../services/post-hatch-companion');
const analytics = require('../../services/analytics');
const config = require('../../config/v2');

let clientMessageSequence = 0;

function windowHeight() {
  try {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const height = Number(info && info.windowHeight);
    return Number.isFinite(height) && height > 0 ? Math.round(height) : 0;
  } catch (error) {
    return 0;
  }
}

function viewportStyle(windowHeightValue, keyboardHeight) {
  const availableHeight = Math.round(Number(windowHeightValue) || 0) - Math.max(0, Math.round(Number(keyboardHeight) || 0));
  return availableHeight > 0 ? `height:${availableHeight}px;` : '';
}

function chatAvatarSourceFor(pet) {
  const source = pet || {};
  const prototype = petStore.normalizePrototype(
    source.prototype || source.prototypeName || source.prototype_name || source.petType || source.pet_type
  );
  return prototype === '锦鲤'
    ? '/assets/ui/3d-scene-actions/runtime/ui_3d_scene_chat_boon_koi_96_v02.png'
    : '/assets/ui/3d-scene-actions/runtime/ui_3d_scene_chat_jade_rabbit_96_v02.png';
}

function createClientMessageId() {
  clientMessageSequence += 1;
  return `chat-${Date.now()}-${clientMessageSequence}-${Math.random().toString(36).slice(2, 8)}`;
}

function message(id, role, text, fields) {
  return Object.assign({ id, role, text: String(text || ''), status: 'sent' }, fields || {});
}

function updateMessage(messages, clientMessageId, fields) {
  return (Array.isArray(messages) ? messages : []).map(item => (
    item && item.clientMessageId === clientMessageId ? Object.assign({}, item, fields || {}) : item
  ));
}

function timestampParts(value) {
  const source = String(value || '');
  const dateMatch = source.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = source.match(/T(\d{2}):(\d{2})/);
  if (!dateMatch) return { dateKey: '', dateLabel: '', compactDateLabel: '', timeLabel: '' };
  const dateKey = dateMatch[0];
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date(Date.UTC(
    Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])
  )).getUTCDay()];
  return {
    dateKey,
    dateLabel: `${dateMatch[1]}年${Number(dateMatch[2])}月${Number(dateMatch[3])}日`,
    compactDateLabel: `${Number(dateMatch[2])}月${Number(dateMatch[3])}日 · 星期${weekday}`,
    timeLabel: timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : ''
  };
}

function decorateTimeline(messages, compactDate) {
  let previousDateKey = '';
  return (Array.isArray(messages) ? messages : []).map(item => {
    const parts = timestampParts(item && item.createdAt);
    const dateLabel = parts.dateKey && parts.dateKey !== previousDateKey ? parts.dateLabel : '';
    if (parts.dateKey) previousDateKey = parts.dateKey;
    const compactDateLabel = dateLabel ? parts.compactDateLabel : '';
    return Object.assign({}, item, {
      dateLabel,
      compactDateLabel,
      dateDisplayLabel: dateLabel ? (compactDate ? compactDateLabel : dateLabel) : '',
      timeLabel: parts.timeLabel
    });
  });
}

function historyMessage(item) {
  return message(item.id, item.role, item.text, {
    serverMessageId: item.id,
    createdAt: item.createdAt,
    clientMessageId: item.clientMessageId || undefined
  });
}

function mergeLatestHistory(remoteMessages, currentMessages, openingMessage) {
  const remoteClientMessageIds = new Set(remoteMessages.map(item => item && item.clientMessageId).filter(Boolean));
  const unresolved = (Array.isArray(currentMessages) ? currentMessages : []).filter(item => (
    item && ['pending', 'failed'].includes(item.status) && !remoteClientMessageIds.has(item.clientMessageId)
  ));
  return (remoteMessages.length ? remoteMessages : [openingMessage]).concat(unresolved);
}

function isServerInputRejection(result) {
  const code = String(result && result.code || '');
  return String(result && result.resultType || '') === 'INPUT_REJECTED'
    || ['INPUT_EMPTY', 'INPUT_TOO_LONG', 'SENSITIVE_INFO', 'CONTENT_REJECTED'].includes(code);
}

function isTalkUnavailable(result) {
  return String(result && result.code || '') === 'TALK_NOT_AVAILABLE';
}

function fatalChatRoute(result) {
  const code = String(result && result.code || '');
  if (code === 'AUTH_REQUIRED') return { action: 'login', label: '重新登录', fallback: '登录状态已失效，请重新登录。' };
  if (code === 'EGG_FORBIDDEN') return { action: 'home', label: '返回首页', fallback: '当前账号无法访问这只蛋宝宝。' };
  if (code === 'NOT_HATCHED') return { action: 'home', label: '返回首页', fallback: '破壳后才能和蛋宝宝说话。' };
  return null;
}

function isAuthoritativeTimestamp(value) {
  const source = String(value || '');
  return /^\d{4}-\d{2}-\d{2}T/.test(source) && Number.isFinite(Date.parse(source));
}

function isConfirmedChatResult(result, clientMessageId) {
  if (!result || !result.ok || !['REPLY', 'CRISIS_REPLY'].includes(result.resultType)) return false;
  const expectedSafety = result.resultType === 'CRISIS_REPLY' ? 'crisis' : 'passed';
  const validSafety = result.mode === 'demo' ? result.safety === 'approved-fallback' : result.safety === expectedSafety;
  return Boolean(
    validSafety
    && result.messageId
    && result.userMessageId
    && result.messageId !== result.userMessageId
    && result.clientMessageId === clientMessageId
    && result.requestId === clientMessageId
    && typeof result.text === 'string'
    && result.text.trim()
    && isAuthoritativeTimestamp(result.createdAt)
    && isAuthoritativeTimestamp(result.userCreatedAt)
  );
}

function conversationKeyFor(pet) {
  return pet ? `${String(pet.ownerId || '')}:${String(pet.id || '')}` : '';
}

function sceneLabelFor(currentState) {
  if (!currentState) return '';
  return currentState.atHome
    ? `在家 · ${currentState.label}`
    : [currentState.majorLabel, currentState.label].filter(Boolean).join(' · ');
}

function reducedMotionEnabled() {
  try {
    const system = wx.getSystemSetting
      ? wx.getSystemSetting()
      : (wx.getSystemInfoSync ? wx.getSystemInfoSync() : {});
    return Boolean(system.reducedMotion || system.enableReduceMotion);
  } catch (error) {
    return false;
  }
}

Page({
  data: {
    pet: null,
    chatAvatarSrc: '/assets/ui/3d-scene-actions/runtime/ui_3d_scene_chat_jade_rabbit_96_v02.png',
    snapshot: null,
    chatAccess: null,
    chatAvailable: false,
    chatUnavailable: false,
    chatUnavailableMessage: '',
    title: '和蛋宝宝说说话',
    sceneLabel: '',
    messages: [],
    draft: '',
    canSend: false,
    busy: false,
    loading: true,
    error: '',
    scrollTarget: '',
    historyCursor: '',
    hasMoreHistory: false,
    historyLoading: false,
    historyError: '',
    historyRetryCursor: '',
    historyHasRecords: false,
    dateCompact: false,
    inputFocus: false,
    inputFocused: false,
    serverInputError: false,
    composerNotice: '',
    chatViewportStyle: '',
    keyboardHeight: 0,
    fatalErrorAction: 'reload',
    fatalErrorActionLabel: '重新加载',
    reducedMotion: false,
    isDemo: config.localDemoEnabled
  },

  onLoad(query) {
    const params = query || {};
    this.requestedStateKey = String(params.state_key || '');
    this.preview = params.preview === '1' && config.localDemoEnabled;
    this.updateChatViewport();
    this.windowResizeHandler = event => {
      const resizedHeight = Number(event && event.size && event.size.windowHeight);
      if (!Number.isFinite(resizedHeight) || resizedHeight <= 0) return;
      // 输入框已获焦时，部分机型会先把“键盘缩小后的窗口”发到这里；
      // 不能把它当作新的基准高度，否则随后再减 keyboardHeight 会双重缩短页面。
      if (this.data.inputFocused || this.data.keyboardHeight) return;
      this.chatWindowHeight = Math.round(resizedHeight);
      this.updateChatViewport();
    };
    if (wx.onWindowResize) wx.onWindowResize(this.windowResizeHandler);
  },

  onShow() {
    this.pageActive = true;
    this.updateChatViewport(0);
    this.setData({ reducedMotion: reducedMotionEnabled() });
    if (this.data.snapshot) {
      const latestPet = petStore.getPet();
      if (!latestPet || conversationKeyFor(latestPet) !== conversationKeyFor(this.data.pet)) {
        this.setData({ snapshot: null, messages: [], draft: '', canSend: false, busy: false });
        this.loadConversation();
        return;
      }
      // develop 的 demo 不访问正式记录；正式环境回到前台时同步最新一页。
      if (!this.data.isDemo && !this.preview) this.refreshLatestHistory();
      return;
    }
    this.loadConversation();
  },

  onHide() {
    this.cancelActiveChatRequest();
    this.resetChatViewport();
    this.pageActive = false;
  },
  onUnload() {
    this.cancelActiveChatRequest();
    this.resetChatViewport();
    if (this.windowResizeHandler && wx.offWindowResize) wx.offWindowResize(this.windowResizeHandler);
    this.pageActive = false;
  },

  loadConversation() {
    const pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      this.setData({ loading: false, error: '破壳后才能和蛋宝宝说话', fatalErrorAction: 'home', fatalErrorActionLabel: '返回首页' });
      return;
    }
    const conversationKey = conversationKeyFor(pet);
    this.conversationKey = conversationKey;
    this.setData({
      pet,
      chatAvatarSrc: chatAvatarSourceFor(pet),
      snapshot: null,
      loading: true,
      error: '',
      composerNotice: '',
      fatalErrorAction: 'reload',
      fatalErrorActionLabel: '重新加载',
      chatAccess: null,
      chatAvailable: false,
      chatUnavailable: false,
      chatUnavailableMessage: ''
    });
    postHatch.getSnapshot(pet).then(result => {
      if (!this.pageActive || this.conversationKey !== conversationKey) return;
      if (!result || !result.ok) {
        this.setData({ loading: false, error: result && result.message || '对话没有加载好，请重试' });
        return;
      }
      const previewState = this.preview && this.requestedStateKey
        ? lifeScenes.resolveDefinition('home', this.requestedStateKey)
        : null;
      const currentState = previewState || result.currentState;
      const chatAccess = this.preview
        ? { status: 'available', reason: 'DEMO_PREVIEW', message: '', nextAvailableAt: '' }
        : result.chatAccess;
      if (!currentState || !chatAccess) {
        this.setData({ loading: false, error: '聊天权限没有加载好，请重试' });
        return;
      }
      const snapshot = Object.assign({}, result, { currentState, chatAccess });
      if (chatAccess.status !== 'available') {
        this.setData({
          snapshot,
          title: `和${pet.name || '蛋宝宝'}说说话`,
          sceneLabel: sceneLabelFor(currentState),
          chatAccess,
          chatAvailable: false,
          chatUnavailable: true,
          chatUnavailableMessage: chatAccess.message || '现在暂时不能聊天，请稍后再试。',
          messages: [],
          loading: false,
          error: '',
          inputFocus: false
        });
        return;
      }
      postHatch.getChatHistory(pet, '', 20).then(historyResult => {
        if (!this.pageActive || this.conversationKey !== conversationKey) return;
        const openingText = currentState.line || '我在呢。';
        const historyAvailable = Boolean(historyResult && historyResult.ok);
        const historyMessages = historyAvailable
          ? historyResult.messages.map(historyMessage)
          : [];
        const messages = historyAvailable ? (historyMessages.length ? historyMessages : [message('opening', 'assistant', openingText)]) : [];
        this.setData({
          snapshot,
          title: `和${pet.name || '蛋宝宝'}说说话`,
          sceneLabel: sceneLabelFor(currentState),
          chatAccess,
          chatAvailable: true,
          chatUnavailable: false,
          chatUnavailableMessage: '',
          messages: decorateTimeline(messages, this.data.dateCompact),
          historyCursor: historyResult && historyResult.ok ? historyResult.nextCursor : '',
          hasMoreHistory: Boolean(historyResult && historyResult.ok && historyResult.hasMore),
          loading: false,
          error: '',
          historyError: historyResult && !historyResult.ok ? historyResult.message || '聊天记录没有加载好，请重试' : '',
          historyRetryCursor: '',
          historyHasRecords: historyMessages.length > 0,
          inputFocus: true
        }, () => this.scrollToLatest());
        analytics.track('chat_open', { scene_id: currentState.key, entry: 'life_scene' });
      }).catch(() => {
        if (this.pageActive) this.setData({ loading: false, error: '', historyError: '聊天记录没有加载好，请重试', historyRetryCursor: '' });
      });
    }).catch(() => {
      if (this.pageActive) this.setData({ loading: false, error: '对话没有加载好，请重试' });
    });
  },

  onRetry() { this.loadConversation(); },

  onFatalErrorAction() {
    if (this.data.fatalErrorAction === 'login') {
      wx.reLaunch({ url: '/pages/welcome/welcome' });
      return;
    }
    if (this.data.fatalErrorAction === 'home') {
      wx.reLaunch({ url: '/pages/home/home' });
      return;
    }
    this.loadConversation();
  },

  onBackToLife() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/home/home' })
    });
  },

  refreshLatestHistory() {
    if (this.data.historyLoading || !this.data.pet) return;
    const latestPet = petStore.getPet();
    if (!latestPet || conversationKeyFor(latestPet) !== conversationKeyFor(this.data.pet)) {
      this.setData({ snapshot: null, messages: [], draft: '', canSend: false, busy: false });
      this.loadConversation();
      return;
    }
    const pet = this.data.pet;
    const snapshot = this.data.snapshot;
    const currentState = snapshot && snapshot.currentState || {};
    this.setData({ historyLoading: true, historyError: '' });
    postHatch.getChatHistory(pet, '', 20).then(result => {
      if (!this.pageActive) return;
      if (!result || !result.ok) {
        this.setData({ historyLoading: false, historyError: result && result.message || '聊天记录没有加载好，请重试' });
        return;
      }
      const remoteMessages = result.messages.map(historyMessage);
      const messages = mergeLatestHistory(
        remoteMessages,
        this.data.messages,
        message('opening', 'assistant', currentState.line || '我在呢。')
      );
      this.setData({
        messages: decorateTimeline(messages, this.data.dateCompact),
        historyCursor: result.nextCursor,
        hasMoreHistory: Boolean(result.hasMore),
        historyLoading: false,
        historyError: '',
        historyRetryCursor: '',
        historyHasRecords: remoteMessages.length > 0
      }, () => this.scrollToLatest());
    }).catch(() => {
      if (this.pageActive) this.setData({ historyLoading: false, historyError: '聊天记录没有加载好，请重试' });
    });
  },

  onRetryHistory() {
    if (this.data.historyRetryCursor) {
      this.onLoadMoreHistory();
      return;
    }
    this.refreshLatestHistory();
  },

  onToggleDateFormat() {
    const dateCompact = !this.data.dateCompact;
    this.setData({
      dateCompact,
      messages: decorateTimeline(this.data.messages, dateCompact)
    });
  },

  onLoadMoreHistory() {
    if (this.data.historyLoading || !this.data.hasMoreHistory || !this.data.historyCursor || !this.data.pet) return;
    const anchor = this.data.messages && this.data.messages[0];
    const anchorId = anchor && anchor.id;
    this.setData({ historyLoading: true });
    const requestedCursor = this.data.historyCursor;
    postHatch.getChatHistory(this.data.pet, requestedCursor, 20).then(result => {
      if (!this.pageActive || !result || !result.ok) {
        if (this.pageActive) this.setData({ historyLoading: false, historyError: result && result.message || '更多聊天记录没有加载好，请重试', historyRetryCursor: this.data.historyCursor });
        return;
      }
      if (result.hasMore && (!result.nextCursor || result.nextCursor === requestedCursor)) {
        this.setData({ historyLoading: false, historyError: '更多聊天记录数据不完整，请重试', historyRetryCursor: requestedCursor });
        return;
      }
      const ids = new Set((this.data.messages || []).map(item => item && item.id));
      const older = result.messages.filter(item => item && item.id && item.text && !ids.has(item.id))
        .map(historyMessage);
      this.setData({
        messages: decorateTimeline(older.concat(this.data.messages || []), this.data.dateCompact),
        historyCursor: result.nextCursor,
        hasMoreHistory: result.hasMore,
        historyLoading: false,
        historyError: '',
        historyRetryCursor: '',
        historyHasRecords: true
      }, () => {
        if (anchorId) this.setScrollTarget(`message-${anchorId}`);
      });
    }).catch(() => {
      if (this.pageActive) this.setData({ historyLoading: false, historyError: '更多聊天记录没有加载好，请重试', historyRetryCursor: this.data.historyCursor });
    });
  },

  onInput(event) {
    const draft = String(event.detail.value || '');
    this.setData({ draft, canSend: draft.trim().length > 0, error: '', serverInputError: false, composerNotice: '' });
  },

  onInputFocus() {
    const currentWindowHeight = windowHeight();
    if (currentWindowHeight) this.chatWindowHeight = currentWindowHeight;
    this.setData({ inputFocused: true });
  },

  onInputBlur() {
    this.setData({ inputFocused: false, inputFocus: false }, () => this.resetChatViewport());
  },

  updateChatViewport(keyboardHeight, afterUpdate) {
    const currentWindowHeight = this.chatWindowHeight || windowHeight();
    if (currentWindowHeight) this.chatWindowHeight = currentWindowHeight;
    const nextKeyboardHeight = keyboardHeight === undefined ? this.data.keyboardHeight : keyboardHeight;
    this.setData({
      keyboardHeight: Math.max(0, Number(nextKeyboardHeight) || 0),
      chatViewportStyle: viewportStyle(currentWindowHeight, nextKeyboardHeight)
    }, afterUpdate);
  },

  resetChatViewport() {
    this.chatWindowHeight = windowHeight() || this.chatWindowHeight;
    this.updateChatViewport(0);
  },

  onKeyboardHeightChange(event) {
    const keyboardHeight = Math.max(0, Number(event && event.detail && event.detail.height) || 0);
    const openingKeyboard = keyboardHeight > 0 && !this.data.keyboardHeight;
    if (!keyboardHeight) this.chatWindowHeight = windowHeight() || this.chatWindowHeight;
    this.updateChatViewport(keyboardHeight, () => {
      // 键盘首次出现时，只把当前对话的末尾（或等待气泡）放入可见区；
      // 收起键盘时不改写用户可能正在阅读的历史滚动位置。
      if (!openingKeyboard) return;
      if (this.data.busy) this.scrollToTyping();
      else this.scrollToLatest();
    });
  },

  onSend() {
    if (this.data.busy || !this.data.snapshot || !this.data.chatAvailable) return;
    const text = String(this.data.draft || '');
    // 这是防误触的页面交互，不替代服务端对空白内容的最终校验。
    if (!text.trim()) return;
    const clientMessageId = createClientMessageId();
    const userMessage = message(`user-${clientMessageId}`, 'user', text, { clientMessageId, status: 'pending' });
    this.setData({ messages: decorateTimeline(this.data.messages.concat(userMessage), this.data.dateCompact), draft: '', canSend: false, busy: true, error: '', serverInputError: false, composerNotice: '' }, () => this.scrollToTyping());
    this.sendUserMessage(userMessage);
  },

  onRetryMessage(event) {
    if (this.data.busy || !this.data.snapshot || !this.data.chatAvailable) return;
    const clientMessageId = String(event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.clientMessageId || '');
    const userMessage = this.data.messages.find(item => item && item.clientMessageId === clientMessageId && item.status === 'failed');
    if (!userMessage) return;
    this.setData({
      messages: updateMessage(this.data.messages, clientMessageId, { status: 'pending' }),
      busy: true,
      error: ''
    }, () => this.scrollToTyping());
    this.sendUserMessage(Object.assign({}, userMessage, { status: 'pending' }));
  },

  sendUserMessage(userMessage) {
    const clientMessageId = userMessage.clientMessageId;
    const text = userMessage.text;
    if (this.preview) {
      const previewReply = message(`assistant-${Date.now()}`, 'assistant', '我在呢。这是测试回复，不会写进陪伴记录。');
      const messages = updateMessage(this.data.messages, clientMessageId, { status: 'sent' }).concat(previewReply);
      this.setData({ messages, busy: false }, () => this.scrollToLatest());
      return;
    }
    const request = postHatch.sendSceneMessage(this.data.pet, this.data.snapshot, text, clientMessageId);
    const requestToken = this.trackActiveChatRequest(clientMessageId, request);
    request.then(result => {
      if (!this.isActiveChatRequest(clientMessageId, requestToken)) return;
      this.clearActiveChatRequest(clientMessageId, requestToken);
      if (!this.pageActive) return;
      if (result && result.ok && !isConfirmedChatResult(result, clientMessageId)) {
        result = { ok: false, code: 'CHAT_REPLY_INVALID', message: '回复数据不完整，请重试' };
      }
      if (!result || !result.ok) {
        if (isTalkUnavailable(result)) {
          const chatAccess = Object.assign({}, this.data.chatAccess || {}, {
            status: 'unavailable',
            reason: 'TALK_NOT_AVAILABLE',
            message: result && result.message || '蛋宝宝暂时不能聊天，请稍后再试。'
          });
          this.setData({
            messages: this.data.messages.filter(item => item && item.clientMessageId !== clientMessageId),
            draft: text,
            canSend: text.trim().length > 0,
            busy: false,
            chatAccess,
            chatAvailable: false,
            chatUnavailable: true,
            chatUnavailableMessage: chatAccess.message,
            inputFocus: false
          });
          return;
        }
        const fatalRoute = fatalChatRoute(result);
        if (fatalRoute) {
          this.setData({
            snapshot: null,
            sceneLabel: '',
            messages: [],
            draft: text,
            canSend: false,
            busy: false,
            chatAvailable: false,
            chatUnavailable: false,
            error: result && result.message || fatalRoute.fallback,
            fatalErrorAction: fatalRoute.action,
            fatalErrorActionLabel: fatalRoute.label,
            inputFocus: false
          });
          return;
        }
        if (isServerInputRejection(result)) {
          this.setData({
            messages: this.data.messages.filter(item => item && item.clientMessageId !== clientMessageId),
            draft: text,
            canSend: text.trim().length > 0,
            busy: false,
            error: result && result.message || '这句话暂时不能发送，请修改后再试',
            serverInputError: true,
            inputFocus: true
          });
          return;
        }
        if (String(result && result.code || '') === 'RATE_LIMITED') {
          this.setData({
            messages: this.data.messages.filter(item => item && item.clientMessageId !== clientMessageId),
            draft: text,
            canSend: text.trim().length > 0,
            busy: false,
            composerNotice: result && result.message || '现在发送得有点快，请稍后再试。',
            inputFocus: true
          });
          return;
        }
        this.setData({
          messages: updateMessage(this.data.messages, clientMessageId, { status: 'failed' }),
          busy: false
        });
        return;
      }
      const replyId = String(result.messageId);
      const reply = message(replyId, 'assistant', result.text, {
        serverMessageId: replyId,
        createdAt: result.createdAt
      });
      const confirmedMessages = updateMessage(this.data.messages, clientMessageId, {
        id: String(result.userMessageId),
        status: 'sent',
        serverMessageId: String(result.userMessageId),
        createdAt: result.userCreatedAt
      });
      const messages = confirmedMessages.some(item => item && item.id === replyId)
        ? confirmedMessages
        : confirmedMessages.concat(reply);
      this.setData({ messages: decorateTimeline(messages, this.data.dateCompact), busy: false }, () => this.scrollToLatest());
      analytics.track('chat_message_sent', { msg_len: Array.from(text).length, scene_id: this.data.snapshot.currentState.key });
    }).catch(() => {
      if (!this.isActiveChatRequest(clientMessageId, requestToken)) return;
      this.clearActiveChatRequest(clientMessageId, requestToken);
      if (this.pageActive) this.setData({
        messages: updateMessage(this.data.messages, clientMessageId, { status: 'failed' }),
        busy: false
      });
    });
  },

  trackActiveChatRequest(clientMessageId, request) {
    const token = (this.chatRequestSequence || 0) + 1;
    this.chatRequestSequence = token;
    this.activeChatRequest = { clientMessageId, token, request };
    return token;
  },

  isActiveChatRequest(clientMessageId, token) {
    const active = this.activeChatRequest;
    return Boolean(active && active.clientMessageId === clientMessageId && active.token === token);
  },

  clearActiveChatRequest(clientMessageId, token) {
    if (this.isActiveChatRequest(clientMessageId, token)) this.activeChatRequest = null;
  },

  cancelActiveChatRequest() {
    const active = this.activeChatRequest;
    if (!active) return;
    this.activeChatRequest = null;
    if (active.request && active.request.abort) active.request.abort();
    const pending = (this.data.messages || []).some(item => item && item.clientMessageId === active.clientMessageId && item.status === 'pending');
    if (!pending) return;
    this.setData({
      messages: updateMessage(this.data.messages, active.clientMessageId, { status: 'failed' }),
      busy: false,
      error: ''
    });
  },

  scrollToLatest() {
    const items = this.data.messages || [];
    const latest = items[items.length - 1];
    if (latest) this.setScrollTarget(`message-${latest.id}`);
  },

  scrollToTyping() {
    this.setScrollTarget('message-typing');
  },

  setScrollTarget(target) {
    // 先清空再写入，保证连续多轮对话都会重新触发 scroll-into-view。
    this.setData({ scrollTarget: '' }, () => this.setData({ scrollTarget: target }));
  }
});
