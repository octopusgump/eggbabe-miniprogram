const petStore = require('../../utils/pet-store');
const sceneCardStore = require('../../services/scene-card-store');
const analytics = require('../../services/analytics');
const config = require('../../config/v2');
const h5Bridge = require('../../services/birth-card-h5');
const runtime = require('../../services/runtime-context');
Page({
  data: { card: null, sceneCards: [], setSlots: [], tab: 'hatch', summary: null, shareCard: null, isDemo: false },
  onLoad(query) { this.setData({ tab: query.tab === 'scene' ? 'scene' : 'hatch' }); },
  onShow() {
    const pet = petStore.getPet();
    const summary = pet ? sceneCardStore.collectionSummary(pet.prototype) : null;
    this.setData({
      card: pet && pet.collectionCard ? pet.collectionCard : null,
      sceneCards: sceneCardStore.list(),
      setSlots: summary ? summary.slots : [],
      summary,
      isDemo: runtime.getMode() === 'demo'
    });
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
    wx.showToast({ title: '已在卡册中标记', icon: 'success' });
  },
  onSceneCardImageError(event) {
    const cardId = event.currentTarget.dataset.cardId;
    this.setData({ setSlots: this.data.setSlots.map(card => card.cardId === cardId ? Object.assign({}, card, { imageFailed: true }) : card) });
  },
  onSelectShare(event) {
    const card = this.data.sceneCards.find(item => item.id === event.currentTarget.dataset.id);
    this.setData({ shareCard: card || null });
    if (card) sceneCardStore.markShared(card.id);
  },
  onOpenCopies(event) {
    const slot = this.data.setSlots.find(item => item.cardId === event.currentTarget.dataset.cardId);
    if (!slot || !slot.copies.length) return;
    const content = slot.copies.map((copy, index) => {
      const code = copy.uniqueCode || '旧副本暂无编号';
      const obtained = copy.obtainedLabel ? `获得于 ${copy.obtainedLabel}` : '获得时间未记录';
      return `${index + 1}. ${code}\n${obtained}`;
    }).join('\n\n');
    wx.showModal({ title: `${slot.name} · ${slot.quantity} 份副本`, content, showCancel: false, confirmText: '知道了', confirmColor: '#3F5A47' });
  },
  onOpenSetCard(event) {
    const definitionId = event.currentTarget.dataset.cardId;
    if (runtime.getMode() === 'demo') {
      wx.navigateTo({ url: `/pages/set-card-preview/set-card-preview?cardId=${encodeURIComponent(definitionId || '')}` });
      return;
    }
    const card = this.data.sceneCards.find(item => item.id === event.currentTarget.dataset.id);
    if (!card) {
      wx.showToast({ title: '先去场景里遇见这张卡吧', icon: 'none' });
      return;
    }
    const pet = petStore.getPet();
    const cardData = h5Bridge.toH5CollectibleCard(pet, card, config);
    const src = h5Bridge.buildH5Url(config.birthCardH5Url, 'card', cardData, config.birthCardApiBase);
    if (!src) {
      wx.showToast({ title: '完整卡面将在 H5 地址配置后开放', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/h5-card/h5-card?sceneCardId=${encodeURIComponent(card.id)}` });
  },
  onPreviewAllCards() { wx.navigateTo({ url: '/pages/set-card-preview/set-card-preview' }); },
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
