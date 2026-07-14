const config = require('../config/v2');

function call(name, data) {
  if (!config.cloudEnabled || !wx.cloud) {
    return Promise.resolve({ ok: false, code: 'CLOUD_NOT_CONFIGURED', message: '云服务尚未配置' });
  }
  return wx.cloud.callFunction({ name, data: data || {} }).then(({ result }) => result).catch(error => ({
    ok: false,
    code: 'NETWORK_ERROR',
    message: '网络异常，请稍后重试',
    detail: error && error.errMsg
  }));
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
function currencyAccount(action, itemId) { return call('currencyAccount', { action, itemId }); }
function recordEngagement(source) { return call('recordEngagement', { source }); }
function uploadAvatar(localPath) {
  if (!config.cloudEnabled || !wx.cloud) return Promise.resolve({ ok: false, code: 'CLOUD_NOT_CONFIGURED', message: '云服务尚未配置' });
  const suffix = String(localPath).split('.').pop().replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
  const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${suffix}`;
  return wx.cloud.uploadFile({ cloudPath, filePath: localPath }).then(result => updateProfile({ avatar_url: result.fileID }).then(saved => saved.ok ? { ok: true, fileID: result.fileID } : saved)).catch(() => ({ ok: false, code: 'UPLOAD_FAILED', message: '头像上传失败，请重试' }));
}

module.exports = { call, bootstrap, redeemActivationCode, evaluateSceneCardDrop, generateHatchCard, updateProfile, saveMessage, updateSceneCard, recordIncubationAction, manageDeletion, currencyAccount, recordEngagement, uploadAvatar };
