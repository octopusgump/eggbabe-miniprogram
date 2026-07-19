const config = require('../config/v2');
const runtime = require('./runtime-context');
const dataApi = require('./cloud-api');

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
  // live 模式没有服务端基准时不提供业务时间，避免设备时钟进入判定。
  return 0;
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

function formatBeijingDate(timestamp) {
  const key = beijingDateKey(timestamp);
  const parts = key.split('-').map(Number);
  return `${parts[0]}年${parts[1]}月${parts[2]}日`;
}

function sync() {
  if (runtime.getMode() === 'demo') return Promise.resolve({ ok: true, demoFixture: true, now: now() });
  if (!config.backendEnabled) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONNECTED' });
  const startedAt = Date.now();
  return dataApi.serverTime().then(result => {
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

module.exports = { now, beijingDateKey, formatBeijingDate, sync, isAuthoritative, requireAuthoritative };
