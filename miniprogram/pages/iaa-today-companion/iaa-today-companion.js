const adapter = require('../../services/iaa-today-companion-adapter');
const starAdapter = require('../../services/iaa-star-unlock-adapter');
const fixture = require('../../fixtures/iaa-today-companion');

function isDevelopmentBuild() {
  try {
    const account = wx.getAccountInfoSync ? wx.getAccountInfoSync() : {};
    return !account.miniProgram || account.miniProgram.envVersion === 'develop';
  } catch (error) {
    return true;
  }
}

function optionKey(options, candidate, fallback) {
  const key = String(candidate || '');
  return options.some(item => item.key === key) ? key : fallback;
}

Page({
  data: {
    topInset: 44,
    isDev: false,
    devPanelOpen: false,
    scenarioOptions: fixture.SCENARIO_OPTIONS,
    viewStateOptions: fixture.VIEW_STATE_OPTIONS,
    selectedScenario: 'normal',
    selectedViewState: 'ready',
    screenState: 'loading',
    view: null,
    starView: null,
    errorMessage: '',
    interactionDone: false,
    interactionPending: false,
    interactionFeedback: '',
    awardedStars: 0,
    starAwardVisible: false
  },

  onLoad(query) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : { statusBarHeight: 20 };
    const selectedScenario = optionKey(fixture.SCENARIO_OPTIONS, query && query.scenario, 'normal');
    const selectedViewState = optionKey(fixture.VIEW_STATE_OPTIONS, query && query.state, 'ready');
    this.setData({
      topInset: Number(info.statusBarHeight || 20) + 12,
      isDev: isDevelopmentBuild(),
      selectedScenario,
      selectedViewState
    });
    return this.loadPreview();
  },

  loadPreview() {
    const state = this.data.selectedViewState;
    if (state === 'loading') {
      this.setData({ screenState: 'loading', view: null, starView: null, errorMessage: '', interactionDone: false, interactionPending: false, interactionFeedback: '', awardedStars: 0, starAwardVisible: false });
      return Promise.resolve();
    }

    this.setData({ screenState: 'loading', view: null, starView: null, errorMessage: '', interactionDone: false, interactionPending: false, interactionFeedback: '', awardedStars: 0, starAwardVisible: false });
    return adapter.getTodayView({ scenario: this.data.selectedScenario, state }).then(result => {
      if (!result.ok) {
        this.setData({ screenState: 'error', errorMessage: result.error.message, view: null });
        return;
      }
      if (!result.data) {
        this.setData({ screenState: 'empty', view: null });
        return;
      }
      const dailyClaimStatus = result.data.star && result.data.star.dailyClaimStatus || 'AVAILABLE';
      return starAdapter.getStarUnlockView({ state: dailyClaimStatus }).then(starResult => {
        if (!starResult.ok) {
          this.setData({ screenState: 'error', errorMessage: starResult.error.message, view: null, starView: null });
          return;
        }
        const interactionDone = starResult.data.star.dailyClaimStatus !== 'AVAILABLE';
        this.setData({
          screenState: 'ready',
          view: result.data,
          starView: starResult.data,
          interactionDone,
          interactionFeedback: interactionDone ? starResult.data.helperText : ''
        });
      });
    });
  },

  onToggleDevPanel() {
    if (!this.data.isDev) return;
    this.setData({ devPanelOpen: !this.data.devPanelOpen });
  },

  onScenarioSelect(event) {
    const selectedScenario = optionKey(fixture.SCENARIO_OPTIONS, event.currentTarget.dataset.key, 'normal');
    this.setData({ selectedScenario });
    return this.loadPreview();
  },

  onViewStateSelect(event) {
    const selectedViewState = optionKey(fixture.VIEW_STATE_OPTIONS, event.currentTarget.dataset.key, 'ready');
    this.setData({ selectedViewState });
    return this.loadPreview();
  },

  onRetry() {
    this.setData({ selectedViewState: 'ready' });
    return this.loadPreview();
  },

  onInteract() {
    const view = this.data.view;
    const starView = this.data.starView;
    if (!view || !view.today || !starView || this.data.interactionDone || this.data.interactionPending) return Promise.resolve();

    this.setData({ interactionPending: true, starAwardVisible: false });
    return starAdapter.recordCompanion(starView).then(result => {
      if (!result.ok) {
        this.setData({
          interactionPending: false,
          interactionFeedback: result.error.message
        });
        return result;
      }

      const awardedStars = Number(result.awardedStars || 0);
      this.setData({
        starView: result.data,
        interactionDone: true,
        interactionPending: false,
        interactionFeedback: awardedStars > 0 ? view.today.interactionFeedback : result.data.helperText,
        awardedStars,
        starAwardVisible: awardedStars > 0
      });
      return result;
    });
  },

  onBack() {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/home/home' });
  }
});
