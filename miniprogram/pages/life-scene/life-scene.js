const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const timeService = require('../../services/time-service');
const postHatch = require('../../services/post-hatch-companion');
const assets = require('../../config/post-hatch-assets');
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
const POST_HATCH_PERIOD_OPTIONS = assets.POST_HATCH.periodSceneOptions || [];
const SCENE_TESTER_OPTIONS = Object.freeze([AUTO_SCENE_OPTION].concat(POST_HATCH_PERIOD_OPTIONS));
const AUTO_COMPANION_STATE_OPTION = Object.freeze({ key: 'auto', label: '跟随时间' });
const COMPANION_STATE_TEST_OPTIONS = Object.freeze([
  AUTO_COMPANION_STATE_OPTION,
  // 快捷项必须落到已有动作全景的状态，避免验收器选择后看不见对应画面。
  Object.freeze({ key: 'home-talk', label: '在家 · 可对话（画画）', major: 'home', stateKey: 'drawing' }),
  Object.freeze({ key: 'home-sleep', label: '在家 · 睡觉（可对话）', major: 'home', stateKey: 'sleep', actionDone: true }),
  Object.freeze({ key: 'home-lazy', label: '在家 · 小憩', major: 'home', stateKey: 'lazy' }),
  Object.freeze({ key: 'home-stare', label: '在家 · 发呆', major: 'home', stateKey: 'stare' }),
  Object.freeze({ key: 'home-reading', label: '在家 · 看书', major: 'home', stateKey: 'reading' }),
  Object.freeze({ key: 'home-music', label: '在家 · 听音乐', major: 'home', stateKey: 'music' }),
  Object.freeze({ key: 'home-window', label: '在家 · 看窗外', major: 'home', stateKey: 'window' }),
  Object.freeze({ key: 'home-gaming', label: '在家 · 打游戏', major: 'home', stateKey: 'gaming' }),
  Object.freeze({ key: 'away', label: '不在家', major: 'travel', stateKey: 'dali' })
]);

const STATUS_BUBBLE_POOL = Object.freeze({
  sleep: Object.freeze(['我把自己卷成小饭团啦。', '枕头批准我再眯一会儿。', '我在梦里追一朵慢吞吞的云。']),
  lazy: Object.freeze(['被子太会抱人，我还没赢。', '我刚醒一点点，又困回去了。', '早晨先放口袋里，晚点再打开。']),
  stare: Object.freeze(['我在和光斑一起走神。', '桌上的光跑得比我快。', '我发呆得很认真，真的。']),
  drawing: Object.freeze(['它本来是云，现在像小鱼。', '我画的圆，自己偷偷跑偏啦。', '这张纸好像比我更有主意。']),
  reading: Object.freeze(['这一页的月亮，和窗外那一盏有点像。', '我把喜欢的句子藏在耳朵旁边。', '故事慢慢走，我也慢一点。']),
  gaming: Object.freeze(['这一关很紧张，耳朵静音。', '小角色又跳歪了，我忍住笑。', '我快赢啦，先认真三小秒。']),
  music: Object.freeze(['这段旋律像在给窗帘梳头发。', '我把安静放进歌里听一会儿。', '尾音还没走远，我先不说话。']),
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
  return POST_HATCH_PERIOD_OPTIONS.find(item => item.key === key) || null;
}

function companionStatePreviewTarget(key) {
  if (!key || key === 'auto') return null;
  return COMPANION_STATE_TEST_OPTIONS.find(item => item.key === key) || null;
}

function companionStateTesterOptions(pet, environment) {
  return COMPANION_STATE_TEST_OPTIONS.map(option => {
    if (option.key === 'auto' || option.major !== 'home') return Object.assign({}, option, { available: true });
    const definition = lifeScenes.resolveDefinition(option.major, option.stateKey);
    const previewState = definition && Object.assign({}, definition, {
      actionDone: Boolean(option.actionDone),
      action: definition.action ? Object.assign({}, definition.action) : null
    });
    const available = Boolean(previewState && assets.resolveActionPanorama(pet, previewState, environment));
    return Object.assign({}, option, { available });
  });
}

function companionStateTesterLabel(options, key) {
  const option = (options || []).find(item => item.key === key);
  if (!option) return AUTO_COMPANION_STATE_OPTION.label;
  return option.available ? option.label : `${option.label} · 缺图片`;
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
      actionDone: Boolean(target.actionDone),
      actionFeedback: target.actionDone && definition.action ? definition.action.feedback : '',
      isPreview: true
    })
  });
}

function previewEnvironment(base, target) {
  if (!target) return base;
  return Object.assign({}, base, {
    period: target.period,
    lightPhase: target.lightPhase,
    valid: true,
    windowImage: environmentService.windowAssetPath('', base.weather, target.period)
  });
}

function stageTesterPresentation(pet) {
  const key = String(pet && pet.demoPreviewStage || 'hatched');
  const stage = demoExperience.PREVIEW_STAGES.find(item => item.key === key) || demoExperience.PREVIEW_STAGES[demoExperience.PREVIEW_STAGES.length - 1];
  return { key: stage.key, label: stage.label };
}

function prototypeTesterPresentation(pet) {
  const prototype = String(pet && pet.prototype || '玉兔');
  return demoExperience.PREVIEW_PROTOTYPES.find(item => item.key === prototype || item.cardCode === prototype) || demoExperience.PREVIEW_PROTOTYPES[0];
}

function panoramaPresentation(period, panelWidth, panelHeight, cdnBase, actionScene) {
  const sceneSet = actionScene || assets.resolvePanoramaScene(period, cdnBase);
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

// 把当前状态的角色与动作锚点换算成本机屏幕位置。
function sceneAnchorPresentation(pet, currentState, panelWidth, panelHeight) {
  const empty = { characterPanel: -1, characterStyle: '', actionPanel: -1, actionStyle: '' };
  if (!currentState) return empty;
  const anchors = assets.resolveStateAnchors(pet, currentState);
  const meta = assets.POST_HATCH.panoramaFallbackMeta || {};
  const points = {};
  if (anchors.character) points.character = anchors.character;
  if (anchors.action) points.action = anchors.action;
  const mapped = windowGeometry.mapPanoramaPoints({
    imageWidth: meta.width,
    imageHeight: meta.height,
    panelWidth,
    panelHeight,
    points
  });
  return {
    characterPanel: mapped.character ? mapped.character.panel : -1,
    characterStyle: mapped.character ? mapped.character.style : '',
    actionPanel: mapped.action ? mapped.action.panel : -1,
    actionStyle: mapped.action ? mapped.action.style : ''
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

function contextActionPresentation(pet, currentState) {
  const atHome = Boolean(currentState && currentState.atHome);
  return {
    icon: atHome ? homeFinderIcon(pet) : '',
    label: atHome ? '和蛋宝宝说话' : ''
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
    mySettingsIcon: assets.POST_HATCH.sceneActions && assets.POST_HATCH.sceneActions.toolboxItems && assets.POST_HATCH.sceneActions.toolboxItems.my || '',
    characterPanel: -1,
    characterStyle: '',
    actionPanel: -1,
    actionStyle: '',
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
    pendingPanoramaImage: '',
    previousPanoramaImage: '',
    sceneCrossfadeActive: false,
    windowHotspots: [[], [], []],
    sceneBackgroundError: false,
    sceneTransitionError: false,
    sceneBackgroundReady: false,
    initialViewportReady: false,
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
    companionStateTesterMissing: false,
    companionStateTesterOptions: COMPANION_STATE_TEST_OPTIONS,
    prototypeTesterOpen: false,
    prototypeTesterBusy: false,
    prototypeTesterTopPx: 220,
    prototypeTesterKey: '玉兔',
    prototypeTesterLabel: '玉兔',
    prototypeTesterOptions: demoExperience.PREVIEW_PROTOTYPES,
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
    this.needsInitialViewport = true;
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
    const prototypeTester = prototypeTesterPresentation(pet);
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
    const panorama = panoramaPresentation(dailyWindowEnvironment.period, panelWidth, panelHeight, app && app.globalData && app.globalData.environmentCdnBase);
    this.setData({
      statusBarHeight: info.statusBarHeight || 20,
      panelWidth,
      panelHeight,
      // scroll-view 在 currentState 就绪前不会挂载；目标屏由快照一次性写入，避免首帧横滑。
      currentScreen: 0,
      scrollLeft: 0,
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
      prototypeTesterTopPx: Math.round(testerTopPx + 132),
      stageTesterKey: stageTester.key,
      stageTesterLabel: stageTester.label,
      prototypeTesterKey: prototypeTester.key,
      prototypeTesterLabel: prototypeTester.label,
      companionStateTesterOptions: companionStateTesterOptions(pet, dailyWindowEnvironment)
    });
    this.scheduleEnvironmentRefresh();
    this.loadSnapshot();
  },

  loadSnapshot() {
    if (!this.data.pet) return;
    if (this.snapshotRequest && this.snapshotRequest.abort) this.snapshotRequest.abort();
    const token = this.loadToken = (this.loadToken || 0) + 1;
    this.clearSlotTimer();
    this.clearPresentationTimers();
    this.setData({
      loading: true, error: '', actionBusy: false,
      feedback: '', playedActionKind: '', statusBubble: '', statusBubbleVisible: false
    });
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
      const app = typeof getApp === 'function' ? getApp() : null;
      const cdnBase = app && app.globalData && app.globalData.environmentCdnBase;
      const actionScene = assets.resolveActionPanorama(this.data.pet, currentState, this.data.dailyWindowEnvironment, cdnBase);
      const panorama = panoramaPresentation(this.data.dailyWindowEnvironment.period, this.data.panelWidth, this.data.panelHeight, cdnBase, actionScene);
      const panoramaChanged = Boolean(panorama.panoramaImage && panorama.panoramaImage !== this.data.panoramaImage);
      const contextAction = contextActionPresentation(this.data.pet, currentState);
      const slotKey = `${currentState.slotIndex}:${currentState.major}:${currentState.key}`;
      const shouldShowStatusBubble = slotKey !== this.lastStatusSlotKey;
      const nextStatusBubble = shouldShowStatusBubble ? statusBubbleFor(currentState, this.lastStatusBubble) : '';
      const preparingInitialViewport = Boolean(this.needsInitialViewport);
      const initialViewportToken = preparingInitialViewport ? (this.initialViewportToken = (this.initialViewportToken || 0) + 1) : 0;
      if (preparingInitialViewport) {
        this.initialViewportScreen = screen;
        this.initialViewportTarget = screen * this.data.panelWidth;
      }
      this.setData(Object.assign(sceneAnchorPresentation(this.data.pet, currentState, this.data.panelWidth, this.data.panelHeight), {
        loading: false,
        error: '',
        snapshot,
        currentState,
        panelSceneSetId: panorama.sceneSetId,
        windowHotspots: panorama.windowHotspots,
        contextActionIcon: contextAction.icon,
        contextActionLabel: contextAction.label,
        currentScreen: screen,
        scrollLeft: screen * this.data.panelWidth,
        initialViewportReady: preparingInitialViewport ? false : this.data.initialViewportReady,
        // actionDone 是持久业务状态；反馈和场景动作效果仅属于本次交互，不能跨页面恢复。
        feedback: '',
        playedActionKind: ''
      }), () => {
        this.scheduleInitialSceneDeadline();
        this.revealInitialScene();
        if (preparingInitialViewport) this.scheduleInitialViewportSettle(initialViewportToken);
        if (panoramaChanged && panorama.valid) this.queuePanoramaTransition(panorama.panoramaImage);
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
    const cdnBase = app && app.globalData && app.globalData.environmentCdnBase;
    const actionScene = assets.resolveActionPanorama(this.data.pet, this.data.currentState, environment, cdnBase);
    const panorama = panoramaPresentation(environment.period, this.data.panelWidth, this.data.panelHeight, cdnBase, actionScene);
    const changed = panorama.panoramaImage && panorama.panoramaImage !== this.data.panoramaImage;
    const stateOptions = companionStateTesterOptions(this.data.pet, environment);
    const selectedStateOption = stateOptions.find(item => item.key === this.data.companionStateTesterKey);
    // 环境变化后不允许保留一个已失配的动作预览：清空覆盖状态，回到真实陪伴状态，
    // 并在验收器上保留“缺图片”反馈，直到验收者重新选择状态。
    const resetCompanionStatePreview = Boolean(
      this.companionStateTestOverride
      && selectedStateOption
      && !selectedStateOption.available
    );
    if (resetCompanionStatePreview) this.companionStateTestOverride = null;
    const companionStateTesterMissing = resetCompanionStatePreview || this.data.companionStateTesterMissing;
    this.setData({
      dailyWindowEnvironment: environment,
      dailyWindowWeatherLabel: WEATHER_LABELS[environment.weather] || '晴朗',
      dailyWindowPeriodLabel: environment.lightPhase === 'sunset' ? '日落' : (environment.period === 'night' ? '夜晚' : '日间'),
      panelSceneSetId: panorama.sceneSetId, windowHotspots: panorama.windowHotspots,
      sceneBackgroundError: !panorama.valid,
      sceneTransitionError: false,
      companionStateTesterOptions: stateOptions,
      companionStateTesterKey: resetCompanionStatePreview ? 'auto' : this.data.companionStateTesterKey,
      companionStateTesterMissing,
      companionStateTesterLabel: companionStateTesterMissing
        ? `${AUTO_COMPANION_STATE_OPTION.label} · 缺图片`
        : companionStateTesterLabel(stateOptions, resetCompanionStatePreview ? 'auto' : this.data.companionStateTesterKey)
    }, () => {
      if (changed && panorama.valid) this.queuePanoramaTransition(panorama.panoramaImage);
      if (resetCompanionStatePreview) this.loadSnapshot();
      else this.scheduleEnvironmentRefresh();
    });
  },

  queuePanoramaTransition(nextImage) {
    const next = String(nextImage || '');
    if (!next || next === this.data.panoramaImage) return;
    this.clearPanoramaTransition();
    this.panoramaTransitionToken = (this.panoramaTransitionToken || 0) + 1;
    this.pendingPanoramaUrl = next;
    this.setData({ pendingPanoramaImage: next, sceneTransitionError: false });
  },

  onPendingPanoramaLoad(event) {
    const loadedUrl = String(event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.panoramaUrl || '');
    if (!this.pageActive || !loadedUrl || loadedUrl !== this.pendingPanoramaUrl || loadedUrl !== this.data.pendingPanoramaImage) return;
    const token = this.panoramaTransitionToken;
    const previous = this.data.panoramaImage;
    this.pendingPanoramaUrl = '';
    this.setData({
      panoramaImage: loadedUrl,
      pendingPanoramaImage: '',
      previousPanoramaImage: previous,
      sceneCrossfadeActive: Boolean(previous),
      sceneBackgroundReady: true,
      sceneBackgroundError: false,
      sceneTransitionError: false
    }, () => {
      this.revealInitialScene();
      if (previous) this.schedulePanoramaCleanup(previous, token);
    });
  },

  onPendingPanoramaError(event) {
    const failedUrl = String(event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.panoramaUrl || '');
    if (!this.pageActive || !failedUrl || failedUrl !== this.pendingPanoramaUrl) return;
    this.pendingPanoramaUrl = '';
    this.setData({ pendingPanoramaImage: '', previousPanoramaImage: '', sceneCrossfadeActive: false, sceneTransitionError: true });
  },

  schedulePanoramaCleanup(previous, token) {
    clearTimeout(this.environmentCrossfadeTimer);
    this.environmentCrossfadeTimer = setTimeout(() => {
      if (this.pageActive && token === this.panoramaTransitionToken && this.data.previousPanoramaImage === previous) this.clearPanoramaTransition();
    }, this.data.reducedMotion ? 40 : 700);
  },

  onPreviousPanoramaAnimationEnd(event) {
    const previous = String(event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.panoramaUrl || '');
    if (previous && previous === this.data.previousPanoramaImage) this.clearPanoramaTransition();
  },

  clearPanoramaTransition() {
    clearTimeout(this.environmentCrossfadeTimer);
    this.pendingPanoramaUrl = '';
    if (this.data.pendingPanoramaImage || this.data.previousPanoramaImage || this.data.sceneCrossfadeActive) {
      this.setData({ pendingPanoramaImage: '', previousPanoramaImage: '', sceneCrossfadeActive: false });
    }
  },

  onSceneBackgroundLoad() {
    if (!this.pageActive) return;
    clearTimeout(this.initialSceneTimer);
    if (!this.data.sceneBackgroundReady || this.data.sceneBackgroundError) {
      this.setData({ sceneBackgroundReady: true, sceneBackgroundError: false }, () => this.revealInitialScene());
    }
  },

  onSceneBackgroundError() {
    if (!this.pageActive) return;
    clearTimeout(this.initialSceneTimer);
    this.setData({ sceneBackgroundReady: true, sceneBackgroundError: true }, () => this.revealInitialScene());
  },

  revealInitialScene() {
    if (!this.pageActive || this.data.sceneEntered || !this.data.currentState || !this.data.sceneBackgroundReady) return;
    clearTimeout(this.sceneEnterTimer);
    this.sceneEnterTimer = setTimeout(() => {
      if (this.pageActive && this.data.currentState && this.data.sceneBackgroundReady) this.setData({ sceneEntered: true });
    }, this.data.reducedMotion ? 0 : 24);
  },

  scheduleInitialSceneDeadline() {
    clearTimeout(this.initialSceneTimer);
    if (this.data.sceneEntered || this.data.sceneBackgroundReady) return;
    this.initialSceneTimer = setTimeout(() => {
      if (!this.pageActive || this.data.sceneEntered || !this.data.currentState || this.data.sceneBackgroundReady) return;
      this.setData({ sceneBackgroundReady: true, sceneBackgroundError: true }, () => this.revealInitialScene());
    }, this.data.reducedMotion ? 1200 : 6000);
  },

  onRetrySceneBackground() {
    const app = typeof getApp === 'function' ? getApp() : null;
    const cdnBase = app && app.globalData && app.globalData.environmentCdnBase;
    const actionScene = assets.resolveActionPanorama(this.data.pet, this.data.currentState, this.data.dailyWindowEnvironment, cdnBase);
    const panorama = panoramaPresentation(this.data.dailyWindowEnvironment && this.data.dailyWindowEnvironment.period, this.data.panelWidth, this.data.panelHeight, cdnBase, actionScene);
    if (panorama.panoramaImage && panorama.panoramaImage !== this.data.panoramaImage) {
      this.setData({ panelSceneSetId: panorama.sceneSetId, windowHotspots: panorama.windowHotspots, sceneBackgroundError: false, sceneTransitionError: false });
      this.queuePanoramaTransition(panorama.panoramaImage);
      return;
    }
    this.setData({ sceneBackgroundError: false, sceneTransitionError: false, panelSceneSetId: panorama.sceneSetId, panoramaImage: panorama.panoramaImage, windowHotspots: panorama.windowHotspots });
  },

  // DEV-ONLY：破壳后只切换白天／落日／黑夜三个时段；release/trial 下不渲染。
  onSceneTesterToggle() {
    if (!this.data.isDemo || this.data.sceneTesterBusy) return;
    this.setData({ sceneTesterOpen: !this.data.sceneTesterOpen, stageTesterOpen: false, companionStateTesterOpen: false, prototypeTesterOpen: false });
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
    this.setData({ stageTesterOpen: !this.data.stageTesterOpen, sceneTesterOpen: false, companionStateTesterOpen: false, prototypeTesterOpen: false });
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
    this.setData({ stageTesterBusy: true, stageTesterOpen: false, sceneTesterOpen: false, companionStateTesterOpen: false, prototypeTesterOpen: false });
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
      companionStateTesterLabel: AUTO_COMPANION_STATE_OPTION.label,
      companionStateTesterMissing: false
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
      sceneTesterOpen: false,
      prototypeTesterOpen: false
    });
  },

  // DEV-ONLY：只替换本地 demo 角色，用于核验玉兔与锦鲤各自的动作全景。
  onPrototypeTesterToggle() {
    if (!this.data.isDemo || this.data.prototypeTesterBusy) return;
    this.setData({
      prototypeTesterOpen: !this.data.prototypeTesterOpen,
      stageTesterOpen: false,
      sceneTesterOpen: false,
      companionStateTesterOpen: false
    });
  },

  onPrototypeTesterSelect(event) {
    if (!this.data.isDemo || this.data.prototypeTesterBusy) return;
    const prototypeKey = event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.prototype;
    const target = demoExperience.PREVIEW_PROTOTYPES.find(item => item.key === prototypeKey);
    if (!target) return;
    if (target.key === this.data.prototypeTesterKey) {
      this.setData({ prototypeTesterOpen: false });
      return;
    }
    this.setData({ prototypeTesterBusy: true, prototypeTesterOpen: false, stageTesterOpen: false, sceneTesterOpen: false, companionStateTesterOpen: false });
    const result = demoExperience.setPreviewPrototype(target.key);
    if (!result.ok) {
      this.setData({ prototypeTesterBusy: false });
      wx.showToast({ title: result.message || '测试角色切换失败', icon: 'none' });
      return;
    }
    this.companionStateTestOverride = null;
    this.setData({
      pet: result.pet,
      prototypeTesterBusy: false,
      prototypeTesterKey: target.key,
      prototypeTesterLabel: target.label,
      companionStateTesterKey: 'auto',
      companionStateTesterLabel: AUTO_COMPANION_STATE_OPTION.label,
      companionStateTesterMissing: false
    }, () => {
      this.refreshEnvironment();
      this.loadSnapshot();
      wx.showToast({ title: `已切换：${target.label}`, icon: 'none' });
    });
  },

  onCompanionStateTesterSelect(event) {
    if (!this.data.isDemo) return;
    const key = event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.companionState;
    const option = (this.data.companionStateTesterOptions || []).find(item => item.key === key);
    if (option && !option.available) return;
    const target = companionStatePreviewTarget(key);
    if (key !== 'auto' && !target) return;
    if (key === this.data.companionStateTesterKey) {
      this.setData({
        companionStateTesterOpen: false,
        companionStateTesterLabel: key === 'auto' ? AUTO_COMPANION_STATE_OPTION.label : this.data.companionStateTesterLabel,
        companionStateTesterMissing: false
      });
      return;
    }
    this.companionStateTestOverride = target;
    this.setData({
      companionStateTesterOpen: false,
      companionStateTesterKey: key,
      companionStateTesterLabel: companionStateTesterLabel(this.data.companionStateTesterOptions, key),
      companionStateTesterMissing: false
    }, () => {
      this.loadSnapshot();
      wx.showToast({ title: target ? `已切换：${target.label}` : '已跟随真实时间', icon: 'none' });
    });
  },

  onScroll(event) {
    const left = Number(event.detail && event.detail.scrollLeft || 0);
    if (this.needsInitialViewport && Math.abs(left - Number(this.initialViewportTarget || 0)) <= 2) {
      this.markInitialViewportReady(this.initialViewportToken);
    }
    if (this.windowGesture && Math.abs(left - this.windowGesture.startScrollLeft) > 3) this.windowGesture.moved = true;
    const screen = Math.max(0, Math.min(2, Math.round(left / this.data.panelWidth)));
    if (screen !== this.data.currentScreen) this.setData({ currentScreen: screen });
  },

  onResize(size) {
    const next = size && size.size || size || {};
    const panelWidth = Number(next.windowWidth || this.data.panelWidth);
    const panelHeight = Number(next.windowHeight || this.data.panelHeight);
    const screen = Number(this.data.currentScreen || 0);
    const app = typeof getApp === 'function' ? getApp() : null;
    const cdnBase = app && app.globalData && app.globalData.environmentCdnBase;
    const actionScene = assets.resolveActionPanorama(this.data.pet, this.data.currentState, this.data.dailyWindowEnvironment, cdnBase);
    const panorama = panoramaPresentation(this.data.dailyWindowEnvironment && this.data.dailyWindowEnvironment.period, panelWidth, panelHeight, cdnBase, actionScene);
    const changed = panorama.panoramaImage && panorama.panoramaImage !== this.data.panoramaImage;
    if (this.needsInitialViewport) this.initialViewportTarget = Math.max(0, Math.min(2, screen)) * panelWidth;
    // 屏幕尺寸变了，母图锚点要按新的 aspectFill 结果重新换算。
    this.setData(Object.assign(sceneAnchorPresentation(this.data.pet, this.data.currentState, panelWidth, panelHeight), {
      panelWidth,
      panelHeight,
      panelSceneSetId: panorama.sceneSetId,
      windowHotspots: panorama.windowHotspots,
      scrollLeft: Math.max(0, Math.min(2, screen)) * panelWidth
    }), () => {
      if (this.needsInitialViewport) this.scheduleInitialViewportSettle(this.initialViewportToken);
      if (changed) this.queuePanoramaTransition(panorama.panoramaImage);
    });
  },

  scheduleInitialViewportSettle(token) {
    clearTimeout(this.initialViewportTimer);
    if (!this.needsInitialViewport || token !== this.initialViewportToken) return;
    const settle = () => {
      if (!this.needsInitialViewport || token !== this.initialViewportToken) return;
      this.initialViewportTimer = setTimeout(() => this.markInitialViewportReady(token), this.data.reducedMotion ? 20 : 220);
    };
    if (wx.nextTick) wx.nextTick(() => wx.nextTick ? wx.nextTick(settle) : settle());
    else setTimeout(settle, 0);
  },

  markInitialViewportReady(token) {
    if (!this.pageActive || !this.needsInitialViewport || token !== this.initialViewportToken) return;
    this.needsInitialViewport = false;
    clearTimeout(this.initialViewportTimer);
    this.initialViewportTimer = null;
    this.setData({ initialViewportReady: true });
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
    clearTimeout(this.statusBubbleTimer);
    clearTimeout(this.statusBubbleClearTimer);
    this.setData({ feedback: text || '', statusBubble: '', statusBubbleVisible: false });
    this.feedbackTimer = setTimeout(() => {
      if (this.pageActive) this.setData({ feedback: '', playedActionKind: '' });
    }, 2600);
  },

  showStatusBubble(text) {
    clearTimeout(this.statusBubbleTimer);
    clearTimeout(this.statusBubbleClearTimer);
    clearTimeout(this.feedbackTimer);
    if (!text) {
      this.setData({ statusBubble: '', statusBubbleVisible: false, feedback: '', playedActionKind: '' });
      return;
    }
    this.lastStatusBubble = text;
    this.setData({ statusBubble: text, statusBubbleVisible: true, feedback: '', playedActionKind: '' });
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
      }, () => this.refreshEnvironment());
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
      this.setData({ 'currentState.actionDone': actionDone, 'currentState.actionFeedback': result.feedback || current.action.feedback, playedActionKind: current.action.kind }, () => this.refreshEnvironment());
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
    if (!current || !current.atHome) return;
    this.openChatPage(current);
  },

  openChatPage(current) {
    this.returningFromChild = true;
    const preview = this.isCompanionStatePreview() ? '1' : '0';
    wx.navigateTo({
      url: `/pages/chat/chat?state_key=${encodeURIComponent(current.key)}&preview=${preview}`,
      success: () => analytics.track('room_element_interaction', { element_id: 'scene_chat_button', result: 'opened' }),
      fail: () => {
        this.returningFromChild = false;
        if (this.pageActive) this.showFeedback('对话页面没有打开，请重试');
      }
    });
  },

  onOpenMySettings() {
    wx.switchTab({ url: '/pages/my/my' });
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
    const cdnBase = app && app.globalData && app.globalData.environmentCdnBase;
    const actionScene = assets.resolveActionPanorama(this.data.pet, this.data.currentState, environment, cdnBase);
    const panorama = panoramaPresentation(environment.period, this.data.panelWidth, this.data.panelHeight, cdnBase, actionScene);
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
    const resuming = Boolean(this.hasShownOnce);
    this.hasShownOnce = true;
    this.pageActive = true;
    if (this.data.dailyWindowVisible || this.data.magicWindowVisible) this.setData({ dailyWindowVisible: false, magicWindowVisible: false });
    this.refreshEnvironment();
    if (this.returningFromChild || resuming) {
      this.returningFromChild = false;
      this.loadSnapshot();
      return;
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
    this.clearPresentationTimers();
    clearTimeout(this.magicKoiTimer);
    clearTimeout(this.environmentCrossfadeTimer);
    clearTimeout(this.sceneEnterTimer);
    clearTimeout(this.initialSceneTimer);
    clearTimeout(this.initialViewportTimer);
    this.clearPanoramaTransition();
    this.needsInitialViewport = true;
    this.initialViewportToken = (this.initialViewportToken || 0) + 1;
    this.setData({ feedback: '', playedActionKind: '', statusBubble: '', statusBubbleVisible: false, dailyWindowVisible: false, magicWindowVisible: false, magicKoiReacting: false, characterWarming: false, sceneTransitionError: false, initialViewportReady: false, sceneEntered: false });
  },
  clearPresentationTimers() {
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.statusBubbleTimer);
    clearTimeout(this.statusBubbleClearTimer);
    this.feedbackTimer = null;
    this.statusBubbleTimer = null;
    this.statusBubbleClearTimer = null;
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
