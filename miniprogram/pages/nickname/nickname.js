const petStore = require('../../utils/pet-store');
const config = require('../../config/v2');
const runtime = require('../../services/runtime-context');
const syncQueue = require('../../services/sync-queue');

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
    const result = petStore.updateNickname(this.data.name);
    if (!result.ok) return this.setData({ error: result.message });
    if (config.backendEnabled && runtime.getMode() === 'live' && result.pet.collectionCard) {
      this.setData({ saving: true, error: '' });
      const synced = await syncQueue.flush();
      if (!synced.ok) {
        this.setData({ saving: false, error: '名字已保存在本机，但云端还没同步成功。请检查网络后再试。' });
        return;
      }
    }
    wx.showToast({ title: result.added ? '我记住自己的名字啦' : '我记住新名字啦', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
