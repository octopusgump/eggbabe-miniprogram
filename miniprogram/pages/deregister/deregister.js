const DEREGISTER_KEY = 'eggbabe_deregister_request_v1';
const safeStorage = require('../../services/safe-storage');
const timeService = require('../../services/time-service');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const petStore = require('../../utils/pet-store');
const { createInlineNoticeController } = require('../../utils/inline-notice-controller');

function deregisterKey() {
  const user = petStore.getUser();
  return `${DEREGISTER_KEY}_${user ? user.id : 'signed-out'}`;
}

Page({
  data: {
    pending: false,
    endDate: '',
    systemNoticeText: '',
    systemNoticeTone: 'info',
    systemNoticeVisible: false
  },

  onLoad() { this.pageActive = true; },

  onShow() {
    this.pageActive = true;
    if (config.backendEnabled) {
      cloudApi.manageDeletion('query').then(result => {
        if (result.ok && result.mode === 'live' && result.request) {
          const request = Object.assign({}, result.request, { mode: 'live' });
          safeStorage.set(deregisterKey(), request, 'account_delete_query');
          this.showRequest(request);
        } else if (result.ok && result.mode === 'live') this.setData({ pending: false, endDate: '' });
      });
    }
    const request = safeStorage.get(deregisterKey(), null);
    if (!request) return this.setData({ pending: false, endDate: '' });
    this.showRequest(request);
  },

  showRequest(request) {
    if (!request || request.mode !== 'live') return this.setData({ pending: false, endDate: '' });
    this.setData({
      pending: true,
      endDate: timeService.formatBeijingDate(request.endAt)
    });
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

  onConfirmDeregister() {
    if (this.data.pending) return;
    wx.showModal({
      title: '再次确认',
      content: '提交后进入 15 天冷静期，数据不会立即删除。确定继续吗？',
      confirmColor: '#D9463C',
      success: (res) => {
        if (!res.confirm) return;
        if (!config.backendEnabled) {
          this.showSystemNotice('账户服务尚未接入，请稍后再试', 'warning');
          return;
        }
        cloudApi.manageDeletion('request').then(result => {
          if (!result.ok || result.mode !== 'live' || !result.request) {
            this.showSystemNotice(result.message || '提交失败，请重试', 'warning');
            return;
          }
          const request = Object.assign({}, result.request, { mode: 'live' });
          const saved = safeStorage.set(deregisterKey(), request, 'account_delete_request');
          if (!saved.ok) {
            this.showSystemNotice(saved.message, 'warning');
            return;
          }
          analytics.track('account_delete_request');
          this.showRequest(request);
        }).catch(() => this.showSystemNotice('提交失败，请重试', 'warning'));
      }
    });
  },

  onCancelDeregister() {
    wx.showModal({
      title: '取消注销',
      content: '取消后账号会恢复正常，可以继续使用蛋宝宝、收藏卡和对话。',
      success: (res) => {
        if (!res.confirm) return;
        if (!config.backendEnabled) {
          this.showSystemNotice('账户服务尚未接入，请稍后再试', 'warning');
          return;
        }
        cloudApi.manageDeletion('cancel').then(result => {
          if (!result.ok || result.mode !== 'live') {
            this.showSystemNotice(result.message || '取消失败，请重试', 'warning');
            return;
          }
          safeStorage.remove(deregisterKey(), 'account_delete_cancel');
          analytics.track('account_delete_cancel');
          this.setData({ pending: false, endDate: '' });
          this.showSystemNotice('已取消注销', 'info');
        }).catch(() => this.showSystemNotice('取消失败，请重试', 'warning'));
      }
    });
  },

  onBackAccount() { wx.navigateBack(); },
  onCancel() { wx.navigateBack(); },

  clearSystemNotice() {
    if (this.systemNoticeController) this.systemNoticeController.destroy();
    this.setData({ systemNoticeText: '', systemNoticeVisible: false });
  },

  onHide() {
    this.pageActive = false;
    this.clearSystemNotice();
  },

  onUnload() {
    this.pageActive = false;
    this.clearSystemNotice();
  }
});
