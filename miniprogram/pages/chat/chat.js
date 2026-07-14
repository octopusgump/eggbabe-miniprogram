const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const timeService = require('../../services/time-service');
const config = require('../../config/v2');
const syncQueue = require('../../services/sync-queue');
const runtime = require('../../services/runtime-context');
const REPLIES = ['我在的，一直都在。', '说给我听吧，我会认真记住。', '今天见到你，我很开心。', '嗯，我在认真听。'];
const MOOD_REPLIES = {
  开心: ['你一来，我今天就更开心了。', '我就知道你会来找我。'],
  平静: ['慢慢说，我会一直听着。', '就这样待在一起也很好。'],
  想念: ['我今天其实想了你好几次。', '你来以后，我就不等啦。'],
  兴奋: ['我有好多话想马上告诉你。', '今天好像会有小小的好事。'],
  低落: ['靠近一点点就好，我没关系。', '陪我待一会儿，好不好？']
};

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

  onSend() {
    const text = this.data.draft.trim();
    if (!text || this.data.typing) return;
    const userMessage = { id: `u${timeService.now()}`, from: 'user', text, mode: runtime.getMode(), sessionId: runtime.getSessionId() };
    const messages = this.data.messages.concat(userMessage);
    const savedUserMessage = petStore.saveMessage(userMessage);
    if (!savedUserMessage.ok) {
      wx.showToast({ title: savedUserMessage.message, icon: 'none' });
      return;
    }
    analytics.track('chat_message_sent', { msg_len: Array.from(text).length });
    if (config.cloudEnabled && runtime.getMode() === 'live') syncQueue.enqueue('saveMessage', { message: userMessage });
    this.setData({ messages, draft: '', typing: true, scrollAnchor: `msg-${userMessage.id}` });
    this.replyTimer = setTimeout(() => {
      const mood = this.data.dailyStatus ? this.data.dailyStatus.mood : '平静';
      const pool = MOOD_REPLIES[mood] || REPLIES;
      const personalityPrefix = this.data.card.mbti === 'ENFP' && Math.random() > .5 ? '嘿，' : '';
      const reply = { id: `e${timeService.now()}`, from: 'egg', text: personalityPrefix + pool[Math.floor(Math.random() * pool.length)], mode: runtime.getMode(), sessionId: runtime.getSessionId() };
      const savedReply = petStore.saveMessage(reply);
      if (!savedReply.ok) {
        this.setData({ typing: false });
        wx.showToast({ title: savedReply.message, icon: 'none' });
        return;
      }
      analytics.track('chat_reply', { mood, mbti_context: this.data.card.mbti });
      if (config.cloudEnabled && runtime.getMode() === 'live') syncQueue.enqueue('saveMessage', { message: reply });
      const next = this.data.messages.concat(reply);
      this.setData({ messages: next, typing: false, scrollAnchor: `msg-${reply.id}` });
    }, 900);
  },

  onUnload() {
    clearTimeout(this.replyTimer);
    analytics.track('chat_session_end', { duration: Math.max(0, timeService.now() - (this.openedAt || timeService.now())), turn_count: this.data.messages.filter(item => item.from === 'user').length });
  },

  noop() {}
});
