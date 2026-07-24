const petStore = require('../../utils/pet-store');
Page({
  data: { selected: '', options: ['希望今天慢一点', '希望窗外有好天气', '希望我们都好好休息'] },
  onSelect(e) { this.setData({ selected: e.currentTarget.dataset.value }); },
  onSubmit() {
    if (!this.data.selected) return wx.showToast({ title: '先选一个愿望吧', icon: 'none' });
    const result = petStore.completeWish(this.data.selected);
    wx.showToast({ title: result.ok ? '我把愿望听进心里啦' : '这句话没有送达，请重试', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
