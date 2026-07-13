const MODE_KEY = 'eggbaby_runtime_mode_v2';
const SESSION_KEY = 'eggbaby_session_id_v2';

function read(key, fallback) {
  try { return wx.getStorageSync(key) || fallback; } catch (error) { return fallback; }
}

function write(key, value) {
  try {
    wx.setStorageSync(key, value);
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
  return `eggbaby_${mode || getMode()}_${key}_v2`;
}

module.exports = { getMode, setMode, getSessionId, scopedKey };
