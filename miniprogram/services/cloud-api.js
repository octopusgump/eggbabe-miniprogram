const config = require('../config/v2');

function call(name, data) {
  if (!config.backendEnabled) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONNECTED', message: '正式数据服务尚未接入' });
  if (!config.apiBase || typeof wx === 'undefined' || !wx.request) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONFIGURED', message: '正式数据服务尚未配置' });
  return new Promise(resolve => {
    wx.request({
      url: `${String(config.apiBase).replace(/\/$/, '')}/${name}`,
      method: 'POST',
      data: data || {},
      success: response => resolve(response.data || { ok: false, code: 'EMPTY_RESPONSE', message: '数据服务未返回结果' }),
      fail: error => resolve({ ok: false, code: 'NETWORK_ERROR', message: '网络异常，请稍后重试', detail: error && error.errMsg })
    });
  });
}

function redeemActivationCode(code) { return call('redeemActivationCode', { code }); }
function evaluateSceneCardDrop(data) { return call('sceneCardDrop', data); }
function bootstrap() { return call('bootstrap'); }
function generateHatchCard() { return call('generateHatchCard'); }
function updateProfile(profile) { return call('updateProfile', { profile }); }
function saveMessage(message) { return call('saveMessage', { message }); }
function updateSceneCard(cardId, changes) { return call('updateSceneCard', { cardId, changes }); }
function recordIncubationAction(actionType, payload) { return call('recordIncubationAction', { actionType, payload: payload || {} }); }
function manageDeletion(action) { return call('manageDeletion', { action }); }
function currencyAccount(action, itemId) { return call('currencyAccount', { action, itemId, mode: 'live' }); }
function tapEggCurrency(requestId) { return call('tapEggCurrency', { request_id: requestId, mode: 'live' }); }
function trackEvents(events) { return call('trackEvents', { events }); }
function serverTime() { return call('serverTime'); }
function uploadAvatar(localPath) {
  if (!config.backendEnabled) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONNECTED', message: '正式头像服务尚未接入' });
  if (!config.apiBase || typeof wx === 'undefined' || !wx.uploadFile) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONFIGURED', message: '正式头像服务尚未配置' });
  return new Promise(resolve => {
    wx.uploadFile({
      url: `${String(config.apiBase).replace(/\/$/, '')}/uploadAvatar`,
      filePath: localPath,
      name: 'avatar',
      success: response => {
        let payload = response.data;
        try { if (typeof payload === 'string') payload = JSON.parse(payload); }
        catch (error) { return resolve({ ok: false, code: 'INVALID_RESPONSE', message: '头像服务返回格式不正确' }); }
        if (response.statusCode < 200 || response.statusCode >= 300 || !payload) return resolve({ ok: false, code: 'UPLOAD_FAILED', message: (payload && payload.message) || '头像上传失败，请重试' });
        const avatarUrl = payload.avatarUrl || payload.avatar_url || payload.url || '';
        if (!avatarUrl) return resolve({ ok: false, code: 'MISSING_AVATAR_URL', message: '头像服务未返回可用地址' });
        resolve(Object.assign({}, payload, { ok: payload.ok !== false, avatarUrl }));
      },
      fail: error => resolve({ ok: false, code: 'NETWORK_ERROR', message: '网络异常，请稍后重试', detail: error && error.errMsg })
    });
  });
}

module.exports = { call, bootstrap, redeemActivationCode, evaluateSceneCardDrop, generateHatchCard, updateProfile, saveMessage, updateSceneCard, recordIncubationAction, manageDeletion, currencyAccount, tapEggCurrency, trackEvents, serverTime, uploadAvatar };
