const petStore = require('../../utils/pet-store');

Page({
  data: { userName: '微信用户', eggCount: 0 },

  onShow() {
    if (this.getTabBar && this.getTabBar()) this.getTabBar().setData({ selected: 1, hidden: true });
    const user = petStore.getUser();
    const pet = petStore.getPet();
    this.setData({
      userName: (user && user.nickname) || '微信用户',
      eggCount: pet ? 1 : 0
    });
  },

  onTapUserCard() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },
  onNavCodes() { wx.navigateTo({ url: '/pages/invite-codes/invite-codes' }); },
  onNavSettings() { wx.navigateTo({ url: '/pages/settings/settings' }); },
  onNavChatRecords() { wx.navigateTo({ url: '/pages/chat-records/chat-records' }); },
  onNavHelp() { wx.navigateTo({ url: '/pages/help/help' }); }
});
