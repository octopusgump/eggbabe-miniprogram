const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const runtime = require('../../services/runtime-context');
const subscriptionMessages = require('../../services/subscription-messages');

Page({
  data: { code: '', error: '', canSubmit: false, success: null, submitting: false },

  onLoad() { analytics.track('add_egg_page_view'); },

  onCodeInput(e) {
    const code = e.detail.value;
    this.setData({ code, error: '', canSubmit: code.trim().length > 0 });
  },

  onValidate() {
    if (!this.data.canSubmit || this.data.submitting) return;
    this.setData({ submitting: true, error: '' });
    if (!config.backendEnabled) runtime.setMode('demo');
    analytics.track('activation_submit', { code_type: 'preview' });
    if (config.backendEnabled) {
      cloudApi.redeemActivationCode(this.data.code).then(result => this.handleResult(result));
      return;
    }
    this.handleResult(petStore.bindPet(this.data.code));
  },

  handleResult(result) {
    if (!result.ok) {
      analytics.track('activation_result', { success: false, fail_reason: result.reason || result.code || 'WRITE_FAILED' });
      this.setData({ error: result.message, submitting: false });
      return;
    }
    analytics.track('activation_result', { success: true, fail_reason: '' });
    if (!result.pet && config.backendEnabled) {
      const imported = petStore.importCloudPet(result);
      if (!imported.ok) {
        this.setData({ error: imported.message, submitting: false });
        return;
      }
      result.pet = imported.pet;
    }
    const prototype = result.pet ? result.pet.prototype : result.prototype;
    analytics.track('egg_bound', { prototype, code_type: config.backendEnabled ? 'server' : 'preview' });
    this.setData({ success: { prototype } });
    analytics.track('add_success_feedback_shown', { prototype });
    subscriptionMessages.requestHatchReminders();
    setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 1150);
  }
});
