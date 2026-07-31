const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const timeService = require('../../services/time-service');
const sceneConfig = require('../../utils/life-scenes');
const syncQueue = require('../../services/sync-queue');
const environmentService = require('../../services/incubation-environment');
const shellArtService = require('../../services/egg-shell-art');
const canvas2d = require('../../utils/canvas-2d');
const runtime = require('../../services/runtime-context');
const practice = require('../../services/incubation-practice');
const touchLines = require('../../services/egg-touch-lines');
const deviceClock = require('../../services/device-clock');

const WEATHER_PARTICLES = Array.from({ length: 12 }, (_, index) => index);
const COMPANION_ACTIONS = [
  { key: 'wish', title: '许愿池', desc: '今天想和我做什么', icon: '/assets/scenes/incubation/svg/interaction_wish.svg' },
  { key: 'learn', title: '早教班', desc: '教我一件小事', icon: '/assets/scenes/incubation/svg/interaction_learn.svg' },
  { key: 'draw', title: '画画', desc: '画下我们的记号', icon: '/assets/scenes/incubation/svg/interaction_draw.svg' }
];
const DAILY_ACTION_MODULES = {
  wish: 'wish_pool',
  learn: 'edu_class'
};

function companionActionsFor(records, serverDate) {
  const targetDate = String(serverDate || '');
  const completedModules = new Set((records || [])
    .filter(record => (
      targetDate
      && (record.server_date || record.serverDate) === targetDate
      && record.module
    ))
    .map(record => record.module));

  return COMPANION_ACTIONS.map(item => {
    const module = DAILY_ACTION_MODULES[item.key];
    const completed = !!(module && completedModules.has(module));
    const appearance = item.key === 'draw' ? 'draw' : (completed ? 'completed' : 'card');
    return Object.assign({}, item, {
      completed,
      appearance,
      ariaLabel: completed
        ? `${item.title}，今天已经回答，点击查看`
        : (item.key === 'draw' ? '画画，点击打开绘图工具' : item.title)
    });
  });
}

Page({
  data: {
    pet: null,
    stage: 'empty',
    stageText: '',
    expectedHatchLabel: '',
    displayProgress: 100,
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
    companionActions: companionActionsFor([], ''),
    wishUnlocked: true,
    learnUnlocked: false,
    tapParticles: [],
    showNameSheet: false,
    nameDraft: '',
    nameCount: 0,
    nameError: '',
    savingName: false,
    homeEggBasePreview: '',
    homeEggArtPreview: '',
    lampOn: false,
    clockMode: 'analog',
    clockTopPx: 88,
    clockLeftPx: 18,
    clockTimeText: '--:--',
    clockDateText: '',
    clockHourStyle: 'transform:rotate(0deg);',
    clockMinuteStyle: 'transform:rotate(0deg);',
    clockSecondStyle: 'transform:rotate(0deg);',
    sceneOpening: false,
    sceneTransitionStyle: ''
  },

  formatExpectedHatch(hatchAt) {
    const timestamp = Date.parse(hatchAt || '');
    if (!Number.isFinite(timestamp)) return '';
    const date = new Date(timestamp + 8 * 60 * 60 * 1000);
    return `预计 ${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日破壳`;
  },

  prefersReducedMotion() {
    try {
      const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
      return !!(system.reducedMotion || system.enableReduceMotion);
    } catch (error) {
      return false;
    }
  },

  async onShow() {
    this.pageActive = true;
    this.configureClockPosition();
    if (this.data.sceneOpening) this.setData({ sceneOpening: false, sceneTransitionStyle: '' });
    if (this.getTabBar && this.getTabBar()) this.getTabBar().setData({ selected: 0 });
    const pet = petStore.getPet();
    if (!pet) {
      this.stopClock();
      this.homeEggLayersReady = false;
      this.setData({
        pet: null,
        stage: 'empty',
        hasScenes: false,
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
    const app = typeof getApp === 'function' ? getApp() : null;
    const serverEnvironment = app && app.globalData ? app.globalData.incubationEnvironment : null;
    const environment = environmentService.resolve(serverEnvironment, { createdAt: pet.createdAt });
    const lampStateKey = `${environment.dateKey}:${environment.period}`;
    const lampOn = this.lampOverride && this.lampOverride.key === lampStateKey
      ? this.lampOverride.value
      : environment.period === 'night';
    this.setData({
      pet,
      stage,
      stageText: presentation.homeText,
      expectedHatchLabel: hatched || stage === 'ready' ? '' : this.formatExpectedHatch(pet.hatchAt),
      actionLabel: presentation.actionLabel,
      dailyStatus: hatched ? petStore.getDailyStatus() : null,
      showNameSheet,
      nameDraft: pet.name || '',
      nameCount: Array.from(pet.name || '').length,
      nameError: '',
      hasScenes: hatched && sceneConfig.getScenesForCharacter(pet.prototype).length > 0,
      sceneImage: hatched ? sceneConfig.getScene('grass', pet.prototype).image : '',
      environment,
      lampOn,
      companionActions: companionActionsFor([], ''),
      syncPending: syncQueue.pendingCount()
    }, () => {
      if (!hatched) {
        this.startClock();
        this.setupWindowFog();
        this.setupHomeEgg();
      } else {
        this.stopClock();
      }
    });
    analytics.track(hatched ? 'role_home_view' : 'hatch_home_view');
    if (hatched) {
      practice.getManualState().then(state => {
        const rawTotal = state && state.points ? state.points.total : null;
        const total = Number(rawTotal);
        if (state.ok && rawTotal !== null && rawTotal !== undefined && Number.isFinite(total)) {
          this.setData({ displayProgress: Math.max(0, Math.min(100, Math.round(total))) });
        }
      });
    } else {
      practice.getManualState().then(state => {
        if (!state.ok) return;
        const unlocked = state.unlockedModules || [];
        const touchRecord = (state.records || []).find(record => (
          record.module === 'touch' && record.server_date === state.serverDate
        ));
        if (touchRecord) this.touchRecordedDate = state.serverDate;
        const currentPet = state.pet || this.data.pet;
        const currentStage = petStore.getStage(currentPet);
        const currentPresentation = petStore.getStagePresentation(currentStage);
        this.setData({
          pet: currentPet,
          stage: currentStage,
          stageText: currentPresentation.homeText,
          actionLabel: currentPresentation.actionLabel,
          expectedHatchLabel: currentStage === 'ready' ? '' : this.formatExpectedHatch(state.hatchAt || (state.pet && state.pet.hatchAt)),
          wishUnlocked: unlocked.includes('wish_pool'),
          learnUnlocked: unlocked.includes('edu_class'),
          companionActions: companionActionsFor(state.records, state.serverDate)
        });
      });
    }
  },

  onReady() {
    this.configureClockPosition();
    this.setupWindowFog();
    this.setupHomeEgg();
  },

  configureClockPosition() {
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const menuRect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
      const statusBarHeight = Number(windowInfo.statusBarHeight || 20);
      const safeLeft = windowInfo.safeArea ? Number(windowInfo.safeArea.left || 0) : 0;
      const clockTopPx = menuRect && Number(menuRect.bottom)
        ? Number(menuRect.bottom) + 8
        : statusBarHeight + 42;
      this.setData({
        clockTopPx: Math.round(clockTopPx),
        clockLeftPx: Math.round(safeLeft + 18)
      });
    } catch (error) {
      this.setData({ clockTopPx: 88, clockLeftPx: 18 });
    }
  },

  syncClock() {
    if (!this.pageActive || !this.data.pet || this.data.stage === 'hatched') return;
    const clock = deviceClock.snapshot(new Date());
    this.setData({
      clockTimeText: clock.timeText,
      clockDateText: clock.dateText,
      clockHourStyle: `transform:rotate(${clock.hourAngle}deg);`,
      clockMinuteStyle: `transform:rotate(${clock.minuteAngle}deg);`,
      clockSecondStyle: `transform:rotate(${clock.secondAngle}deg);`
    });
  },

  startClock() {
    this.stopClock();
    this.syncClock();
    const delay = deviceClock.millisecondsUntilNextSecond(Date.now());
    this.clockBoundaryTimer = setTimeout(() => {
      if (!this.pageActive || !this.data.pet || this.data.stage === 'hatched') return;
      this.syncClock();
      this.clockTimer = setInterval(() => this.syncClock(), 1000);
    }, delay);
  },

  stopClock() {
    clearTimeout(this.clockBoundaryTimer);
    clearInterval(this.clockTimer);
    this.clockBoundaryTimer = null;
    this.clockTimer = null;
  },

  onClockTap() {
    const clockMode = this.data.clockMode === 'analog' ? 'digital' : 'analog';
    this.syncClock();
    this.setData({ clockMode });
    analytics.track('room_element_interaction', { element_id: 'clock', result: clockMode });
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
    if (this.data.sceneOpening || !this.data.hasScenes) return;
    wx.createSelectorQuery().in(this).select('.life-home-scene').boundingClientRect(rect => {
      if (!rect) {
        wx.navigateTo({
          url: '/pages/life-scene/life-scene?scene=grass&entry=home-expand',
          animationType: 'none',
          animationDuration: 0
        });
        return;
      }
      const duration = this.prefersReducedMotion() ? 20 : 560;
      this.setData({
        sceneOpening: true,
        sceneTransitionStyle: `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;--scene-expand-duration:${duration}ms;`
      });
      const originQuery = [
        `origin_left=${encodeURIComponent(rect.left.toFixed(2))}`,
        `origin_top=${encodeURIComponent(rect.top.toFixed(2))}`,
        `origin_width=${encodeURIComponent(rect.width.toFixed(2))}`,
        `origin_height=${encodeURIComponent(rect.height.toFixed(2))}`
      ].join('&');
      clearTimeout(this.sceneOpenTimer);
      this.sceneOpenTimer = setTimeout(() => {
        wx.navigateTo({
          url: `/pages/life-scene/life-scene?scene=grass&entry=home-expand&${originQuery}`,
          animationType: 'none',
          animationDuration: 0,
          fail: () => this.setData({ sceneOpening: false, sceneTransitionStyle: '' })
        });
      }, Math.max(0, duration - 20));
    }).exec();
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
    const now = Date.now();
    this.runSceneEffect('scene--touch', this.prefersReducedMotion() ? '' : 'egg--wobble', 760);
    if (!this.lastEggVibrationAt || now - this.lastEggVibrationAt >= 300) {
      this.lastEggVibrationAt = now;
      try {
        if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
      } catch (error) {}
    }
    const currentDate = practice.dateKey();
    if (!currentDate || this.touchRecordedDate !== currentDate) {
      practice.submit('touch').then(result => {
        if (!result.ok) return;
        this.touchRecordedDate = result.serverDate || currentDate;
        if (!result.alreadyDone) {
          this.setData({ expectedHatchLabel: this.formatExpectedHatch(result.hatchAt) });
          this.showFeedback('我好像离你近了一点点。');
        }
      });
    }
    analytics.track('companion_interaction', { interaction_type: 'touch', result: 'played' });
    if (this.lastTapAt && now - this.lastTapAt < 2000) return;
    this.lastTapAt = now;
    const line = touchLines.choose({
      period: this.data.environment.period,
      weather: this.data.environment.weather,
      nearHatch: this.data.stage === 'soon' || this.data.stage === 'ready'
    }, this.recentTouchLines);
    this.recentTouchLines = (this.recentTouchLines || []).concat(line).slice(-5);
    this.showFeedback(line);
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
      practice.submitOnce('heartbeat').then(result => {
        if (result.ok && !result.alreadyDone) {
          this.showFeedback('你听见了壳里的心跳。');
          return;
        }
        this.showFeedback('我暖起来了。');
      });
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
    if (key === 'wish' && !this.data.wishUnlocked) return this.showFeedback('许愿池还在准备中。');
    if (key === 'learn' && !this.data.learnUnlocked) return this.showFeedback('再陪我一天，早教班就会打开。');
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

  onLampTap() {
    const lampOn = !this.data.lampOn;
    const environment = this.data.environment || {};
    this.lampOverride = {
      key: `${environment.dateKey || ''}:${environment.period || ''}`,
      value: lampOn
    };
    this.setData({ lampOn });
    this.showFeedback(lampOn ? '台灯亮起来了。' : '台灯关好了。');
    analytics.track('room_element_interaction', { element_id: 'lamp', result: lampOn ? 'on' : 'off' });
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
      const progress = result.ok ? await practice.submitOnce('nickname') : null;
      this.setData({ savingName: false, showNameSheet: !result.ok, nameError: result.ok ? '' : result.message });
      if (result.ok) {
        analytics.track('companion_interaction', { interaction_type: 'nickname', result: 'saved' });
        this.showFeedback(progress && !progress.alreadyDone ? '我记住名字啦，也离你近了一点点。' : '我记住自己的名字啦。');
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
    if (response.hatch_at) petStore.applyConfirmedHatchAt(response.hatch_at);
    await practice.submitOnce('nickname');
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

  onPrimaryAction() {
    if (this.data.stage === 'ready') wx.navigateTo({ url: '/pages/hatch/hatch' });
    else if (this.data.stage === 'hatched') wx.navigateTo({ url: '/pages/chat/chat' });
  },

  clearInteractionTimers() {
    this.clearCuddleTimers();
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.sceneOpenTimer);
    this.clearEffectTimers();
    (this.particleTimers || []).forEach(clearTimeout);
    this.particleTimers = [];
  },

  onHide() {
    this.pageActive = false;
    this.stopClock();
    this.clearInteractionTimers();
    this.completedLongPress = false;
    this.setData({ eggMotion: '', sceneEffect: '', feedback: '', tapParticles: [] });
  },

  onUnload() {
    this.pageActive = false;
    this.stopClock();
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
    this.recentTouchLines = [];
  }
});
