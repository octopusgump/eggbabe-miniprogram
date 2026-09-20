const adapter = require('../../services/iaa-star-unlock-adapter');
const fixture = require('../../fixtures/iaa-star-unlock');

function isDevelopmentBuild() {
  try {
    const account = wx.getAccountInfoSync ? wx.getAccountInfoSync() : {};
    return !account.miniProgram || account.miniProgram.envVersion === 'develop';
  } catch (error) {
    return true;
  }
}

function validState(candidate) {
  const key = String(candidate || '').toUpperCase();
  return fixture.STATE_OPTIONS.some(item => item.key === key) ? key : 'AVAILABLE';
}

Page({
  data: {
    topInset: 44,
    isDev: false,
    devPanelOpen: false,
    stateOptions: fixture.STATE_OPTIONS,
    selectedState: 'AVAILABLE',
    loading: true,
    busy: false,
    view: null,
    awardedStars: 0,
    duplicateFeedback: '',
    errorMessage: '',
    unlockVisible: false
  },

  onLoad(query) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : { statusBarHeight: 20 };
    const selectedState = validState(query && query.state);
    this.setData({
      topInset: Number(info.statusBarHeight || 20) + 12,
      isDev: isDevelopmentBuild(),
      selectedState
    });
    this.loadState(selectedState);
  },

  loadState(stateKey) {
    this.setData({ loading: true, busy: false, errorMessage: '', awardedStars: 0, duplicateFeedback: '', unlockVisible: false });
    return adapter.getStarUnlockView({ state: stateKey }).then(result => {
      if (!result.ok) {
        this.setData({ loading: false, view: null, errorMessage: result.error.message });
        return;
      }
      this.setData({
        loading: false,
        view: result.data,
        unlockVisible: Boolean(result.data.newlyUnlockedMemory)
      });
    });
  },

  onToggleDevPanel() {
    if (!this.data.isDev) return;
    this.setData({ devPanelOpen: !this.data.devPanelOpen });
  },

  onStateSelect(event) {
    const selectedState = validState(event.currentTarget.dataset.key);
    this.setData({ selectedState });
    return this.loadState(selectedState);
  },

  onCompanionTap() {
    if (this.data.busy || !this.data.view) return Promise.resolve();
    this.setData({ busy: true, errorMessage: '', awardedStars: 0, duplicateFeedback: '' });
    return adapter.recordCompanion(this.data.view).then(result => {
      if (!result.ok) {
        this.setData({ busy: false, errorMessage: result.error.message });
        return;
      }
      this.setData({
        busy: false,
        view: result.data,
        awardedStars: result.awardedStars,
        duplicateFeedback: result.duplicate ? '这颗星星今天已经收好了。陪伴本身还在继续。' : '',
        unlockVisible: Boolean(result.data.newlyUnlockedMemory)
      });
    });
  },

  onRetry() {
    if (this.data.busy) return Promise.resolve();
    this.setData({ busy: true, errorMessage: '' });
    return adapter.retryCompanion().then(result => {
      if (!result.ok) {
        this.setData({ busy: false, errorMessage: result.error.message });
        return;
      }
      this.setData({
        busy: false,
        selectedState: result.data.star.dailyClaimStatus,
        view: result.data,
        awardedStars: result.awardedStars,
        unlockVisible: Boolean(result.data.newlyUnlockedMemory)
      });
    });
  },

  onCloseUnlock() {
    this.setData({ unlockVisible: false });
  },

  noop() {},

  onBack() {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/home/home' });
  }
});
