const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const config = require('../../config/v2');
const h5Bridge = require('../../services/birth-card-h5');

Page({
  data: { pet: null, card: null, dailyStatus: null, redirectingToH5: false },

  onLoad(query) {
    if (query.native !== '1' && h5Bridge.isValidH5BaseUrl(config.birthCardH5Url)) {
      this.setData({ redirectingToH5: true });
      wx.redirectTo({ url: '/pages/h5-card/h5-card?view=profile' });
    }
  },

  onShow() {
    if (this.data.redirectingToH5) return;
    const pet = petStore.getPet();
    if (!pet || !pet.collectionCard) {
      wx.showToast({ title: '破壳后才会生成档案', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const card = pet.collectionCard;
    const dailyStatus = petStore.getDailyStatus();
    this.setData({
      pet,
      card,
      dailyStatus
    });
    if (dailyStatus) analytics.track('daily_status_viewed', { where: 'profile', mood_type: dailyStatus.mood });
  },

  onChat() { wx.navigateTo({ url: '/pages/chat/chat' }); },
  onCard() { wx.navigateTo({ url: '/pages/collection-card/collection-card' }); }
});
