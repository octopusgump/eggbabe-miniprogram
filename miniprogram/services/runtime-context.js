const storage = require('./storage-migration');
const config = require('../config/v2');
const SESSION_KEY = 'eggbabe_session_id_v2';
let activeMode = config.defaultMode === 'demo' && config.localDemoEnabled ? 'demo' : 'live';

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
  return activeMode;
}

function setMode(mode) {
  if (mode === 'demo' && !config.localDemoEnabled) return { ok: false, code: 'DEMO_NOT_ALLOWED' };
  if (mode !== 'live' && mode !== 'demo') return { ok: false, code: 'MODE_INVALID' };
  activeMode = mode;
  return { ok: true, value: activeMode };
}

function getSessionId() {
  const key = scopedKey(SESSION_KEY);
  let sessionId = read(key, '');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    write(key, sessionId);
  }
  return sessionId;
}

function setSessionId(value) {
  const sessionId = String(value || '').trim();
  if (!sessionId) return { ok: false, code: 'SESSION_ID_REQUIRED' };
  return write(scopedKey(SESSION_KEY), sessionId);
}

function scopedKey(key, mode) {
  const requested = mode || activeMode;
  const safeMode = requested === 'demo' && config.localDemoEnabled ? 'demo' : 'live';
  return `eggbabe_${safeMode}_${key}_v2`;
}

module.exports = { getMode, setMode, getSessionId, setSessionId, scopedKey };
