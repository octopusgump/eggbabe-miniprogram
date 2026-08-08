const petStore = require('../../utils/pet-store');
const postHatch = require('../../services/post-hatch-companion');
const config = require('../../config/v2');
const memoryDemoPreview = require('../../utils/memory-demo-preview');

const SECTIONS = ['keepsakes', 'postcards', 'card'];

function memoryDateLabel(value) {
  const date = new Date(value || 0);
  if (!value || !Number.isFinite(date.getTime())) return '';
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function normalizePostcard(item) {
  const postcard = Object.assign({}, item, {
    displayDate: memoryDateLabel(item && (item.deliveredAt || item.sentAt || item.appearedAt)),
    imageFailed: false
  });
  const journeySlides = Array.isArray(item && item.postcards)
    ? item.postcards.map(slide => Object.assign({}, slide, {
      displayDate: memoryDateLabel(slide.deliveredAt || item.deliveredAt || item.sentAt || item.appearedAt),
      imageFailed: false
    }))
    : [];
  if (journeySlides.length) {
    postcard.postcards = journeySlides;
    postcard.asset = postcard.asset || journeySlides[0].asset || '';
  }
  return postcard;
}

Page({
  data: {
    pet: null,
    loading: true,
    error: '',
    section: 'keepsakes',
    keepsakes: [],
    postcards: [],
    cardRecommendation: null,
    cardPreview: null,
    selectedKeepsake: null,
    selectedPostcard: null,
    selectedPostcardSlides: [],
    selectedPostcardIndex: 0,
    detailTitle: '',
    isDemo: config.localDemoEnabled,
    demoPreviewIndex: 0
  },
  onLoad(query) {
    const params = query || {};
    this.requestedKeepsakeId = String(params.keepsake_id || '');
    this.postcardIdToRead = String(params.postcard_id || '');
    this.useSourceMemoriesForDetail = !!this.postcardIdToRead && params.preview === undefined;
    const requestedSection = this.requestedKeepsakeId ? 'keepsakes' : (this.postcardIdToRead ? 'postcards' : params.section);
    const section = SECTIONS.includes(requestedSection) ? requestedSection : 'keepsakes';
    const previewIndex = Math.max(0, Math.min(2, Number(params.preview) || 0));
    this.setData({ section, demoPreviewIndex: previewIndex });
  },
  onShow() {
    this.pageActive = true;
    const pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      wx.showToast({ title: '破壳后才能查看这些回忆', icon: 'none' });
      this.backTimer = setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const token = this.loadToken = (this.loadToken || 0) + 1;
    this.setData({ pet, loading: true, error: '' });
    postHatch.getMemories(pet).then(result => {
      if (!this.pageActive || token !== this.loadToken) return;
      if (!result.ok) {
        this.setData({ loading: false, error: result.message || '回忆没有加载好，请重试' });
        return;
      }
      this.loadedMemories = {
        keepsakes: result.keepsakes || [],
        postcards: result.postcards || [],
        cardRecommendation: result.cardRecommendation || null
      };
      this.applyMemories();
    }).catch(() => {
      if (this.pageActive && token === this.loadToken) this.setData({ loading: false, error: '回忆没有加载好，请重试' });
    });
  },
  applyMemories() {
    const source = this.loadedMemories || { keepsakes: [], postcards: [], cardRecommendation: null };
    const memories = this.data.isDemo && !this.useSourceMemoriesForDetail
      ? memoryDemoPreview.build(this.data.demoPreviewIndex, this.data.pet, source)
      : source;
    const keepsakes = (memories.keepsakes || []).map(item => Object.assign({}, item, { imageFailed: false }));
    const postcards = (memories.postcards || []).map(normalizePostcard);
    const recommendation = memories.cardRecommendation || null;
    const card = recommendation && recommendation.card || null;
    const selectedKeepsake = keepsakes.find(item => String(item && item.id || '') === this.requestedKeepsakeId) || null;
    const selectedPostcard = postcards.find(item => String(item && item.id || '') === this.postcardIdToRead) || null;
    const selectedPostcardSlides = selectedPostcard && Array.isArray(selectedPostcard.postcards)
      ? selectedPostcard.postcards
      : [];
    const restoredPostcardIndex = Math.min(
      Math.max(0, Number(this.returnPostcardIndex) || 0),
      Math.max(0, selectedPostcardSlides.length - 1)
    );
    this.setData({
      loading: false,
      error: '',
      keepsakes,
      postcards,
      cardRecommendation: recommendation,
      cardPreview: card ? {
        illustration: card.illustration_url || card.illustrationUrl || '',
        name: card.display_name || card.displayName || this.data.pet.name || '我的蛋宝宝',
        style: card.style || '',
        imageFailed: false
      } : null,
      selectedKeepsake,
      selectedPostcard,
      selectedPostcardSlides,
      selectedPostcardIndex: restoredPostcardIndex,
      detailTitle: selectedKeepsake ? selectedKeepsake.name : (selectedPostcard ? selectedPostcard.sceneLabel || '明信片' : '')
    }, () => this.markTargetPostcardRead());
  },
  markTargetPostcardRead() {
    const postcardId = this.postcardIdToRead;
    if (!postcardId || !this.data.pet || !this.pageActive) return;
    const target = (this.loadedMemories && this.loadedMemories.postcards || []).find(item => String(item && item.id || '') === postcardId);
    if (!target) return;
    postHatch.markPostcardRead(this.data.pet, postcardId).then(result => {
      if (!result || !result.ok) return;
      this.postcardIdToRead = '';
      target.unread = false;
      target.readAt = Date.now();
    }).catch(() => {});
  },
  onCycleMemoryPreview() {
    if (!this.data.isDemo || this.data.loading) return;
    this.setData({ demoPreviewIndex: (this.data.demoPreviewIndex + 1) % 3 }, () => this.applyMemories());
  },
  onPostcardSlideChange(event) {
    const index = Number(event && event.detail && event.detail.current);
    const slides = this.data.selectedPostcardSlides || [];
    if (!Number.isInteger(index) || index < 0 || index >= slides.length) return;
    this.setData({ selectedPostcardIndex: index });
  },
  onOpenJourneyScene(event) {
    const journey = this.data.selectedPostcard;
    const slides = this.data.selectedPostcardSlides || [];
    const requestedIndex = Number(event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.index);
    const index = Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < slides.length
      ? requestedIndex
      : this.data.selectedPostcardIndex;
    if (!journey || !slides.length) return;
    this.returnPostcardIndex = index;
    const journeyId = encodeURIComponent(String(journey.journeyId || journey.id || ''));
    wx.navigateTo({
      url: `/pages/journey-scene/journey-scene?journey_id=${journeyId}&index=${index}`,
      success: result => {
        if (!result || !result.eventChannel) return;
        result.eventChannel.emit('journey', {
          id: journey.id,
          journeyId: journey.journeyId || '',
          destinationId: journey.destinationId || '',
          title: journey.sceneLabel || '旅途回放',
          slides
        });
      }
    });
  },
  onOpenKeepsake(event) {
    const id = String(event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.id || '');
    if (!id) return;
    const preview = this.data.isDemo ? `&preview=${this.data.demoPreviewIndex}` : '';
    wx.navigateTo({ url: `/pages/life-scenes/life-scenes?section=keepsakes&keepsake_id=${encodeURIComponent(id)}${preview}` });
  },
  onOpenPostcard(event) {
    const id = String(event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.id || '');
    if (!id) return;
    const preview = this.data.isDemo ? `&preview=${this.data.demoPreviewIndex}` : '';
    wx.navigateTo({ url: `/pages/life-scenes/life-scenes?section=postcards&postcard_id=${encodeURIComponent(id)}${preview}` });
  },
  setMemoryImageFailed(scope, index, failed) {
    const paths = {
      'keepsake-detail': 'selectedKeepsake.imageFailed',
      'postcard-detail': 'selectedPostcard.imageFailed',
      'card-preview': 'cardPreview.imageFailed'
    };
    let path = paths[scope];
    if (scope === 'keepsake-list' && Number.isInteger(index)) path = `keepsakes[${index}].imageFailed`;
    if (scope === 'postcard-list' && Number.isInteger(index)) path = `postcards[${index}].imageFailed`;
    if (scope === 'postcard-slide' && Number.isInteger(index)) path = `selectedPostcardSlides[${index}].imageFailed`;
    if (!path) return;
    this.setData({ [path]: failed });
  },
  onMemoryImageError(event) {
    const dataset = event.currentTarget && event.currentTarget.dataset || {};
    this.setMemoryImageFailed(String(dataset.scope || ''), Number(dataset.index), true);
  },
  onRetryMemoryImage(event) {
    const dataset = event.currentTarget && event.currentTarget.dataset || {};
    this.setMemoryImageFailed(String(dataset.scope || ''), Number(dataset.index), false);
  },
  onRetry() { if (!this.data.loading) this.onShow(); },
  onOpenCard() {
    if (this.data.pet && this.data.pet.collectionCard) wx.navigateTo({ url: '/pages/collection-card/collection-card' });
  },
  onHide() { this.pageActive = false; },
  onUnload() {
    this.pageActive = false;
    this.loadToken = (this.loadToken || 0) + 1;
    clearTimeout(this.backTimer);
    this.loadedMemories = null;
  }
});
