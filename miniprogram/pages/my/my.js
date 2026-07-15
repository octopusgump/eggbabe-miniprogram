const petStore = require('../../utils/pet-store');

Page({
  data: { userName: '蛋友3024', eggCount: 0 },

  onShow() {
    const user = petStore.getUser();
    const pet = petStore.getPet();
    this.setData({
      userName: (user && user.nickname) || '蛋友3024',
      eggCount: pet ? 1 : 0
    });
  },

  onTapUserCard() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },
  onNavAlbum() { wx.navigateTo({ url: '/pages/album/album' }); },
  onNavCodes() { wx.navigateTo({ url: '/pages/invite-codes/invite-codes' }); },
  onNavSettings() { wx.navigateTo({ url: '/pages/settings/settings' }); },
  onNavAccount() { wx.navigateTo({ url: '/pages/account/account' }); },
  onNavPrivacy() { wx.navigateTo({ url: '/pages/privacy/privacy' }); },
  onNavHelp() { wx.navigateTo({ url: '/pages/help/help' }); }
});
