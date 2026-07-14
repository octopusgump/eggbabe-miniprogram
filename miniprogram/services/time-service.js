const config = require('../config/v2');
const runtime = require('./runtime-context');

const storage = require('./storage-migration');
const OFFSET_KEY = 'eggbabe_server_time_offset_v2';
const DEMO_EPOCH_MS = Date.parse('2026-07-14T12:00:00+08:00');
let offset = 0;
let serverBase = 0;
let monotonicBase = 0;
let authoritative = false;
const demoMonotonicBase = monotonicNow();

function monotonicNow() {
  if (typeof performance !== 'undefined' && performance.now) return performance.now();
  return Date.now();
}

function loadOffset() {
  if (typeof wx === 'undefined') return 0;
  try { offset = Number(storage.read(OFFSET_KEY, 0)) || 0; } catch (error) { offset = 0; }
  return offset;
}

function now() {
  if (authoritative) return serverBase + (monotonicNow() - monotonicBase);
  if (runtime.getMode() === 'demo') return DEMO_EPOCH_MS + (monotonicNow() - demoMonotonicBase);
  return Date.now() + offset;
}

function isAuthoritative() { return authoritative; }

function requireAuthoritative() {
  if (authoritative) return { ok: true, now: now(), authoritative: true, mode: runtime.getMode() };
  if (runtime.getMode() === 'demo') return { ok: true, now: now(), authoritative: false, demoFixture: true, mode: 'demo' };
  return { ok: false, code: 'SERVER_TIME_REQUIRED', message: '正在同步北京时间，请稍后再试', mode: 'live' };
}

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
    try { storage.set(OFFSET_KEY, offset); } catch (error) {}
    return { ok: true, now: now(), offset };
  }).catch(() => ({ ok: false, fallback: true, now: now() }));
}

loadOffset();

module.exports = { now, beijingDateKey, sync, isAuthoritative, requireAuthoritative };
