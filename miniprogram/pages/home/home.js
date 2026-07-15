const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const timeService = require('../../services/time-service');
const sceneConfig = require('../../utils/life-scenes');
const syncQueue = require('../../services/sync-queue');
const config = require('../../config/v2');

const TOUCH_LINES = ['你碰到它啦。', '它轻轻晃了一下。', '它好像听见你了。', '蛋壳里传来小小的声音。'];
Page({
  data: {
    pet: null,
    stage: 'empty',
    stageText: '',
    countdown: '',
    dailyStatus: null,
    feedback: '',
    eggMotion: '',
    cuddleProgress: 0,
    actionLabel: '孵化修炼手册',
    hasScenes: false,
    syncPending: 0,
    activationCode: config.localActivationCode,
    hatchedActivationCode: config.localHatchedActivationCode,
    sceneImage: ''
  },

  async onShow() {
    const pet = petStore.getPet();
    if (!pet) {
      this.setData({ pet: null, stage: 'empty', hasScenes: false, syncPending: syncQueue.pendingCount() });
      return;
    }
    const stage = petStore.getStage(pet);
    analytics.track(stage === 'hatched' ? 'role_home_view' : 'hatch_home_view');
    const presentation = petStore.getStagePresentation(stage);
    const dailyStatus = petStore.getDailyStatus();
    this.setData({
      pet,
      stage,
      stageText: presentation.homeText,
      countdown: petStore.getCountdown(pet),
      dailyStatus,
      actionLabel: presentation.actionLabel,
      hasScenes: stage === 'hatched' && sceneConfig.getScenesForCharacter(pet.prototype).length > 0,
      sceneImage: stage === 'hatched' ? sceneConfig.getScene('grass', pet.prototype).image : '',
      syncPending: syncQueue.pendingCount()
    });
    if (dailyStatus) analytics.track('daily_status_viewed', { where: stage === 'hatched' ? 'role_home' : 'hatch_home', mood_type: dailyStatus.mood });
  },

  onAddDevice() {
    wx.navigateTo({ url: '/pages/add-device/add-device' });
  },

  onOpenLifeScene() {
    wx.navigateTo({ url: '/pages/life-scene/life-scene?scene=grass' });
  },

  onChangeScene() {
    wx.navigateTo({ url: '/pages/life-scenes/life-scenes' });
  },

  showFeedback(text) {
    this.setData({ feedback: text });
    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => this.setData({ feedback: '' }), 2200);
  },

  onEggTap() {
    if (this.completedLongPress) {
      this.completedLongPress = false;
      return;
    }
    const now = timeService.now();
    if (this.lastTapAt && now - this.lastTapAt < 2000) return;
    this.lastTapAt = now;
    petStore.recordTouch();
    analytics.track('egg_tap', { tap_count: 1 });
    this.setData({ eggMotion: 'egg--wobble' });
    this.showFeedback(TOUCH_LINES[Math.floor(Math.random() * TOUCH_LINES.length)]);
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    clearTimeout(this.wobbleTimer);
    this.wobbleTimer = setTimeout(() => this.setData({ eggMotion: '' }), 600);
  },

  onTouchStart() {
    if (!this.data.pet || this.data.stage === 'hatched') return;
    this.clearCuddleTimers();
    this.completedLongPress = false;
    const started = timeService.now();
    this.setData({ eggMotion: 'egg--warming', cuddleProgress: 1 });
    this.cuddleTicker = setInterval(() => {
      const progress = Math.min(99, Math.round((timeService.now() - started) / 30));
      this.setData({ cuddleProgress: progress });
    }, 90);
    this.cuddleTimer = setTimeout(() => {
      clearInterval(this.cuddleTicker);
      const result = petStore.completeCuddle();
      if (!result.ok) {
        this.clearCuddleTimers();
        this.setData({ cuddleProgress: 0, eggMotion: '' });
        this.showFeedback(result.message || '保存失败，请重试');
        return;
      }
      analytics.track('pat_egg_complete');
      analytics.track('incubation_action', { action_type: 'cuddle', is_first_time: !!result.added, progress_delta: result.added || 0 });
      this.completedLongPress = true;
      this.setData({ cuddleProgress: 100, eggMotion: 'egg--warm' });
      this.showFeedback(result.added ? '它暖起来了 · 孵化进度 +5%' : '它又往你这边靠了靠');
      if (wx.vibrateShort) wx.vibrateShort({ type: 'medium' });
      this.cuddleResetTimer = setTimeout(() => {
        this.setData({ cuddleProgress: 0, eggMotion: '' });
        this.onShow();
      }, 900);
    }, 3000);
  },

  onTouchEnd() {
    clearTimeout(this.cuddleTimer);
    clearInterval(this.cuddleTicker);
    if (!this.completedLongPress) this.setData({ cuddleProgress: 0, eggMotion: '' });
  },

  clearCuddleTimers() {
    clearTimeout(this.cuddleTimer);
    clearTimeout(this.cuddleResetTimer);
    clearInterval(this.cuddleTicker);
  },

  clearInteractionTimers() {
    this.clearCuddleTimers();
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.wobbleTimer);
  },

  onPrimaryAction() {
    const stage = this.data.stage;
    if (stage === 'ready') {
      wx.navigateTo({ url: '/pages/hatch/hatch' });
    } else if (stage === 'hatched') {
      wx.navigateTo({ url: '/pages/chat/chat' });
    } else if (stage === 'prepared') {
      this.showFeedback('它已经准备好了，收藏卡会在破壳日生成');
    } else {
      wx.navigateTo({ url: '/pages/hatch-guide/hatch-guide' });
    }
  },

  onOpenCard() {
    if (this.data.stage === 'hatched') wx.navigateTo({ url: '/pages/collection-card/collection-card' });
  },

  onHide() {
    this.clearInteractionTimers();
    this.completedLongPress = false;
    this.setData({ cuddleProgress: 0, eggMotion: '', feedback: '' });
  },

  onUnload() { this.clearInteractionTimers(); }
});
