Page({
  data: {
    scrollTarget: ''
  },

  onTocTap(event) {
    const target = String(event.currentTarget.dataset.target || '');
    if (!target) return;
    this.setData({ scrollTarget: '' });
    wx.nextTick(() => this.setData({ scrollTarget: target }));
  }
});
