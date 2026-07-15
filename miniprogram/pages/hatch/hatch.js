const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');

Page({
  data: {
    phase: 'confirm',
    pet: null,
    particles: [
      { tx: '-140rpx', ty: '-110rpx', color: '#EDE78E' },
      { tx: '150rpx', ty: '-90rpx', color: '#F4B9AE' },
      { tx: '-170rpx', ty: '70rpx', color: '#9DB65B' },
      { tx: '160rpx', ty: '90rpx', color: '#EDE78E' },
      { tx: '0rpx', ty: '-180rpx', color: '#FFFFFF' },
      { tx: '30rpx', ty: '180rpx', color: '#F4B9AE' }
    ]
  },

  onLoad() {
    const pet = petStore.getPet();
    if (pet && pet.collectionCard) {
      wx.redirectTo({ url: '/pages/collection-card/collection-card' });
      return;
    }
    if (!pet || petStore.getStage(pet) !== 'ready') {
      wx.showToast({ title: '还没到破壳时间', icon: 'none' });
      this.backTimer = setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    this.setData({ pet });
    analytics.track('hatch_receive_start');
  },

  onReveal() {
    if (this.data.phase !== 'confirm' || !this.data.pet) return;
    this.setData({ phase: 'reveal' });
    this.revealTimer = setTimeout(() => {
      if (config.backendEnabled) {
        cloudApi.generateHatchCard().then(result => this.handleHatchResult(result));
        return;
      }
      this.handleHatchResult(petStore.createCollectionCard());
    }, 1450);
  },

  handleHatchResult(result) {
      if (!result.ok) {
        analytics.track('hatch_card_generate_fail', { error_code: result.reason || 'GENERATE_FAILED' });
        this.setData({ phase: 'confirm' });
        wx.showToast({ title: result.message, icon: 'none' });
        return;
      }
      if (config.backendEnabled) {
        const applied = petStore.applyCloudHatchCard(result.card);
        if (!applied.ok) {
          this.setData({ phase: 'confirm' });
          wx.showToast({ title: applied.message, icon: 'none' });
          return;
        }
      }
      analytics.track('hatch_card_generated', { card_id: result.card.id, style: result.card.style, rarity: result.card.collectible, mbti: result.card.mbti });
      wx.redirectTo({ url: '/pages/collection-card/collection-card?new=1' });
  },

  onUnload() {
    clearTimeout(this.backTimer);
    clearTimeout(this.revealTimer);
  }
});
