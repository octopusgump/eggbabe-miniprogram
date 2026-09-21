const config = require('../../config/v2');
const analytics = require('../../services/analytics');

const previewEnabled = config.localDemoEnabled;
const adapter = previewEnabled ? require('../../services/iaa-today-companion-adapter') : null;
const starAdapter = previewEnabled ? require('../../services/iaa-star-unlock-adapter') : null;
const fixture = previewEnabled
  ? require('../../fixtures/iaa-today-companion')
  : { SCENARIO_OPTIONS: [], VIEW_STATE_OPTIONS: [] };

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
    interactionError: '',
    awardedStars: 0,
    starAwardVisible: false,
    tomorrowHintVisible: false
  },

  onLoad(query) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : { statusBarHeight: 20 };
    const selectedScenario = optionKey(fixture.SCENARIO_OPTIONS, query && query.scenario, 'normal');
    const selectedViewState = optionKey(fixture.VIEW_STATE_OPTIONS, query && query.state, 'ready');
    this.setData({
      topInset: Number(info.statusBarHeight || 20) + 12,
      isDev: previewEnabled,
      selectedScenario,
      selectedViewState
    });
    if (!previewEnabled) {
      this.setData({
        screenState: 'unavailable',
        view: null,
        starView: null,
        errorMessage: '',
        interactionDone: false,
        interactionPending: false,
        interactionFeedback: '',
        interactionError: '',
        awardedStars: 0,
        starAwardVisible: false,
        tomorrowHintVisible: false
      });
      return Promise.resolve({ ok: false, code: 'OFFICIAL_SERVICE_NOT_CONNECTED' });
    }
    return this.loadPreview();
  },

  loadPreview() {
    if (!previewEnabled) return Promise.resolve({ ok: false, code: 'LOCAL_PREVIEW_DISABLED' });
    this._tomorrowPromptTracked = false;
    const state = this.data.selectedViewState;
    if (state === 'loading') {
      this.setData({ screenState: 'loading', view: null, starView: null, errorMessage: '', interactionDone: false, interactionPending: false, interactionFeedback: '', interactionError: '', awardedStars: 0, starAwardVisible: false, tomorrowHintVisible: false });
      return Promise.resolve();
    }

    this.setData({ screenState: 'loading', view: null, starView: null, errorMessage: '', interactionDone: false, interactionPending: false, interactionFeedback: '', interactionError: '', awardedStars: 0, starAwardVisible: false, tomorrowHintVisible: false });
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
          interactionFeedback: interactionDone ? starResult.data.helperText : '',
          tomorrowHintVisible: false
        });
        this.trackTomorrowPromptShown();
      });
    });
  },

  trackTomorrowPromptShown() {
    if (this._tomorrowPromptTracked || this.data.screenState !== 'ready') return;
    this._tomorrowPromptTracked = true;
    analytics.track('companion_interaction', {
      interaction_type: 'tomorrow_hint',
      result: 'prompt_shown'
    });
  },

  onToggleDevPanel() {
    if (!this.data.isDev) return;
    this.setData({ devPanelOpen: !this.data.devPanelOpen });
  },

  onScenarioSelect(event) {
    if (!previewEnabled) return Promise.resolve();
    const selectedScenario = optionKey(fixture.SCENARIO_OPTIONS, event.currentTarget.dataset.key, 'normal');
    this.setData({ selectedScenario });
    return this.loadPreview();
  },

  onViewStateSelect(event) {
    if (!previewEnabled) return Promise.resolve();
    const selectedViewState = optionKey(fixture.VIEW_STATE_OPTIONS, event.currentTarget.dataset.key, 'ready');
    this.setData({ selectedViewState });
    return this.loadPreview();
  },

  onRetry() {
    if (!previewEnabled) return Promise.resolve();
    this.setData({ selectedViewState: 'ready' });
    return this.loadPreview();
  },

  onInteract() {
    if (!previewEnabled) return Promise.resolve({ ok: false, code: 'OFFICIAL_SERVICE_NOT_CONNECTED' });
    const view = this.data.view;
    const starView = this.data.starView;
    if (!view || !view.today || !starView || this.data.interactionDone || this.data.interactionPending) return Promise.resolve();

    this.setData({ interactionPending: true, interactionError: '', starAwardVisible: false });
    return starAdapter.recordCompanion(starView).then(result => {
      if (!result.ok) {
        this.setData({
          interactionPending: false,
          interactionError: result.error.message
        });
        return result;
      }

      const awardedStars = Number(result.awardedStars || 0);
      this.setData({
        starView: result.data,
        interactionDone: true,
        interactionPending: false,
        interactionFeedback: awardedStars > 0 ? view.today.interactionFeedback : result.data.helperText,
        interactionError: '',
        awardedStars,
        starAwardVisible: awardedStars > 0
      });
      return result;
    });
  },

  onRevealTomorrow() {
    if (!this.data.view || this.data.tomorrowHintVisible) return;
    this.setData({ tomorrowHintVisible: true });
    analytics.track('companion_interaction', {
      interaction_type: 'tomorrow_hint',
      result: 'revealed'
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
