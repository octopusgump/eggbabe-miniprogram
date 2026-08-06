const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const timeService = require('../../services/time-service');
const postHatch = require('../../services/post-hatch-companion');
const assets = require('../../config/post-hatch-assets');
const preHatchAssets = require('../../config/pre-hatch-assets').PRE_HATCH;
const config = require('../../config/v2');
const demoExperience = require('../../services/demo-experience');
const environmentService = require('../../services/incubation-environment');
const windowGeometry = require('../../utils/scene-window-geometry');
const lifeScenes = require('../../utils/life-scenes');

const WEATHER_LABELS = {
  sunny: '晴朗', cloudy: '多云', rain: '下雨', snow: '下雪', fog: '有雾',
  storm: '雷雨', afterRain: '雨后', postSnow: '雪后', wind: '有风'
};

const AUTO_SCENE_OPTION = Object.freeze({
  key: 'auto',
  label: '实时环境'
});
const SCENE_TESTER_OPTIONS = Object.freeze([AUTO_SCENE_OPTION].concat(preHatchAssets.sceneTesterOptions || []));
const AUTO_COMPANION_STATE_OPTION = Object.freeze({ key: 'auto', label: '跟随时间' });
const COMPANION_STATE_TEST_OPTIONS = Object.freeze([
  AUTO_COMPANION_STATE_OPTION,
  Object.freeze({ key: 'home-talk', label: '在家 · 可对话', major: 'home', stateKey: 'stare' }),
  Object.freeze({ key: 'home-busy', label: '在家 · 不便对话', major: 'home', stateKey: 'sleep' }),
  Object.freeze({ key: 'away-letter', label: '不在家 · 写信', major: 'travel', stateKey: 'dali' })
]);

const STATUS_BUBBLE_POOL = Object.freeze({
  sleep: Object.freeze(['我把自己卷成小饭团啦。', '枕头批准我再眯一会儿。', '我在梦里追一朵慢吞吞的云。']),
  lazy: Object.freeze(['被子太会抱人，我还没赢。', '我刚醒一点点，又困回去了。', '早晨先放口袋里，晚点再打开。']),
  stare: Object.freeze(['我在和光斑一起走神。', '桌上的光跑得比我快。', '我发呆得很认真，真的。']),
  tea: Object.freeze(['热气在跳舞，我先看一会儿。', '这口有点烫，嘴巴先请假。', '杯子暖暖的，我也慢下来。']),
  drawing: Object.freeze(['它本来是云，现在像小鱼。', '我画的圆，自己偷偷跑偏啦。', '这张纸好像比我更有主意。']),
  gaming: Object.freeze(['这一关很紧张，耳朵静音。', '小角色又跳歪了，我忍住笑。', '我快赢啦，先认真三小秒。']),
  window: Object.freeze(['云走得好慢，我也慢一点。', '我在数窗外亮晶晶的东西。', '风把树叶的小秘密吹过来啦。']),
  travel: Object.freeze(['我把风装进帽子里啦。', '路边的云，今天特别会走。', '我在远处拐一个小小的弯。']),
  work: Object.freeze(['我在认真忙，袖口都精神了。', '今天的小事排队来找我。', '我先把这一点点做好。']),
  school: Object.freeze(['我在上课，问题比铅笔多。', '今天的字好多，我慢慢认识它们。', '我把新知识塞进小脑袋啦。'])
});

function reducedMotionEnabled() {
  try {
    const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    return Boolean(system.reducedMotion || system.enableReduceMotion);
  } catch (error) {
    return false;
  }
}

function environmentForPet(pet) {
  const app = typeof getApp === 'function' ? getApp() : null;
  const globalData = app && app.globalData || {};
  return environmentService.resolve(null, {
    id: pet && pet.id, eggId: pet && pet.id, createdAt: pet && pet.createdAt,
    companionStartedAt: pet && pet.companionStartedAt, environmentSeed: pet && pet.environmentSeed,
    environmentVersion: pet && pet.environmentVersion, isHatched: true,
    environmentCdnBase: globalData.environmentCdnBase || ''
  });
}

function scenePreviewTarget(key) {
  if (!key || key === 'auto') return null;
  return (preHatchAssets.sceneTesterOptions || []).find(item => item.key === key) || null;
}

function companionStatePreviewTarget(key) {
  if (!key || key === 'auto') return null;
  return COMPANION_STATE_TEST_OPTIONS.find(item => item.key === key) || null;
}

function previewCompanionSnapshot(snapshot, target) {
  if (!snapshot || !snapshot.ok || !target) return snapshot;
  const definition = lifeScenes.resolveDefinition(target.major, target.stateKey);
  if (!definition) return snapshot;
  const current = snapshot.currentState || {};
  return Object.assign({}, snapshot, {
    currentState: Object.assign({}, definition, {
      slotIndex: current.slotIndex,
      slotStart: current.slotStart,
      slotEnd: current.slotEnd,
      actionDone: false,
      actionFeedback: '',
      letterSent: false,
      isPreview: true
    })
  });
}

function previewEnvironment(base, target) {
  if (!target) return base;
  return Object.assign({}, base, {
    season: target.season,
    weather: target.weather,
    period: target.period,
    lightPhase: target.lightPhase,
    sceneKey: target.key,
    valid: true,
    className: target.className,
    windowImage: environmentService.windowAssetPath(target.weather, target.period)
  });
}

function stageTesterPresentation(pet) {
  const key = String(pet && pet.demoPreviewStage || 'hatched');
  const stage = demoExperience.PREVIEW_STAGES.find(item => item.key === key) || demoExperience.PREVIEW_STAGES[demoExperience.PREVIEW_STAGES.length - 1];
  return { key: stage.key, label: stage.label };
}

function panoramaPresentation(sceneKey, panelWidth, panelHeight, cdnBase) {
  const sceneSet = assets.resolvePanoramaScene(sceneKey, cdnBase);
  const fallbackMeta = assets.POST_HATCH.panoramaFallbackMeta || {};
  const imageMeta = sceneSet && sceneSet.windowMeta || fallbackMeta;
  return {
    valid: Boolean(sceneSet),
    sceneSetId: sceneSet ? sceneSet.id : '',
    panoramaImage: sceneSet ? sceneSet.panorama : '',
    windowHotspots: windowGeometry.mapPanoramaRegions({
      imageWidth: imageMeta.width,
      imageHeight: imageMeta.height,
      panelWidth,
      panelHeight,
      regions: imageMeta.windowRegions
    })
  };
}

function characterPosePath(key, environment) {
  const pose = assets.POST_HATCH.characterPoses && assets.POST_HATCH.characterPoses[String(key || '')];
  if (typeof pose === 'string') return pose;
  const lightPhase = String(environment && environment.lightPhase || '');
  return pose && lightPhase ? String(pose[lightPhase] || '') : '';
}

function characterPresentation(pet, currentState, environment) {
  const prototype = String(pet && pet.prototype || '');
  const isJadeRabbit = prototype === '玉兔' || prototype === 'YT';
  const isAtHome = Boolean(currentState && currentState.atHome);
  const pose = String(currentState && currentState.key || '');
  const image = isJadeRabbit && isAtHome ? characterPosePath(pose, environment) : '';
  return {
    visible: Boolean(image),
    image,
    pose: image ? pose : '',
    screen: image ? Math.max(0, Math.min(2, Number(currentState && currentState.action && currentState.action.screen || 0))) : -1
  };
}

function homeFinderIcon(pet) {
  const sceneActions = assets.POST_HATCH.sceneActions || {};
  const findHome = sceneActions.findHome || {};
  const prototype = String(pet && pet.prototype || '');
  if (prototype === '玉兔' || prototype === 'YT') return findHome.jadeRabbit || findHome.egg || '';
  if (prototype === '锦鲤' || prototype === 'KOI') return findHome.boonKoi || findHome.egg || '';
  return findHome.egg || '';
}

function contextActionPresentation(pet, currentState, hasNewMessage) {
  const sceneActions = assets.POST_HATCH.sceneActions || {};
  const atHome = Boolean(currentState && currentState.atHome);
  return {
    icon: atHome ? homeFinderIcon(pet) : sceneActions.envelope || '',
    label: atHome ? '找到蛋宝宝' : '给蛋宝宝写信',
    hasNewMessage: Boolean(hasNewMessage),
    showTalkBadge: Boolean(atHome && currentState && currentState.canTalk && !hasNewMessage)
  };
}

function statusBubbleFor(currentState, previousText) {
  const pool = STATUS_BUBBLE_POOL[currentState && currentState.key] || STATUS_BUBBLE_POOL[currentState && currentState.major] || [];
  const candidates = pool.filter(text => text !== previousText);
  const options = candidates.length ? candidates : pool;
  return options[Math.floor(Math.random() * options.length)] || '';
}

function magicWindowPresentation() {
  const config = assets.POST_HATCH.magicWindow || {};
  const destinations = config.destinations || {};
  const entry = Object.entries(destinations).find(([, value]) => value && typeof value === 'object' && value.base);
  if (!config.enabled || !entry) return { enabled: false, key: '', label: '', base: '', clouds: '', koi: '' };
  const [key, value] = entry;
  return {
    enabled: true,
    key,
    label: String(value.label || key),
    base: String(value.base || ''),
    clouds: String(value.clouds || ''),
    koi: String(value.koi || '')
  };
}

function firstTouch(event, collectionName) {
  const collection = event && event[collectionName];
  const touch = collection && collection[0];
  if (!touch) return null;
  const x = Number(touch.clientX);
  const y = Number(touch.clientY);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

const MAGIC_WINDOW = magicWindowPresentation();

Page({
  data: {
    statusBarHeight: 20,
    pet: null,
    snapshot: null,
    currentState: null,
    loading: true,
    error: '',
    feedback: '',
    playedActionKind: '',
    actionBusy: false,
    talkDraft: '',
    talkBusy: false,
    talkReply: '',
    talkError: '',
    letterDraft: '',
    letterBusy: false,
    letterError: '',
    letterKeyboardHeight: 0,
    letterComposerTopPx: 220,
    composerVisible: false,
    toolboxVisible: false,
    dailyWindowVisible: false,
    magicWindowVisible: false,
    magicWindowLoading: false,
    magicWindowFailed: false,
    magicKoiReacting: false,
    magicWindowEnabled: MAGIC_WINDOW.enabled,
    magicWindowKey: MAGIC_WINDOW.key,
    magicWindowLabel: MAGIC_WINDOW.label,
    magicWindowBase: MAGIC_WINDOW.base,
    magicWindowSourceBase: MAGIC_WINDOW.base,
    magicWindowClouds: MAGIC_WINDOW.clouds,
    magicWindowKoi: MAGIC_WINDOW.koi,
    dailyWindowOriginStyle: '',
    dailyWindowEnvironment: environmentService.resolve(),
    dailyWindowWeatherLabel: '晴朗',
    dailyWindowPeriodLabel: '日间',
    reducedMotion: false,
    characterWarming: false,
    statusBubble: '',
    statusBubbleVisible: false,
    contextActionIcon: '',
    contextActionLabel: '',
    contextActionHasNewMessage: false,
    contextActionShowTalkBadge: false,
    toolboxIcon: assets.POST_HATCH.sceneActions && assets.POST_HATCH.sceneActions.toolbox || '',
    homeFocusVisible: false,
    homeTalkNudgeVisible: false,
    screens: [0, 1, 2],
    currentScreen: 1,
    scrollLeft: 0,
    panelWidth: 375,
    panelHeight: 667,
    enterFromHome: false,
    isExiting: false,
    exitTransitionStyle: '',
    panelSceneSetId: '',
    panoramaImage: '',
    previousPanoramaImage: '',
    sceneCrossfadeActive: false,
    windowHotspots: [[], [], []],
    showSceneCharacter: false,
    sceneCharacterImage: '',
    sceneCharacterPose: '',
    sceneCharacterScreen: -1,
    sceneBackgroundError: false,
    sceneBackgroundReady: false,
    sceneEntered: false,
    isDemo: config.localDemoEnabled,
    sceneTesterOpen: false,
    sceneTesterBusy: false,
    sceneTesterTopPx: 88,
    sceneTesterKey: 'auto',
    sceneTesterLabel: AUTO_SCENE_OPTION.label,
    sceneTesterOptions: SCENE_TESTER_OPTIONS,
    companionStateTesterOpen: false,
    companionStateTesterTopPx: 176,
    companionStateTesterKey: 'auto',
    companionStateTesterLabel: AUTO_COMPANION_STATE_OPTION.label,
    companionStateTesterOptions: COMPANION_STATE_TEST_OPTIONS,
    stageTesterOpen: false,
    stageTesterBusy: false,
    stageTesterTopPx: 132,
    stageTesterKey: 'hatched',
    stageTesterLabel: '破壳后',
    stageTesterOptions: demoExperience.PREVIEW_STAGES
  },

  onLoad(query) {
    this.pageActive = true;
    this.hasTrackedEnter = false;
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const menuRect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    const testerTopPx = menuRect && Number(menuRect.bottom)
      ? Number(menuRect.bottom) + 8
      : Number(info.statusBarHeight || 20) + 42;
    const pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      wx.showToast({ title: '破壳后才能进入这里', icon: 'none' });
      this.backTimer = setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 600);
      return;
    }
    const stageTester = stageTesterPresentation(pet);
    const origin = {
      left: Number(query.origin_left), top: Number(query.origin_top),
      width: Number(query.origin_width), height: Number(query.origin_height)
    };
    this.homeOrigin = Object.values(origin).every(Number.isFinite) && origin.width > 0 && origin.height > 0 ? origin : null;
    this.enteredAt = timeService.now();
    const dailyWindowEnvironment = environmentForPet(pet);
    const panelWidth = Number(info.windowWidth || 375);
    const panelHeight = Number(info.windowHeight || 667);
    const app = typeof getApp === 'function' ? getApp() : null;
    const panorama = panoramaPresentation(dailyWindowEnvironment.sceneKey, panelWidth, panelHeight, app && app.globalData && app.globalData.environmentCdnBase);
    this.setData({
      statusBarHeight: info.statusBarHeight || 20,
      panelWidth,
      panelHeight,
      // 首屏先定位到中屏，异步状态回来时不再从左屏横向滑过来。
      currentScreen: 1,
      scrollLeft: panelWidth,
      pet,
      panelSceneSetId: panorama.sceneSetId,
      panoramaImage: panorama.panoramaImage,
      windowHotspots: panorama.windowHotspots,
      enterFromHome: query.entry === 'home-expand' || query.entry === 'post-hatch-landing',
      dailyWindowEnvironment,
      dailyWindowWeatherLabel: WEATHER_LABELS[dailyWindowEnvironment.weather] || '晴朗',
      dailyWindowPeriodLabel: dailyWindowEnvironment.lightPhase === 'sunset' ? '日落' : (dailyWindowEnvironment.period === 'night' ? '夜晚' : '日间'),
      reducedMotion: reducedMotionEnabled(),
      sceneTesterTopPx: Math.round(testerTopPx),
      stageTesterTopPx: Math.round(testerTopPx + 44),
      companionStateTesterTopPx: Math.round(testerTopPx + 88),
      stageTesterKey: stageTester.key,
      stageTesterLabel: stageTester.label
    });
    this.scheduleEnvironmentRefresh();
    this.loadSnapshot();
  },

  loadSnapshot() {
    if (!this.data.pet) return;
    if (this.snapshotRequest && this.snapshotRequest.abort) this.snapshotRequest.abort();
    const token = this.loadToken = (this.loadToken || 0) + 1;
    this.clearSlotTimer();
    this.setData({ loading: true, error: '', talkError: '', letterError: '', actionBusy: false, talkBusy: false, letterBusy: false });
    const request = postHatch.getSnapshot(this.data.pet);
    this.snapshotRequest = request;
    request.then(result => {
      if (!this.pageActive || token !== this.loadToken) return;
      if (this.snapshotRequest === request) this.snapshotRequest = null;
      if (!result.ok) {
        this.setData({ loading: false, error: result.message || '此刻状态没有加载好' });
        return;
      }
      const snapshot = previewCompanionSnapshot(result, this.companionStateTestOverride);
      const currentState = snapshot.currentState;
      const screen = Math.max(0, Math.min(2, Number(currentState.screen || 0)));
      const character = characterPresentation(this.data.pet, currentState, this.data.dailyWindowEnvironment);
      const contextAction = contextActionPresentation(this.data.pet, currentState, snapshot.newMessage);
      const slotKey = `${currentState.slotIndex}:${currentState.major}:${currentState.key}`;
      const shouldShowStatusBubble = slotKey !== this.lastStatusSlotKey;
      const nextStatusBubble = shouldShowStatusBubble ? statusBubbleFor(currentState, this.lastStatusBubble) : '';
      const restoreToolbox = !!this.restoreToolboxAfterSnapshot;
      this.restoreToolboxAfterSnapshot = false;
      this.clearHomeFocusTimers();
      this.setData({
        loading: false,
        error: '',
        snapshot,
        currentState,
        showSceneCharacter: character.visible,
        sceneCharacterImage: character.image,
        sceneCharacterPose: character.pose,
        sceneCharacterScreen: character.screen,
        contextActionIcon: contextAction.icon,
        contextActionLabel: contextAction.label,
        contextActionHasNewMessage: contextAction.hasNewMessage,
        contextActionShowTalkBadge: contextAction.showTalkBadge,
        currentScreen: screen,
        scrollLeft: screen * this.data.panelWidth,
        feedback: currentState.actionDone ? currentState.actionFeedback : '',
        playedActionKind: currentState.actionDone ? currentState.action.kind : '',
        letterDraft: '',
        talkDraft: '',
        talkReply: '',
        composerVisible: false,
        toolboxVisible: restoreToolbox,
        homeFocusVisible: false,
        homeTalkNudgeVisible: false
      }, () => {
        if (shouldShowStatusBubble) {
          this.lastStatusSlotKey = slotKey;
          this.showStatusBubble(nextStatusBubble);
        }
      });
      if (!this.hasTrackedEnter) {
        analytics.track('scene_enter', { scene_id: `${currentState.major}:${currentState.key}`, entry_type: this.data.enterFromHome ? 'home_expand' : 'direct' });
        this.hasTrackedEnter = true;
      }
      if (!this.companionStateTestOverride) this.scheduleSlotRefresh(currentState.slotEnd);
    }).catch(() => {
      if (this.snapshotRequest === request) this.snapshotRequest = null;
      if (this.pageActive && token === this.loadToken) this.setData({ loading: false, error: '此刻状态没有加载好，请重试' });
    });
  },

  scheduleSlotRefresh(slotEnd) {
    const delay = Number(slotEnd) - timeService.now();
    if (!Number.isFinite(delay) || delay <= 0) return;
    this.slotTimer = setTimeout(() => this.loadSnapshot(), Math.min(delay + 500, 2147483000));
  },

  clearSlotTimer() { clearTimeout(this.slotTimer); this.slotTimer = null; },
  onRetry() { if (!this.data.loading) this.loadSnapshot(); },

  clearEnvironmentTimer() { clearTimeout(this.environmentTimer); this.environmentTimer = null; },
  displayedEnvironment() {
    return previewEnvironment(environmentForPet(this.data.pet), this.sceneTestOverride);
  },
  scheduleEnvironmentRefresh() {
    this.clearEnvironmentTimer();
    if (!this.pageActive || this.data.dailyWindowVisible || this.data.magicWindowVisible) return;
    const delay = environmentService.millisecondsUntilNextEnvironmentBoundary();
    this.environmentTimer = setTimeout(() => this.refreshEnvironment(), Math.min(delay + 1200, 2147483000));
  },
  refreshEnvironment() {
    if (!this.pageActive || !this.data.pet || this.data.dailyWindowVisible || this.data.magicWindowVisible) return;
    const environment = this.displayedEnvironment();
    const app = typeof getApp === 'function' ? getApp() : null;
    const panorama = panoramaPresentation(environment.sceneKey, this.data.panelWidth, this.data.panelHeight, app && app.globalData && app.globalData.environmentCdnBase);
    const changed = panorama.panoramaImage && panorama.panoramaImage !== this.data.panoramaImage;
    const character = characterPresentation(this.data.pet, this.data.currentState, environment);
    this.setData({
      dailyWindowEnvironment: environment,
      dailyWindowWeatherLabel: WEATHER_LABELS[environment.weather] || '晴朗',
      dailyWindowPeriodLabel: environment.lightPhase === 'sunset' ? '日落' : (environment.period === 'night' ? '夜晚' : '日间'),
      panelSceneSetId: panorama.sceneSetId, panoramaImage: panorama.panoramaImage,
      previousPanoramaImage: changed ? this.data.panoramaImage : '', windowHotspots: panorama.windowHotspots,
      sceneCrossfadeActive: changed, sceneBackgroundError: !panorama.valid,
      showSceneCharacter: character.visible,
      sceneCharacterImage: character.image,
      sceneCharacterPose: character.pose,
      sceneCharacterScreen: character.screen
    }, () => {
      if (changed) {
        clearTimeout(this.environmentCrossfadeTimer);
        this.environmentCrossfadeTimer = setTimeout(() => this.pageActive && this.setData({ previousPanoramaImage: '', sceneCrossfadeActive: false }), this.data.reducedMotion ? 20 : 520);
      }
      this.scheduleEnvironmentRefresh();
    });
  },

  onSceneBackgroundLoad() {
    if (!this.pageActive) return;
    if (!this.data.sceneBackgroundReady || this.data.sceneBackgroundError) {
      this.setData({ sceneBackgroundReady: true, sceneBackgroundError: false }, () => this.revealInitialScene());
    }
  },

  onSceneBackgroundError() {
    if (!this.pageActive) return;
    this.setData({ sceneBackgroundReady: true, sceneBackgroundError: true }, () => this.revealInitialScene());
  },

  revealInitialScene() {
    if (!this.pageActive || this.data.sceneEntered || !this.data.currentState || !this.data.sceneBackgroundReady) return;
    clearTimeout(this.sceneEnterTimer);
    this.sceneEnterTimer = setTimeout(() => {
      if (this.pageActive && this.data.currentState && this.data.sceneBackgroundReady) this.setData({ sceneEntered: true });
    }, this.data.reducedMotion ? 0 : 24);
  },

  onRetrySceneBackground() {
    const app = typeof getApp === 'function' ? getApp() : null;
    const panorama = panoramaPresentation(this.data.dailyWindowEnvironment && this.data.dailyWindowEnvironment.sceneKey, this.data.panelWidth, this.data.panelHeight, app && app.globalData && app.globalData.environmentCdnBase);
    this.setData({
      sceneBackgroundError: false,
      panelSceneSetId: panorama.sceneSetId,
      panoramaImage: panorama.panoramaImage,
      windowHotspots: panorama.windowHotspots
    });
  },

  // DEV-ONLY：与破壳前首页使用同一套 36 个环境 key；release/trial 下不渲染。
  onSceneTesterToggle() {
    if (!this.data.isDemo || this.data.sceneTesterBusy) return;
    this.setData({ sceneTesterOpen: !this.data.sceneTesterOpen, stageTesterOpen: false, companionStateTesterOpen: false });
  },

  onSceneTesterSelect(event) {
    if (!this.data.isDemo || this.data.sceneTesterBusy) return;
    const key = event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.scene;
    const target = key === 'auto' ? null : scenePreviewTarget(key);
    if (key !== 'auto' && !target) return;
    if (key === this.data.sceneTesterKey) {
      this.setData({ sceneTesterOpen: false });
      return;
    }
    this.sceneTestOverride = target;
    this.setData({
      sceneTesterBusy: true,
      sceneTesterOpen: false,
      sceneTesterKey: key,
      sceneTesterLabel: target ? target.label : AUTO_SCENE_OPTION.label
    }, () => {
      this.refreshEnvironment();
      this.setData({ sceneTesterBusy: false });
      wx.showToast({ title: target ? `已切换：${target.label}` : '已恢复实时环境', icon: 'none' });
    });
  },

  // DEV-ONLY：与首页共享 Day 1–Day 7 / 破壳后阶段验收器。
  onStageTesterToggle() {
    if (!this.data.isDemo || this.data.stageTesterBusy) return;
    this.setData({ stageTesterOpen: !this.data.stageTesterOpen, sceneTesterOpen: false, companionStateTesterOpen: false });
  },

  onStageTesterSelect(event) {
    if (!this.data.isDemo || this.data.stageTesterBusy) return;
    const stageKey = event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.stage;
    const target = demoExperience.PREVIEW_STAGES.find(item => item.key === stageKey);
    if (!target) return;
    if (stageKey === this.data.stageTesterKey) {
      this.setData({ stageTesterOpen: false });
      return;
    }
    this.setData({ stageTesterBusy: true, stageTesterOpen: false, sceneTesterOpen: false, companionStateTesterOpen: false });
    const result = demoExperience.setPreviewStage(stageKey);
    if (!result.ok) {
      this.setData({ stageTesterBusy: false });
      wx.showToast({ title: result.message || '测试阶段切换失败', icon: 'none' });
      return;
    }
    if (stageKey !== 'hatched') {
      wx.showToast({ title: `已切换到${target.label}`, icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 220);
      return;
    }
    this.setData({
      pet: result.pet,
      stageTesterBusy: false,
      stageTesterKey: target.key,
      stageTesterLabel: target.label,
      companionStateTesterKey: 'auto',
      companionStateTesterLabel: AUTO_COMPANION_STATE_OPTION.label
    }, () => {
      this.companionStateTestOverride = null;
      this.refreshEnvironment();
      this.loadSnapshot();
      wx.showToast({ title: `已切换到${target.label}`, icon: 'none' });
    });
  },

  // DEV-ONLY：只覆盖当前页的陪伴状态，用于验证入口与转场；不写入陪伴记录。
  onCompanionStateTesterToggle() {
    if (!this.data.isDemo) return;
    this.setData({
      companionStateTesterOpen: !this.data.companionStateTesterOpen,
      stageTesterOpen: false,
      sceneTesterOpen: false
    });
  },

  onCompanionStateTesterSelect(event) {
    if (!this.data.isDemo) return;
    const key = event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.companionState;
    const target = companionStatePreviewTarget(key);
    if (key !== 'auto' && !target) return;
    if (key === this.data.companionStateTesterKey) {
      this.setData({ companionStateTesterOpen: false });
      return;
    }
    this.companionStateTestOverride = target;
    this.setData({
      companionStateTesterOpen: false,
      companionStateTesterKey: key,
      companionStateTesterLabel: target ? target.label : AUTO_COMPANION_STATE_OPTION.label
    }, () => {
      this.loadSnapshot();
      wx.showToast({ title: target ? `已切换：${target.label}` : '已跟随真实时间', icon: 'none' });
    });
  },

  onScroll(event) {
    const left = Number(event.detail && event.detail.scrollLeft || 0);
    if (this.windowGesture && Math.abs(left - this.windowGesture.startScrollLeft) > 3) this.windowGesture.moved = true;
    const screen = Math.max(0, Math.min(2, Math.round(left / this.data.panelWidth)));
    if (screen !== this.data.currentScreen) this.setData({ currentScreen: screen, toolboxVisible: false });
  },

  onResize(size) {
    const next = size && size.size || size || {};
    const panelWidth = Number(next.windowWidth || this.data.panelWidth);
    const panelHeight = Number(next.windowHeight || this.data.panelHeight);
    const screen = Number(this.data.currentScreen || 0);
    const app = typeof getApp === 'function' ? getApp() : null;
    const panorama = panoramaPresentation(this.data.dailyWindowEnvironment && this.data.dailyWindowEnvironment.sceneKey, panelWidth, panelHeight, app && app.globalData && app.globalData.environmentCdnBase);
    this.setData({
      panelWidth,
      panelHeight,
      panelSceneSetId: panorama.sceneSetId,
      panoramaImage: panorama.panoramaImage,
      windowHotspots: panorama.windowHotspots,
      scrollLeft: Math.max(0, Math.min(2, screen)) * panelWidth,
      letterComposerTopPx: this.resolveLetterComposerTop(this.data.letterKeyboardHeight, panelHeight, panelWidth)
    });
  },

  vibrateCuddleTick() {
    if (this.cuddleVibrationCount >= 3) return;
    this.cuddleVibrationCount += 1;
    try { if (wx.vibrateShort) wx.vibrateShort({ type: 'light' }); } catch (error) {}
  },

  onCharacterTouchStart() {
    if (!this.data.currentState || !this.data.currentState.atHome) return;
    this.clearCuddleTimers();
    this.cuddleCompleted = false;
    this.cuddleVibrationCount = 0;
    this.setData({ characterWarming: true });
    this.cuddleVibrationTicker = setInterval(() => this.vibrateCuddleTick(), 1000);
    this.cuddleTimer = setTimeout(() => {
      this.cuddleCompleted = true;
      clearInterval(this.cuddleVibrationTicker);
      if (this.cuddleVibrationCount < 3) this.vibrateCuddleTick();
      this.showFeedback('我暖起来了。');
      analytics.track('companion_interaction', { interaction_type: 'cuddle', result: 'played' });
      this.cuddleResetTimer = setTimeout(() => {
        if (this.pageActive) this.setData({ characterWarming: false });
      }, this.data.reducedMotion ? 20 : 900);
    }, 3000);
  },

  onCharacterTouchEnd() {
    clearTimeout(this.cuddleTimer);
    clearInterval(this.cuddleVibrationTicker);
    if (!this.cuddleCompleted) this.setData({ characterWarming: false });
  },

  clearCuddleTimers() {
    clearTimeout(this.cuddleTimer);
    clearTimeout(this.cuddleResetTimer);
    clearInterval(this.cuddleVibrationTicker);
    this.cuddleTimer = null;
    this.cuddleResetTimer = null;
    this.cuddleVibrationTicker = null;
    this.cuddleCompleted = false;
  },

  showFeedback(text) {
    clearTimeout(this.feedbackTimer);
    this.setData({ feedback: text || '' });
    this.feedbackTimer = setTimeout(() => {
      if (this.pageActive) this.setData({ feedback: '' });
    }, 2600);
  },

  showStatusBubble(text) {
    clearTimeout(this.statusBubbleTimer);
    clearTimeout(this.statusBubbleClearTimer);
    if (!text) {
      this.setData({ statusBubble: '', statusBubbleVisible: false });
      return;
    }
    this.lastStatusBubble = text;
    this.setData({ statusBubble: text, statusBubbleVisible: true });
    this.statusBubbleTimer = setTimeout(() => {
      if (!this.pageActive) return;
      this.setData({ statusBubbleVisible: false });
      this.statusBubbleClearTimer = setTimeout(() => {
        if (this.pageActive) this.setData({ statusBubble: '' });
      }, this.data.reducedMotion ? 20 : 220);
    }, 2600);
  },

  onCharacterTap() {
    if (this.cuddleCompleted) {
      this.cuddleCompleted = false;
      return;
    }
    const mood = this.data.snapshot && this.data.snapshot.mood;
    if (!mood) return;
    const moodText = `今日心情 · ${mood.mood}\n${mood.line}`;
    const current = this.data.currentState;
    if (current && current.action && current.action.kind === 'pet' && !current.actionDone) {
      this.runSceneAction(false, moodText);
    } else {
      this.showFeedback(moodText);
    }
    analytics.track('companion_interaction', { interaction_type: 'mood_peek', result: 'shown' });
  },

  onSceneAction() { this.runSceneAction(false); },

  isCompanionStatePreview() { return Boolean(this.companionStateTestOverride); },

  runSceneAction(openWindowAfter, feedbackOverride, windowSelector) {
    const current = this.data.currentState;
    if (!current || !current.atHome || this.data.actionBusy) return;
    if (this.isCompanionStatePreview()) {
      const feedback = feedbackOverride || current.action.feedback;
      this.setData({
        'currentState.actionDone': true,
        'currentState.actionFeedback': feedback,
        playedActionKind: current.action.kind
      });
      this.showFeedback(feedback);
      if (openWindowAfter) this.openDailyWindow(windowSelector);
      return;
    }
    clearTimeout(this.feedbackTimer);
    this.setData({ actionBusy: true });
    postHatch.performAction(this.data.pet, this.data.snapshot).then(result => {
      if (!this.pageActive) return;
      this.setData({ actionBusy: false });
      if (!result.ok) {
        this.showFeedback(result.message || '这次没有回应，请重试');
        return;
      }
      const actionDone = true;
      this.setData({ 'currentState.actionDone': actionDone, 'currentState.actionFeedback': result.feedback || current.action.feedback, playedActionKind: current.action.kind });
      this.showFeedback(feedbackOverride || result.feedback || current.action.feedback);
      if (openWindowAfter) this.openDailyWindow(windowSelector);
    }).catch(() => {
      if (this.pageActive) {
        this.setData({ actionBusy: false });
        this.showFeedback('这次没有回应，请重试');
      }
    });
  },

  noop() {},

  onContextActionTap() {
    const current = this.data.currentState;
    if (!current) return;
    const newMessage = this.data.snapshot && this.data.snapshot.newMessage;
    if (newMessage) {
      if (current.atHome) {
        this.focusHomeCharacter(current);
        this.showFeedback(newMessage.line || '我给你留了一句话。');
        this.markNewMessageRead(newMessage);
      } else {
        this.returningFromChild = true;
        wx.navigateTo({ url: `/pages/life-scenes/life-scenes?section=postcards&postcard_id=${encodeURIComponent(newMessage.id)}` });
      }
      analytics.track('room_element_interaction', { element_id: 'scene_new_message_button', result: 'opened' });
      return;
    }
    if (current.atHome) {
      this.focusHomeCharacter(current);
      return;
    }
    const screen = Math.max(0, Math.min(2, Number(current.screen || 0)));
    this.setData({
      composerVisible: true,
      toolboxVisible: false,
      currentScreen: screen,
      scrollLeft: screen * this.data.panelWidth,
      letterKeyboardHeight: 0,
      letterComposerTopPx: this.resolveLetterComposerTop(0)
    });
    analytics.track('room_element_interaction', { element_id: 'scene_letter_button', result: 'opened' });
  },

  markNewMessageRead(message) {
    postHatch.markPostcardRead(this.data.pet, message && message.id).then(result => {
      if (!this.pageActive || !result || !result.ok) return;
      const contextAction = contextActionPresentation(this.data.pet, this.data.currentState, null);
      this.setData({
        'snapshot.newMessage': null,
        contextActionHasNewMessage: false,
        contextActionShowTalkBadge: contextAction.showTalkBadge
      });
    }).catch(() => {});
  },

  focusHomeCharacter(current) {
    const screen = Math.max(0, Math.min(2, Number(current.screen || 0)));
    this.clearHomeFocusTimers();
    this.setData({
      composerVisible: false,
      toolboxVisible: false,
      currentScreen: screen,
      scrollLeft: screen * this.data.panelWidth,
      homeFocusVisible: true,
      homeTalkNudgeVisible: !!current.canTalk
    });
    this.homeFocusTimer = setTimeout(() => {
      if (this.pageActive) this.setData({ homeFocusVisible: false });
    }, this.data.reducedMotion ? 20 : 1120);
    if (current.canTalk) {
      this.homeTalkNudgeTimer = setTimeout(() => {
        if (this.pageActive) this.setData({ homeTalkNudgeVisible: false });
      }, this.data.reducedMotion ? 2400 : 4200);
    }
    analytics.track('room_element_interaction', { element_id: 'scene_find_home_button', result: 'focused' });
  },

  onOpenTalkComposer() {
    const current = this.data.currentState;
    if (!current || !current.atHome || !current.canTalk) return;
    this.clearHomeFocusTimers();
    this.setData({
      composerVisible: true,
      toolboxVisible: false,
      homeFocusVisible: false,
      homeTalkNudgeVisible: false
    });
    analytics.track('room_element_interaction', { element_id: 'scene_talk_button', result: 'opened' });
  },

  onCloseComposer() {
    this.setData({ composerVisible: false, talkError: '', letterError: '', letterKeyboardHeight: 0 });
  },

  resolveLetterComposerTop(keyboardHeight, panelHeight, panelWidth) {
    const height = Number(panelHeight || this.data.panelHeight || 667);
    const width = Number(panelWidth || this.data.panelWidth || 375);
    const keyboard = Math.max(0, Number(keyboardHeight || 0));
    const safeTop = Math.max(20, Number(this.data.statusBarHeight || 20)) + 52;
    const desiredTop = Math.round(height * 0.29);
    // 按包含错误文案的 240rpx 高度估算，键盘上方保留 18px 可点击间隔。
    const estimatedComposerHeight = Math.max(120, Math.round(240 * width / 750));
    const keyboardSafeTop = height - keyboard - estimatedComposerHeight - 18;
    return Math.max(safeTop, Math.min(desiredTop, keyboardSafeTop));
  },

  onLetterKeyboardHeightChange(event) {
    const height = Math.max(0, Number(event.detail && event.detail.height || 0));
    this.setData({
      letterKeyboardHeight: height,
      letterComposerTopPx: this.resolveLetterComposerTop(height)
    });
  },

  clearHomeFocusTimers() {
    clearTimeout(this.homeFocusTimer);
    clearTimeout(this.homeTalkNudgeTimer);
    this.homeFocusTimer = null;
    this.homeTalkNudgeTimer = null;
  },

  onToggleToolbox() {
    this.setData({ toolboxVisible: !this.data.toolboxVisible, composerVisible: false });
  },

  onCloseToolbox() {
    if (this.data.toolboxVisible) this.setData({ toolboxVisible: false });
  },

  onToolboxItemTap(event) {
    const target = event.currentTarget.dataset.target;
    this.setData({ toolboxVisible: false });
    if (target === 'my') {
      wx.switchTab({ url: '/pages/my/my' });
      return;
    }
    if (target === 'card') {
      this.restoreToolboxOnReturn = true;
      wx.navigateTo({
        url: '/pages/collection-card/collection-card',
        fail: () => {
          this.restoreToolboxOnReturn = false;
          if (this.pageActive) this.setData({ toolboxVisible: true });
        }
      });
      return;
    }
    if (target === 'postcards' || target === 'keepsakes') {
      this.restoreToolboxOnReturn = true;
      wx.navigateTo({
        url: `/pages/life-scenes/life-scenes?section=${target}`,
        fail: () => {
          this.restoreToolboxOnReturn = false;
          if (this.pageActive) this.setData({ toolboxVisible: true });
        }
      });
    }
  },

  onTalkInput(event) { this.setData({ talkDraft: event.detail.value, talkError: '' }); },
  onSendTalk() {
    if (this.data.talkBusy) return;
    const messageLength = Array.from(this.data.talkDraft || '').length;
    if (this.isCompanionStatePreview()) {
      if (!messageLength) {
        this.setData({ talkError: '先说一句话吧' });
        return;
      }
      this.setData({ talkDraft: '', talkError: '', talkReply: '我在呢。这是测试回复，不会写进陪伴记录。' });
      return;
    }
    this.setData({ talkBusy: true, talkError: '', talkReply: '' });
    postHatch.sendSceneMessage(this.data.pet, this.data.snapshot, this.data.talkDraft).then(result => {
      if (!this.pageActive) return;
      if (!result.ok) {
        this.setData({ talkBusy: false, talkError: result.message || '这句话没有送到，请重试' });
        return;
      }
      this.setData({ talkBusy: false, talkDraft: '', talkReply: result.text || '我在听。' });
      analytics.track('chat_message_sent', { msg_len: messageLength, scene_id: this.data.currentState.key });
    }).catch(() => this.pageActive && this.setData({ talkBusy: false, talkError: '这句话没有送到，请重试' }));
  },

  onLetterInput(event) { this.setData({ letterDraft: event.detail.value, letterError: '' }); },
  onSendLetter() {
    if (this.data.letterBusy) return;
    if (this.isCompanionStatePreview()) {
      if (!String(this.data.letterDraft || '').trim()) {
        this.setData({ letterError: '写一句话再寄出吧' });
        return;
      }
      const feedback = this.data.currentState && this.data.currentState.action && this.data.currentState.action.feedback || '信已经寄出，家里又安静下来。';
      this.setData({
        letterDraft: '',
        letterError: '',
        'currentState.actionDone': true,
        'currentState.letterSent': true,
        'currentState.actionFeedback': feedback
      });
      this.showFeedback(`${feedback}（测试预览）`);
      return;
    }
    this.setData({ letterBusy: true, letterError: '' });
    postHatch.sendLetter(this.data.pet, this.data.snapshot, this.data.letterDraft).then(result => {
      if (!this.pageActive) return;
      if (!result.ok) {
        this.setData({ letterBusy: false, letterError: result.message || '信没有寄出去，请重试' });
        return;
      }
      this.setData({ letterBusy: false, letterDraft: '', 'currentState.actionDone': true, 'currentState.letterSent': true, 'currentState.actionFeedback': result.feedback });
      this.showFeedback(result.feedback || '信已经寄出，家里又安静下来。');
    }).catch(() => this.pageActive && this.setData({ letterBusy: false, letterError: '信没有寄出去，请重试' }));
  },

  onDailyWindowTouchStart(event) {
    const point = firstTouch(event, 'touches');
    if (!point || !event.currentTarget) return;
    this.windowGesture = {
      x: point.x,
      y: point.y,
      startedAt: Date.now(),
      moved: false,
      startScrollLeft: Number(this.data.scrollLeft || this.data.currentScreen * this.data.panelWidth),
      panel: Number(event.currentTarget.dataset.windowPanel),
      hotspot: String(event.currentTarget.dataset.windowHotspot || '')
    };
  },

  onDailyWindowTouchMove(event) {
    const gesture = this.windowGesture;
    const point = firstTouch(event, 'touches');
    if (!gesture || !point) return;
    const threshold = windowGeometry.windowGestureThreshold(this.data.panelWidth);
    if (Math.abs(point.x - gesture.x) > threshold || Math.abs(point.y - gesture.y) > threshold) gesture.moved = true;
  },

  onDailyWindowTouchEnd(event) {
    const gesture = this.windowGesture;
    this.windowGesture = null;
    if (!gesture) return;
    const point = firstTouch(event, 'changedTouches') || { x: gesture.x, y: gesture.y };
    const activate = windowGeometry.shouldActivateWindowGesture({
      startX: gesture.x,
      startY: gesture.y,
      endX: point.x,
      endY: point.y,
      elapsedMs: Date.now() - gesture.startedAt,
      moved: gesture.moved,
      panelWidth: this.data.panelWidth
    });
    if (!activate) return;
    this.onDailyWindowTap({ currentTarget: { dataset: { windowPanel: gesture.panel, windowHotspot: gesture.hotspot } } });
  },

  onDailyWindowTouchCancel() { this.windowGesture = null; },

  onDailyWindowTap(event) {
    const current = this.data.currentState;
    const tappedPanel = Number(event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.windowPanel);
    const windowPanel = Math.max(0, Math.min(2, Number.isFinite(tappedPanel) ? tappedPanel : this.data.currentScreen));
    const hotspotId = String(event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.windowHotspot || '');
    const windowSelector = hotspotId ? `.daily-window-hotspot--${hotspotId}` : `.daily-window-hotspot--panel-${windowPanel}`;
    this.openDailyWindow(windowSelector);
    if (current && current.atHome && current.action.kind === 'window' && !current.actionDone) {
      this.runSceneAction(false);
    }
  },

  openDailyWindow(windowSelector) {
    if (!this.pageActive || this.data.dailyWindowVisible) return;
    const activePanel = Math.max(0, Math.min(2, Number(this.data.currentScreen || 0)));
    const selector = windowSelector || `.daily-window-hotspot--panel-${activePanel}`;
    wx.createSelectorQuery().in(this).select(selector).boundingClientRect(rect => {
      const fallback = {
        left: 0,
        top: 0,
        width: this.data.panelWidth,
        height: this.data.panelHeight * .48
      };
      const origin = rect || fallback;
      const environment = this.displayedEnvironment();
      this.setData({
        dailyWindowVisible: true,
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
    }).exec();
  },

  onDailyWindowClosed() {
    if (!this.data.dailyWindowVisible) return;
    this.setData({ dailyWindowVisible: false });
    analytics.track('room_element_interaction', { element_id: 'window', result: 'daily_detail_closed' });
  },

  onDailyWindowRetry() {
    const environment = this.displayedEnvironment();
    const app = typeof getApp === 'function' ? getApp() : null;
    const panorama = panoramaPresentation(environment.sceneKey, this.data.panelWidth, this.data.panelHeight, app && app.globalData && app.globalData.environmentCdnBase);
    this.setData({
      dailyWindowEnvironment: environment,
      panelSceneSetId: panorama.sceneSetId,
      panoramaImage: panorama.panoramaImage,
      windowHotspots: panorama.windowHotspots,
      dailyWindowWeatherLabel: WEATHER_LABELS[environment.weather] || '晴朗',
      dailyWindowPeriodLabel: environment.lightPhase === 'sunset' ? '日落' : (environment.period === 'night' ? '夜晚' : '日间')
    });
  },

  onOpenMagicWindow() {
    if (!this.pageActive || !this.data.magicWindowEnabled || !this.data.magicWindowSourceBase || this.data.magicWindowVisible) return;
    clearTimeout(this.magicKoiTimer);
    this.setData({
      dailyWindowVisible: false,
      magicWindowVisible: true,
      magicWindowLoading: true,
      magicWindowFailed: false,
      magicKoiReacting: false,
      magicWindowBase: this.data.magicWindowSourceBase
    });
    analytics.track('room_element_interaction', { element_id: `magic_window_${this.data.magicWindowKey}`, result: 'opened' });
  },

  onMagicWindowBaseLoad() {
    if (!this.data.magicWindowVisible) return;
    this.setData({ magicWindowLoading: false, magicWindowFailed: false });
  },

  onMagicWindowBaseError() {
    if (!this.data.magicWindowVisible) return;
    this.setData({ magicWindowLoading: false, magicWindowFailed: true });
  },

  onMagicWindowRetry() {
    if (!this.data.magicWindowVisible || this.data.magicWindowLoading) return;
    this.setData({ magicWindowBase: '', magicWindowLoading: true, magicWindowFailed: false }, () => {
      wx.nextTick(() => {
        if (this.data.magicWindowVisible) this.setData({ magicWindowBase: this.data.magicWindowSourceBase });
      });
    });
  },

  onMagicKoiTap() {
    if (!this.data.magicWindowVisible || this.data.magicWindowLoading || this.data.magicWindowFailed) return;
    clearTimeout(this.magicKoiTimer);
    this.setData({ magicKoiReacting: false }, () => {
      wx.nextTick(() => {
        if (!this.data.magicWindowVisible) return;
        this.setData({ magicKoiReacting: true });
        this.magicKoiTimer = setTimeout(() => {
          if (this.pageActive) this.setData({ magicKoiReacting: false });
        }, 1050);
      });
    });
    analytics.track('room_element_interaction', { element_id: `magic_window_${this.data.magicWindowKey}_subject`, result: 'reacted' });
  },

  onCloseMagicWindow() {
    if (!this.data.magicWindowVisible) return;
    clearTimeout(this.magicKoiTimer);
    this.setData({
      magicWindowVisible: false,
      magicWindowLoading: false,
      magicWindowFailed: false,
      magicKoiReacting: false,
      dailyWindowVisible: true
    });
    analytics.track('room_element_interaction', { element_id: `magic_window_${this.data.magicWindowKey}`, result: 'closed' });
  },

  onMagicTouchMove() {},

  onBack() {
    if (this.data.magicWindowVisible) {
      this.onCloseMagicWindow();
      return;
    }
    if (this.data.dailyWindowVisible) {
      const detail = this.selectComponent && this.selectComponent('#dailyWindowDetail');
      if (detail && detail.requestClose) detail.requestClose();
      else this.onDailyWindowClosed();
      return;
    }
    if (this.data.toolboxVisible) {
      this.onCloseToolbox();
      return;
    }
    if (this.data.composerVisible) {
      this.onCloseComposer();
      return;
    }
    if (this.data.isExiting) return;
    let reducedMotion = false;
    try {
      const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
      reducedMotion = !!(system.reducedMotion || system.enableReduceMotion);
    } catch (error) {}
    const duration = reducedMotion ? 20 : 560;
    const origin = this.homeOrigin || { left: 0, top: 0, width: '100vw', height: '100vh' };
    const size = value => typeof value === 'number' ? `${value}px` : value;
    this.setData({
      isExiting: true,
      exitTransitionStyle: [
        `--scene-origin-left:${size(origin.left)}`, `--scene-origin-top:${size(origin.top)}`,
        `--scene-origin-width:${size(origin.width)}`, `--scene-origin-height:${size(origin.height)}`,
        `--scene-exit-duration:${duration}ms`
      ].join(';')
    });
    this.exitTimer = setTimeout(() => {
      if (this.data.enterFromHome) wx.switchTab({ url: '/pages/home/home' });
      else wx.navigateBack();
    }, Math.max(0, duration - 20));
  },

  onShow() {
    this.pageActive = true;
    if (this.data.dailyWindowVisible || this.data.magicWindowVisible) this.setData({ dailyWindowVisible: false, magicWindowVisible: false });
    if (this.returningFromChild) {
      this.returningFromChild = false;
      this.restoreToolboxAfterSnapshot = !!this.restoreToolboxOnReturn;
      this.restoreToolboxOnReturn = false;
      this.loadSnapshot();
    }
    this.scheduleEnvironmentRefresh();
  },
  onHide() {
    this.pageActive = false;
    this.windowGesture = null;
    if (this.snapshotRequest && this.snapshotRequest.abort) this.snapshotRequest.abort();
    this.snapshotRequest = null;
    this.returningFromChild = true;
    this.clearEnvironmentTimer();
    this.clearTransientState();
  },
  clearTransientState() {
    this.clearSlotTimer();
    this.clearCuddleTimers();
    this.clearHomeFocusTimers();
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.statusBubbleTimer);
    clearTimeout(this.statusBubbleClearTimer);
    clearTimeout(this.magicKoiTimer);
    clearTimeout(this.environmentCrossfadeTimer);
    clearTimeout(this.sceneEnterTimer);
    this.setData({ feedback: '', talkReply: '', statusBubble: '', statusBubbleVisible: false, composerVisible: false, toolboxVisible: false, dailyWindowVisible: false, magicWindowVisible: false, magicKoiReacting: false, characterWarming: false, homeFocusVisible: false, homeTalkNudgeVisible: false });
  },
  onUnload() {
    this.pageActive = false;
    this.windowGesture = null;
    if (this.snapshotRequest && this.snapshotRequest.abort) this.snapshotRequest.abort();
    this.snapshotRequest = null;
    this.loadToken = (this.loadToken || 0) + 1;
    clearTimeout(this.backTimer);
    clearTimeout(this.exitTimer);
    this.clearEnvironmentTimer();
    this.clearTransientState();
    analytics.track('scene_exit', { scene_id: this.data.currentState ? `${this.data.currentState.major}:${this.data.currentState.key}` : '', dwell_time: Math.max(0, timeService.now() - (this.enteredAt || timeService.now())) });
  }
});
