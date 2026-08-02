const config = require('../config/v2');
const runtime = require('./runtime-context');
let requestSequence = 0;

function call(name, data) {
  if (runtime.getMode() !== 'live') return Promise.resolve({ ok: false, code: 'LIVE_MODE_REQUIRED', message: '开发验收数据不访问正式服务' });
  if (!config.backendEnabled) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONNECTED', message: '正式数据服务尚未接入' });
  if (!config.apiBase || typeof wx === 'undefined' || !wx.request) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONFIGURED', message: '正式数据服务尚未配置' });
  return new Promise(resolve => {
    const payload = Object.assign({}, data || {}, {
      mode: 'live',
      request_id: (data && data.request_id) || `${runtime.getSessionId()}-${name}-${requestSequence += 1}`
    });
    wx.request({
      url: `${String(config.apiBase).replace(/\/$/, '')}/${name}`,
      method: 'POST',
      data: payload,
      success: response => {
        const result = response.data || { ok: false, code: 'EMPTY_RESPONSE', message: '数据服务未返回结果' };
        if (result.ok && result.mode !== 'live') {
          resolve({ ok: false, code: 'RESPONSE_MODE_INVALID', message: '数据服务环境标识无效' });
          return;
        }
        resolve(result);
      },
      fail: error => resolve({ ok: false, code: 'NETWORK_ERROR', message: '网络异常，请稍后重试', detail: error && error.errMsg })
    });
  });
}

function redeemActivationCode(code) { return call('redeemActivationCode', { code }); }
function bootstrap(loginCode) { return call('bootstrap', { login_code: loginCode, mode: 'live' }); }
function generateHatchCard() { return call('generateHatchCard'); }
function updateProfile(profile) { return call('updateProfile', { profile }); }
function updateEggName(eggId, displayName) {
  return call('updateEggName', { egg_id: eggId, display_name: displayName, mode: 'live' });
}
function saveEggCreation(eggId, creation) {
  return call('saveEggCreation', { egg_id: eggId, creation, mode: 'live' });
}
function chatReply(payload) { return call('chatReply', payload); }
function recordCompanionInteraction(interactionType, payload) {
  return call('recordCompanionInteraction', { interactionType, payload: payload || {} });
}
function getIncubationPractice(eggId, module) {
  return call('getIncubationPractice', { egg_id: eggId, module });
}
function getIncubationManual(eggId) {
  return call('getIncubationManual', { egg_id: eggId });
}
function submitIncubationAction(eggId, module, questionId, optionId, payload) {
  return call('submitIncubationAction', Object.assign({
    egg_id: eggId,
    module,
    question_id: questionId || '',
    option_id: optionId || ''
  }, payload || {}));
}
function recordRoomElementInteraction(elementId, result) {
  return call('recordRoomElementInteraction', { element_id: elementId, result });
}
function getPostHatchHome(eggId) {
  return call('getPostHatchHome', { egg_id: eggId });
}
function performPostHatchAction(eggId, slotIndex, actionId) {
  return call('performPostHatchAction', { egg_id: eggId, slot_index: slotIndex, action_id: actionId });
}
function sendPostHatchLetter(eggId, slotIndex, message) {
  return call('sendPostHatchLetter', { egg_id: eggId, slot_index: slotIndex, message });
}
function getPostHatchMemories(eggId) {
  return call('getPostHatchMemories', { egg_id: eggId });
}
function manageDeletion(action) { return call('manageDeletion', { action }); }
function trackEvents(events) { return call('trackEvents', { events }); }
function serverTime() { return call('serverTime'); }
function uploadAvatar(localPath) {
  if (runtime.getMode() !== 'live') return Promise.resolve({ ok: false, code: 'LIVE_MODE_REQUIRED', message: '开发验收头像不上传正式服务' });
  if (!config.backendEnabled) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONNECTED', message: '正式头像服务尚未接入' });
  if (!config.apiBase || typeof wx === 'undefined' || !wx.uploadFile) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONFIGURED', message: '正式头像服务尚未配置' });
  return new Promise(resolve => {
    wx.uploadFile({
      url: `${String(config.apiBase).replace(/\/$/, '')}/uploadAvatar`,
      filePath: localPath,
      name: 'avatar',
      formData: {
        mode: 'live',
        request_id: `${runtime.getSessionId()}-uploadAvatar-${requestSequence += 1}`
      },
      success: response => {
        let payload = response.data;
        try { if (typeof payload === 'string') payload = JSON.parse(payload); }
        catch (error) { return resolve({ ok: false, code: 'INVALID_RESPONSE', message: '头像服务返回格式不正确' }); }
        if (response.statusCode < 200 || response.statusCode >= 300 || !payload || payload.mode !== 'live') return resolve({ ok: false, code: 'UPLOAD_FAILED', message: (payload && payload.message) || '头像上传失败，请重试' });
        const avatarUrl = payload.avatarUrl || payload.avatar_url || payload.url || '';
        if (!avatarUrl) return resolve({ ok: false, code: 'MISSING_AVATAR_URL', message: '头像服务未返回可用地址' });
        resolve(Object.assign({}, payload, { ok: payload.ok !== false, avatarUrl }));
      },
      fail: error => resolve({ ok: false, code: 'NETWORK_ERROR', message: '网络异常，请稍后重试', detail: error && error.errMsg })
    });
  });
}

module.exports = {
  call,
  bootstrap,
  redeemActivationCode,
  generateHatchCard,
  updateProfile,
  updateEggName,
  saveEggCreation,
  chatReply,
  recordCompanionInteraction,
  getIncubationPractice,
  getIncubationManual,
  submitIncubationAction,
  recordRoomElementInteraction,
  getPostHatchHome,
  performPostHatchAction,
  sendPostHatchLetter,
  getPostHatchMemories,
  manageDeletion,
  trackEvents,
  serverTime,
  uploadAvatar
};
