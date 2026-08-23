const chatRecords = require('../../services/chat-records');
const { createInlineNoticeController } = require('../../utils/inline-notice-controller');

Page({
  data: {
    email: '',
    emailError: '',
    exporting: false,
    deleting: false,
    exportError: '',
    deleteError: '',
    systemNoticeText: '',
    systemNoticeTone: 'info',
    systemNoticeVisible: false
  },

  onLoad() { this.pageActive = true; },
  onShow() { this.pageActive = true; },

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

  onEmailInput(event) {
    this.setData({ email: String(event.detail.value || ''), emailError: '', exportError: '' });
  },

  onExport() {
    if (this.data.exporting || this.data.deleting || this.exportRequestActive) return;
    const email = chatRecords.normalizeEmail(this.data.email);
    if (!chatRecords.validateEmail(email)) {
      this.setData({ email, emailError: '请输入有效的邮箱地址', exportError: '' });
      return;
    }
    this.exportRequestActive = true;
    this.setData({ email, emailError: '', exportError: '', exporting: true });
    chatRecords.requestExport(email).then(result => {
      this.exportRequestActive = false;
      if (!result || !result.ok) {
        this.setData({ exporting: false, exportError: result && result.message || '导出失败，请重试' });
        return;
      }
      this.setData({ exporting: false, exportError: '' });
      this.showSystemNotice('导出申请已提交，请留意邮箱', 'info');
    }).catch(() => {
      this.exportRequestActive = false;
      this.setData({ exporting: false, exportError: '导出失败，请重试' });
    });
  },

  onDelete() {
    if (this.data.exporting || this.data.deleting || this.deletePromptOpen || this.deleteRequestActive) return;
    this.deletePromptOpen = true;
    wx.showModal({
      title: '删除全部聊天记录？',
      content: '将删除当前账号下全部蛋宝宝的聊天记录，删除后无法恢复。建议先导出备份。',
      confirmText: '确认删除',
      confirmColor: '#D9463C',
      success: result => { if (result.confirm) this.performDelete(); },
      complete: () => { this.deletePromptOpen = false; }
    });
  },

  performDelete() {
    if (this.deleteRequestActive || this.data.deleting) return;
    this.deleteRequestActive = true;
    this.setData({ deleting: true, deleteError: '' });
    chatRecords.deleteAll().then(result => {
      this.deleteRequestActive = false;
      if (!result || !result.ok) {
        this.setData({ deleting: false, deleteError: result && result.message || '删除失败，请重试' });
        return;
      }
      this.setData({ deleting: false, deleteError: '' });
      this.showSystemNotice('全部聊天记录已删除', 'info');
    }).catch(() => {
      this.deleteRequestActive = false;
      this.setData({ deleting: false, deleteError: '删除失败，请重试' });
    });
  },

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
    this.exportRequestActive = false;
    this.deleteRequestActive = false;
    this.clearSystemNotice();
  }
});
