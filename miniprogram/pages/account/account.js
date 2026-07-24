const petStore = require('../../utils/pet-store');
const syncQueue = require('../../services/sync-queue');
const analytics = require('../../services/analytics');

Page({
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出会清除本机账号缓存，不会删除服务端的蛋宝宝数据。重新登录后会再次同步。',
      confirmColor: '#D9463C',
      success: (res) => {
        if (!res.confirm) return;
        syncQueue.clear();
        analytics.clearQueue();
        petStore.clearUser();
        wx.reLaunch({ url: '/pages/welcome/welcome' });
      }
    });
  },
  onDeregister() { wx.navigateTo({ url: '/pages/deregister/deregister' }); }
});
