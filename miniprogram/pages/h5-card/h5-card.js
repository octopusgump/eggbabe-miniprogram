const config = require('../../config/v2');
const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const h5Bridge = require('../../services/birth-card-h5');

Page({
  data: { src: '', view: 'card' },

  onLoad(query) {
    this.view = query.view === 'profile' ? 'profile' : 'card';
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
    const cardData = h5Bridge.toH5Card(pet, config);
    let src = h5Bridge.buildH5Url(config.birthCardH5Url, view, cardData, config.birthCardApiBase);
    if (!src) {
      this.openNativeFallback(view);
      return;
    }
    if (forceReload) src += `${src.includes('?') ? '&' : '?'}refresh=${Date.now()}`;
    this.setData({ src, view });
    analytics.track(forceReload ? 'h5_birth_card_refreshed' : 'h5_birth_card_opened', { view });
  },

  openNativeFallback(view) {
    const destination = view === 'profile' ? '/pages/pet-detail/pet-detail?native=1' : '/pages/collection-card/collection-card?native=1';
    wx.redirectTo({ url: destination });
  },

  onMessage(event) {
    const messages = event.detail && event.detail.data;
    if (!Array.isArray(messages)) return;
    messages.slice(-5).forEach(message => {
      if (!message || !/^h5_birth_card_/.test(message.event_name || '')) return;
      analytics.track(message.event_name, { view: message.view || this.data.view, reason: message.reason || '' });
    });
  }
});
