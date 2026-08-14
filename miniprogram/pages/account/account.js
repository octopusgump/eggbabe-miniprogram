const accountSession = require('../../services/account-session');
const runtime = require('../../services/runtime-context');
const { createInlineNoticeController } = require('../../utils/inline-notice-controller');

Page({
  data: {
    canClearLocalData: false,
    clearingLocalState: false,
    systemNoticeText: '',
    systemNoticeTone: 'info',
    systemNoticeVisible: false
  },

  onShow() {
    this.pageActive = true;
    this.setData({ canClearLocalData: runtime.getMode() === 'demo' });
  },

  showSystemNotice(text, tone) {
    if (!this.systemNoticeController) {
      this.systemNoticeController = createInlineNoticeController(this, {
        textKey: 'systemNoticeText',
        toneKey: 'systemNoticeTone',
        visibleKey: 'systemNoticeVisible',
        timerKey: 'systemNoticeTimer',
        cleanupTimerKey: 'systemNoticeCleanupTimer',
        isActive: () => this.pageActive !== false
      });
    }
    return this.systemNoticeController.show(text, tone);
  },

  clearLocalState() {
    if (this.data.clearingLocalState) return;
    this.setData({ clearingLocalState: true });
    const result = accountSession.clearLocalAccountState();
    if (!result.ok) {
      this.setData({ clearingLocalState: false });
      this.showSystemNotice(result.message, 'warning');
      return;
    }
    try {
      const app = typeof getApp === 'function' ? getApp() : null;
      if (app && app.globalData) app.globalData.dailyMoodIntroShown = false;
    } catch (error) {}
    wx.reLaunch({
      url: '/pages/welcome/welcome',
      fail: () => {
        this.setData({ clearingLocalState: false });
        this.showSystemNotice('页面暂时没有打开，请重试', 'warning');
      }
    });
  },

  onLogout() {
    if (this.data.clearingLocalState || this.logoutPromptOpen) return;
    this.logoutPromptOpen = true;
    wx.showModal({
      title: '退出登录',
      content: '退出会清除本机账号缓存，不会删除服务端的蛋宝宝数据。重新登录后会再次同步。',
      confirmColor: '#D9463C',
      success: (res) => {
        if (!res.confirm) return;
        this.clearLocalState();
      },
      complete: () => { this.logoutPromptOpen = false; }
    });
  },

  onClearLocalData() {
    if (this.data.clearingLocalState || this.clearDataPromptOpen) return;
    this.clearDataPromptOpen = true;
    wx.showModal({
      title: '清除本地数据？',
      content: '仅清除开发验收环境在这台设备上的账号、蛋宝宝、修炼记录和待同步记录，不会注销或删除正式服务端账号。清除后可重新体验绑定与孵化流程。',
      confirmText: '确认清除',
      confirmColor: '#D9463C',
      success: (res) => {
        if (!res.confirm) return;
        this.clearLocalState();
      },
      complete: () => { this.clearDataPromptOpen = false; }
    });
  },

  onDeregister() { wx.navigateTo({ url: '/pages/deregister/deregister' }); },

  onHide() {
    this.pageActive = false;
    if (this.systemNoticeController) this.systemNoticeController.destroy();
    this.setData({ systemNoticeText: '', systemNoticeVisible: false });
  },

  onUnload() {
    this.pageActive = false;
    if (this.systemNoticeController) this.systemNoticeController.destroy();
  }
});
