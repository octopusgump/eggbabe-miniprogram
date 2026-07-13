const config = require('../config/v2');
const cloudApi = require('./cloud-api');
const analytics = require('./analytics');

const storage = require('./storage-migration');
const KEY = 'eggbabe_sync_queue_v2';
let inFlight = null;

function read() {
  return storage.read(KEY, []);
}

function write(queue) {
  try { storage.set(KEY, queue); return true; } catch (error) { return false; }
}

function enqueue(api, data) {
  const item = { id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, api, data: data || {}, attempts: 0, createdAt: Date.now() };
  const ok = write(read().concat(item).slice(-100));
  if (ok && config.cloudEnabled) flush();
  return { ok, pending: ok, item };
}

function pendingCount() { return read().length; }

function flush() {
  if (inFlight) return inFlight;
  if (!config.cloudEnabled) return Promise.resolve({ ok: false, pending: pendingCount() });
  const run = async () => {
    let queue = read();
    while (queue.length) {
      const item = queue[0];
      const result = await cloudApi.call(item.api, item.data);
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
  inFlight = run().then(result => { inFlight = null; return result; }, error => { inFlight = null; return { ok: false, error, pending: pendingCount() }; });
  return inFlight;
}

module.exports = { enqueue, flush, pendingCount };
