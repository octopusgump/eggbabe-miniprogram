const petStore = require('../../utils/pet-store');
const releaseSurface = require('../../utils/release-surface');

Page({
  data: { card: null },

  onLoad() {
    this.accessAllowed = releaseSurface.guardDeferredContent();
  },

  onShow() {
    if (!this.accessAllowed) return;
    const pet = petStore.getPet();
    this.setData({ card: pet && pet.collectionCard ? pet.collectionCard : null });
  },

  onOpen() {
    wx.navigateTo({ url: '/pages/collection-card/collection-card' });
  }
});
