const petStore = require('../../utils/pet-store');
const config = require('../../config/v2');
const cloudApi = require('../../services/cloud-api');
const analytics = require('../../services/analytics');

Page({
  data: { name: '', count: 0, error: '', saving: false },
  onLoad() {
    const pet = petStore.getPet();
    const name = pet ? pet.name : '';
    this.setData({ name, count: Array.from(name).length });
  },
  onInput(e) {
    const name = e.detail.value;
    this.setData({ name, count: Array.from(name).length, error: '' });
  },
  async onSave() {
    if (this.data.saving) return;
    const validation = petStore.validateNickname(this.data.name);
    if (!validation.ok) return this.setData({ error: validation.message });
    if (!config.backendEnabled) return this.setData({ error: '账号资料服务尚未接入，请稍后再试' });
    this.setData({ saving: true, error: '' });
    const response = await cloudApi.updateEggName((petStore.getPet() || {}).id, validation.value);
    if (!response.ok || response.mode !== 'live') {
      this.setData({ saving: false, error: response.message || '名字没有保存成功，请重试' });
      return;
    }
    const result = petStore.applyConfirmedNickname(response.display_name || validation.value);
    if (!result.ok) {
      this.setData({ saving: false, error: result.message || '名字没有保存成功，请重试' });
      return;
    }
    analytics.track('companion_interaction', { interaction_type: 'nickname', result: 'saved' });
    wx.showToast({ title: '我记住新名字啦', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
