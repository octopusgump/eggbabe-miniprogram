const petStore = require('../../utils/pet-store');
Page({
  data: { selected: '', options: ['安静陪伴你', '活泼逗你开心', '聪明帮你出主意'] },
  onSelect(e) { this.setData({ selected: e.currentTarget.dataset.value }); },
  onSubmit() {
    if (!this.data.selected) return wx.showToast({ title: '先选一个愿望吧', icon: 'none' });
    const result = petStore.completeWish(this.data.selected);
    wx.showToast({ title: result.added ? '我把愿望收好啦' : '这个愿望我还记得', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
