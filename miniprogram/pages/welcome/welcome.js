const petStore = require('../../utils/pet-store');
const config = require('../../config/v2');
const runtime = require('../../services/runtime-context');
const demoExperience = require('../../services/demo-experience');
Page({
  data: {
    agreed: false,
    authorizing: false,
    isDemo: config.localDemoEnabled
  },

  onLoad() {
    if (petStore.getUser()) {
      wx.switchTab({ url: '/pages/home/home' });
    }
  },

  onToggleAgreement() {
    this.setData({ agreed: !this.data.agreed });
  },

  onPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  },

  onAuthorize() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并同意隐私政策', icon: 'none' });
      return;
    }
    if (this.data.authorizing) return;
    this.setData({ authorizing: true });
    if (runtime.getMode() === 'demo') {
      const result = demoExperience.bootstrap();
      this.setData({ authorizing: false });
      if (!result.ok) {
        wx.showToast({ title: result.message, icon: 'none' });
        return;
      }
      wx.switchTab({ url: '/pages/home/home' });
      return;
    }
    if (!config.backendEnabled) {
      this.setData({ authorizing: false });
      wx.showToast({ title: '账号服务尚未接入，请稍后再试', icon: 'none' });
      return;
    }
    const user = petStore.getUser();
    this.setData({ authorizing: false });
    if (!user) {
      wx.showToast({ title: '正在连接账号服务，请稍后重试', icon: 'none' });
      return;
    }
    wx.switchTab({ url: '/pages/home/home' });
  }
});
