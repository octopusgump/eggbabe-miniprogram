const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const timeService = require('../../services/time-service');
const config = require('../../config/v2');
const runtime = require('../../services/runtime-context');
const chatSafety = require('../../services/chat-safety');
const chatService = require('../../services/chat-service');

Page({
  data: { pet: null, card: null, dailyStatus: null, messages: [], draft: '', typing: false, scrollAnchor: '' },

  onLoad() {
    this.openedAt = timeService.now();
    const pet = petStore.getPet();
    if (!pet || !pet.collectionCard) {
      wx.showToast({ title: '破壳后才可以对话', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    let messages = pet.messages || [];
    if (!messages.length) messages = [{ id: 'hello', from: 'egg', text: '你来啦。我已经等你好一会儿了。' }];
    const dailyStatus = petStore.getDailyStatus();
    this.setData({ pet, card: pet.collectionCard, dailyStatus, messages, scrollAnchor: `msg-${messages[messages.length - 1].id}` });
    analytics.track('chat_open', { entry: 'role_home' });
    if (dailyStatus) analytics.track('daily_status_viewed', { where: 'chat', mood_type: dailyStatus.mood });
  },

  onInput(e) { this.setData({ draft: e.detail.value }); },

  messageId(prefix) {
    this.messageSequence = (this.messageSequence || 0) + 1;
    return `${prefix}-${runtime.getSessionId()}-${this.messageSequence}`;
  },

  appendReply(text, resultType, messageId, persistConfirmed) {
    const reply = {
      id: messageId || this.messageId('egg'),
      from: 'egg',
      text: chatSafety.safeOutput(text),
      mode: 'live',
      sessionId: runtime.getSessionId()
    };
    const next = this.data.messages.concat(reply);
    if (persistConfirmed) {
      const savedConversation = petStore.applyConfirmedConversation(next.filter(message => message.mode === 'live'));
      if (!savedConversation.ok) {
        this.setData({ typing: false });
        wx.showToast({ title: savedConversation.message, icon: 'none' });
        return;
      }
    }
    analytics.track('chat_reply_result', { result: resultType, safety_result: 'passed' });
    const turnCount = next.filter(item => item.from === 'user').length;
    if (chatSafety.shouldShowRestReminder(timeService.now(), turnCount, this.restReminderShown)) {
      this.restReminderShown = true;
      next.push({ id: this.messageId('rest'), from: 'egg', text: '我有点困了，你也早点休息吧。', safety: 'rest-reminder' });
    }
    this.setData({ messages: next, typing: false, scrollAnchor: `msg-${reply.id}` });
  },

  onSend() {
    const text = this.data.draft.trim();
    if (!text || this.data.typing) return;
    const assessment = chatSafety.assessInput(text);
    if (!assessment.allowed) {
      wx.showToast({ title: assessment.message, icon: 'none' });
      return;
    }
    const userMessage = { id: this.messageId('user'), from: 'user', text, mode: 'live', sessionId: runtime.getSessionId() };
    const messages = this.data.messages.concat(userMessage);
    if (assessment.crisis) {
      const reply = { id: this.messageId('safety'), from: 'egg', text: chatSafety.CRISIS_RESPONSE, safety: 'crisis' };
      analytics.track('chat_reply_result', { result: 'crisis_fallback', safety_result: 'crisis' });
      this.setData({ messages: messages.concat(reply), draft: '', typing: false, scrollAnchor: `msg-${reply.id}` });
      return;
    }
    analytics.track('chat_message_sent', { msg_len: Array.from(text).length });
    this.setData({ messages, draft: '', typing: true, scrollAnchor: `msg-${userMessage.id}` });
    if (config.backendEnabled && runtime.getMode() === 'live') {
      chatService.requestReply({
        eggId: this.data.pet.id,
        text,
        history: messages
      }).then(result => {
        if (result.ok) {
          this.appendReply(result.text, 'success', result.messageId, true);
          return;
        }
        this.appendReply(chatService.approvedFallback(this.data.dailyStatus && this.data.dailyStatus.mood), 'approved_fallback', '', false);
      });
      return;
    }
    this.replyTimer = setTimeout(() => {
      this.appendReply(chatService.approvedFallback(this.data.dailyStatus && this.data.dailyStatus.mood), 'approved_fallback', '', false);
    }, 900);
  },

  onUnload() {
    clearTimeout(this.replyTimer);
    analytics.track('scene_exit', { scene_id: 'chat', dwell_time: Math.max(0, timeService.now() - (this.openedAt || timeService.now())) });
  },

  noop() {}
});
