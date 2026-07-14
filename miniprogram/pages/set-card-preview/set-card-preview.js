const petStore = require('../../utils/pet-store');
const sceneCardStore = require('../../services/scene-card-store');
const previewService = require('../../services/set-card-preview');
const analytics = require('../../services/analytics');

Page({
  data: { cards: [], current: null, currentIndex: 0, total: 0 },

  onLoad(query) {
    const pet = petStore.getPet();
    if (!pet || !pet.demoMode) {
      wx.showToast({ title: '请先从首页进入展会快速体验', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 700);
      return;
    }
    const cards = previewService.buildPreviewCards(pet, sceneCardStore.list());
    const requestedIndex = cards.findIndex(card => card.cardId === query.cardId);
    const currentIndex = requestedIndex >= 0 ? requestedIndex : 0;
    this.setData({ cards, current: cards[currentIndex] || null, currentIndex, total: cards.length });
    analytics.track('demo_set_card_preview_opened', { set_code: 'YT-S01', card_id: cards[currentIndex] ? cards[currentIndex].cardId : '' });
  },

  setCurrent(index) {
    const total = this.data.cards.length;
    if (!total) return;
    const nextIndex = (index + total) % total;
    const current = this.data.cards[nextIndex];
    this.setData({ currentIndex: nextIndex, current });
    analytics.track('demo_set_card_preview_changed', { set_code: current.setCode, card_id: current.cardId, collector_number: current.collectorLabel });
  },

  onPrevious() { this.setCurrent(this.data.currentIndex - 1); },
  onNext() { this.setCurrent(this.data.currentIndex + 1); },
  onSelect(event) { this.setCurrent(Number(event.currentTarget.dataset.index)); },
  onOpenAlbum() {
    const pages = getCurrentPages();
    const previous = pages.length > 1 ? pages[pages.length - 2] : null;
    if (previous && previous.route === 'pages/album/album') return wx.navigateBack();
    return wx.redirectTo({ url: '/pages/album/album?tab=scene' });
  },

  onShareAppMessage() {
    const card = this.data.current;
    return { title: card ? `${card.name}的 ${card.setCode} 收藏卡预览` : 'eggbabe 收藏卡预览', path: '/pages/welcome/welcome' };
  }
});
