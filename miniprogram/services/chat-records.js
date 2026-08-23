const cloudApi = require('./cloud-api');
const runtime = require('./runtime-context');

const ACCOUNT_CHAT_SCOPE = 'ACCOUNT_ALL_CONVERSATIONS';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validateEmail(value) {
  const email = normalizeEmail(value);
  return Boolean(email && email.length <= 254 && EMAIL_PATTERN.test(email));
}

function backendRequired() {
  return { ok: false, code: 'BACKEND_REQUIRED', message: '正式聊天记录服务尚未接入，请稍后重试' };
}

function requestExport(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!validateEmail(normalizedEmail)) return Promise.resolve({ ok: false, code: 'EMAIL_INVALID', message: '请输入有效的邮箱地址' });
  if (runtime.getMode() !== 'live') return Promise.resolve(backendRequired());
  return cloudApi.requestChatHistoryExport({
    email: normalizedEmail,
    scope: ACCOUNT_CHAT_SCOPE,
    requested_at: new Date().toISOString()
  }).then(result => {
    if (!result || !result.ok) return result || { ok: false, code: 'CHAT_EXPORT_FAILED', message: '导出失败，请重试' };
    const exportRequestId = String(result.export_request_id || result.exportRequestId || '');
    if (!exportRequestId) return { ok: false, code: 'CHAT_EXPORT_CONFIRMATION_MISSING', message: '导出申请没有确认，请重试' };
    return { ok: true, exportRequestId };
  });
}

function deleteAll() {
  if (runtime.getMode() !== 'live') return Promise.resolve(backendRequired());
  return cloudApi.deleteAllChatHistory({
    scope: ACCOUNT_CHAT_SCOPE,
    requested_at: new Date().toISOString()
  }).then(result => {
    if (!result || !result.ok) return result || { ok: false, code: 'CHAT_DELETE_FAILED', message: '删除失败，请重试' };
    const deleted = result.deleted === true || String(result.status || '').toUpperCase() === 'DELETED';
    if (!deleted) return { ok: false, code: 'CHAT_DELETE_CONFIRMATION_MISSING', message: '服务端没有确认删除，请重试' };
    return { ok: true, deletionReceipt: String(result.deletion_receipt || result.deletionReceipt || '') };
  });
}

module.exports = { ACCOUNT_CHAT_SCOPE, normalizeEmail, validateEmail, requestExport, deleteAll };
