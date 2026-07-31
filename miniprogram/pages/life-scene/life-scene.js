const petStore = require('../../utils/pet-store');
const lifeScenes = require('../../utils/life-scenes');
const analytics = require('../../services/analytics');
const timeService = require('../../services/time-service');
const config = require('../../config/v2');

Page({
  data: { statusBarHeight: 20, pet: null, scene: null, hotspots: [], bubble: '', ripple: null, flowerEffect: null, butterflyEffect: null, sceneEffect: null, isActive: true, sceneKicker: '', isDemo: config.localDemoEnabled, enterFromHome: false, isExiting: false, exitTransitionStyle: '' },

  onLoad(query) {
    this.pageActive = true;
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      wx.showToast({ title: '破壳后才能进入生活场景', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 600);
      return;
    }
    const scene = lifeScenes.getScene(query.scene, pet.prototype);
    const origin = {
      left: Number(query.origin_left),
      top: Number(query.origin_top),
      width: Number(query.origin_width),
      height: Number(query.origin_height)
    };
    this.homeOrigin = Object.values(origin).every(Number.isFinite) && origin.width > 0 && origin.height > 0
      ? origin
      : null;
    this.enteredAt = timeService.now();
    this.setData({
      statusBarHeight: info.statusBarHeight || 20,
      pet,
      scene,
      hotspots: lifeScenes.HOTSPOTS[scene.key] || [],
      sceneKicker: `${pet.prototype} · 生活场景`,
      enterFromHome: query.entry === 'home-expand'
    });
    analytics.track('scene_enter', { scene_id: scene.key, character: pet.prototype, entry_type: query.entry || 'scene' });
  },

  onBack() {
    if (this.data.isExiting) return;
    const reducedMotion = (() => {
      try {
        const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
        return !!(system.reducedMotion || system.enableReduceMotion);
      } catch (error) {
        return false;
      }
    })();
    const duration = reducedMotion ? 20 : 560;
    const origin = this.homeOrigin || { left: 0, top: 0, width: '100vw', height: '100vh' };
    const size = value => typeof value === 'number' ? `${value}px` : value;
    this.setData({
      isExiting: true,
      exitTransitionStyle: [
        `--scene-origin-left:${size(origin.left)}`,
        `--scene-origin-top:${size(origin.top)}`,
        `--scene-origin-width:${size(origin.width)}`,
        `--scene-origin-height:${size(origin.height)}`,
        `--scene-exit-duration:${duration}ms`
      ].join(';')
    });
    clearTimeout(this.exitTimer);
    this.exitTimer = setTimeout(() => {
      if (this.data.enterFromHome) {
        wx.switchTab({ url: '/pages/home/home' });
        return;
      }
      wx.navigateBack();
    }, Math.max(0, duration - 20));
  },
  onTapPet() { this.showReaction(this.data.scene.petLine, '50%', '52%'); },
  onTapHotspot(event) {
    const spot = this.data.hotspots[event.currentTarget.dataset.index];
    if (!spot) return;
    this.showReaction(spot.line, spot.x, spot.y);
    if (this.data.scene.key === 'grass' && spot.label === '小花') this.showFlowerSway(spot);
    if (this.data.scene.key === 'grass' && spot.label === '蝴蝶') this.showButterflyFlight(spot);
    if (spot.effect) this.showSceneEffect(spot);
    analytics.track('companion_interaction', { interaction_type: 'scene_point', scene_id: this.data.scene.key, result: 'played' });
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
  },

  onShow() {
    this.pageActive = true;
    if (!this.data.isActive) this.setData({ isActive: true });
  },

  onHide() {
    this.pageActive = false;
    this.clearEffectTimers();
    this.setData({ isActive: false, bubble: '', ripple: null, flowerEffect: null, butterflyEffect: null, sceneEffect: null });
  },

  onUnload() {
    this.pageActive = false;
    clearTimeout(this.exitTimer);
    this.clearEffectTimers();
    analytics.track('scene_exit', { scene_id: this.data.scene ? this.data.scene.key : '', dwell_time: Math.max(0, timeService.now() - (this.enteredAt || timeService.now())) });
  }
});
