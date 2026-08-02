const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const timeService = require('../../services/time-service');
const config = require('../../config/v2');
const postHatch = require('../../services/post-hatch-companion');
const assets = require('../../config/post-hatch-assets');
const environmentService = require('../../services/incubation-environment');

const WEATHER_LABELS = {
  sunny: '晴朗', cloudy: '多云', rain: '下雨', snow: '下雪', fog: '有雾',
  storm: '雷雨', afterRain: '雨后', postSnow: '雪后', wind: '有风'
};

const TOKYO_MAGIC_WINDOW = assets.POST_HATCH.magicWindow && assets.POST_HATCH.magicWindow.tokyo || {};

function reducedMotionEnabled() {
  try {
    const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    return Boolean(system.reducedMotion || system.enableReduceMotion);
  } catch (error) {
    return false;
  }
}

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
    dailyWindowVisible: false,
    dailyWindowOriginStyle: '',
    dailyWindowEnvironment: environmentService.resolve(),
    dailyWindowWeatherLabel: '晴朗',
    dailyWindowPeriodLabel: '日间',
    magicWindowVisible: false,
    magicWindowLoading: false,
    magicWindowFailed: false,
    magicWindowReducedMotion: false,
    magicKoiReacting: false,
    magicWindowBaseSrc: TOKYO_MAGIC_WINDOW.base || '',
    magicWindowCloudsSrc: TOKYO_MAGIC_WINDOW.clouds || '',
    magicWindowKoiSrc: TOKYO_MAGIC_WINDOW.koi || '',
    screens: [0, 1, 2],
    currentScreen: 1,
    scrollLeft: 0,
    panelWidth: 375,
    panelHeight: 667,
    decorations: [],
    isDemo: config.localDemoEnabled,
    enterFromHome: false,
    isExiting: false,
    exitTransitionStyle: '',
    panelImages: [assets.POST_HATCH.leftLivingBackground, assets.POST_HATCH.centerDeskBackground, assets.POST_HATCH.rightDecorBackground],
    panoramaFallback: assets.POST_HATCH.panoramaFallback
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
    const app = typeof getApp === 'function' ? getApp() : null;
    const serverEnvironment = app && app.globalData ? app.globalData.incubationEnvironment : null;
    const dailyWindowEnvironment = environmentService.resolve(serverEnvironment, { createdAt: pet.createdAt });
    this.setData({
      statusBarHeight: info.statusBarHeight || 20,
      panelWidth: Number(info.windowWidth || 375),
      panelHeight: Number(info.windowHeight || 667),
      pet,
      enterFromHome: query.entry === 'home-expand',
      dailyWindowEnvironment,
      dailyWindowWeatherLabel: WEATHER_LABELS[dailyWindowEnvironment.weather] || '晴朗',
      dailyWindowPeriodLabel: dailyWindowEnvironment.lightPhase === 'sunset' ? '日落' : (dailyWindowEnvironment.period === 'night' ? '夜晚' : '日间'),
      magicWindowReducedMotion: reducedMotionEnabled()
    });
    this.loadSnapshot();
  },

  loadSnapshot() {
    if (!this.data.pet) return;
    const token = this.loadToken = (this.loadToken || 0) + 1;
    this.clearSlotTimer();
    this.setData({ loading: true, error: '', talkError: '', letterError: '', actionBusy: false, talkBusy: false, letterBusy: false });
    postHatch.getSnapshot(this.data.pet).then(result => {
      if (!this.pageActive || token !== this.loadToken) return;
      if (!result.ok) {
        this.setData({ loading: false, error: result.message || '此刻状态没有加载好' });
        return;
      }
      const currentState = result.currentState;
      const screen = Math.max(0, Math.min(2, Number(currentState.screen || 0)));
      this.setData({
        loading: false,
        error: '',
        snapshot: result,
        currentState,
        currentScreen: screen,
        scrollLeft: screen * this.data.panelWidth,
        feedback: currentState.actionDone ? currentState.actionFeedback : '',
        playedActionKind: currentState.actionDone ? currentState.action.kind : '',
        letterDraft: '',
        talkDraft: '',
        talkReply: '',
        decorations: result.decorations || []
      });
      if (!this.hasTrackedEnter) {
        analytics.track('scene_enter', { scene_id: `${currentState.major}:${currentState.key}`, entry_type: this.data.enterFromHome ? 'home_expand' : 'direct' });
        this.hasTrackedEnter = true;
      }
      this.scheduleSlotRefresh(currentState.slotEnd);
    }).catch(() => {
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

  onScroll(event) {
    const left = Number(event.detail && event.detail.scrollLeft || 0);
    const screen = Math.max(0, Math.min(2, Math.round(left / this.data.panelWidth)));
    if (screen !== this.data.currentScreen) this.setData({ currentScreen: screen });
  },

  showFeedback(text) {
    clearTimeout(this.feedbackTimer);
    this.setData({ feedback: text || '' });
    this.feedbackTimer = setTimeout(() => {
      if (this.pageActive) this.setData({ feedback: '' });
    }, 2600);
  },

  onSceneAction() {
    const current = this.data.currentState;
    if (!current || !current.atHome || this.data.actionBusy) return;
    clearTimeout(this.feedbackTimer);
    this.setData({ actionBusy: true, feedback: '正在回应…' });
    postHatch.performAction(this.data.pet, this.data.snapshot).then(result => {
      if (!this.pageActive) return;
      this.setData({ actionBusy: false });
      if (!result.ok) {
        this.showFeedback(result.message || '这次没有回应，请重试');
        return;
      }
      const actionDone = true;
      this.setData({ 'currentState.actionDone': actionDone, 'currentState.actionFeedback': result.feedback || current.action.feedback, playedActionKind: current.action.kind });
      this.showFeedback(result.feedback || current.action.feedback);
      if (current.action.kind === 'window') this.onDailyWindowTap();
    }).catch(() => {
      if (this.pageActive) {
        this.setData({ actionBusy: false });
        this.showFeedback('这次没有回应，请重试');
      }
    });
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

  onDailyWindowTap() {
    if (!this.pageActive || this.data.dailyWindowVisible) return;
    wx.createSelectorQuery().in(this).select('.daily-window-hotspot').boundingClientRect(rect => {
      const fallback = {
        left: this.data.panelWidth * .55,
        top: this.data.panelHeight * .08,
        width: this.data.panelWidth * .4,
        height: this.data.panelHeight * .4
      };
      const origin = rect || fallback;
      const app = typeof getApp === 'function' ? getApp() : null;
      const serverEnvironment = app && app.globalData ? app.globalData.incubationEnvironment : null;
      const environment = environmentService.resolve(serverEnvironment, { createdAt: this.data.pet && this.data.pet.createdAt });
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
    const app = typeof getApp === 'function' ? getApp() : null;
    const serverEnvironment = app && app.globalData ? app.globalData.incubationEnvironment : null;
    const environment = environmentService.resolve(serverEnvironment, { createdAt: this.data.pet && this.data.pet.createdAt });
    this.setData({
      dailyWindowEnvironment: environment,
      dailyWindowWeatherLabel: WEATHER_LABELS[environment.weather] || '晴朗',
      dailyWindowPeriodLabel: environment.lightPhase === 'sunset' ? '日落' : (environment.period === 'night' ? '夜晚' : '日间')
    });
  },

  onOpenMagicWindow() {
    if (!this.pageActive || this.data.magicWindowVisible) return;
    const base = TOKYO_MAGIC_WINDOW.base || '';
    this.setData({
      dailyWindowVisible: false,
      magicWindowVisible: true,
      magicWindowLoading: Boolean(base),
      magicWindowFailed: !base,
      magicWindowReducedMotion: reducedMotionEnabled(),
      magicKoiReacting: false,
      magicWindowBaseSrc: base,
      magicWindowCloudsSrc: TOKYO_MAGIC_WINDOW.clouds || '',
      magicWindowKoiSrc: TOKYO_MAGIC_WINDOW.koi || ''
    });
    analytics.track('room_element_interaction', { element_id: 'far_glow', result: 'magic_window_tokyo_opened' });
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
    const source = TOKYO_MAGIC_WINDOW.base || '';
    if (!source) {
      this.setData({ magicWindowFailed: true });
      return;
    }
    this.setData({ magicWindowBaseSrc: '', magicWindowLoading: true, magicWindowFailed: false }, () => {
      const reload = () => this.pageActive && this.data.magicWindowVisible && this.setData({ magicWindowBaseSrc: source });
      if (wx.nextTick) wx.nextTick(reload);
      else setTimeout(reload, 0);
    });
  },

  onMagicKoiTap() {
    if (!this.data.magicWindowVisible || this.data.magicWindowReducedMotion) return;
    clearTimeout(this.magicKoiTimer);
    this.setData({ magicKoiReacting: false }, () => {
      this.setData({ magicKoiReacting: true });
      this.magicKoiTimer = setTimeout(() => {
        if (this.pageActive && this.data.magicWindowVisible) this.setData({ magicKoiReacting: false });
      }, 720);
    });
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
    analytics.track('room_element_interaction', { element_id: 'far_glow', result: 'magic_window_tokyo_closed' });
  },
  onOpenMemories(event) {
    const section = event.currentTarget.dataset.section || 'keepsakes';
    wx.navigateTo({ url: `/pages/life-scenes/life-scenes?section=${section}` });
  },
  onOpenDecorStudio() { wx.navigateTo({ url: '/pages/decor-studio/decor-studio' }); },

  onDecorTouchStart(event) {
    if (this.decorSaveBusy) return;
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || !this.data.decorations[index]) return;
    const decorations = this.data.decorations.slice();
    const nextZ = Math.min(50, Math.max.apply(null, decorations.map(item => Number(item.z || 0)).concat(0)) + 1);
    decorations[index] = Object.assign({}, decorations[index], { z: nextZ, renderZ: nextZ + 4 });
    this.dragDecorationIndex = index;
    this.setData({ decorations, feedback: '拖到喜欢的位置，松手就会留在这里。' });
  },
  onDecorTouchMove(event) {
    const index = this.dragDecorationIndex;
    const touch = (event.touches || [])[0];
    if (!Number.isInteger(index) || !touch || !this.data.decorations[index]) return;
    const x = Math.max(12, Math.min(88, Number(touch.clientX || touch.x || 0) / this.data.panelWidth * 100));
    const y = Math.max(24, Math.min(76, Number(touch.clientY || touch.y || 0) / this.data.panelHeight * 100));
    const decorations = this.data.decorations.slice();
    decorations[index] = Object.assign({}, decorations[index], { x, y });
    this.setData({ decorations });
  },
  onDecorTouchEnd() {
    const index = this.dragDecorationIndex;
    this.dragDecorationIndex = null;
    const decoration = this.data.decorations[index];
    if (!decoration || this.decorSaveBusy) return;
    this.decorSaveBusy = true;
    postHatch.moveDecoration(this.data.pet, decoration.id, decoration.x, decoration.y, decoration.z).then(result => {
      this.decorSaveBusy = false;
      if (!this.pageActive) return;
      this.showFeedback(result && result.ok ? '就放在这里了。' : result && result.message || '位置没有保存好，请重试');
    }).catch(() => {
      this.decorSaveBusy = false;
      if (this.pageActive) this.showFeedback('位置没有保存好，请重试');
    });
  },

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
    this.pageActive = true;
    if (this.data.dailyWindowVisible || this.data.magicWindowVisible) this.setData({ dailyWindowVisible: false, magicWindowVisible: false });
    if (this.returningFromChild) {
      this.returningFromChild = false;
      this.loadSnapshot();
    }
  },
  onHide() {
    this.pageActive = false;
    this.returningFromChild = true;
    this.clearTransientState();
  },
  clearTransientState() {
    this.clearSlotTimer();
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.magicKoiTimer);
    this.dragDecorationIndex = null;
    this.setData({ feedback: '', talkReply: '', dailyWindowVisible: false, magicWindowVisible: false, magicKoiReacting: false });
  },
  onUnload() {
    this.pageActive = false;
    this.loadToken = (this.loadToken || 0) + 1;
    clearTimeout(this.backTimer);
    clearTimeout(this.exitTimer);
    this.clearTransientState();
    analytics.track('scene_exit', { scene_id: this.data.currentState ? `${this.data.currentState.major}:${this.data.currentState.key}` : '', dwell_time: Math.max(0, timeService.now() - (this.enteredAt || timeService.now())) });
  }
});
