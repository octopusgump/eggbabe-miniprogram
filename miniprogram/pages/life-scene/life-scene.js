const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const timeService = require('../../services/time-service');
const postHatch = require('../../services/post-hatch-companion');
const assets = require('../../config/post-hatch-assets');
const environmentService = require('../../services/incubation-environment');
const windowGeometry = require('../../utils/scene-window-geometry');

const WEATHER_LABELS = {
  sunny: '晴朗', cloudy: '多云', rain: '下雨', snow: '下雪', fog: '有雾',
  storm: '雷雨', afterRain: '雨后', postSnow: '雪后', wind: '有风'
};

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

function characterPresentation(pet, currentState) {
  const prototype = String(pet && pet.prototype || '');
  const isJadeRabbit = prototype === '玉兔' || prototype === 'YT';
  const isAcceptedSleepState = currentState && currentState.atHome && currentState.key === 'sleep' && Number(currentState.action && currentState.action.screen) === 0;
  const image = isJadeRabbit && isAcceptedSleepState ? assets.POST_HATCH.characterPoses.sleep : '';
  return { visible: Boolean(image), image };
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
    sceneBackgroundError: false
  },

  onLoad(query) {
    this.pageActive = true;
    this.hasTrackedEnter = false;
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      wx.showToast({ title: '破壳后才能进入这里', icon: 'none' });
      this.backTimer = setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 600);
      return;
    }
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
      pet,
      panelSceneSetId: panorama.sceneSetId,
      panoramaImage: panorama.panoramaImage,
      windowHotspots: panorama.windowHotspots,
      enterFromHome: query.entry === 'home-expand' || query.entry === 'post-hatch-landing',
      dailyWindowEnvironment,
      dailyWindowWeatherLabel: WEATHER_LABELS[dailyWindowEnvironment.weather] || '晴朗',
      dailyWindowPeriodLabel: dailyWindowEnvironment.lightPhase === 'sunset' ? '日落' : (dailyWindowEnvironment.period === 'night' ? '夜晚' : '日间'),
      reducedMotion: reducedMotionEnabled()
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
      const currentState = result.currentState;
      const screen = Math.max(0, Math.min(2, Number(currentState.screen || 0)));
      const character = characterPresentation(this.data.pet, currentState);
      this.setData({
        loading: false,
        error: '',
        snapshot: result,
        currentState,
        showSceneCharacter: character.visible,
        sceneCharacterImage: character.image,
        currentScreen: screen,
        scrollLeft: screen * this.data.panelWidth,
        feedback: currentState.actionDone ? currentState.actionFeedback : '',
        playedActionKind: currentState.actionDone ? currentState.action.kind : '',
        letterDraft: '',
        talkDraft: '',
        talkReply: '',
        composerVisible: false,
        toolboxVisible: false
      });
      if (!this.hasTrackedEnter) {
        analytics.track('scene_enter', { scene_id: `${currentState.major}:${currentState.key}`, entry_type: this.data.enterFromHome ? 'home_expand' : 'direct' });
        this.hasTrackedEnter = true;
      }
      this.scheduleSlotRefresh(currentState.slotEnd);
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
  scheduleEnvironmentRefresh() {
    this.clearEnvironmentTimer();
    if (!this.pageActive || this.data.dailyWindowVisible || this.data.magicWindowVisible) return;
    const delay = environmentService.millisecondsUntilNextEnvironmentBoundary();
    this.environmentTimer = setTimeout(() => this.refreshEnvironment(), Math.min(delay + 1200, 2147483000));
  },
  refreshEnvironment() {
    if (!this.pageActive || !this.data.pet || this.data.dailyWindowVisible || this.data.magicWindowVisible) return;
    const environment = environmentForPet(this.data.pet);
    const app = typeof getApp === 'function' ? getApp() : null;
    const panorama = panoramaPresentation(environment.sceneKey, this.data.panelWidth, this.data.panelHeight, app && app.globalData && app.globalData.environmentCdnBase);
    const changed = panorama.panoramaImage && panorama.panoramaImage !== this.data.panoramaImage;
    this.setData({
      dailyWindowEnvironment: environment,
      dailyWindowWeatherLabel: WEATHER_LABELS[environment.weather] || '晴朗',
      dailyWindowPeriodLabel: environment.lightPhase === 'sunset' ? '日落' : (environment.period === 'night' ? '夜晚' : '日间'),
      panelSceneSetId: panorama.sceneSetId, panoramaImage: panorama.panoramaImage,
      previousPanoramaImage: changed ? this.data.panoramaImage : '', windowHotspots: panorama.windowHotspots,
      sceneCrossfadeActive: changed, sceneBackgroundError: !panorama.valid
    }, () => {
      if (changed) {
        clearTimeout(this.environmentCrossfadeTimer);
        this.environmentCrossfadeTimer = setTimeout(() => this.pageActive && this.setData({ previousPanoramaImage: '', sceneCrossfadeActive: false }), this.data.reducedMotion ? 20 : 520);
      }
      this.scheduleEnvironmentRefresh();
    });
  },

  onSceneBackgroundLoad() {
    if (this.pageActive && this.data.sceneBackgroundError) this.setData({ sceneBackgroundError: false });
  },

  onSceneBackgroundError() {
    if (!this.pageActive) return;
    this.setData({ sceneBackgroundError: true });
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
      scrollLeft: Math.max(0, Math.min(2, screen)) * panelWidth
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

  runSceneAction(openWindowAfter, feedbackOverride, windowSelector) {
    const current = this.data.currentState;
    if (!current || !current.atHome || this.data.actionBusy) return;
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
    if (!current || (current.atHome && !current.canTalk)) return;
    const screen = Math.max(0, Math.min(2, Number(current.screen || 0)));
    this.setData({
      composerVisible: true,
      toolboxVisible: false,
      currentScreen: screen,
      scrollLeft: screen * this.data.panelWidth
    });
    analytics.track('room_element_interaction', { element_id: current.atHome ? 'scene_talk_button' : 'scene_letter_button', result: 'opened' });
  },

  onCloseComposer() {
    this.setData({ composerVisible: false, talkError: '', letterError: '' });
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
      wx.navigateTo({ url: '/pages/collection-card/collection-card' });
      return;
    }
    if (target === 'postcards' || target === 'keepsakes') {
      wx.navigateTo({ url: `/pages/life-scenes/life-scenes?section=${target}` });
    }
  },

  onTalkInput(event) { this.setData({ talkDraft: event.detail.value, talkError: '' }); },
  onSendTalk() {
    if (this.data.talkBusy) return;
    const messageLength = Array.from(this.data.talkDraft || '').length;
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
      const environment = environmentForPet(this.data.pet);
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
    const environment = environmentForPet(this.data.pet);
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
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.magicKoiTimer);
    clearTimeout(this.environmentCrossfadeTimer);
    this.setData({ feedback: '', talkReply: '', composerVisible: false, toolboxVisible: false, dailyWindowVisible: false, magicWindowVisible: false, magicKoiReacting: false, characterWarming: false });
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
