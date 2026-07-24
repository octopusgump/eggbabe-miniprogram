const petStore = require('../../utils/pet-store');
Page({
  data: { selected: '', options: [{ icon: '♡', value: '难过时可以慢慢呼吸' }, { icon: '✦', value: '看云的时候不用着急' }, { icon: '☺', value: '冷笑话也能让人笑一下' }] },
  onSelect(e) { this.setData({ selected: e.currentTarget.dataset.value }); },
  onSubmit() {
    if (!this.data.selected) return wx.showToast({ title: '先选一堂课吧', icon: 'none' });
    const result = petStore.completeLesson(this.data.selected);
    wx.showToast({ title: result.ok ? '我认真听完啦' : '这句话没有送达，请重试', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
