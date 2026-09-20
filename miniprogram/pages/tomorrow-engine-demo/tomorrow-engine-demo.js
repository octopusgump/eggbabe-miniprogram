const {
  createTomorrowEngineAdapter,
  validateReviewView
} = require('../../services/tomorrow-engine-adapter');

const VIEW_STATES = [
  { value: 'CONTENT', label: '内容' },
  { value: 'LOADING', label: '加载' },
  { value: 'EMPTY', label: '空态' },
  { value: 'ERROR', label: '失败' }
];

Page({
  data: {
    debugMode: false,
    dayTypeOptions: [],
    viewStateOptions: VIEW_STATES,
    selectedDayType: 'NORMAL',
    selectedViewState: 'LOADING',
    loading: true,
    empty: false,
    failed: false,
    view: null,
    scenario: null
  },

  onLoad(query) {
    this.pageActive = true;
    this.adapter = createTomorrowEngineAdapter();
    this.setData({
      debugMode: Boolean(query && query.debug === '1'),
      dayTypeOptions: this.adapter.listReviewOptions()
    });
    this.loadCurrentReview();
  },

  onUnload() {
    this.pageActive = false;
  },

  loadCurrentReview() {
    const requestType = this.data.selectedDayType;
    this.setData({
      selectedViewState: 'LOADING',
      loading: true,
      empty: false,
      failed: false
    });
    return this.adapter.loadReview(requestType).then(view => {
      if (!this.pageActive || requestType !== this.data.selectedDayType) return;
      if (!validateReviewView(view)) throw new Error('INVALID_TOMORROW_REVIEW_VIEW');
      this.setData({
        selectedViewState: 'CONTENT',
        loading: false,
        empty: false,
        failed: false,
        view,
        scenario: view.scenario
      });
    }).catch(() => {
      if (!this.pageActive || requestType !== this.data.selectedDayType) return;
      this.setData({
        selectedViewState: 'ERROR',
        loading: false,
        empty: false,
        failed: true,
        view: null,
        scenario: null
      });
    });
  },

  onDayTypeTap(event) {
    if (this.data.loading) return;
    const dayType = String(event.currentTarget.dataset.dayType || 'NORMAL');
    this.setData({ selectedDayType: dayType }, () => this.loadCurrentReview());
  },

  onViewStateTap(event) {
    const state = String(event.currentTarget.dataset.state || 'CONTENT');
    if (state === 'CONTENT') {
      this.loadCurrentReview();
      return;
    }
    this.setData({
      selectedViewState: state,
      loading: state === 'LOADING',
      empty: state === 'EMPTY',
      failed: state === 'ERROR',
      view: null,
      scenario: null
    });
  },

  onRetry() {
    this.loadCurrentReview();
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
