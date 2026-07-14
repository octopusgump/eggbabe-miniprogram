const petStore = require('../../utils/pet-store');
const exhibitionScenes = require('../../utils/exhibition-scenes');
const sceneCards = require('../../services/scene-card-store');
const analytics = require('../../services/analytics');
const runtime = require('../../services/runtime-context');
const timeService = require('../../services/time-service');
const currency = require('../../services/currency-store');

Page({
  data: { statusBarHeight: 20, pet: null, scene: null, hotspots: [], sceneDecorations: [], bubble: '', ripple: null, flowerEffect: null, butterflyEffect: null, sceneEffect: null, isActive: true, cardDrop: null, cardRevealPhase: '', cardImageFailed: false, sceneKicker: '' },

  onLoad(query) {
    this.pageActive = true;
    this.dropPending = false;
    this.dropRequestToken = 0;
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    let pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') pet = petStore.startExhibitionDemo();
    const scene = exhibitionScenes.getScene(query.scene);
    this.enteredAt = timeService.now();
    const account = currency.getAccount();
    const sceneDecorations = account.inventory.filter(item => item.equipped && item.category === 'scene-decor').map(owned => Object.assign({}, account.catalog.find(item => item.id === owned.itemId) || {}, owned));
    this.setData({ statusBarHeight: info.statusBarHeight || 20, pet, scene, hotspots: exhibitionScenes.HOTSPOTS[scene.key] || [], sceneDecorations, sceneKicker: runtime.getMode() === 'demo' ? '展会体验 · 数据独立保存' : `${pet.prototype} · 生活场景` });
    analytics.track('scene_enter', { scene_id: scene.key, character: pet.prototype, entry_type: query.entry || 'scene' });
  },

  onBack() { wx.navigateBack(); },
  onTapPet() { this.showReaction(this.data.scene.petLine, '50%', '52%'); },
  onTapHotspot(event) {
    const spot = this.data.hotspots[event.currentTarget.dataset.index];
    if (!spot) return;
    analytics.track('interaction_point_tap', { scene_id: this.data.scene.key, point_id: spot.label, character: this.data.pet.prototype });
    currency.earn('scene_interaction', 1, 5);
    this.showReaction(spot.line, spot.x, spot.y);
    if (this.data.scene.key === 'grass' && spot.label === '小花') this.showFlowerSway(spot);
    if (this.data.scene.key === 'grass' && spot.label === '蝴蝶') this.showButterflyFlight(spot);
    if (spot.effect) this.showSceneEffect(spot);
    if (this.dropPending || this.data.cardDrop) return;
    this.dropPending = true;
    const requestToken = ++this.dropRequestToken;
    sceneCards.attemptDrop(this.data.scene.key, spot.label, this.data.pet.prototype).then(drop => {
      if (requestToken !== this.dropRequestToken) return;
      this.dropPending = false;
      if (!drop.ok || !drop.dropped || !this.pageActive || !this.data.isActive) return;
      clearTimeout(this.cardRevealTimer);
      this.setData({ cardDrop: drop.card, cardRevealPhase: 'hint', cardImageFailed: false });
      this.cardRevealTimer = setTimeout(() => {
        if (this.data.cardDrop && this.pageActive && this.data.isActive) this.setData({ cardRevealPhase: 'revealed' });
      }, this.cardRevealDelay || 760);
    }, () => {
      if (requestToken === this.dropRequestToken) this.dropPending = false;
    });
  },
  onCloseCardDrop() {
    clearTimeout(this.cardRevealTimer);
    this.setData({ cardDrop: null, cardRevealPhase: '', cardImageFailed: false });
  },
  onCardImageError() { this.setData({ cardImageFailed: true }); },
  noop() {},
  onOpenFullCard() {
    const card = this.data.cardDrop;
    if (!card) return;
    clearTimeout(this.cardRevealTimer);
    this.setData({ cardDrop: null, cardRevealPhase: '', cardImageFailed: false });
    if (runtime.getMode() === 'demo') {
      wx.navigateTo({ url: `/pages/set-card-preview/set-card-preview?cardId=${encodeURIComponent(card.cardId || '')}` });
      return;
    }
    wx.navigateTo({ url: `/pages/h5-card/h5-card?sceneCardId=${encodeURIComponent(card.id)}` });
  },
  onOpenAlbum() {
    clearTimeout(this.cardRevealTimer);
    this.setData({ cardDrop: null, cardRevealPhase: '', cardImageFailed: false });
    wx.navigateTo({ url: '/pages/album/album' });
  },
  showFlowerSway(spot) {
    clearTimeout(this.flowerStartTimer); clearTimeout(this.flowerHideTimer);
    this.setData({ flowerEffect: null });
    this.flowerStartTimer = setTimeout(() => {
      this.setData({ flowerEffect: { x: spot.x, y: spot.y } });
      this.flowerHideTimer = setTimeout(() => this.setData({ flowerEffect: null }), 3050);
    }, 20);
  },
  showButterflyFlight(spot) {
    clearTimeout(this.butterflyStartTimer); clearTimeout(this.butterflyHideTimer);
    this.setData({ butterflyEffect: null });
    this.butterflyStartTimer = setTimeout(() => {
      this.setData({ butterflyEffect: { x: spot.x, y: spot.y } });
      this.butterflyHideTimer = setTimeout(() => this.setData({ butterflyEffect: null }), 3100);
    }, 20);
  },
  showSceneEffect(spot) {
    clearTimeout(this.sceneEffectStartTimer); clearTimeout(this.sceneEffectHideTimer);
    this.setData({ sceneEffect: null });
    this.sceneEffectStartTimer = setTimeout(() => {
      this.setData({ sceneEffect: { type: spot.effect, x: spot.x, y: spot.y } });
      this.sceneEffectHideTimer = setTimeout(() => this.setData({ sceneEffect: null }), 3050);
    }, 20);
  },
  showReaction(text, x, y) {
    clearTimeout(this.bubbleTimer); clearTimeout(this.rippleTimer);
    this.setData({ bubble: text, ripple: { x, y } });
    this.rippleTimer = setTimeout(() => this.setData({ ripple: null }), 700);
    this.bubbleTimer = setTimeout(() => this.setData({ bubble: '' }), 2800);
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
  },

  clearEffectTimers() {
    clearTimeout(this.bubbleTimer); clearTimeout(this.rippleTimer);
    clearTimeout(this.flowerStartTimer); clearTimeout(this.flowerHideTimer);
    clearTimeout(this.butterflyStartTimer); clearTimeout(this.butterflyHideTimer);
    clearTimeout(this.sceneEffectStartTimer); clearTimeout(this.sceneEffectHideTimer);
    clearTimeout(this.cardRevealTimer);
  },

  onShow() {
    this.pageActive = true;
    const account = currency.getAccount();
    const sceneDecorations = account.inventory.filter(item => item.equipped && item.category === 'scene-decor').map(owned => Object.assign({}, account.catalog.find(item => item.id === owned.itemId) || {}, owned));
    this.setData({ sceneDecorations });
    if (!this.data.isActive) this.setData({ isActive: true });
  },

  onHide() {
    this.pageActive = false;
    this.dropPending = false;
    this.dropRequestToken += 1;
    this.clearEffectTimers();
    this.setData({ isActive: false, bubble: '', ripple: null, flowerEffect: null, butterflyEffect: null, sceneEffect: null, cardDrop: null, cardRevealPhase: '', cardImageFailed: false });
  },

  onUnload() {
    this.pageActive = false;
    this.dropPending = false;
    this.dropRequestToken += 1;
    this.clearEffectTimers();
    analytics.track('scene_exit', { scene_id: this.data.scene ? this.data.scene.key : '', dwell_time: Math.max(0, timeService.now() - (this.enteredAt || timeService.now())) });
  }
});
