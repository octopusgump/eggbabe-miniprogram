const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const timeService = require('../../services/time-service');
const sceneConfig = require('../../utils/life-scenes');
const syncQueue = require('../../services/sync-queue');
const environmentService = require('../../services/incubation-environment');
const config = require('../../config/v2');

const TOUCH_LINES = ['你碰到我啦。', '我轻轻晃了一下。', '我听见你了。', '壳里传来我小小的回应。'];
const TALK_REACTIONS = [
  { motion: 'egg--talk-soft', text: '' },
  { motion: 'egg--talk-happy', text: '我听见啦。' },
  { motion: 'egg--talk-glow', text: '' },
  { motion: 'egg--talk-color', text: '' },
  { motion: 'egg--talk-knock', text: '' }
];
const WEATHER_PARTICLES = Array.from({ length: 12 }, (_, index) => index);
const COMPANION_ACTIONS = [
  { key: 'touch', title: '摸摸我', desc: '轻轻碰一下', icon: '/assets/scenes/incubation/svg/interaction_touch.svg' },
  { key: 'talk', title: '跟我说句话', desc: '我会用身体回应', icon: '/assets/scenes/incubation/svg/interaction_talk.svg' },
  { key: 'quiet', title: '安静陪我一会儿', desc: '一起慢慢呼吸', icon: '/assets/scenes/incubation/svg/interaction_quiet.svg' },
  { key: 'window', title: '一起看看窗外', desc: '看看此刻的上海', icon: '/assets/scenes/incubation/svg/interaction_window.svg' },
  { key: 'wish', title: '告诉我一个愿望', desc: '轻轻放在我这里', icon: '/assets/scenes/incubation/svg/interaction_wish.svg' },
  { key: 'learn', title: '教我一件小事', desc: '让我再懂你一点', icon: '/assets/scenes/incubation/svg/interaction_learn.svg' },
  { key: 'draw', title: '画一个小记号', desc: '留在我的蛋壳上', icon: '/assets/scenes/incubation/svg/interaction_draw.svg' },
  { key: 'secret', title: '说一句秘密暗号', desc: '我会藏在壳里面', icon: '/assets/scenes/incubation/svg/interaction_secret.svg' }
];

Page({
  data: {
    pet: null,
    stage: 'empty',
    stageText: '',
    actionLabel: '',
    dailyStatus: null,
    feedback: '',
    eggMotion: '',
    sceneEffect: '',
    cuddleProgress: 0,
    hasScenes: false,
    syncPending: 0,
    activationCode: config.localActivationCode,
    hatchedActivationCode: config.localHatchedActivationCode,
    sceneImage: '',
    environment: environmentService.resolve(),
    weatherParticles: WEATHER_PARTICLES,
    companionActions: COMPANION_ACTIONS,
    greeting: '',
    progressTip: false,
    talkDraft: '',
    talkFocused: false,
    talkPlaceholder: '最多 50 个字，我会认真听',
    tapParticles: [],
    showNameSheet: false,
    nameDraft: '',
    nameCount: 0,
    nameError: '',
    savingName: false
  },

  async onShow() {
    const pet = petStore.getPet();
    if (!pet) {
      this.setData({ pet: null, stage: 'empty', hasScenes: false, greeting: '', showNameSheet: false, syncPending: syncQueue.pendingCount() });
      return;
    }
    const stage = petStore.getStage(pet);
    const presentation = petStore.getStagePresentation(stage);
    const hatched = stage === 'hatched';
    const showNameSheet = !hatched && petStore.shouldPromptNickname();
    let greeting = '';
    if (!hatched && !showNameSheet && petStore.shouldShowDailyGreeting()) {
      greeting = '我在窝里。想来时，就陪我待一会儿吧。';
      petStore.markDailyGreetingShown();
    }
    const app = typeof getApp === 'function' ? getApp() : null;
    const serverEnvironment = app && app.globalData ? app.globalData.incubationEnvironment : null;
    this.setData({
      pet,
      stage,
      stageText: presentation.homeText,
      actionLabel: presentation.actionLabel,
      dailyStatus: hatched ? petStore.getDailyStatus() : null,
      greeting,
      showNameSheet,
      nameDraft: pet.name || '',
      nameCount: Array.from(pet.name || '').length,
      nameError: '',
      hasScenes: hatched && sceneConfig.getScenesForCharacter(pet.prototype).length > 0,
      sceneImage: hatched ? sceneConfig.getScene('grass', pet.prototype).image : '',
      environment: environmentService.resolve(serverEnvironment),
      syncPending: syncQueue.pendingCount()
    }, () => {
      if (!hatched) this.setupWindowFog();
    });
    analytics.track(hatched ? 'role_home_view' : 'hatch_home_view');
    if (hatched && this.data.dailyStatus) analytics.track('daily_status_viewed', { where: 'role_home', mood_type: this.data.dailyStatus.mood });
  },

  onReady() {
    this.setupWindowFog();
  },

  onAddDevice() { wx.navigateTo({ url: '/pages/add-device/add-device' }); },

  onRoleTap() {
    if (this.completedLongPress) {
      this.completedLongPress = false;
      return;
    }
    wx.navigateTo({ url: '/pages/life-scene/life-scene?scene=grass' });
  },

  onChangeScene() { wx.navigateTo({ url: '/pages/life-scenes/life-scenes' }); },

  onPetNameTap() {
    if (this.data.stage === 'hatched') {
      wx.navigateTo({ url: '/pages/nickname/nickname' });
      return;
    }
    this.setData({ showNameSheet: true, nameError: '' });
  },

  showFeedback(text) {
    this.setData({ feedback: text });
    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => this.setData({ feedback: '' }), 2200);
  },

  clearEffectTimers() {
    clearTimeout(this.sceneEffectTimer);
    clearTimeout(this.wobbleTimer);
    clearTimeout(this.talkReactionTimer);
  },

  runSceneEffect(sceneEffect, eggMotion, duration, onComplete) {
    this.clearEffectTimers();
    this.setData({ sceneEffect, eggMotion });
    this.sceneEffectTimer = setTimeout(() => {
      this.setData({ sceneEffect: '', eggMotion: '' });
      if (typeof onComplete === 'function') onComplete();
    }, duration);
  },

  spawnTapParticles(event) {
    const id = `tap-${timeService.now()}-${this.particleSequence = (this.particleSequence || 0) + 1}`;
    const point = event.detail || {};
    wx.createSelectorQuery().in(this).select('.egg-zone').boundingClientRect(rect => {
      if (!rect) return;
      const x = Math.max(24, Math.min(rect.width - 24, Number(point.x || rect.left + rect.width / 2) - rect.left));
      const y = Math.max(24, Math.min(rect.height - 24, Number(point.y || rect.top + rect.height / 2) - rect.top));
      const next = this.data.tapParticles.concat({ id, x, y }).slice(-3);
      this.setData({ tapParticles: next });
      const timer = setTimeout(() => {
        this.setData({ tapParticles: this.data.tapParticles.filter(item => item.id !== id) });
        this.particleTimers = (this.particleTimers || []).filter(item => item !== timer);
      }, 560);
      this.particleTimers = (this.particleTimers || []).concat(timer);
    }).exec();
  },

  onEggTap(event) {
    if (this.completedLongPress) {
      this.completedLongPress = false;
      return;
    }
    this.spawnTapParticles(event);
    const now = timeService.now();
    this.runSceneEffect('scene--touch', 'egg--wobble', 760);
    petStore.recordTouch();
    analytics.track('egg_tap', { tap_count: 1 });
    if (this.lastTapAt && now - this.lastTapAt < 2000) return;
    this.lastTapAt = now;
    this.showFeedback(TOUCH_LINES[Math.floor(Math.random() * TOUCH_LINES.length)]);
  },

  vibrateCuddleTick() {
    if (this.vibrationCount >= 3) return;
    this.vibrationCount += 1;
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
  },

  onTouchStart() {
    if (!this.data.pet) return;
    this.clearCuddleTimers();
    this.clearEffectTimers();
    this.completedLongPress = false;
    this.vibrationCount = 0;
    const started = timeService.now();
    this.setData({ eggMotion: 'egg--warming', sceneEffect: 'scene--cuddle', cuddleProgress: 1 });
    this.cuddleTicker = setInterval(() => {
      const progress = Math.min(99, Math.round((timeService.now() - started) / 30));
      this.setData({ cuddleProgress: progress });
    }, 90);
    this.cuddleVibrationTicker = setInterval(() => this.vibrateCuddleTick(), 1000);
    this.cuddleTimer = setTimeout(() => {
      clearInterval(this.cuddleTicker);
      clearInterval(this.cuddleVibrationTicker);
      if (this.vibrationCount < 3) this.vibrateCuddleTick();
      const result = this.data.stage === 'hatched' ? { ok: true, added: 0 } : petStore.completeCuddle();
      if (!result.ok) {
        this.clearCuddleTimers();
        this.setData({ cuddleProgress: 0, eggMotion: '', sceneEffect: '' });
        this.showFeedback(result.message || '这次没有记录成功，请再试一次');
        return;
      }
      analytics.track(this.data.stage === 'hatched' ? 'role_cuddle_complete' : 'pat_egg_complete');
      if (this.data.stage !== 'hatched') analytics.track('incubation_action', { action_type: 'cuddle', is_first_time: !!result.added, progress_delta: result.added || 0 });
      this.completedLongPress = true;
      this.setData({ cuddleProgress: 100, eggMotion: 'egg--warm' });
      this.showFeedback(result.added ? '我暖起来了。' : '我又往你这边靠了靠。');
      this.cuddleResetTimer = setTimeout(() => {
        this.setData({ cuddleProgress: 0, eggMotion: '', sceneEffect: '' });
        this.onShow();
      }, 900);
    }, 3000);
  },

  onTouchEnd() {
    clearTimeout(this.cuddleTimer);
    clearInterval(this.cuddleTicker);
    clearInterval(this.cuddleVibrationTicker);
    if (!this.completedLongPress) this.setData({ cuddleProgress: 0, eggMotion: '', sceneEffect: '' });
  },

  clearCuddleTimers() {
    clearTimeout(this.cuddleTimer);
    clearTimeout(this.cuddleResetTimer);
    clearInterval(this.cuddleTicker);
    clearInterval(this.cuddleVibrationTicker);
  },

  onCompanionTap(event) {
    const key = event.currentTarget.dataset.key;
    if (!COMPANION_ACTIONS.some(item => item.key === key)) return;
    if (key === 'touch') {
      this.onEggTap({ detail: {} });
      return;
    }
    if (key === 'talk') {
      this.runSceneEffect('scene--listening', 'egg--talk-soft', 900);
      this.setData({ talkFocused: true, talkPlaceholder: '最多 50 个字，我会认真听' });
      this.showFeedback('我在听。');
      return;
    }
    if (key === 'quiet') {
      this.runSceneEffect('scene--quiet', 'egg--quiet', 8000);
      this.showFeedback('我们就这样安静待一会儿。');
      return;
    }
    if (key === 'window') {
      this.runSceneEffect('scene--window', 'egg--window', 3600);
      this.showFeedback('窗外是此刻的上海，也可以在玻璃上轻轻划一划。');
      return;
    }
    if (key === 'secret') {
      this.runSceneEffect('scene--secret', 'egg--talk-knock', 1100);
      this.setData({ talkFocused: true, talkPlaceholder: '轻轻告诉我一句秘密暗号' });
      this.showFeedback('轻轻说给我听，我会藏在壳里面。');
      return;
    }
    const routes = {
      wish: { route: '/pages/wish/wish', sceneEffect: 'scene--wish', eggMotion: 'egg--talk-glow' },
      learn: { route: '/pages/lesson/lesson', sceneEffect: 'scene--learn', eggMotion: 'egg--talk-knock' },
      draw: { route: '/pages/doodle/doodle', sceneEffect: 'scene--draw', eggMotion: 'egg--talk-color' }
    };
    const destination = routes[key];
    if (destination) {
      this.runSceneEffect(destination.sceneEffect, destination.eggMotion, 520, () => {
        wx.navigateTo({ url: destination.route });
      });
    }
  },

  onGreetingTap() {
    this.setData({ greeting: '' });
  },

  onProgressTap() {
    this.setData({ progressTip: true });
    clearTimeout(this.progressTipTimer);
    this.progressTipTimer = setTimeout(() => this.setData({ progressTip: false }), 2000);
  },

  onTalkInput(event) {
    const value = Array.from(event.detail.value || '').slice(0, 50).join('');
    this.setData({ talkDraft: value });
  },

  setupWindowFog() {
    if (this.data.stage === 'hatched' || this.windowFogInitialized) return;
    wx.createSelectorQuery().in(this).select('#windowFogCanvas').fields({ node: true, size: true, rect: true }).exec(result => {
      const target = result && result[0];
      if (!target || !target.node || !target.width || !target.height) return;
      const canvas = target.node;
      const context = canvas.getContext('2d');
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const pixelRatio = Number(windowInfo.pixelRatio || 1);
      canvas.width = target.width * pixelRatio;
      canvas.height = target.height * pixelRatio;
      context.scale(pixelRatio, pixelRatio);
      const fog = context.createLinearGradient(0, 0, target.width, target.height);
      fog.addColorStop(0, 'rgba(239,247,245,.2)');
      fog.addColorStop(.45, 'rgba(250,250,239,.08)');
      fog.addColorStop(1, 'rgba(224,239,241,.18)');
      context.fillStyle = fog;
      context.fillRect(0, 0, target.width, target.height);
      this.windowFogInitialized = true;
      this.windowFogContext = context;
      this.windowEffectsRect = { left: target.left || 0, top: target.top || 0, width: target.width, height: target.height };
    });
  },

  windowTouchPoint(event) {
    const touch = (event.touches || event.changedTouches || [])[0];
    const rect = this.windowEffectsRect;
    if (!touch || !rect) return null;
    return {
      x: Math.max(0, Math.min(rect.width, touch.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, touch.clientY - rect.top))
    };
  },

  eraseWindowFog(event) {
    const context = this.windowFogContext;
    const point = this.windowTouchPoint(event);
    if (!context || !point) return;
    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = 52;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    const previous = this.lastWindowWipePoint || point;
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    context.beginPath();
    context.arc(point.x, point.y, 26, 0, Math.PI * 2);
    context.fill();
    context.restore();
    this.lastWindowWipePoint = point;
  },

  onWindowTouchStart(event) {
    this.clearEffectTimers();
    this.setData({ sceneEffect: 'scene--window-wipe', eggMotion: 'egg--window' });
    this.lastWindowWipePoint = null;
    this.eraseWindowFog(event);
  },

  onWindowTouchMove(event) {
    this.eraseWindowFog(event);
  },

  onWindowTouchEnd() {
    this.runSceneEffect('scene--window-cleared', 'egg--window', 1800);
    this.lastWindowWipePoint = null;
    this.showFeedback('这样看得更清楚啦。');
  },

  onTalkSubmit() {
    const result = petStore.completeTalk(this.data.talkDraft);
    if (!result.ok) return this.showFeedback(result.message || '换个说法告诉我吧');
    const reaction = TALK_REACTIONS[Math.floor(timeService.now()) % TALK_REACTIONS.length];
    this.setData({ talkDraft: '', talkFocused: false, talkPlaceholder: '最多 50 个字，我会认真听' });
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    if (reaction.text) this.showFeedback(reaction.text);
    analytics.track('incubation_action', { action_type: 'talk', is_first_time: !!result.added, progress_delta: result.added || 0 });
    this.runSceneEffect('scene--listening', reaction.motion, 900, () => {
      this.onShow();
    });
  },

  onNameInput(event) {
    const value = Array.from(event.detail.value || '').slice(0, 10).join('');
    this.setData({ nameDraft: value, nameCount: Array.from(value).length, nameError: '' });
  },

  onSaveName() {
    if (this.data.savingName) return;
    this.setData({ savingName: true, nameError: '' });
    const result = petStore.updateNickname(this.data.nameDraft);
    if (!result.ok) {
      this.setData({ savingName: false, nameError: result.message || '名字没有保存成功' });
      return;
    }
    analytics.track('incubation_action', { action_type: 'nickname', is_first_time: !!result.added, progress_delta: result.added || 0 });
    this.setData({ savingName: false, showNameSheet: false });
    this.showFeedback(result.added ? '我记住自己的名字啦。' : '我记住新名字啦。');
    this.onShow();
  },

  onSkipName() {
    const result = petStore.dismissNicknamePrompt();
    if (!result.ok) return this.setData({ nameError: result.message });
    this.setData({ showNameSheet: false, nameError: '' });
    this.onShow();
  },

  noop() {},

  onPrimaryAction() {
    if (this.data.stage === 'ready') wx.navigateTo({ url: '/pages/hatch/hatch' });
    else if (this.data.stage === 'hatched') wx.navigateTo({ url: '/pages/chat/chat' });
  },

  clearInteractionTimers() {
    this.clearCuddleTimers();
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.progressTipTimer);
    this.clearEffectTimers();
    (this.particleTimers || []).forEach(clearTimeout);
    this.particleTimers = [];
  },

  onHide() {
    this.clearInteractionTimers();
    this.completedLongPress = false;
    this.setData({ cuddleProgress: 0, eggMotion: '', sceneEffect: '', feedback: '', progressTip: false, tapParticles: [] });
  },

  onUnload() {
    this.clearInteractionTimers();
    this.windowFogContext = null;
    this.windowEffectsRect = null;
    this.lastWindowWipePoint = null;
    this.windowFogInitialized = false;
  }
});
