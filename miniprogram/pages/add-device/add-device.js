const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const runtime = require('../../services/runtime-context');
const timeService = require('../../services/time-service');
const subscriptionMessages = require('../../services/subscription-messages');

Page({
  data: { code: '', error: '', canSubmit: false, success: null, submitting: false },

  onCodeInput(e) {
    const code = e.detail.value;
    this.setData({ code, error: '', canSubmit: code.trim().length > 0 });
  },

  onValidate() {
    if (!this.data.canSubmit || this.data.submitting) return;
    this.setData({ submitting: true, error: '' });
    analytics.track('activation_submit', { code_type: 'server' });
    if (!config.backendEnabled) {
      this.handleResult({ ok: false, code: 'BACKEND_NOT_CONNECTED', message: '实体蛋绑定服务尚未接入，请稍后重试' });
      return;
    }
    const requestId = `${runtime.getSessionId()}-activation-${timeService.now()}`;
    cloudApi.call('redeemActivationCode', {
      code: this.data.code.trim(),
      request_id: requestId,
      mode: 'live'
    }).then(result => this.handleResult(result));
  },

  handleResult(result) {
    if (!result.ok) {
      analytics.track('activation_result', { success: false, fail_reason: result.reason || result.code || 'WRITE_FAILED' });
      this.setData({ error: result.message, submitting: false });
      return;
    }
    analytics.track('activation_result', { success: true, fail_reason: '' });
    if (config.backendEnabled) {
      const imported = petStore.importCloudPet(Object.assign({}, result.pet || result, {
        mode: (result.pet && result.pet.mode) || result.mode
      }), 'live');
      if (!imported.ok) {
        this.setData({ error: imported.message, submitting: false });
        return;
      }
      result.pet = imported.pet;
    }
    const prototype = result.pet ? result.pet.prototype : result.prototype;
    analytics.track('egg_bound', { prototype, code_type: 'server' });
    this.setData({ success: { prototype } });
    subscriptionMessages.requestHatchReminders();
    setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 1150);
  }
});
