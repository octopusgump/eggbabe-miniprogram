const petStore = require('../../utils/pet-store');
const sceneCardStore = require('../../services/scene-card-store');
const analytics = require('../../services/analytics');
const config = require('../../config/v2');
const h5Bridge = require('../../services/birth-card-h5');
Page({
  data: { card: null, sceneCards: [], setSlots: [], summary: null, shareCard: null },
  onShow() {
    const pet = petStore.getPet();
    const hasIdentityCard = !!(pet && pet.collectionCard);
    const sceneCards = hasIdentityCard ? sceneCardStore.list().filter(card => card.character === pet.prototype) : [];
    const summary = hasIdentityCard ? sceneCardStore.collectionSummary(pet.prototype) : null;
    this.setData({
      card: hasIdentityCard ? pet.collectionCard : null,
      sceneCards,
      setSlots: summary ? summary.slots : [],
      summary
    });
    analytics.track('card_album_view', { collection_view: 'unified' });
    analytics.track('album_view', { collection_view: 'unified' });
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
  onOpenSetCard(event) {
    const card = this.data.sceneCards.find(item => item.id === event.currentTarget.dataset.id);
    if (!card) {
      wx.showToast({ title: '先去蛋宝宝的世界里遇见它吧', icon: 'none' });
      return;
    }
    const pet = petStore.getPet();
    const cardData = h5Bridge.toH5CollectibleCard(pet, card, config);
    const src = h5Bridge.buildH5Url(config.birthCardH5Url, 'card', cardData, config.birthCardApiBase);
    if (!src) {
      wx.navigateTo({ url: `/pages/collection-card/collection-card?sceneCardId=${encodeURIComponent(card.id)}&native=1` });
      return;
    }
    wx.navigateTo({ url: `/pages/h5-card/h5-card?sceneCardId=${encodeURIComponent(card.id)}` });
  },
  onEcommerce() {
    const channels = [
      { label: '复制淘宝口令 / 链接', value: config.ecommerce.taobaoCopyText, entry: 'copy_taobao' },
      { label: '复制小红书店铺信息', value: config.ecommerce.xiaohongshuCopyText, entry: 'copy_xiaohongshu' }
    ].filter(channel => channel.value);
    if (!channels.length) {
      wx.showModal({ title: '已解锁站外购买资格', content: '店铺信息将在运营确认后开放。小程序内不进行支付。', showCancel: false, confirmText: '知道了', confirmColor: '#3F5A47' });
      return;
    }
    wx.showActionSheet({
      itemList: channels.map(channel => channel.label),
      success: result => {
        const channel = channels[result.tapIndex];
        if (!channel) return;
        analytics.track('ecommerce_cta_click', { unlock_sku: 'scene-set-access', entry: channel.entry });
        wx.setClipboardData({ data: channel.value });
      }
    });
  },
  onShareAppMessage() {
    const card = this.data.shareCard;
    return { title: card ? `我遇见了「${card.name}」收藏卡` : '我的 eggbabe 收藏卡', path: '/pages/welcome/welcome' };
  },
  onOpen() { wx.navigateTo({ url: '/pages/collection-card/collection-card' }); }
});
