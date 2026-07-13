const storage = require('./storage-migration');
const MODE_KEY = 'eggbabe_runtime_mode_v2';
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
  return read(MODE_KEY, 'live') === 'demo' ? 'demo' : 'live';
}

function setMode(mode) {
  return write(MODE_KEY, mode === 'demo' ? 'demo' : 'live');
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
  return `eggbabe_${mode || getMode()}_${key}_v2`;
}

module.exports = { getMode, setMode, getSessionId, scopedKey };
