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
const postHatch = require('../../services/post-hatch-companion');
const preHatchAssets = require('../../config/pre-hatch-assets').PRE_HATCH;
const demoExperience = require('../../services/demo-experience');
const windowWeatherCanvas = require('../../utils/window-weather-canvas');

const SCENE_PREVIEW_STORAGE_KEY = 'eggbabe_scene_preview';
const COMPANION_HINT_STORAGE_KEY = 'eggbabe_companion_icon_hints_seen_v1';
const AUTO_SCENE_OPTION = {
  key: 'auto',
  seasonLabel: '自动',
  stateLabel: '跟随实时环境',
  label: '实时环境'
};
const SCENE_TESTER_OPTIONS = [AUTO_SCENE_OPTION].concat(preHatchAssets.sceneTesterOptions || []);
const SCENE_LAYER_LABELS = {
  background: '背景',
  nest: '窝垫',
  egg: '蛋体'
};
const WEATHER_LABELS = {
  sunny: '晴朗', cloudy: '多云', rain: '下雨', snow: '下雪', fog: '有雾',
  storm: '雷雨', afterRain: '雨后', postSnow: '雪后', wind: '有风'
};

function emptyScenePreloadAssets() {
  return { background: '', nest: '', egg: '' };
}

function storedScenePreviewKey() {
  try {
    return wx.getStorageSync(SCENE_PREVIEW_STORAGE_KEY) || 'auto';
  } catch (error) {
    return 'auto';
  }
}

function storeScenePreviewKey(key) {
  try {
    if (key === 'auto') wx.removeStorageSync(SCENE_PREVIEW_STORAGE_KEY);
    else wx.setStorageSync(SCENE_PREVIEW_STORAGE_KEY, key);
  } catch (error) {}
}

function hasSeenCompanionHints() {
  try {
    return Boolean(wx.getStorageSync(COMPANION_HINT_STORAGE_KEY));
  } catch (error) {
    return false;
  }
}

function markCompanionHintsSeen() {
  try {
    wx.setStorageSync(COMPANION_HINT_STORAGE_KEY, true);
  } catch (error) {}
}

function scenePreviewTarget(key) {
  if (!key || key === 'auto') return null;
  return (preHatchAssets.sceneTesterOptions || []).find(item => item.key === key) || null;
}

function previewEnvironment(base, target) {
  if (!target) return base;
  const isSunset = target.lightPhase === 'sunset';
  return Object.assign({}, base, {
    season: target.season,
    weather: target.weather,
    period: target.period,
    lightPhase: target.lightPhase,
    className: target.className,
    fullSceneImage: target.background,
    windowImage: environmentService.windowAssetPath(target.weather, target.period, isSunset),
    nestImage: target.nest,
    eggImage: target.egg,
    roomLightingEnabled: false
  });
}

function hasCustomizedShell(pet) {
  const shell = shellArtService.normalizeShellArt(pet && pet.shell);
  return shell.colorAlpha > 0 || shell.operations.length > 0;
}

const COMPANION_ACTIONS = [
  { key: 'wish', title: '许愿池', desc: '今天想和我做什么', icon: preHatchAssets.interactionIcons.wish },
  { key: 'learn', title: '早教班', desc: '教我一件小事', icon: preHatchAssets.interactionIcons.learn },
  { key: 'draw', title: '画画', desc: '画下我们的记号', icon: preHatchAssets.interactionIcons.draw }
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
    const appearance = item.key === 'draw' ? 'draw' : 'card';
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
    actionLabel: '',
    dailyStatus: null,
    postHatchSnapshot: null,
    postHatchLoading: false,
    postHatchError: '',
    feedback: '',
    eggMotion: '',
    sceneEffect: '',
    hasScenes: false,
    syncPending: 0,
    sceneImage: '',
    environment: environmentService.resolve(),
    dailyWindowEnvironment: environmentService.resolve(),
    companionActions: companionActionsFor([], ''),
    wishUnlocked: true,
    learnUnlocked: false,
    companionHintKey: '',
    companionHintVisible: false,
    tapParticles: [],
    showNameSheet: false,
    nameDraft: '',
    nameCount: 0,
    nameError: '',
    savingName: false,
    homeEggBasePreview: '',
    homeEggArtPreview: '',
    windowFogVisible: true,
    windowWeatherCanvasFailed: false,
    dailyWindowVisible: false,
    dailyWindowOriginStyle: '',
    dailyWindowWeatherLabel: '晴朗',
    dailyWindowPeriodLabel: '日间',
    fullSceneImageLoading: true,
    fullSceneImageFailed: false,
    previousFullSceneImage: '',
    sceneCrossfadeActive: false,
    pendingTimeSceneImage: '',
    timeSceneIntro: '',
    lampOn: false,
    clockMode: 'analog',
    nameTopPx: 88,
    clockTopPx: 132,
    clockLeftPx: 18,
    clockTimeText: '--:--',
    clockDateText: '',
    clockHourStyle: 'transform:rotate(0deg);',
    clockMinuteStyle: 'transform:rotate(0deg);',
    clockSecondStyle: 'transform:rotate(0deg);',
    sceneOpening: false,
    sceneTransitionStyle: '',
    isDemo: config.localDemoEnabled,
    stageTesterOpen: false,
    stageTesterBusy: false,
    stageTesterKey: 'day1',
    stageTesterLabel: '第 1 天',
    stageTesterOptions: demoExperience.PREVIEW_STAGES,
    sceneTesterTopPx: 88,
    sceneTesterOpen: false,
    sceneTesterBusy: false,
    sceneTesterError: '',
    sceneTesterKey: 'auto',
    sceneTesterLabel: '实时环境',
    sceneTesterOptions: SCENE_TESTER_OPTIONS,
    scenePreloadActive: false,
    scenePreloadToken: 0,
    scenePreloadAssets: emptyScenePreloadAssets()
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

  clearTimeSceneTimers() {
    clearTimeout(this.timeSceneRefreshTimer);
    clearTimeout(this.timeSceneIntroTimer);
    clearTimeout(this.timeSceneCrossfadeTimer);
    this.timeSceneRefreshTimer = null;
    this.timeSceneIntroTimer = null;
    this.timeSceneCrossfadeTimer = null;
  },

  triggerTimeSceneIntro(lightPhase) {
    clearTimeout(this.timeSceneIntroTimer);
    this.timeSceneIntroTimer = null;
    const phase = lightPhase === 'morning' || lightPhase === 'sunset' ? lightPhase : '';
    if (!phase || this.prefersReducedMotion() || !this.pageActive) {
      if (this.data.timeSceneIntro) this.setData({ timeSceneIntro: '' });
      return;
    }
    this.setData({ timeSceneIntro: '' }, () => {
      if (!this.pageActive || this.data.dailyWindowVisible) return;
      const begin = () => {
        if (!this.pageActive || this.data.dailyWindowVisible) return;
        this.setData({ timeSceneIntro: phase });
        this.timeSceneIntroTimer = setTimeout(() => {
          this.timeSceneIntroTimer = null;
          if (this.pageActive) this.setData({ timeSceneIntro: '' });
        }, 1250);
      };
      if (wx.nextTick) wx.nextTick(begin);
      else setTimeout(begin, 0);
    });
  },

  scheduleTimeSceneRefresh() {
    clearTimeout(this.timeSceneRefreshTimer);
    this.timeSceneRefreshTimer = null;
    if (
      !this.pageActive
      || !this.data.pet
      || this.data.stage === 'hatched'
      || this.data.dailyWindowVisible
      || this.sceneTestOverride
    ) return;
    const delay = environmentService.millisecondsUntilNextLightPhase();
    this.timeSceneRefreshTimer = setTimeout(() => {
      this.timeSceneRefreshTimer = null;
      this.refreshTimeScene();
    }, Math.min(delay + 1200, 2147483000));
  },

  refreshTimeScene() {
    if (
      !this.pageActive
      || !this.data.pet
      || this.data.stage === 'hatched'
      || this.data.dailyWindowVisible
      || this.sceneTestOverride
    ) return;
    const app = typeof getApp === 'function' ? getApp() : null;
    const serverEnvironment = app && app.globalData ? app.globalData.incubationEnvironment : null;
    const nextEnvironment = environmentService.resolve(serverEnvironment, { createdAt: this.data.pet.createdAt });
    const currentEnvironment = this.data.environment || {};
    if (nextEnvironment.className === currentEnvironment.className && nextEnvironment.fullSceneImage === currentEnvironment.fullSceneImage) {
      this.scheduleTimeSceneRefresh();
      return;
    }
    if (nextEnvironment.fullSceneImage && nextEnvironment.fullSceneImage !== currentEnvironment.fullSceneImage) {
      this.pendingTimeEnvironment = nextEnvironment;
      this.setData({ pendingTimeSceneImage: nextEnvironment.fullSceneImage });
      return;
    }
    this.commitTimeScene(nextEnvironment, false);
  },

  commitTimeScene(environment, crossfade) {
    if (!environment || !this.pageActive) return;
    const currentEnvironment = this.data.environment || {};
    const lampStateKey = `${environment.dateKey}:${environment.period}`;
    const lampOn = this.lampOverride && this.lampOverride.key === lampStateKey
      ? this.lampOverride.value
      : environment.period === 'night';
    const windowFogSceneKey = `${environment.dateKey}:${environment.fullSceneImage || environment.windowImage}`;
    const windowFogSceneChanged = this.windowFogSceneKey !== windowFogSceneKey;
    this.windowFogSceneKey = windowFogSceneKey;
    clearTimeout(this.timeSceneCrossfadeTimer);
    this.previousTimeEnvironment = crossfade ? currentEnvironment : null;
    this.pendingTimeEnvironment = null;
    this.setData({
      environment,
      previousFullSceneImage: crossfade ? String(currentEnvironment.fullSceneImage || '') : '',
      sceneCrossfadeActive: Boolean(crossfade),
      pendingTimeSceneImage: '',
      fullSceneImageLoading: false,
      fullSceneImageFailed: false,
      windowFogVisible: windowFogSceneChanged ? true : this.data.windowFogVisible,
      lampOn,
      homeEggBasePreview: this.sceneLayerEggActive ? environment.eggImage : this.data.homeEggBasePreview
    }, () => {
      this.setupWindowWeatherCanvas();
      this.triggerTimeSceneIntro(environment.lightPhase);
      this.scheduleTimeSceneRefresh();
      if (!crossfade) return;
      this.timeSceneCrossfadeTimer = setTimeout(() => {
        this.timeSceneCrossfadeTimer = null;
        this.previousTimeEnvironment = null;
        if (this.pageActive) this.setData({ previousFullSceneImage: '', sceneCrossfadeActive: false });
      }, this.prefersReducedMotion() ? 40 : 650);
    });
  },

  onTimeSceneImageLoad() {
    const environment = this.pendingTimeEnvironment;
    if (!environment || !this.pageActive || this.data.dailyWindowVisible) return;
    this.commitTimeScene(environment, true);
  },

  onTimeSceneImageError() {
    this.pendingTimeEnvironment = null;
    this.setData({ pendingTimeSceneImage: '' });
    clearTimeout(this.timeSceneRefreshTimer);
    if (!this.pageActive || this.data.dailyWindowVisible) return;
    this.timeSceneRefreshTimer = setTimeout(() => {
      this.timeSceneRefreshTimer = null;
      this.refreshTimeScene();
    }, 60000);
  },

  async onShow() {
    this.pageActive = true;
    this.clearTimeSceneTimers();
    this.pendingTimeEnvironment = null;
    this.previousTimeEnvironment = null;
    if (this.data.dailyWindowVisible) this.setData({ dailyWindowVisible: false });
    this.pendingSceneTarget = null;
    this.scenePreloadLoaded = null;
    this.scenePreloadRequestToken = (this.scenePreloadRequestToken || 0) + 1;
    this.configureClockPosition();
    if (this.data.sceneOpening) this.setData({ sceneOpening: false, sceneTransitionStyle: '' });
    if (this.getTabBar && this.getTabBar()) this.getTabBar().setData({ selected: 0, hidden: false });
    const pet = petStore.getPet();
    if (!pet) {
      this.stopClock();
      this.stopWindowWeatherAnimation();
      this.homeEggLayersReady = false;
      this.setData({
        pet: null,
        stage: 'empty',
        hasScenes: false,
        showNameSheet: false,
        syncPending: syncQueue.pendingCount(),
        homeEggBasePreview: '',
        homeEggArtPreview: '',
        previousFullSceneImage: '',
        sceneCrossfadeActive: false,
        pendingTimeSceneImage: '',
        timeSceneIntro: ''
      });
      return;
    }
    const stage = petStore.getStage(pet);
    const presentation = petStore.getStagePresentation(stage);
    const hatched = stage === 'hatched';
    const returningFromPostHatchScene = hatched && Boolean(this.postHatchLandingActive);
    if (returningFromPostHatchScene) this.postHatchLandingActive = false;
    const showNameSheet = !hatched && petStore.shouldPromptNickname();
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) tabBar.setData({ selected: 0, hidden: hatched, elevated: showNameSheet });
    const app = typeof getApp === 'function' ? getApp() : null;
    const serverEnvironment = app && app.globalData ? app.globalData.incubationEnvironment : null;
    const resolvedEnvironment = environmentService.resolve(serverEnvironment, { createdAt: pet.createdAt });
    const previewKey = config.localDemoEnabled ? storedScenePreviewKey() : 'auto';
    const previewTarget = scenePreviewTarget(previewKey);
    const environment = previewEnvironment(resolvedEnvironment, previewTarget);
    this.sceneTestOverride = previewTarget;
    this.sceneLayerEggActive = !hatched && !hasCustomizedShell(pet);
    const lampStateKey = `${environment.dateKey}:${environment.period}`;
    const lampOn = this.lampOverride && this.lampOverride.key === lampStateKey
      ? this.lampOverride.value
      : environment.period === 'night';
    const windowFogSceneKey = `${environment.dateKey}:${environment.fullSceneImage || environment.windowImage}`;
    const windowFogSceneChanged = this.windowFogSceneKey !== windowFogSceneKey;
    this.windowFogSceneKey = windowFogSceneKey;
    this.setData({
      pet,
      stage,
      stageText: presentation.homeText,
      expectedHatchLabel: hatched || stage === 'ready' ? '' : this.formatExpectedHatch(pet.hatchAt),
      actionLabel: hatched ? '' : presentation.actionLabel,
      dailyStatus: null,
      postHatchSnapshot: null,
      postHatchLoading: hatched,
      postHatchError: '',
      showNameSheet,
      nameDraft: pet.name || '',
      nameCount: Array.from(pet.name || '').length,
      nameError: '',
      hasScenes: hatched,
      sceneImage: hatched ? sceneConfig.assets.POST_HATCH.panoramaFallback : '',
      environment,
      fullSceneImageLoading: !hatched && Boolean(environment.fullSceneImage),
      fullSceneImageFailed: false,
      previousFullSceneImage: '',
      sceneCrossfadeActive: false,
      pendingTimeSceneImage: '',
      timeSceneIntro: '',
      windowFogVisible: !hatched && (windowFogSceneChanged ? true : this.data.windowFogVisible),
      lampOn,
      stageTesterKey: pet.demoPreviewStage || (hatched ? 'hatched' : 'day1'),
      stageTesterLabel: (demoExperience.PREVIEW_STAGES.find(item => item.key === (pet.demoPreviewStage || (hatched ? 'hatched' : 'day1'))) || demoExperience.PREVIEW_STAGES[0]).label,
      sceneTesterKey: previewTarget ? previewTarget.key : 'auto',
      sceneTesterLabel: previewTarget ? previewTarget.label : AUTO_SCENE_OPTION.label,
      sceneTesterError: '',
      sceneTesterBusy: false,
      scenePreloadActive: false,
      scenePreloadToken: this.scenePreloadRequestToken,
      scenePreloadAssets: emptyScenePreloadAssets(),
      homeEggBasePreview: !hatched && this.sceneLayerEggActive ? environment.eggImage : '',
      homeEggArtPreview: '',
      companionActions: companionActionsFor([], ''),
      syncPending: syncQueue.pendingCount()
    }, () => {
      if (!hatched) {
        this.startClock();
        this.setupWindowWeatherCanvas();
        this.triggerTimeSceneIntro(environment.lightPhase);
        this.scheduleTimeSceneRefresh();
        if (this.sceneLayerEggActive) {
          this.homeEggLayersReady = false;
          this.homeEggSetupPending = false;
          this.homeEggSetupToken = (this.homeEggSetupToken || 0) + 1;
          this.homeEggRenderToken = (this.homeEggRenderToken || 0) + 1;
        } else {
          this.setupHomeEgg();
        }
        this.scheduleCompanionFirstHint(stage, showNameSheet);
      } else {
        this.stopClock();
        this.stopWindowWeatherAnimation();
      }
    });
    analytics.track(hatched ? 'role_home_view' : 'hatch_home_view');
    if (hatched) {
      if (returningFromPostHatchScene) this.loadPostHatchSnapshot(pet);
      else this.openPostHatchLanding();
    } else {
      const manualStateToken = this.manualStateRequestToken = (this.manualStateRequestToken || 0) + 1;
      practice.getManualState().then(state => {
        if (!this.pageActive || manualStateToken !== this.manualStateRequestToken || !state.ok) return;
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
      }).catch(() => {});
    }
  },

  loadPostHatchSnapshot(pet) {
    const requestToken = this.postHatchRequestToken = (this.postHatchRequestToken || 0) + 1;
    clearTimeout(this.postHatchSlotTimer);
    this.setData({ postHatchLoading: true, postHatchError: '' });
    postHatch.getSnapshot(pet || this.data.pet).then(result => {
      if (!this.pageActive || requestToken !== this.postHatchRequestToken) return;
      if (!result.ok) {
        this.setData({ postHatchLoading: false, postHatchError: result.message || '此刻状态没有加载好' });
        return;
      }
      const current = result.currentState;
      this.setData({
        postHatchLoading: false,
        postHatchError: '',
        postHatchSnapshot: result,
        dailyStatus: result.mood,
        stageText: `${current.majorLabel} · ${current.label}`,
        sceneImage: result.previewImage || sceneConfig.assets.POST_HATCH.panoramaFallback
      });
      this.schedulePostHatchRefresh(current.slotEnd);
    }).catch(() => {
      if (this.pageActive && requestToken === this.postHatchRequestToken) {
        this.setData({ postHatchLoading: false, postHatchError: '此刻状态没有加载好，请重试' });
      }
    });
  },

  openPostHatchLanding() {
    if (this.postHatchLandingActive || this.postHatchLandingOpening) return;
    this.postHatchLandingOpening = true;
    this.postHatchLandingActive = true;
    wx.navigateTo({
      url: '/pages/life-scene/life-scene?entry=post-hatch-landing',
      animationType: 'none',
      animationDuration: 0,
      success: () => { this.postHatchLandingOpening = false; },
      fail: () => {
        this.postHatchLandingOpening = false;
        this.postHatchLandingActive = false;
        if (this.pageActive) this.loadPostHatchSnapshot(this.data.pet);
      }
    });
  },

  onRetryPostHatch() {
    if (!this.data.pet || this.data.postHatchLoading) return;
    this.loadPostHatchSnapshot(this.data.pet);
  },

  schedulePostHatchRefresh(slotEnd) {
    clearTimeout(this.postHatchSlotTimer);
    const delay = Number(slotEnd) - timeService.now();
    if (!Number.isFinite(delay) || delay <= 0) return;
    this.postHatchSlotTimer = setTimeout(() => {
      if (this.pageActive && this.data.stage === 'hatched') this.loadPostHatchSnapshot(this.data.pet);
    }, Math.min(delay + 500, 2147483000));
  },

  onReady() {
    this.configureClockPosition();
    this.setupWindowWeatherCanvas();
    if (!this.sceneTestOverride) this.setupHomeEgg();
  },

  configureClockPosition() {
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const menuRect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
      const statusBarHeight = Number(windowInfo.statusBarHeight || 20);
      const safeLeft = windowInfo.safeArea ? Number(windowInfo.safeArea.left || 0) : 0;
      const nameTopPx = menuRect && Number(menuRect.bottom)
        ? Number(menuRect.bottom) + 8
        : statusBarHeight + 42;
      this.setData({
        nameTopPx: Math.round(nameTopPx),
        clockTopPx: Math.round(nameTopPx + 44),
        clockLeftPx: Math.round(safeLeft + 18),
        sceneTesterTopPx: Math.round(nameTopPx)
      });
    } catch (error) {
      this.setData({ nameTopPx: 88, clockTopPx: 132, clockLeftPx: 18, sceneTesterTopPx: 88 });
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

  // DEV-ONLY: 正式上线前删除 stage tester 相关 data、WXML、WXSS 与事件。
  onStageTesterToggle() {
    if (!this.data.isDemo || this.data.stageTesterBusy) return;
    this.setData({
      stageTesterOpen: !this.data.stageTesterOpen,
      sceneTesterOpen: false
    });
  },

  // DEV-ONLY: 20 组季节/时令/天气验收器；release/trial 下不会渲染。
  onSceneTesterToggle() {
    if (!this.data.isDemo || this.data.sceneTesterBusy || this.data.stage === 'hatched') return;
    this.setData({
      sceneTesterOpen: !this.data.sceneTesterOpen,
      stageTesterOpen: false,
      sceneTesterError: ''
    });
  },

  beginScenePreload(target) {
    const token = this.scenePreloadRequestToken = (this.scenePreloadRequestToken || 0) + 1;
    this.pendingSceneTarget = target;
    this.scenePreloadLoaded = { background: false, nest: false, egg: false };
    this.setData({
      sceneTesterBusy: true,
      sceneTesterOpen: false,
      sceneTesterError: '',
      scenePreloadActive: true,
      scenePreloadToken: token,
      scenePreloadAssets: {
        background: target.background,
        nest: target.nest,
        egg: target.egg
      }
    });
  },

  onScenePreloadLoad(event) {
    const dataset = event.currentTarget.dataset || {};
    const layer = dataset.layer;
    const token = Number(dataset.token);
    if (
      !this.pageActive
      || !this.data.scenePreloadActive
      || token !== this.scenePreloadRequestToken
      || !this.pendingSceneTarget
      || !Object.prototype.hasOwnProperty.call(SCENE_LAYER_LABELS, layer)
    ) return;
    this.scenePreloadLoaded[layer] = true;
    if (!Object.keys(SCENE_LAYER_LABELS).every(key => this.scenePreloadLoaded[key])) return;

    const target = this.pendingSceneTarget;
    this.pendingSceneTarget = null;
    this.scenePreloadLoaded = null;
    storeScenePreviewKey(target.key);
    this.sceneTestOverride = target;
    this.homeEggLayersReady = false;
    this.homeEggSetupPending = false;
    this.homeEggSetupToken = (this.homeEggSetupToken || 0) + 1;
    this.homeEggRenderToken = (this.homeEggRenderToken || 0) + 1;
    this.setData({
      environment: previewEnvironment(this.data.environment, target),
      sceneTesterBusy: false,
      sceneTesterKey: target.key,
      sceneTesterLabel: target.label,
      scenePreloadActive: false,
      scenePreloadAssets: emptyScenePreloadAssets(),
      fullSceneImageLoading: true,
      fullSceneImageFailed: false,
      windowFogVisible: true,
      homeEggBasePreview: target.egg,
      homeEggArtPreview: ''
    }, () => {
      this.setupWindowWeatherCanvas();
      this.triggerTimeSceneIntro(target.lightPhase);
      wx.showToast({ title: `已切换：${target.label}`, icon: 'none' });
    });
  },

  onScenePreloadError(event) {
    const dataset = event.currentTarget.dataset || {};
    const layer = dataset.layer;
    const token = Number(dataset.token);
    if (
      !this.pageActive
      || token !== this.scenePreloadRequestToken
      || !this.pendingSceneTarget
      || !Object.prototype.hasOwnProperty.call(SCENE_LAYER_LABELS, layer)
    ) return;
    const target = this.pendingSceneTarget;
    const assetLabel = SCENE_LAYER_LABELS[layer];
    const assetPath = this.data.scenePreloadAssets[layer];
    console.warn('[scene-tester] asset preload failed', {
      scene: target.key,
      layer: assetLabel,
      path: assetPath,
      errMsg: event.detail && event.detail.errMsg
    });
    this.pendingSceneTarget = null;
    this.scenePreloadLoaded = null;
    this.scenePreloadRequestToken += 1;
    this.setData({
      sceneTesterBusy: false,
      sceneTesterError: `${assetLabel}没有加载好，请重试`,
      scenePreloadActive: false,
      scenePreloadToken: this.scenePreloadRequestToken,
      scenePreloadAssets: emptyScenePreloadAssets()
    });
    wx.showToast({ title: `${assetLabel}加载失败`, icon: 'none' });
  },

  onSceneTesterSelect(event) {
    if (!this.data.isDemo || this.data.sceneTesterBusy || this.data.stage === 'hatched') return;
    const key = event.currentTarget.dataset.scene;
    const target = SCENE_TESTER_OPTIONS.find(item => item.key === key);
    if (!target) return;
    if (key === this.data.sceneTesterKey) {
      this.setData({ sceneTesterOpen: false, sceneTesterError: '' });
      return;
    }
    if (key === 'auto') {
      this.pendingSceneTarget = null;
      this.scenePreloadLoaded = null;
      this.scenePreloadRequestToken = (this.scenePreloadRequestToken || 0) + 1;
      storeScenePreviewKey('auto');
      this.sceneTestOverride = null;
      this.setData({
        sceneTesterBusy: true,
        sceneTesterOpen: false,
        sceneTesterError: '',
        sceneTesterKey: 'auto',
        sceneTesterLabel: AUTO_SCENE_OPTION.label,
        scenePreloadActive: false,
        scenePreloadToken: this.scenePreloadRequestToken,
        scenePreloadAssets: emptyScenePreloadAssets(),
        homeEggBasePreview: '',
        homeEggArtPreview: ''
      }, () => {
        this.onShow().then(() => this.setData({ sceneTesterBusy: false }));
      });
      return;
    }
    this.beginScenePreload(target);
  },

  onStageTesterSelect(event) {
    if (!this.data.isDemo || this.data.stageTesterBusy) return;
    const stageKey = event.currentTarget.dataset.stage;
    const target = demoExperience.PREVIEW_STAGES.find(item => item.key === stageKey);
    if (!target) return;
    if (stageKey === this.data.stageTesterKey) {
      this.setData({ stageTesterOpen: false });
      return;
    }
    this.setData({ stageTesterBusy: true, stageTesterOpen: false });
    const result = demoExperience.setPreviewStage(stageKey);
    if (!result.ok) {
      this.setData({ stageTesterBusy: false });
      wx.showToast({ title: result.message || '测试阶段切换失败', icon: 'none' });
      return;
    }
    this.homeEggLayersReady = false;
    this.setData({
      stageTesterBusy: false,
      stageTesterKey: stageKey,
      stageTesterLabel: target.label,
      homeEggBasePreview: '',
      homeEggArtPreview: ''
    }, () => {
      wx.showToast({ title: `已切换到${target.label}`, icon: 'none' });
      this.onShow();
    });
  },

  setupHomeEgg() {
    if (!this.data.pet || this.data.stage === 'hatched' || this.sceneTestOverride || this.sceneLayerEggActive) return;
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
    if (!this.homeEggLayersReady || !this.data.pet || this.data.stage === 'hatched' || this.sceneTestOverride || this.sceneLayerEggActive) return;
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
          url: '/pages/life-scene/life-scene?entry=home-expand',
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
          url: `/pages/life-scene/life-scene?entry=home-expand&${originQuery}`,
          animationType: 'none',
          animationDuration: 0,
          fail: () => this.setData({ sceneOpening: false, sceneTransitionStyle: '' })
        });
      }, Math.max(0, duration - 20));
    }).exec();
  },

  onChangeScene(event) {
    const section = event && event.currentTarget && event.currentTarget.dataset.section || 'keepsakes';
    wx.navigateTo({ url: `/pages/life-scenes/life-scenes?section=${section}` });
  },

  onPetNameTap() {
    if (this.data.stage === 'hatched') {
      wx.navigateTo({ url: '/pages/nickname/nickname' });
      return;
    }
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) tabBar.setData({ elevated: true });
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
    if (this.data.stage === 'hatched' && this.data.postHatchSnapshot && !this.data.postHatchSnapshot.currentState.atHome) return;
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
      if (this.data.stage === 'hatched') this.showFeedback('我暖起来了。');
      else {
        practice.submitOnce('heartbeat').then(result => {
          if (result.ok && !result.alreadyDone) {
            this.showFeedback('你听见了壳里的心跳。');
            return;
          }
          this.showFeedback('我暖起来了。');
        });
      }
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

  cancelCompanionFirstHint() {
    clearTimeout(this.companionFirstHintTimer);
    this.companionFirstHintTimer = null;
  },

  clearCompanionHintTimers() {
    clearTimeout(this.companionHintRevealTimer);
    clearTimeout(this.companionHintTimer);
    clearTimeout(this.companionHintClearTimer);
    this.companionHintRevealTimer = null;
    this.companionHintTimer = null;
    this.companionHintClearTimer = null;
    this.companionHintRequestToken = (this.companionHintRequestToken || 0) + 1;
  },

  scheduleCompanionFirstHint(stage, blockedBySheet) {
    this.cancelCompanionFirstHint();
    if (blockedBySheet || stage === 'ready' || stage === 'hatched' || hasSeenCompanionHints()) return;
    this.companionFirstHintTimer = setTimeout(() => {
      this.companionFirstHintTimer = null;
      if (!this.pageActive || this.data.showNameSheet || this.data.stage === 'ready' || this.data.stage === 'hatched') return;
      this.showCompanionHint('all', 2400, { markSeen: true, keepFirstHintTimer: true });
    }, 420);
  },

  showCompanionHint(key, duration = 1800, options = {}) {
    if (!options.keepFirstHintTimer) this.cancelCompanionFirstHint();
    this.clearCompanionHintTimers();
    const requestToken = this.companionHintRequestToken;
    this.setData({ companionHintKey: key, companionHintVisible: false }, () => {
      if (!this.pageActive || requestToken !== this.companionHintRequestToken) return;
      this.companionHintRevealTimer = setTimeout(() => {
        this.companionHintRevealTimer = null;
        if (!this.pageActive || requestToken !== this.companionHintRequestToken) return;
        this.setData({ companionHintVisible: true });
        if (options.markSeen) markCompanionHintsSeen();
        this.companionHintTimer = setTimeout(() => {
          this.companionHintTimer = null;
          if (!this.pageActive || requestToken !== this.companionHintRequestToken) return;
          this.setData({ companionHintVisible: false });
          this.companionHintClearTimer = setTimeout(() => {
            this.companionHintClearTimer = null;
            if (this.pageActive && requestToken === this.companionHintRequestToken && !this.data.companionHintVisible) this.setData({ companionHintKey: '' });
          }, 180);
        }, duration);
      }, 20);
    });
  },

  onCompanionTouchStart(event) {
    const key = event.currentTarget.dataset.key;
    this.companionGestureKey = key;
    this.companionLongPressKey = '';
    this.companionLongPressTapKey = '';
  },

  onCompanionTouchEnd(event) {
    const key = event.currentTarget.dataset.key;
    if (this.companionGestureKey === key && this.companionLongPressKey === key) {
      this.companionLongPressTapKey = key;
    }
    this.companionGestureKey = '';
  },

  onCompanionTouchCancel() {
    this.companionGestureKey = '';
    this.companionLongPressKey = '';
    this.companionLongPressTapKey = '';
  },

  onCompanionLongPress(event) {
    const key = event.currentTarget.dataset.key;
    const action = COMPANION_ACTIONS.find(item => item.key === key);
    if (!action) return;
    this.cancelCompanionFirstHint();
    this.companionLongPressKey = key;
    this.showCompanionHint(key);
  },

  clearCompanionNavigation() {
    clearTimeout(this.companionNavigationTimer);
    clearTimeout(this.companionNavigationWatchdog);
    this.companionNavigationTimer = null;
    this.companionNavigationWatchdog = null;
    this.companionNavigationPending = false;
    this.companionNavigationStarted = false;
    this.companionNavigationToken = (this.companionNavigationToken || 0) + 1;
  },

  releaseCompanionNavigation(token, message) {
    if (token !== this.companionNavigationToken) return;
    this.clearCompanionNavigation();
    this.clearEffectTimers();
    if (this.pageActive) this.setData({ sceneEffect: '', eggMotion: '' });
    if (message && this.pageActive) this.showFeedback(message);
  },

  startCompanionNavigation(destination) {
    if (this.companionNavigationPending) return;
    this.companionNavigationPending = true;
    this.companionNavigationStarted = false;
    const token = this.companionNavigationToken = (this.companionNavigationToken || 0) + 1;
    this.runSceneEffect(destination.sceneEffect, destination.eggMotion, 520);
    this.companionNavigationTimer = setTimeout(() => {
      this.companionNavigationTimer = null;
      if (!this.pageActive || token !== this.companionNavigationToken || !this.companionNavigationPending) return;
      this.companionNavigationWatchdog = setTimeout(() => {
        if (token !== this.companionNavigationToken || !this.companionNavigationPending) return;
        this.releaseCompanionNavigation(token, this.companionNavigationStarted ? '' : '页面暂时没有打开，请再试一次。');
      }, 1800);
      wx.navigateTo({
        url: destination.route,
        success: () => {
          if (token === this.companionNavigationToken) this.companionNavigationStarted = true;
        },
        fail: () => this.releaseCompanionNavigation(token, '页面暂时没有打开，请再试一次。'),
        complete: () => {
          if (token === this.companionNavigationToken && !this.companionNavigationStarted) {
            this.releaseCompanionNavigation(token, '页面暂时没有打开，请再试一次。');
          }
        }
      });
    }, 520);
  },

  onCompanionTap(event) {
    const key = event.currentTarget.dataset.key;
    if (!COMPANION_ACTIONS.some(item => item.key === key)) return;
    if (this.companionLongPressKey === key || this.companionLongPressTapKey === key) {
      this.companionLongPressKey = '';
      this.companionLongPressTapKey = '';
      return;
    }
    if (this.companionNavigationPending) return;
    this.cancelCompanionFirstHint();
    if (key === 'wish' || key === 'learn' || key === 'draw') this.showCompanionHint(key);
    if (key === 'wish' && !this.data.wishUnlocked) return this.showFeedback('许愿池还在准备中。');
    if (key === 'learn' && !this.data.learnUnlocked) return this.showFeedback('早教班还在准备中。');
    const routes = {
      wish: { route: '/pages/wish/wish', sceneEffect: 'scene--wish', eggMotion: 'egg--talk-glow' },
      learn: { route: '/pages/lesson/lesson', sceneEffect: 'scene--learn', eggMotion: 'egg--talk-knock' },
      draw: { route: '/pages/doodle/doodle', sceneEffect: 'scene--draw', eggMotion: 'egg--talk-color' }
    };
    const destination = routes[key];
    if (destination) this.startCompanionNavigation(destination);
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

  onFullSceneImageLoad() {
    if (this.data.fullSceneImageLoading) this.setData({ fullSceneImageLoading: false });
  },

  onFullSceneImageError() {
    if (this.data.previousFullSceneImage && this.previousTimeEnvironment) {
      const previousEnvironment = this.previousTimeEnvironment;
      clearTimeout(this.timeSceneCrossfadeTimer);
      this.timeSceneCrossfadeTimer = null;
      this.previousTimeEnvironment = null;
      this.setData({
        environment: previousEnvironment,
        previousFullSceneImage: '',
        sceneCrossfadeActive: false,
        fullSceneImageLoading: false,
        fullSceneImageFailed: false,
        homeEggBasePreview: this.sceneLayerEggActive ? previousEnvironment.eggImage : this.data.homeEggBasePreview
      }, () => {
        this.setupWindowWeatherCanvas();
        this.scheduleTimeSceneRefresh();
      });
      return;
    }
    this.setData({ fullSceneImageLoading: false, fullSceneImageFailed: true });
    this.showFeedback('窗外景色暂时没加载好，先回到熟悉的小房间。');
    analytics.track('incubation_scene_asset_error', {
      asset: (this.data.environment && this.data.environment.fullSceneImage) || ''
    });
  },

  createWindowWeatherParticles(width, height) {
    return windowWeatherCanvas.createParticles(width, height);
  },

  setupWindowWeatherCanvas() {
    this.stopWindowWeatherAnimation();
    if (!this.pageActive || !this.data.pet || this.data.stage === 'hatched') return;
    const setupToken = (this.windowWeatherSetupToken || 0) + 1;
    this.windowWeatherSetupToken = setupToken;
    wx.createSelectorQuery().in(this).select('#windowWeatherCanvas').fields({ node: true, size: true }).exec(result => {
      if (setupToken !== this.windowWeatherSetupToken || !this.pageActive) return;
      const target = result && result[0];
      if (!target || !target.node || !target.width || !target.height) {
        this.windowWeatherCanvas = null;
        this.windowWeatherContext = null;
        this.setData({ windowWeatherCanvasFailed: true });
        return;
      }
      const canvas = target.node;
      const context = canvas.getContext('2d');
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const pixelRatio = Number(windowInfo.pixelRatio || 1);
      canvas.width = target.width * pixelRatio;
      canvas.height = target.height * pixelRatio;
      context.scale(pixelRatio, pixelRatio);
      this.windowWeatherCanvas = canvas;
      this.windowWeatherContext = context;
      this.windowWeatherSize = { width: target.width, height: target.height };
      this.windowWeatherParticles = this.createWindowWeatherParticles(target.width, target.height);
      this.setData({ windowWeatherCanvasFailed: false });
      this.startWindowWeatherAnimation();
    });
  },

  drawWindowFog(context, width, height, timestamp, opacity) {
    const drift = Math.sin(timestamp / 3400) * width * .035;
    const haze = context.createLinearGradient(drift - width * .08, 0, drift + width * 1.08, height);
    haze.addColorStop(0, `rgba(228,238,236,${opacity * .86})`);
    haze.addColorStop(.5, `rgba(242,246,239,${opacity})`);
    haze.addColorStop(1, `rgba(224,236,238,${opacity * .9})`);
    context.fillStyle = haze;
    context.fillRect(-width * .1, 0, width * 1.2, height);
  },

  drawWindowRain(context, width, height, timestamp, intensity) {
    const strength = Number(intensity || .72);
    const gust = Math.sin(timestamp / 2300) * 2.4;
    const baseLengths = [2.1, 3.5, 5.6];
    const lengthSteps = [.455, .7, .91];
    context.save();
    context.lineCap = 'round';
    (this.windowWeatherParticles || []).slice(0, 42).forEach((particle, index) => {
      const depth = index % 3;
      const velocity = 1.05 + depth * .42;
      const y = (particle.y + timestamp * particle.speed * velocity) % (height + 44) - 30;
      const x = (particle.x + index * 2 + gust * (1 + depth * .35)) % width;
      const length = baseLengths[depth] + (index % 4) * lengthSteps[depth];
      const slant = 2.4 + strength * 2.2 + gust * .18;
      const alpha = (.1 + depth * .065 + particle.opacity * .08) * strength;
      context.lineWidth = .48 + depth * .25;
      context.strokeStyle = `rgba(196,219,227,${alpha})`;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - slant, y + length);
      context.stroke();
    });
    context.restore();
  },

  drawWindowSnow(context, width, height, timestamp) {
    context.save();
    context.fillStyle = 'rgba(255,255,252,.82)';
    (this.windowWeatherParticles || []).slice(0, 30).forEach((particle, index) => {
      const y = (particle.y + timestamp * particle.speed * .72) % (height + 20) - 10;
      const x = particle.x + Math.sin(timestamp / 900 + index) * particle.drift;
      context.beginPath();
      context.arc(x, y, particle.radius, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  },

  drawWindowDroplets(context, width, height, timestamp, density) {
    context.save();
    context.lineCap = 'round';
    const count = Math.max(4, Math.round(10 * density));
    (this.windowWeatherParticles || []).slice(0, count).forEach((particle, index) => {
      const travel = timestamp * particle.speed * .075;
      const y = (particle.y + travel + index * 17) % (height + 36) - 18;
      const x = (particle.x + Math.sin(timestamp / 2100 + particle.phase) * 1.2) % width;
      const radius = 1.1 + (index % 3) * .55;
      const alpha = .12 + particle.opacity * .16;
      context.fillStyle = `rgba(224,238,242,${alpha})`;
      context.beginPath();
      context.moveTo(x, y - radius * 1.7);
      context.bezierCurveTo(x + radius * 1.15, y - radius * .2, x + radius, y + radius, x, y + radius * 1.2);
      context.bezierCurveTo(x - radius, y + radius, x - radius * 1.15, y - radius * .2, x, y - radius * 1.7);
      context.fill();
      if (index % 5 === 0) {
        context.strokeStyle = `rgba(216,233,239,${alpha * .65})`;
        context.lineWidth = .55;
        context.beginPath();
        context.moveTo(x, y + radius * 1.8);
        context.lineTo(x - .4, y + radius * 4.4 + (index % 3) * 2);
        context.stroke();
      }
    });
    context.restore();
  },

  drawWindowSunFlecks(context, width, height, timestamp, opacity) {
    context.save();
    (this.windowWeatherParticles || []).slice(0, 8).forEach((particle, index) => {
      const x = (particle.x + Math.sin(timestamp / 2600 + particle.phase) * particle.drift) % width;
      const y = particle.y * .8 + Math.cos(timestamp / 3100 + particle.phase) * 3;
      const radius = 5 + (index % 4) * 3;
      const glow = context.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgba(255,248,202,${opacity})`);
      glow.addColorStop(1, 'rgba(255,248,202,0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  },

  drawWindowCloudDrift(context, width, height, timestamp) {
    context.save();
    const drift = (timestamp / 90) % (width * 1.8) - width * .6;
    const cloud = context.createRadialGradient(drift, height * .28, 0, drift, height * .28, width * .62);
    cloud.addColorStop(0, 'rgba(235,241,239,.105)');
    cloud.addColorStop(1, 'rgba(235,241,239,0)');
    context.fillStyle = cloud;
    context.fillRect(0, 0, width, height);
    context.restore();
  },

  drawWindowLeaves(context, width, height, timestamp) {
    context.save();
    (this.windowWeatherParticles || []).slice(0, 12).forEach((particle, index) => {
      const y = (particle.y + timestamp * particle.speed * .28) % (height + 30) - 15;
      const x = (particle.x + timestamp * .006 + Math.sin(timestamp / 950 + particle.phase) * particle.drift * 2) % (width + 20) - 10;
      const size = 3.5 + (index % 4) * 1.1;
      context.save();
      context.translate(x, y);
      context.rotate(Math.sin(timestamp / 760 + particle.phase) * .9);
      context.fillStyle = index % 3 === 0 ? 'rgba(183,116,56,.54)' : 'rgba(208,153,73,.48)';
      context.beginPath();
      context.moveTo(-size, 0);
      context.quadraticCurveTo(0, -size * .75, size, 0);
      context.quadraticCurveTo(0, size * .75, -size, 0);
      context.fill();
      context.restore();
    });
    context.restore();
  },

  drawWindowLightning(context, width, height, timestamp) {
    const cycle = timestamp % 11800;
    if (cycle > 320) return;
    const firstPulse = cycle < 115 ? Math.sin(Math.PI * cycle / 115) : 0;
    const secondPulse = cycle > 185 && cycle < 300
      ? Math.sin(Math.PI * (cycle - 185) / 115) * .52
      : 0;
    const flash = Math.max(firstPulse, secondPulse);
    if (flash <= 0) return;
    context.save();
    const glow = context.createRadialGradient(width * .82, height * .08, 0, width * .82, height * .08, width * .95);
    glow.addColorStop(0, `rgba(218,231,255,${flash * .095})`);
    glow.addColorStop(.52, `rgba(205,222,249,${flash * .042})`);
    glow.addColorStop(1, 'rgba(199,219,248,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
    context.restore();
  },

  clipWindowGlass(context, width, height) {
    // The photographed window sill slopes down to the right. Keep this clip in
    // normalized coordinates so the weather edge follows it on every screen.
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(width, 0);
    context.lineTo(width, height * .98);
    context.lineTo(0, height * .88);
    context.closePath();
    context.clip();
  },

  drawWindowWeatherFrame(timestamp, options) {
    windowWeatherCanvas.drawFrame(
      this.windowWeatherContext,
      this.windowWeatherSize,
      this.windowWeatherParticles,
      this.data.environment,
      {
        timestamp,
        reducedMotion: Boolean(options && options.reducedMotion),
        fogVisible: this.data.windowFogVisible,
        clipGlass: true
      }
    );
  },

  windowWeatherNeedsAnimation() {
    return windowWeatherCanvas.needsAnimation(this.data.environment, this.data.windowFogVisible);
  },

  startWindowWeatherAnimation() {
    this.stopWindowWeatherAnimation();
    if (!this.windowWeatherCanvas || !this.windowWeatherContext) return;
    const animationToken = (this.windowWeatherAnimationToken || 0) + 1;
    this.windowWeatherAnimationToken = animationToken;
    const reducedMotion = this.prefersReducedMotion();
    if (reducedMotion) {
      // Deliberately render a stable, representative weather frame. This keeps
      // rain, snow, fog and droplets recognizable without motion or lightning.
      const staticFrameTime = 4200;
      this.drawWindowWeatherFrame(staticFrameTime, { reducedMotion: true });
      this.windowWeatherLastDrawAt = staticFrameTime;
      return;
    }
    const render = () => {
      if (animationToken !== this.windowWeatherAnimationToken || !this.pageActive) return;
      // Canvas requestAnimationFrame timestamps are relative to the page while
      // Date.now() is absolute. Use one clock consistently so later frames are
      // never blocked by a negative elapsed-time calculation.
      const frameTime = Date.now();
      if (!this.windowWeatherLastDrawAt || frameTime - this.windowWeatherLastDrawAt >= 33) {
        this.drawWindowWeatherFrame(frameTime);
        this.windowWeatherLastDrawAt = frameTime;
      }
      if (!this.windowWeatherNeedsAnimation()) return;
      if (this.windowWeatherCanvas.requestAnimationFrame) {
        this.windowWeatherFrameId = this.windowWeatherCanvas.requestAnimationFrame(render);
      } else {
        this.windowWeatherFrameTimer = setTimeout(render, 33);
      }
    };
    render();
  },

  stopWindowWeatherAnimation() {
    this.windowWeatherAnimationToken = (this.windowWeatherAnimationToken || 0) + 1;
    if (this.windowWeatherCanvas && this.windowWeatherCanvas.cancelAnimationFrame && this.windowWeatherFrameId != null) {
      this.windowWeatherCanvas.cancelAnimationFrame(this.windowWeatherFrameId);
    }
    clearTimeout(this.windowWeatherFrameTimer);
    this.windowWeatherLastDrawAt = 0;
    this.windowWeatherFrameId = null;
    this.windowWeatherFrameTimer = null;
  },

  onWindowTap() {
    if (this.data.dailyWindowVisible || this.data.stage === 'hatched') return;
    wx.createSelectorQuery().in(this).select('.window-effects').boundingClientRect(rect => {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const fallback = {
        left: Number(info.windowWidth || 375) * .58,
        top: 0,
        width: Number(info.windowWidth || 375) * .42,
        height: Number(info.windowHeight || 667) * .5
      };
      this.openDailyWindow(rect || fallback);
    }).exec();
  },

  openDailyWindow(rect) {
    if (!this.pageActive || this.data.dailyWindowVisible) return;
    const app = typeof getApp === 'function' ? getApp() : null;
    const serverEnvironment = app && app.globalData ? app.globalData.incubationEnvironment : null;
    const environment = this.sceneTestOverride
      ? this.data.environment
      : environmentService.resolve(serverEnvironment, { createdAt: this.data.pet && this.data.pet.createdAt });
    const origin = rect || {};
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) tabBar.setData({ hidden: true });
    this.clearTimeSceneTimers();
    this.pendingTimeEnvironment = null;
    this.previousTimeEnvironment = null;
    this.stopWindowWeatherAnimation();
    this.setData({
      dailyWindowVisible: true,
      timeSceneIntro: '',
      previousFullSceneImage: '',
      sceneCrossfadeActive: false,
      pendingTimeSceneImage: '',
      windowFogVisible: false,
      dailyWindowEnvironment: environment,
      dailyWindowOriginStyle: [
        `--daily-window-origin-left:${Number(origin.left || 0)}px;`,
        `--daily-window-origin-top:${Number(origin.top || 0)}px;`,
        `--daily-window-origin-width:${Math.max(1, Number(origin.width || 1))}px;`,
        `--daily-window-origin-height:${Math.max(1, Number(origin.height || 1))}px;`
      ].join(''),
      dailyWindowWeatherLabel: WEATHER_LABELS[environment.weather] || '晴朗',
      dailyWindowPeriodLabel: environment.lightPhase === 'sunset' ? '日落' : (environment.period === 'night' ? '夜晚' : '日间')
    });
    analytics.track('room_element_interaction', { element_id: 'window', result: 'daily_detail_opened' });
  },

  onDailyWindowClosed() {
    if (!this.data.dailyWindowVisible) return;
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) tabBar.setData({ selected: 0, hidden: false });
    this.setData({ dailyWindowVisible: false }, () => {
      if (this.pageActive && this.data.stage !== 'hatched') {
        this.setupWindowWeatherCanvas();
        this.refreshTimeScene();
      }
    });
    analytics.track('room_element_interaction', { element_id: 'window', result: 'daily_detail_closed' });
  },

  onDailyWindowRetry() {
    const environment = this.data.dailyWindowEnvironment || {};
    if (environment.windowImage) return;
    const pet = this.data.pet;
    const app = typeof getApp === 'function' ? getApp() : null;
    const serverEnvironment = app && app.globalData ? app.globalData.incubationEnvironment : null;
    const resolved = environmentService.resolve(serverEnvironment, { createdAt: pet && pet.createdAt });
    this.setData({
      dailyWindowEnvironment: resolved,
      dailyWindowWeatherLabel: WEATHER_LABELS[resolved.weather] || '晴朗',
      dailyWindowPeriodLabel: resolved.lightPhase === 'sunset' ? '日落' : (resolved.period === 'night' ? '夜晚' : '日间')
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
    else if (this.data.stage === 'hatched') this.onRoleTap();
  },

  clearInteractionTimers() {
    this.clearCuddleTimers();
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.sceneOpenTimer);
    clearTimeout(this.postHatchSlotTimer);
    this.cancelCompanionFirstHint();
    this.clearCompanionHintTimers();
    this.clearCompanionNavigation();
    this.companionLongPressKey = '';
    this.companionLongPressTapKey = '';
    this.companionGestureKey = '';
    this.clearEffectTimers();
    (this.particleTimers || []).forEach(clearTimeout);
    this.particleTimers = [];
  },

  onHide() {
    this.pageActive = false;
    this.manualStateRequestToken = (this.manualStateRequestToken || 0) + 1;
    this.pendingSceneTarget = null;
    this.scenePreloadLoaded = null;
    this.scenePreloadRequestToken = (this.scenePreloadRequestToken || 0) + 1;
    this.stopClock();
    this.stopWindowWeatherAnimation();
    this.clearTimeSceneTimers();
    this.pendingTimeEnvironment = null;
    this.previousTimeEnvironment = null;
    this.clearInteractionTimers();
    this.completedLongPress = false;
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) tabBar.setData({ hidden: this.data.stage === 'hatched', elevated: false });
    this.setData({
      dailyWindowVisible: false,
      eggMotion: '',
      sceneEffect: '',
      feedback: '',
      companionHintKey: '',
      companionHintVisible: false,
      tapParticles: [],
      previousFullSceneImage: '',
      sceneCrossfadeActive: false,
      pendingTimeSceneImage: '',
      timeSceneIntro: ''
    });
  },

  onUnload() {
    this.pageActive = false;
    this.manualStateRequestToken = (this.manualStateRequestToken || 0) + 1;
    this.pendingSceneTarget = null;
    this.scenePreloadLoaded = null;
    this.scenePreloadRequestToken = (this.scenePreloadRequestToken || 0) + 1;
    this.stopClock();
    this.stopWindowWeatherAnimation();
    this.clearTimeSceneTimers();
    this.pendingTimeEnvironment = null;
    this.previousTimeEnvironment = null;
    this.clearInteractionTimers();
    this.windowFogSceneKey = '';
    this.windowWeatherCanvas = null;
    this.windowWeatherContext = null;
    this.windowWeatherSize = null;
    this.windowWeatherParticles = null;
    this.windowWeatherSetupToken = (this.windowWeatherSetupToken || 0) + 1;
    this.homeEggBaseLayer = null;
    this.homeEggArtLayer = null;
    this.homeEggBaseImage = null;
    this.homeEggMaskImage = null;
    this.homeEggLayersReady = false;
    this.homeEggSetupPending = false;
    this.homeEggSetupToken = (this.homeEggSetupToken || 0) + 1;
    this.homeEggRenderToken = (this.homeEggRenderToken || 0) + 1;
    this.recentTouchLines = [];
    this.postHatchRequestToken = (this.postHatchRequestToken || 0) + 1;
  }
});
