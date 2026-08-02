const config = require('../config/v2');
const runtime = require('./runtime-context');
const cloudApi = require('./cloud-api');
const chatSafety = require('./chat-safety');

const APPROVED_FALLBACKS = {
  开心: '你来啦，我正好想说句话。',
  平静: '慢慢说，我在听。',
  想念: '今天又见到你啦。',
  兴奋: '我听见啦，我们慢慢说。',
  低落: '今天可以慢一点，我们先一起歇一会儿。',
  default: '我在听。慢慢说就好。'
};

function approvedFallback(mood) {
  return APPROVED_FALLBACKS[mood] || APPROVED_FALLBACKS.default;
}

function requestReply({ eggId, text, history, scene }) {
  if (!config.backendEnabled || runtime.getMode() !== 'live') {
    return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONNECTED' });
  }
  const payload = {
    egg_id: eggId,
    message: text,
    history: (history || []).slice(-12).map(item => ({ from: item.from, text: item.text })),
    scene_context: scene || null,
    mode: 'live'
  };
  const timeout = new Promise(resolve => {
    setTimeout(() => resolve({ ok: false, code: 'CHAT_TIMEOUT' }), 8000);
  });
  return Promise.race([cloudApi.chatReply(payload), timeout]).then(result => {
    const reply = result && (result.reply || result.message);
    const replyText = typeof reply === 'string' ? reply : reply && reply.text;
    const safetyResult = result && (result.safety_result || reply && reply.safety_result);
    if (!result || !result.ok || result.mode !== 'live' || safetyResult !== 'passed' || !replyText) {
      return { ok: false, code: result && result.code || 'CHAT_REPLY_INVALID' };
    }
    return {
      ok: true,
      mode: 'live',
      messageId: String(result.message_id || reply && reply.id || ''),
      text: chatSafety.safeOutput(replyText)
    };
  }).catch(() => ({ ok: false, code: 'CHAT_NETWORK_ERROR' }));
}

module.exports = { APPROVED_FALLBACKS, approvedFallback, requestReply };
