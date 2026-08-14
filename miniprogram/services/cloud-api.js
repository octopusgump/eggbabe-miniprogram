const config = require('../config/v2');
const runtime = require('./runtime-context');
let requestSequence = 0;

function errorResult(code, message, detail) {
  return { ok: false, code, message, detail };
}

function normalizeResponse(payload) {
  const source = payload && typeof payload === 'object' ? payload : null;
  if (!source) return errorResult('EMPTY_RESPONSE', '数据服务未返回结果');
  if (typeof source.success === 'boolean') {
    if (!source.success) {
      const error = source.error && typeof source.error === 'object' ? source.error : {};
      const data = source.data && typeof source.data === 'object' ? source.data : {};
      return Object.assign(
        errorResult(String(error.code || 'SERVICE_ERROR'), String(error.message || '数据服务暂时不可用'), error.detail),
        {
          resultType: String(data.result_type || data.resultType || ''),
          requestId: String(source.request_id || data.request_id || '')
        }
      );
    }
    const data = source.data && typeof source.data === 'object' ? source.data : {};
    const serverTime = source.server_time || data.server_time || data.serverTs;
    const parsedServerTime = typeof serverTime === 'number' ? serverTime : Date.parse(serverTime || '');
    return Object.assign({}, data, {
      ok: true,
      mode: data.mode || 'live',
      request_id: source.request_id || data.request_id || '',
      serverTs: Number.isFinite(parsedServerTime) ? parsedServerTime : data.serverTs
    });
  }
  return source;
}

function call(name, data, options) {
  if (runtime.getMode() !== 'live') return Promise.resolve({ ok: false, code: 'LIVE_MODE_REQUIRED', message: '开发验收数据不访问正式服务' });
  if (!config.backendEnabled) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONNECTED', message: '正式数据服务尚未接入' });
  if (!config.apiBase || typeof wx === 'undefined' || !wx.request) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONFIGURED', message: '正式数据服务尚未配置' });
  let requestTask = null;
  const promise = new Promise(resolve => {
    const payload = Object.assign({}, data || {}, {
      mode: 'live',
      client_version: config.version,
      session_id: runtime.getSessionId(),
      request_id: (data && data.request_id) || `${runtime.getSessionId()}-${name}-${requestSequence += 1}`
    });
    requestTask = wx.request({
      url: `${String(config.apiBase).replace(/\/$/, '')}/${name}`,
      method: 'POST',
      timeout: Number(options && options.timeoutMs || config.requestTimeoutMs || 15000),
      header: { 'content-type': 'application/json' },
      data: payload,
      success: response => {
        const statusCode = Number(response && response.statusCode || 0);
        if (statusCode < 200 || statusCode >= 300) {
          resolve(errorResult(`HTTP_${statusCode || 'ERROR'}`, '数据服务暂时不可用', response && response.data));
          return;
        }
        const result = normalizeResponse(response.data);
        if (result.ok && result.mode !== 'live') {
          resolve({ ok: false, code: 'RESPONSE_MODE_INVALID', message: '数据服务环境标识无效' });
          return;
        }
        resolve(result);
      },
      fail: error => {
        const detail = error && error.errMsg;
        const timedOut = /timeout/i.test(String(detail || ''));
        resolve(errorResult(timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR', timedOut ? '请求超时，请稍后重试' : '网络异常，请稍后重试', detail));
      }
    });
  });
  promise.abort = () => {
    if (requestTask && requestTask.abort) requestTask.abort();
  };
  return promise;
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
function chatReply(payload) { return call('chatReply', payload, { timeoutMs: config.chatRequestTimeoutMs }); }
function getChatHistory(eggId, cursor, limit) {
  return call('getChatHistory', { egg_id: eggId, cursor: cursor || '', limit: Number(limit) || 20 });
}
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
function performPostHatchAction(eggId, slotIndex, actionId, requestId) {
  return call('performPostHatchAction', { egg_id: eggId, slot_index: slotIndex, action_id: actionId, request_id: requestId });
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
      timeout: Number(config.requestTimeoutMs || 15000),
      formData: {
        mode: 'live',
        client_version: config.version,
        session_id: runtime.getSessionId(),
        request_id: `${runtime.getSessionId()}-uploadAvatar-${requestSequence += 1}`
      },
      success: response => {
        let payload = response.data;
        try { if (typeof payload === 'string') payload = JSON.parse(payload); }
        catch (error) { return resolve({ ok: false, code: 'INVALID_RESPONSE', message: '头像服务返回格式不正确' }); }
        payload = normalizeResponse(payload);
        if (response.statusCode < 200 || response.statusCode >= 300 || !payload || !payload.ok || payload.mode !== 'live') return resolve({ ok: false, code: 'UPLOAD_FAILED', message: (payload && payload.message) || '头像上传失败，请重试' });
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
  normalizeResponse,
  bootstrap,
  redeemActivationCode,
  generateHatchCard,
  updateProfile,
  updateEggName,
  saveEggCreation,
  chatReply,
  getChatHistory,
  recordCompanionInteraction,
  getIncubationPractice,
  getIncubationManual,
  submitIncubationAction,
  recordRoomElementInteraction,
  getPostHatchHome,
  performPostHatchAction,
  getPostHatchMemories,
  manageDeletion,
  trackEvents,
  serverTime,
  uploadAvatar
};
