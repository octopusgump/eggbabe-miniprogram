const storage = require('./storage-migration');
const SESSION_KEY = 'eggbabe_session_id_v2';

function read(key, fallback) {
  return storage.read(key, fallback);
}

function write(key, value) {
  try {
    storage.set(key, value);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: { code: 'LOCAL_WRITE_FAILED', message: '本地数据保存失败，请重试' } };
  }
}

function getMode() {
  return 'live';
}

function setMode(mode) {
  if (mode !== 'live') return { ok: false, code: 'ORDINARY_LIVE_ONLY' };
  return { ok: true, value: 'live' };
}

function getSessionId() {
  let sessionId = read(SESSION_KEY, '');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    write(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function scopedKey(key, mode) {
  return `eggbabe_live_${key}_v2`;
}

module.exports = { getMode, setMode, getSessionId, scopedKey };
