const petStore = require('../../utils/pet-store');
const syncQueue = require('../../services/sync-queue');
const analytics = require('../../services/analytics');
const runtime = require('../../services/runtime-context');

Page({
  data: {
    canClearLocalData: false
  },

  onShow() {
    this.setData({ canClearLocalData: runtime.getMode() === 'demo' });
  },

  clearLocalState() {
    syncQueue.clear();
    analytics.clearQueue();
    petStore.clearUser();
    wx.reLaunch({ url: '/pages/welcome/welcome' });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出会清除本机账号缓存，不会删除服务端的蛋宝宝数据。重新登录后会再次同步。',
      confirmColor: '#D9463C',
      success: (res) => {
        if (!res.confirm) return;
        this.clearLocalState();
      }
    });
  },

  onClearLocalData() {
    wx.showModal({
      title: '清除本地数据？',
      content: '仅清除开发验收环境在这台设备上的账号、蛋宝宝、修炼记录和待同步记录，不会注销或删除正式服务端账号。清除后可重新体验绑定与孵化流程。',
      confirmText: '确认清除',
      confirmColor: '#D9463C',
      success: (res) => {
        if (!res.confirm) return;
        this.clearLocalState();
      }
    });
  },

  onDeregister() { wx.navigateTo({ url: '/pages/deregister/deregister' }); }
});
