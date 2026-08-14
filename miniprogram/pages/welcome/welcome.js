const petStore = require('../../utils/pet-store');
const config = require('../../config/v2');
const runtime = require('../../services/runtime-context');
const demoExperience = require('../../services/demo-experience');
const { createInlineNoticeController } = require('../../utils/inline-notice-controller');

Page({
  data: {
    agreed: false,
    agreementError: '',
    authorizing: false,
    isDemo: config.localDemoEnabled,
    systemNoticeText: '',
    systemNoticeTone: 'info',
    systemNoticeVisible: false
  },

  onLoad() {
    this.pageActive = true;
    if (petStore.getUser()) {
      wx.switchTab({ url: '/pages/home/home' });
    }
  },

  onShow() { this.pageActive = true; },

  onToggleAgreement() {
    this.setData({ agreed: !this.data.agreed, agreementError: '' });
  },

  onPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
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

  onAuthorize() {
    if (!this.data.agreed) {
      this.setData({ agreementError: '请先阅读并同意隐私政策' });
      return;
    }
    if (this.data.authorizing) return;
    this.setData({ authorizing: true });
    if (runtime.getMode() === 'demo') {
      const result = demoExperience.bootstrap();
      this.setData({ authorizing: false });
      if (!result.ok) {
        this.showSystemNotice(result.message, 'warning');
        return;
      }
      wx.switchTab({ url: '/pages/home/home' });
      return;
    }
    if (!config.backendEnabled) {
      this.setData({ authorizing: false });
      this.showSystemNotice('账号服务尚未接入，请稍后再试', 'warning');
      return;
    }
    const user = petStore.getUser();
    this.setData({ authorizing: false });
    if (!user) {
      this.showSystemNotice('正在连接账号服务，请稍后重试', 'warning');
      return;
    }
    wx.switchTab({ url: '/pages/home/home' });
  },

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
