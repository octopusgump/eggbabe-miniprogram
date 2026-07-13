const petStore = require('../../utils/pet-store');
const sceneCardStore = require('../../services/scene-card-store');
const analytics = require('../../services/analytics');
Page({
  data: { card: null, sceneCards: [], tab: 'hatch', summary: null, shareCard: null },
  onLoad(query) { this.setData({ tab: query.tab === 'scene' ? 'scene' : 'hatch' }); },
  onShow() {
    const pet = petStore.getPet();
    this.setData({ card: pet && pet.collectionCard ? pet.collectionCard : null, sceneCards: sceneCardStore.list(), summary: pet ? sceneCardStore.collectionSummary(pet.prototype) : null });
    analytics.track('card_album_view', { album_tab: this.data.tab });
  },
  onTab(event) {
    const tab = event.currentTarget.dataset.tab;
    this.setData({ tab });
    analytics.track('album_view', { album_tab: tab });
  },
  onSaveSceneCard(event) {
    const result = sceneCardStore.markSaved(event.currentTarget.dataset.id);
    if (!result.ok) return wx.showToast({ title: result.message, icon: 'none' });
    this.onShow();
    wx.showToast({ title: '已标记保存', icon: 'success' });
  },
  onSceneCardImageError(event) {
    const cardId = event.currentTarget.dataset.id;
    this.setData({ sceneCards: this.data.sceneCards.map(card => card.id === cardId ? Object.assign({}, card, { imageFailed: true }) : card) });
  },
  onSelectShare(event) {
    const card = this.data.sceneCards.find(item => item.id === event.currentTarget.dataset.id);
    this.setData({ shareCard: card || null });
    if (card) sceneCardStore.markShared(card.id);
  },
  onEcommerce() {
    analytics.track('ecommerce_cta_click', { unlock_sku: 'scene-set-access', entry: 'album' });
    wx.showModal({ title: '已解锁站外购买资格', content: '购买仍在线下或品牌私域完成。正式跳转入口将在运营渠道确认后开放。', showCancel: false, confirmText: '知道了', confirmColor: '#3F5A47' });
  },
  onShareAppMessage() {
    const card = this.data.shareCard;
    return { title: card ? `我在${card.name}里遇见了蛋宝宝` : '我的蛋宝宝场景卡册', path: '/pages/welcome/welcome' };
  },
  onOpen() { wx.navigateTo({ url: '/pages/collection-card/collection-card' }); }
});
