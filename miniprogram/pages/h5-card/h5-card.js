const config = require('../../config/v2');
const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const h5Bridge = require('../../services/birth-card-h5');
const sceneCardStore = require('../../services/scene-card-store');

Page({
  data: { src: '', view: 'card', savingPoster: false },

  onLoad(query) {
    this.view = query.view === 'profile' ? 'profile' : 'card';
    this.sceneCardId = String(query.sceneCardId || '');
    this.initialShowPending = true;
    this.refreshSource(false);
  },

  onShow() {
    if (this.initialShowPending) {
      this.initialShowPending = false;
      return;
    }
    this.refreshSource(true);
  },

  refreshSource(forceReload) {
    const view = this.view || 'card';
    const pet = petStore.getPet();
    const sceneCard = this.sceneCardId ? sceneCardStore.list().find(card => card.id === this.sceneCardId) : null;
    const cardData = sceneCard ? h5Bridge.toH5CollectibleCard(pet, sceneCard, config) : h5Bridge.toH5Card(pet, config);
    let src = h5Bridge.buildH5Url(config.birthCardH5Url, view, cardData, config.birthCardApiBase);
    if (!src) {
      this.openNativeFallback(view, Boolean(this.sceneCardId));
      return;
    }
    if (forceReload) src += `${src.includes('?') ? '&' : '?'}refresh=${Date.now()}`;
    this.setData({ src, view });
    analytics.track(forceReload ? 'h5_birth_card_refreshed' : 'h5_birth_card_opened', { view, card_type: sceneCard ? 'collectible' : 'birth' });
  },

  openNativeFallback(view, isSetCard) {
    const destination = isSetCard
      ? `/pages/collection-card/collection-card?sceneCardId=${encodeURIComponent(this.sceneCardId)}&native=1`
      : (view === 'profile' ? '/pages/pet-detail/pet-detail?native=1' : '/pages/collection-card/collection-card?native=1');
    wx.redirectTo({ url: destination });
  },

  onMessage(event) {
    const messages = event.detail && event.detail.data;
    if (!Array.isArray(messages)) return;
    messages.slice(-5).forEach(message => {
      if (!message || !/^h5_birth_card_/.test(message.event_name || '')) return;
      if (message.event_name === 'h5_birth_card_save_poster') {
        this.savePoster(message.data_url);
        return;
      }
      analytics.track(message.event_name, { view: message.view || this.data.view, reason: message.reason || '' });
    });
  },

  savePoster(dataUrl) {
    if (this.data.savingPoster) return;
    const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
    if (!match || !wx.getFileSystemManager || !wx.env || !wx.env.USER_DATA_PATH) {
      wx.showToast({ title: '分享图数据无效，请重试', icon: 'none' });
      return;
    }
    this.setData({ savingPoster: true });
    const filePath = `${wx.env.USER_DATA_PATH}/eggbabe-collection-card.png`;
    wx.getFileSystemManager().writeFile({
      filePath,
      data: match[1],
      encoding: 'base64',
      success: () => wx.saveImageToPhotosAlbum({
        filePath,
        success: () => {
          analytics.track('card_saved', { source: 'h5_bridge' });
          wx.showToast({ title: '收藏卡已保存', icon: 'success' });
        },
        fail: () => wx.showToast({ title: '请允许保存到相册', icon: 'none' }),
        complete: () => this.setData({ savingPoster: false })
      }),
      fail: () => {
        this.setData({ savingPoster: false });
        wx.showToast({ title: '分享图保存失败，请重试', icon: 'none' });
      }
    });
  }
});
