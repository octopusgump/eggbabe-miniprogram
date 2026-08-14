const config = require('../config/v2');
const runtime = require('./runtime-context');
const cloudApi = require('./cloud-api');

const DISPLAYABLE_SAFETY_RESULTS = ['passed', 'crisis'];
const DISPLAYABLE_RESULT_TYPES = ['REPLY', 'CRISIS_REPLY'];

function isAuthoritativeTimestamp(value) {
  const source = String(value || '');
  return /^\d{4}-\d{2}-\d{2}T/.test(source) && Number.isFinite(Date.parse(source));
}

function requestReply({ eggId, text, clientMessageId }) {
  if (!config.backendEnabled || runtime.getMode() !== 'live') {
    return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONNECTED' });
  }
  const stableClientMessageId = String(clientMessageId || '');
  if (!eggId || !stableClientMessageId) {
    return Promise.resolve({ ok: false, code: 'CHAT_REQUEST_INVALID', message: '消息请求不完整，请重试' });
  }
  const payload = {
    egg_id: eggId,
    message: text,
    client_message_id: stableClientMessageId,
    request_id: stableClientMessageId,
    mode: 'live'
  };
  const request = cloudApi.chatReply(payload);
  const response = request.then(result => {
    if (!result || !result.ok) {
      return {
        ok: false,
        code: String(result && result.code || 'CHAT_REPLY_FAILED'),
        message: String(result && result.message || ''),
        resultType: String(result && (result.resultType || result.result_type) || ''),
        requestId: String(result && (result.requestId || result.request_id) || '')
      };
    }
    const reply = result && result.reply;
    const replyText = reply && typeof reply.text === 'string' ? reply.text : '';
    const safetyResult = String(reply && (reply.safety_result || reply.safetyResult) || '');
    const resultType = String(result && (result.result_type || result.resultType) || '');
    const messageId = String(reply && (reply.message_id || reply.id) || '');
    const userMessage = result && result.user_message;
    const userMessageId = String(userMessage && (userMessage.message_id || userMessage.id) || '');
    const echoedClientMessageId = String(userMessage && (userMessage.client_message_id || userMessage.clientMessageId) || '');
    const replyCreatedAt = String(reply && (reply.created_at || reply.createdAt) || '');
    const userCreatedAt = String(userMessage && (userMessage.created_at || userMessage.createdAt) || '');
    const requestId = String(result && (result.request_id || result.requestId) || '');
    const expectedSafety = resultType === 'CRISIS_REPLY' ? 'crisis' : 'passed';
    const valid = Boolean(
      result && result.ok && result.mode === 'live'
      && DISPLAYABLE_RESULT_TYPES.includes(resultType)
      && DISPLAYABLE_SAFETY_RESULTS.includes(safetyResult)
      && safetyResult === expectedSafety
      && reply && reply.role === 'assistant'
      && userMessage && userMessage.role === 'user'
      && replyText.trim()
      && messageId && userMessageId && messageId !== userMessageId
      && echoedClientMessageId === stableClientMessageId
      && requestId === stableClientMessageId
      && isAuthoritativeTimestamp(replyCreatedAt)
      && isAuthoritativeTimestamp(userCreatedAt)
      && typeof (reply.fallback_used !== undefined ? reply.fallback_used : result.fallback_used) === 'boolean'
    );
    if (!valid) {
      return { ok: false, code: result && result.code || 'CHAT_REPLY_INVALID', message: result && result.message || '' };
    }
    return {
      ok: true,
      mode: 'live',
      resultType,
      requestId,
      messageId,
      userMessageId,
      clientMessageId: echoedClientMessageId,
      createdAt: replyCreatedAt,
      userCreatedAt,
      text: replyText,
      safety: safetyResult,
      fallbackUsed: Boolean(result.fallback_used || reply && reply.fallback_used)
    };
  }).catch(() => ({ ok: false, code: 'CHAT_NETWORK_ERROR' }));
  if (request && request.abort) response.abort = () => request.abort();
  return response;
}

module.exports = { DISPLAYABLE_SAFETY_RESULTS, DISPLAYABLE_RESULT_TYPES, requestReply, isAuthoritativeTimestamp };
