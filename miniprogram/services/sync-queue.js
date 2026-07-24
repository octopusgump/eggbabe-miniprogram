const config = require('../config/v2');
const cloudApi = require('./cloud-api');
const analytics = require('./analytics');
const runtime = require('./runtime-context');
const time = require('./time-service');

const storage = require('./storage-migration');
const KEY = 'eggbabe_sync_queue_v2';
let inFlight = null;
let generation = 0;

function read() {
  return storage.read(runtime.scopedKey(KEY), []);
}

function write(queue) {
  try { storage.set(runtime.scopedKey(KEY), queue); return true; } catch (error) { return false; }
}

function enqueue(api, data) {
  const item = { id: `sync-${time.now()}-${Math.random().toString(36).slice(2, 8)}`, api, data: data || {}, mode: runtime.getMode(), attempts: 0, createdAt: time.now() };
  const ok = write(read().concat(item).slice(-100));
  if (ok && config.backendEnabled && runtime.getMode() === 'live') flush();
  return { ok, pending: ok, item };
}

function pendingCount() { return read().length; }

function clear() {
  generation += 1;
  inFlight = null;
  return write([]);
}

function flush() {
  if (inFlight) return inFlight;
  if (!config.backendEnabled || runtime.getMode() !== 'live') return Promise.resolve({ ok: false, pending: pendingCount() });
  const activeGeneration = generation;
  const run = async () => {
    let queue = read();
    while (queue.length) {
      const item = queue[0];
      const result = await cloudApi.call(item.api, item.data);
      if (generation !== activeGeneration) return { ok: false, pending: 0, cancelled: true };
      if (!result.ok) {
        item.attempts += 1;
        queue[0] = item;
        write(queue);
        analytics.track('network_error', { api: item.api, error_code: result.code || 'SYNC_FAILED' });
        return { ok: false, pending: queue.length };
      }
      queue = read().filter(queued => queued.id !== item.id);
      write(queue);
    }
    return { ok: true, pending: 0 };
  };
  inFlight = run().then(result => {
    if (generation === activeGeneration) inFlight = null;
    return result;
  }, error => {
    if (generation === activeGeneration) inFlight = null;
    return { ok: false, error, pending: generation === activeGeneration ? pendingCount() : 0 };
  });
  return inFlight;
}

module.exports = { enqueue, flush, pendingCount, clear };
