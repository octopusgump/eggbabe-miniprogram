const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const timeService = require('../../services/time-service');
const sceneConfig = require('../../utils/life-scenes');
const syncQueue = require('../../services/sync-queue');
const environmentService = require('../../services/incubation-environment');
const shellArtService = require('../../services/egg-shell-art');
const roomSound = require('../../services/room-sound');
const canvas2d = require('../../utils/canvas-2d');
const runtime = require('../../services/runtime-context');
const demoExperience = require('../../services/demo-experience');

const TOUCH_LINES = ['你碰到我啦。', '我轻轻晃了一下。', '我听见你了。', '壳里传来我小小的回应。'];
const TALK_REACTIONS = [
  { motion: 'egg--talk-soft', text: '' },
  { motion: 'egg--talk-happy', text: '我听见啦。' },
  { motion: 'egg--talk-glow', text: '' },
  { motion: 'egg--talk-color', text: '' },
  { motion: 'egg--talk-knock', text: '' }
];
const WEATHER_PARTICLES = Array.from({ length: 12 }, (_, index) => index);
const ROOM_ELEMENTS = [
  { key: 'lamp', label: '台灯', icon: '灯', position: 'room-element--lamp', effect: 'scene--lamp', motion: 'egg--quiet' },
  { key: 'coffee', label: '咖啡机', icon: '暖', position: 'room-element--coffee', effect: 'scene--coffee', motion: 'egg--quiet', feedback: '房间里暖了一点。' },
  { key: 'brush', label: '画笔', icon: '画', position: 'room-element--brush', effect: 'scene--draw', motion: 'egg--quiet', feedback: '纸上多了一笔柔和的颜色。', route: '/pages/doodle/doodle' },
  { key: 'scarf', label: '围巾', icon: '软', position: 'room-element--scarf', effect: 'scene--scarf', motion: 'egg--warm', feedback: '这条围巾摸起来软软的。' },
  { key: 'window', label: '窗户', icon: '窗', position: 'room-element--window', effect: 'scene--window', motion: 'egg--quiet' }
];
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
    hasScenes: false,
    syncPending: 0,
    sceneImage: '',
    environment: environmentService.resolve(),
    weatherParticles: WEATHER_PARTICLES,
    companionActions: COMPANION_ACTIONS,
    greeting: '',
    talkDraft: '',
    talkFocused: false,
    talkPlaceholder: '最多 50 个字，我会认真听',
    tapParticles: [],
    showNameSheet: false,
    nameDraft: '',
    nameCount: 0,
    nameError: '',
    savingName: false,
    homeEggBasePreview: '',
    homeEggArtPreview: '',
    roomElements: ROOM_ELEMENTS,
    lampOn: false,
    isDemo: config.localDemoEnabled
  },

  async onShow() {
    this.pageActive = true;
    const pet = petStore.getPet();
    if (!pet) {
      this.homeEggLayersReady = false;
      this.setData({
        pet: null,
        stage: 'empty',
        hasScenes: false,
        greeting: '',
        showNameSheet: false,
        syncPending: syncQueue.pendingCount(),
        homeEggBasePreview: '',
        homeEggArtPreview: ''
      });
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
      syncPending: syncQueue.pendingCount(),
      isDemo: runtime.getMode() === 'demo'
    }, () => {
      if (!hatched) {
        this.setupWindowFog();
        this.setupHomeEgg();
      }
    });
    analytics.track(hatched ? 'role_home_view' : 'hatch_home_view');
  },

  onReady() {
    this.setupWindowFog();
    this.setupHomeEgg();
  },

  setupHomeEgg() {
    if (!this.data.pet || this.data.stage === 'hatched') return;
    if (this.homeEggLayersReady) {
      this.renderHomeEgg();
      return;
    }
    if (this.homeEggSetupPending) return;
    this.homeEggSetupPending = true;
    const setupToken = this.homeEggSetupToken = (this.homeEggSetupToken || 0) + 1;
    let candidateLayers = null;
    const begin = () => {
      if (setupToken !== this.homeEggSetupToken) return;
      Promise.all([
        canvas2d.createLayer(this, '#homeEggBaseCanvas'),
        canvas2d.createLayer(this, '#homeEggArtCanvas')
      ]).then(layers => {
        if (setupToken !== this.homeEggSetupToken) return null;
        candidateLayers = layers;
        if (!candidateLayers[0] || !candidateLayers[1]) return null;
        return Promise.all([
          canvas2d.loadImage(candidateLayers[0], shellArtService.BASE_ASSET),
          canvas2d.loadImage(candidateLayers[1], shellArtService.BASE_ASSET)
        ]);
      }).then(images => {
        if (setupToken !== this.homeEggSetupToken) return;
        if (!images) {
          this.homeEggSetupPending = false;
          return;
        }
        this.homeEggBaseLayer = candidateLayers[0];
        this.homeEggArtLayer = candidateLayers[1];
        this.homeEggBaseImage = images[0];
        this.homeEggMaskImage = images[1];
        this.homeEggLayersReady = true;
        this.renderHomeEgg();
        this.homeEggSetupPending = false;
      }).catch(() => {
        if (setupToken === this.homeEggSetupToken) this.homeEggSetupPending = false;
      });
    };
    if (wx.nextTick) wx.nextTick(begin);
    else setTimeout(begin, 0);
  },

  renderHomeEgg() {
    if (!this.homeEggLayersReady || !this.data.pet || this.data.stage === 'hatched') return;
    const renderToken = this.homeEggRenderToken = (this.homeEggRenderToken || 0) + 1;
    const shell = shellArtService.normalizeShellArt(this.data.pet.shell);
    shellArtService.drawEggBase(
      this.homeEggBaseLayer.context,
      this.homeEggBaseImage,
      this.homeEggBaseLayer.width,
      this.homeEggBaseLayer.height,
      shell
    );
    shellArtService.drawEggArt(
      this.homeEggArtLayer.context,
      this.homeEggMaskImage,
      this.homeEggArtLayer.width,
      this.homeEggArtLayer.height,
      shell
    );
    Promise.all([
      canvas2d.exportImage(this.homeEggBaseLayer),
      canvas2d.exportImage(this.homeEggArtLayer)
    ]).then(previews => {
      if (renderToken !== this.homeEggRenderToken || !this.data.pet || this.data.stage === 'hatched') return;
      this.setData({
        homeEggBasePreview: previews[0] || this.data.environment.eggImage,
        homeEggArtPreview: previews[1] || ''
      });
    });
  },

  onHomeEggPreviewError(event) {
    const layer = event.currentTarget.dataset.layer;
    if (layer === 'art') {
      this.setData({ homeEggArtPreview: '' });
      return;
    }
    if (this.data.homeEggBasePreview !== this.data.environment.eggImage) {
      this.setData({ homeEggBasePreview: this.data.environment.eggImage });
    }
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
    return new Promise(resolve => {
      const detail = event.detail || {};
      wx.createSelectorQuery().in(this).select('.egg-zone').boundingClientRect(rect => {
        if (!rect) return resolve({ x: 0, y: 0 });
        const clientX = Number(detail.x || rect.left + rect.width / 2);
        const clientY = Number(detail.y || rect.top + rect.height / 2);
        const point = {
          x: Math.max(24, Math.min(rect.width - 24, clientX - rect.left)),
          y: Math.max(24, Math.min(rect.height - 24, clientY - rect.top))
        };
        const id = `tap-${timeService.now()}-${this.particleSequence = (this.particleSequence || 0) + 1}`;
        const next = this.data.tapParticles.concat({ id, x: point.x, y: point.y }).slice(-3);
        this.setData({ tapParticles: next });
        const timer = setTimeout(() => {
          if (this.pageActive) this.setData({ tapParticles: this.data.tapParticles.filter(item => item.id !== id) });
          this.particleTimers = (this.particleTimers || []).filter(item => item !== timer);
        }, 560);
        this.particleTimers = (this.particleTimers || []).concat(timer);
        resolve(point);
      }).exec();
    });
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
    analytics.track('companion_interaction', { interaction_type: 'touch', result: 'played' });
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
    this.setData({ eggMotion: 'egg--warming', sceneEffect: 'scene--cuddle' });
    this.cuddleVibrationTicker = setInterval(() => this.vibrateCuddleTick(), 1000);
    this.cuddleTimer = setTimeout(() => {
      clearInterval(this.cuddleVibrationTicker);
      if (this.vibrationCount < 3) this.vibrateCuddleTick();
      analytics.track('companion_interaction', { interaction_type: 'cuddle', result: 'played' });
      this.completedLongPress = true;
      this.setData({ eggMotion: 'egg--warm' });
      this.showFeedback('我暖起来了。');
      this.cuddleResetTimer = setTimeout(() => {
        this.setData({ eggMotion: '', sceneEffect: '' });
        this.onShow();
      }, 900);
    }, 3000);
  },

  onTouchEnd() {
    clearTimeout(this.cuddleTimer);
    clearInterval(this.cuddleVibrationTicker);
    if (!this.completedLongPress) this.setData({ eggMotion: '', sceneEffect: '' });
  },

  clearCuddleTimers() {
    clearTimeout(this.cuddleTimer);
    clearTimeout(this.cuddleResetTimer);
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

  onRoomElementTap(event) {
    const elementId = event.currentTarget.dataset.key;
    const element = ROOM_ELEMENTS.find(item => item.key === elementId);
    if (!element) return;
    let feedback = element.feedback;
    if (elementId === 'lamp') feedback = this.data.lampOn ? '灯暗下来，我们安静待一会儿。' : '灯亮了，我也看清你啦。';
    if (elementId === 'window') feedback = this.data.environment.weather === 'rain' ? '我在这里听着雨。' : '窗外的光慢慢落进房间。';
    if (elementId === 'lamp') this.setData({ lampOn: !this.data.lampOn });
    if (elementId === 'coffee') roomSound.playCoffeeChime();
    this.runSceneEffect(element.effect, element.motion, 900);
    this.showFeedback(feedback);
    analytics.track('room_element_interaction', { element_id: elementId, result: 'played' });
    if (element.route) {
      clearTimeout(this.roomElementRouteTimer);
      this.roomElementRouteTimer = setTimeout(() => wx.navigateTo({ url: element.route }), 820);
    }
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
    analytics.track('companion_interaction', { interaction_type: 'talk', result: 'played' });
    this.runSceneEffect('scene--listening', reaction.motion, 900, () => {
      this.onShow();
    });
  },

  onNameInput(event) {
    const value = Array.from(event.detail.value || '').slice(0, 10).join('');
    this.setData({ nameDraft: value, nameCount: Array.from(value).length, nameError: '' });
  },

  async onSaveName() {
    if (this.data.savingName) return;
    this.setData({ savingName: true, nameError: '' });
    const validation = petStore.validateNickname(this.data.nameDraft);
    if (!validation.ok) {
      this.setData({ savingName: false, nameError: validation.message || '名字没有保存成功' });
      return;
    }
    if (runtime.getMode() === 'demo') {
      const result = petStore.applyConfirmedNickname(validation.value);
      this.setData({ savingName: false, showNameSheet: !result.ok, nameError: result.ok ? '' : result.message });
      if (result.ok) {
        analytics.track('companion_interaction', { interaction_type: 'nickname', result: 'saved' });
        this.showFeedback('我记住自己的名字啦。');
        this.onShow();
      }
      return;
    }
    if (!config.backendEnabled) {
      this.setData({ savingName: false, nameError: '账号资料服务尚未接入，请稍后再试' });
      return;
    }
    const response = await cloudApi.updateEggName(this.data.pet.id, validation.value);
    if (!response.ok || response.mode !== 'live') {
      this.setData({ savingName: false, nameError: response.message || '名字没有保存成功，请重试' });
      return;
    }
    const result = petStore.applyConfirmedNickname(response.display_name || validation.value);
    if (!result.ok) {
      this.setData({ savingName: false, nameError: result.message || '名字没有保存成功，请重试' });
      return;
    }
    analytics.track('companion_interaction', { interaction_type: 'nickname', result: 'saved' });
    this.setData({ savingName: false, showNameSheet: false });
    this.showFeedback('我记住自己的名字啦。');
    this.onShow();
  },

  onSkipName() {
    const result = petStore.dismissNicknamePrompt();
    if (!result.ok) return this.setData({ nameError: result.message });
    this.setData({ showNameSheet: false, nameError: '' });
    this.onShow();
  },

  noop() {},

  onDemoAdvance() {
    const result = demoExperience.advanceToHatchable();
    if (!result.ok) {
      wx.showToast({ title: result.message, icon: 'none' });
      return;
    }
    wx.showToast({ title: '已进入破壳验收阶段', icon: 'none' });
    this.onShow();
  },

  onPrimaryAction() {
    if (this.data.stage === 'ready') wx.navigateTo({ url: '/pages/hatch/hatch' });
    else if (this.data.stage === 'hatched') wx.navigateTo({ url: '/pages/chat/chat' });
  },

  clearInteractionTimers() {
    this.clearCuddleTimers();
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.roomElementRouteTimer);
    this.clearEffectTimers();
    (this.particleTimers || []).forEach(clearTimeout);
    this.particleTimers = [];
  },

  onHide() {
    this.pageActive = false;
    this.clearInteractionTimers();
    this.completedLongPress = false;
    roomSound.stop();
    this.setData({ eggMotion: '', sceneEffect: '', feedback: '', tapParticles: [] });
  },

  onUnload() {
    this.pageActive = false;
    this.clearInteractionTimers();
    this.windowFogContext = null;
    this.windowEffectsRect = null;
    this.lastWindowWipePoint = null;
    this.windowFogInitialized = false;
    this.homeEggBaseLayer = null;
    this.homeEggArtLayer = null;
    this.homeEggBaseImage = null;
    this.homeEggMaskImage = null;
    this.homeEggLayersReady = false;
    this.homeEggSetupPending = false;
    this.homeEggSetupToken = (this.homeEggSetupToken || 0) + 1;
    this.homeEggRenderToken = (this.homeEggRenderToken || 0) + 1;
  }
});
