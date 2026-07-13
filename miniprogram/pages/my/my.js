const petStore = require('../../utils/pet-store');
const runtime = require('../../services/runtime-context');

Page({
  data: { userName: '蛋友3024', eggCount: 0, isDemo: false },

  onShow() {
    const user = petStore.getUser();
    const pet = petStore.getPet();
    this.setData({
      userName: runtime.getMode() === 'demo' ? '展会体验访客' : ((user && user.nickname) || '蛋友3024'),
      eggCount: pet ? 1 : 0,
      isDemo: runtime.getMode() === 'demo'
    });
  },

  onTapUserCard() {
    if (this.data.isDemo) return wx.showToast({ title: '展会体验不保存账户资料', icon: 'none' });
    wx.navigateTo({ url: '/pages/profile/profile' });
  },
  onNavAlbum() { wx.navigateTo({ url: '/pages/album/album' }); },
  onNavCodes() { wx.navigateTo({ url: '/pages/invite-codes/invite-codes' }); },
  onNavSettings() { wx.navigateTo({ url: '/pages/settings/settings' }); },
  onNavAccount() { wx.navigateTo({ url: '/pages/account/account' }); },
  onNavPrivacy() { wx.navigateTo({ url: '/pages/privacy/privacy' }); },
  onNavHelp() { wx.navigateTo({ url: '/pages/help/help' }); }
});
