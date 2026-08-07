const JOURNEY_PAYLOAD_WAIT_MS = 800;

function reducedMotionEnabled() {
  try {
    const system = wx.getSystemSetting
      ? wx.getSystemSetting()
      : (wx.getSystemInfoSync ? wx.getSystemInfoSync() : {});
    return Boolean(system.reducedMotion || system.enableReduceMotion);
  } catch (error) {
    return false;
  }
}

function normalizeJourney(payload) {
  const journey = payload && typeof payload === 'object' ? payload : {};
  const slides = Array.isArray(journey.slides)
    ? journey.slides.filter(item => item && item.asset).map(item => Object.assign({}, item))
    : [];
  return {
    id: String(journey.id || ''),
    journeyId: String(journey.journeyId || ''),
    destinationId: String(journey.destinationId || ''),
    title: String(journey.title || '旅途回放'),
    slides
  };
}

Page({
  data: {
    statusBarHeight: 20,
    title: '旅途回放',
    slides: [],
    current: 0,
    loading: true,
    reducedMotion: false,
    ready: false,
    error: ''
  },
  onLoad(query) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.failedSlideIndexes = new Set();
    this.requestedIndex = Math.max(0, Number(query && query.index) || 0);
    this.requestedJourneyId = String(query && query.journey_id || '');
    this.setData({
      statusBarHeight: info.statusBarHeight || 20,
      reducedMotion: reducedMotionEnabled()
    });
    this.journeyDeadline = setTimeout(() => {
      if (!this.data.ready) this.setData({ loading: false, error: '没有收到可回放的旅程内容' });
    }, JOURNEY_PAYLOAD_WAIT_MS);

    const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (eventChannel && eventChannel.on) {
      eventChannel.on('journey', payload => this.applyJourney(payload));
    }
  },
  applyJourney(payload) {
    const journey = normalizeJourney(payload);
    if (this.requestedJourneyId && journey.journeyId !== this.requestedJourneyId && journey.id !== this.requestedJourneyId) {
      this.clearJourneyDeadline();
      this.setData({ loading: false, ready: false, error: '这次旅程的数据没有对上' });
      return;
    }
    if (!journey.slides.length) {
      this.clearJourneyDeadline();
      this.setData({ loading: false, ready: false, error: '这次旅程暂时无法回放' });
      return;
    }
    const current = Math.min(this.requestedIndex || 0, journey.slides.length - 1);
    this.clearJourneyDeadline();
    this.setData({
      title: journey.title,
      slides: journey.slides,
      current,
      loading: false,
      ready: true,
      error: ''
    });
  },
  onSlideChange(event) {
    const index = Number(event && event.detail && event.detail.current);
    if (!Number.isInteger(index) || index < 0 || index >= this.data.slides.length) return;
    if (this.failedSlideIndexes && this.failedSlideIndexes.has(index)) {
      this.setData({ current: index, loading: false, ready: false, error: '这张旅途画面没有加载好' });
      return;
    }
    this.setData({ current: index });
  },
  onImageError(event) {
    const index = Number(event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.index);
    if (Number.isInteger(index) && this.failedSlideIndexes) this.failedSlideIndexes.add(index);
    if (index !== this.data.current) return;
    this.clearJourneyDeadline();
    this.setData({ loading: false, ready: false, error: '这张旅途画面没有加载好' });
  },
  clearJourneyDeadline() {
    clearTimeout(this.journeyDeadline);
    this.journeyDeadline = null;
  },
  onBack() {
    wx.navigateBack();
  },
  onUnload() {
    this.clearJourneyDeadline();
    this.failedSlideIndexes = null;
  }
});

module.exports = { normalizeJourney, JOURNEY_PAYLOAD_WAIT_MS };
