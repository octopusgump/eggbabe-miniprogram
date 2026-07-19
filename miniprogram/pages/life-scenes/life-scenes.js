const petStore = require('../../utils/pet-store');
const lifeScenes = require('../../utils/life-scenes');
const analytics = require('../../services/analytics');

Page({
  data: { pet: null, scenes: [], introImage: '', introKicker: '', introTitle: '', introDesc: '' },

  onShow() {
    const pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      wx.showToast({ title: '破壳后才能进入生活场景', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 600);
      return;
    }
    const scenes = lifeScenes.getScenesForCharacter(pet.prototype);
    this.setData({
      pet,
      scenes,
      introImage: scenes[0] ? scenes[0].image : '',
      introKicker: `${pet.prototype} · SCENES`,
      introTitle: `${pet.name || pet.prototype}的生活`,
      introDesc: '选择一个地方，来看看我此刻正在做什么。'
    });
  },

  onSelectScene(event) {
    analytics.track('scene_switch', { from_scene: '', to_scene: event.currentTarget.dataset.scene });
    wx.navigateTo({ url: `/pages/life-scene/life-scene?scene=${event.currentTarget.dataset.scene}` });
  }
});
