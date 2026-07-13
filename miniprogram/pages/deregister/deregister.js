const DEREGISTER_KEY = 'eggbaby_deregister_request_v1';
const safeStorage = require('../../services/safe-storage');
const timeService = require('../../services/time-service');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');

Page({
  data: { pending: false, endDate: '' },

  onShow() {
    if (config.cloudEnabled) {
      cloudApi.manageDeletion('query').then(result => {
        if (result.ok && result.request) {
          safeStorage.set(DEREGISTER_KEY, result.request, 'account_delete_query');
          this.showRequest(result.request);
        } else if (result.ok) this.setData({ pending: false, endDate: '' });
      });
    }
    const request = safeStorage.get(DEREGISTER_KEY, null);
    if (!request) return this.setData({ pending: false, endDate: '' });
    this.showRequest(request);
  },

  showRequest(request) {
    const end = new Date(request.endAt);
    this.setData({
      pending: true,
      endDate: `${end.getFullYear()}年${end.getMonth() + 1}月${end.getDate()}日`
    });
  },

  onConfirmDeregister() {
    if (this.data.pending) {
      wx.showToast({ title: '注销申请已提交，可取消注销', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '再次确认',
      content: '提交后进入 15 天冷静期，数据不会立即删除。确定继续吗？',
      confirmColor: '#D9463C',
      success: (res) => {
        if (!res.confirm) return;
        if (config.cloudEnabled) {
          cloudApi.manageDeletion('request').then(result => {
            if (!result.ok) return wx.showToast({ title: result.message || '提交失败，请重试', icon: 'none' });
            const saved = safeStorage.set(DEREGISTER_KEY, result.request, 'account_delete_request');
            if (!saved.ok) return wx.showToast({ title: saved.message, icon: 'none' });
            analytics.track('account_delete_request'); this.onShow(); wx.showToast({ title: '注销申请已提交', icon: 'success' });
          });
          return;
        }
        const submittedAt = timeService.now();
        const saved = safeStorage.set(DEREGISTER_KEY, { submittedAt, endAt: submittedAt + 15 * 24 * 60 * 60 * 1000 }, 'account_delete_request');
        if (!saved.ok) return wx.showToast({ title: saved.message, icon: 'none' });
        analytics.track('account_delete_request');
        this.onShow();
        wx.showToast({ title: '注销申请已提交', icon: 'success' });
      }
    });
  },

  onCancelDeregister() {
    wx.showModal({
      title: '取消注销',
      content: '取消后账号会恢复正常，可以继续使用蛋宝宝、卡册和对话。',
      success: (res) => {
        if (!res.confirm) return;
        if (config.cloudEnabled) {
          cloudApi.manageDeletion('cancel').then(result => {
            if (!result.ok) return wx.showToast({ title: result.message || '取消失败，请重试', icon: 'none' });
            safeStorage.remove(DEREGISTER_KEY, 'account_delete_cancel'); analytics.track('account_delete_cancel'); this.onShow(); wx.showToast({ title: '已取消注销', icon: 'success' });
          });
          return;
        }
        const removed = safeStorage.remove(DEREGISTER_KEY, 'account_delete_cancel');
        if (!removed.ok) return wx.showToast({ title: removed.message, icon: 'none' });
        analytics.track('account_delete_cancel');
        this.onShow();
        wx.showToast({ title: '已取消注销', icon: 'success' });
      }
    });
  },

  onBackAccount() { wx.navigateBack(); },
  onCancel() { wx.navigateBack(); }
});
