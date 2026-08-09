const petStore = require('../../utils/pet-store');
const lifeScenes = require('../../utils/life-scenes');
const postHatch = require('../../services/post-hatch-companion');
const analytics = require('../../services/analytics');
const config = require('../../config/v2');

function message(id, role, text) {
  return { id, role, text: String(text || '') };
}

function reducedMotionEnabled() {
  try {
    const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    return Boolean(system.reducedMotion || system.enableReduceMotion);
  } catch (error) {
    return false;
  }
}

Page({
  data: {
    pet: null,
    snapshot: null,
    title: '和蛋宝宝说说话',
    sceneLabel: '',
    messages: [],
    draft: '',
    busy: false,
    loading: true,
    error: '',
    scrollTarget: '',
    inputFocus: false,
    reducedMotion: false,
    isDemo: config.localDemoEnabled
  },

  onLoad(query) {
    const params = query || {};
    this.requestedStateKey = String(params.state_key || '');
    this.preview = params.preview === '1';
  },

  onShow() {
    this.pageActive = true;
    this.setData({ reducedMotion: reducedMotionEnabled() });
    if (this.data.snapshot) return;
    this.loadConversation();
  },

  onHide() { this.pageActive = false; },
  onUnload() { this.pageActive = false; },

  loadConversation() {
    const pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      this.setData({ loading: false, error: '破壳后才能和蛋宝宝说话' });
      return;
    }
    this.setData({ pet, loading: true, error: '' });
    postHatch.getSnapshot(pet).then(result => {
      if (!this.pageActive) return;
      if (!result || !result.ok) {
        this.setData({ loading: false, error: result && result.message || '对话没有加载好，请重试' });
        return;
      }
      const previewState = this.preview && this.requestedStateKey
        ? lifeScenes.resolveDefinition('home', this.requestedStateKey)
        : null;
      const currentState = previewState || result.currentState;
      if (!currentState || !currentState.atHome || !currentState.canTalk) {
        this.setData({ loading: false, error: 'ta 现在不在家，请回到生活空间留言' });
        return;
      }
      const snapshot = Object.assign({}, result, { currentState });
      const openingText = currentState.line || result.mood && result.mood.line || '我在呢。';
      const messages = [message('opening', 'assistant', openingText)];
      let visibleNewMessageId = '';
      if (result.newMessage && result.newMessage.line && result.newMessage.line !== openingText) {
        messages.push(message(`new-${result.newMessage.id || 'message'}`, 'assistant', result.newMessage.line));
        visibleNewMessageId = result.newMessage.id;
      }
      this.setData({
        snapshot,
        title: `和${pet.name || '蛋宝宝'}说说话`,
        sceneLabel: `在家 · ${currentState.label}`,
        messages,
        loading: false,
        error: '',
        inputFocus: true
      }, () => {
        this.scrollToLatest();
        if (visibleNewMessageId) postHatch.markPostcardRead(pet, visibleNewMessageId).catch(() => {});
      });
      analytics.track('chat_open', { scene_id: currentState.key, entry: 'life_scene' });
    }).catch(() => {
      if (this.pageActive) this.setData({ loading: false, error: '对话没有加载好，请重试' });
    });
  },

  onRetry() { this.loadConversation(); },

  onInput(event) {
    this.setData({ draft: event.detail.value, error: '' });
  },

  onSend() {
    if (this.data.busy || !this.data.snapshot) return;
    const text = String(this.data.draft || '').trim();
    if (!text) {
      this.setData({ error: '先说一句话吧' });
      return;
    }
    const userMessage = message(`user-${Date.now()}`, 'user', text);
    const priorMessages = this.data.messages;
    const visibleMessages = priorMessages.concat(userMessage);
    this.setData({ messages: visibleMessages, draft: '', busy: true, error: '' }, () => this.scrollToTyping());
    if (this.preview) {
      const previewReply = message(`assistant-${Date.now()}`, 'assistant', '我在呢。这是测试回复，不会写进陪伴记录。');
      this.setData({ messages: visibleMessages.concat(previewReply), busy: false }, () => this.scrollToLatest());
      return;
    }
    postHatch.sendSceneMessage(this.data.pet, this.data.snapshot, text, priorMessages).then(result => {
      if (!this.pageActive) return;
      if (!result || !result.ok) {
        this.setData({ busy: false, error: result && result.message || '这句话没有送到，请重试', draft: text });
        return;
      }
      const reply = message(`assistant-${Date.now()}`, 'assistant', result.text || '我在听。');
      this.setData({ messages: visibleMessages.concat(reply), busy: false }, () => this.scrollToLatest());
      analytics.track('chat_message_sent', { msg_len: Array.from(text).length, scene_id: this.data.snapshot.currentState.key });
      analytics.track('chat_reply_result', { result: result.safety || 'ok', scene_id: this.data.snapshot.currentState.key });
    }).catch(() => {
      if (this.pageActive) this.setData({ busy: false, error: '这句话没有送到，请重试', draft: text });
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
