const compliance = require('../../services/compliance-service');
const { FEEDBACK_TYPES } = require('../../config/compliance');
const MIN_SUBMITTING_VISIBLE_MS = 600;
const TYPE_OPTIONS = Object.freeze([
  Object.freeze({ value: '', label: '请选择诉求类型' }),
  ...FEEDBACK_TYPES
]);

Page({
  data: {
    typeOptions: TYPE_OPTIONS,
    typeIndex: 0,
    type: '',
    description: '',
    consent: false,
    messageId: '',
    typePanelOpen: false,
    submitting: false,
    submitError: '',
    receiptNumber: '',
    canSubmit: false
  },

  onLoad(query) {
    const messageId = String(query && query.messageId || '');
    this.setData({
      messageId,
      typeIndex: messageId ? 1 : 0,
      type: messageId ? FEEDBACK_TYPES[0].value : '',
      typePanelOpen: false
    });
  },

  onUnload() {
    this.submissionInFlight = false;
    this.submitRequestToken = (Number(this.submitRequestToken) || 0) + 1;
    clearTimeout(this.submitDelayTimer);
    this.submitDelayTimer = null;
  },

  refreshCanSubmit(fields) {
    const next = Object.assign({}, this.data, fields || {});
    this.setData(Object.assign({}, fields || {}, {
      canSubmit: Boolean(next.type && String(next.description || '').trim() && next.consent && !next.submitting)
    }));
  },

  onToggleTypePanel() {
    if (this.data.submitting) return;
    this.setData({ typePanelOpen: !this.data.typePanelOpen, submitError: '' });
  },

  onSelectType(event) {
    if (this.data.submitting) return;
    const typeIndex = Number(event.currentTarget.dataset.index);
    const option = this.data.typeOptions[typeIndex];
    if (!option || !option.value) return;
    this.refreshCanSubmit({ typeIndex, type: option.value, typePanelOpen: false, submitError: '' });
  },

  onDescriptionInput(event) {
    this.refreshCanSubmit({ description: String(event.detail.value || ''), submitError: '' });
  },

  onToggleConsent() {
    if (this.data.submitting) return;
    this.refreshCanSubmit({ consent: !this.data.consent, submitError: '' });
  },

  onPrivacy() { wx.navigateTo({ url: '/pages/policy/policy?type=privacy' }); },

  onSubmit() {
    if (this.data.submitting || this.submissionInFlight) return;
    if (!this.data.canSubmit) {
      let submitError = '';
      if (!this.data.type) submitError = '请选择诉求类型';
      else if (!String(this.data.description || '').trim()) submitError = '请填写问题详细描述';
      else if (!this.data.consent) submitError = '请勾选同意隐私政策';
      else submitError = '请完善必填信息后提交';
      this.setData({ submitError });
      wx.showToast({ title: submitError, icon: 'none' });
      return;
    }
    const payload = {
      type: this.data.type,
      description: this.data.description.trim(),
      consent: true,
      messageId: this.data.messageId || null,
      submittedAt: new Date().toISOString()
    };
    this.submissionInFlight = true;
    this.refreshCanSubmit({ submitting: true, submitError: '' });
    const requestToken = (Number(this.submitRequestToken) || 0) + 1;
    this.submitRequestToken = requestToken;
    const minimumVisibleDelay = new Promise(resolve => {
      this.submitDelayTimer = setTimeout(() => {
        this.submitDelayTimer = null;
        resolve();
      }, MIN_SUBMITTING_VISIBLE_MS);
    });
    const submission = compliance.submitFeedback(payload)
      .catch(() => ({ ok: false, message: '提交失败，请重试' }));
    Promise.all([submission, minimumVisibleDelay]).then(([result]) => {
      if (this.submitRequestToken !== requestToken) return;
      this.submissionInFlight = false;
      if (!result || !result.ok) {
        this.refreshCanSubmit({ submitting: false, submitError: result && result.message || '提交失败，请重试' });
        return;
      }
      this.setData({
        typeIndex: 0,
        type: '',
        description: '',
        consent: false,
        typePanelOpen: false,
        submitting: false,
        submitError: '',
        receiptNumber: result.receiptNumber,
        canSubmit: false
      });
    });
  }
});

module.exports = { MIN_SUBMITTING_VISIBLE_MS };
