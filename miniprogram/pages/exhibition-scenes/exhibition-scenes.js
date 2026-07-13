const petStore = require('../../utils/pet-store');
const exhibitionScenes = require('../../utils/exhibition-scenes');
const analytics = require('../../services/analytics');

Page({
  data: { pet: null, scenes: [], isDemo: false, introKicker: '', introTitle: '', introDesc: '' },

  onShow() {
    let pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') pet = petStore.startExhibitionDemo();
    const isDemo = !!pet.demoMode;
    this.setData({
      pet,
      isDemo,
      scenes: exhibitionScenes.getScenesForCharacter(pet.prototype),
      introKicker: isDemo ? 'EXHIBITION MODE' : `${pet.prototype} · SCENES`,
      introTitle: `${pet.name || pet.prototype}的生活`,
      introDesc: isDemo ? '选择一个场景，看看它破壳后会怎样陪在你身边。' : '选择一个地方，去看看它此刻正在做什么。'
    });
  },

  onSelectScene(event) {
    analytics.track('scene_switch', { from_scene: '', to_scene: event.currentTarget.dataset.scene });
    wx.navigateTo({ url: `/pages/exhibition-scene/exhibition-scene?scene=${event.currentTarget.dataset.scene}` });
  },

  onExit() {
    if (!this.data.isDemo) return wx.navigateBack();
    wx.showModal({
      title: '退出展会体验',
      content: '将恢复进入体验前的蛋宝宝数据。',
      confirmColor: '#002900',
      success: (result) => {
        if (!result.confirm) return;
        petStore.endExhibitionDemo();
        wx.switchTab({ url: '/pages/home/home' });
      }
    });
  }
});
