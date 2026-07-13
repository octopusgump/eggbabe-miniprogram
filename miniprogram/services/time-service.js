const config = require('../config/v2');

const OFFSET_KEY = 'eggbaby_server_time_offset_v2';
let offset = 0;
let serverBase = 0;
let monotonicBase = 0;
let authoritative = false;

function monotonicNow() {
  if (typeof performance !== 'undefined' && performance.now) return performance.now();
  return Date.now();
}

function loadOffset() {
  if (typeof wx === 'undefined') return 0;
  try { offset = Number(wx.getStorageSync(OFFSET_KEY)) || 0; } catch (error) { offset = 0; }
  return offset;
}

function now() {
  if (authoritative) return serverBase + (monotonicNow() - monotonicBase);
  return Date.now() + offset;
}

function isAuthoritative() { return authoritative; }

function beijingDateKey(timestamp) {
  const date = new Date((timestamp === undefined ? now() : timestamp) + 8 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function sync() {
  if (typeof wx === 'undefined' || !config.cloudEnabled || !wx.cloud) return Promise.resolve({ ok: false, fallback: true, now: now() });
  const startedAt = Date.now();
  return wx.cloud.callFunction({ name: 'serverTime' }).then(({ result }) => {
    if (!result || !result.serverTs) throw new Error('INVALID_SERVER_TIME');
    const receivedAt = Date.now();
    offset = Number(result.serverTs) - Math.round((startedAt + receivedAt) / 2);
    serverBase = Number(result.serverTs);
    monotonicBase = monotonicNow();
    authoritative = true;
    try { wx.setStorageSync(OFFSET_KEY, offset); } catch (error) {}
    return { ok: true, now: now(), offset };
  }).catch(() => ({ ok: false, fallback: true, now: now() }));
}

loadOffset();

module.exports = { now, beijingDateKey, sync, isAuthoritative };
