const JOURNEY_PAYLOAD_WAIT_MS = 800;

function decodedQueryValue(value) {
  const source = String(value || '');
  try {
    return decodeURIComponent(source);
  } catch (error) {
    return source;
  }
}

function requestedSlideIndex(value) {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 ? index : 0;
}

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
  const sourceSlides = Array.isArray(journey.slides) ? journey.slides : [];
  const slideIds = new Set();
  let invalidSlides = false;
  const slides = sourceSlides.map(item => {
    const slide = item && typeof item === 'object' ? item : {};
    const normalized = Object.assign({}, slide, {
      id: String(slide.id || ''),
      sceneLabel: String(slide.sceneLabel || ''),
      actionLabel: String(slide.actionLabel || ''),
      line: String(slide.line || ''),
      asset: String(slide.asset || '')
    });
    if (!normalized.id || !normalized.sceneLabel || !normalized.actionLabel || !normalized.line || !normalized.asset || slideIds.has(normalized.id)) {
      invalidSlides = true;
    }
    slideIds.add(normalized.id);
    return normalized;
  });
  return {
    id: String(journey.id || ''),
    journeyId: String(journey.journeyId || ''),
    destinationId: String(journey.destinationId || ''),
    title: String(journey.title || '旅途回放'),
    slides,
    invalidSlides
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
    this.requestedIndex = requestedSlideIndex(query && query.index);
    this.requestedJourneyId = String(query && query.journey_id || '');
    this.decodedRequestedJourneyId = decodedQueryValue(this.requestedJourneyId);
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
    const requestedJourneyIds = Array.from(new Set([this.requestedJourneyId, this.decodedRequestedJourneyId].filter(Boolean)));
    if (requestedJourneyIds.length && !requestedJourneyIds.some(id => journey.journeyId === id || journey.id === id)) {
      this.clearJourneyDeadline();
      this.setData({ loading: false, ready: false, error: '这次旅程的数据没有对上' });
      return;
    }
    if (!journey.slides.length) {
      this.clearJourneyDeadline();
      this.setData({ loading: false, ready: false, error: '这次旅程暂时无法回放' });
      return;
    }
    if (journey.invalidSlides) {
      this.clearJourneyDeadline();
      this.setData({ loading: false, ready: false, error: '这次旅程的数据不完整' });
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
    this.requestedJourneyId = '';
    this.decodedRequestedJourneyId = '';
  }
});

module.exports = { decodedQueryValue, requestedSlideIndex, normalizeJourney, JOURNEY_PAYLOAD_WAIT_MS };
