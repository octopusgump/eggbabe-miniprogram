const runtime = require('./runtime-context');
const time = require('./time-service');
const config = require('../config/v2');
const dataApi = require('./cloud-api');

const storage = require('./storage-migration');
const QUEUE_KEY = 'eggbabe_analytics_queue_v2';
const EVENT_ALLOWLIST = new Set([
  'app_open',
  'login_result',
  'activation_submit',
  'activation_result',
  'egg_bound',
  'hatch_home_view',
  'companion_interaction',
  'room_element_interaction',
  'egg_creation_saved',
  'hatch_receive_start',
  'hatch_card_ready',
  'card_save',
  'card_share',
  'role_home_view',
  'scene_enter',
  'scene_exit',
  'chat_open',
  'chat_message_sent',
  'chat_reply_result',
  'account_delete_request',
  'account_delete_cancel',
  'data_write_fail',
  'network_error'
]);

function readQueue() {
  return storage.read(QUEUE_KEY, []);
}

function getContext() {
  const petStore = require('../utils/pet-store');
  const pet = petStore.getPet();
  const user = petStore.getUser();
  const mode = runtime.getMode();
  const context = {
    user_id: config.backendEnabled && user && user.mode === 'live' ? user.id : '',
    mode,
    session_id: runtime.getSessionId(),
    egg_id: pet ? pet.id : '',
    prototype: pet ? pet.prototype : '',
    stage: pet ? petStore.getStage(pet) : 'empty',
    source_channel: pet ? (pet.sourceChannel || '') : ''
  };
  if (time.isAuthoritative()) context.server_ts = time.now();
  else context.server_time_pending = true;
  return context;
}

function track(eventName, properties) {
  if (!EVENT_ALLOWLIST.has(eventName)) return { ok: false, skipped: true, code: 'EVENT_NOT_ALLOWED' };
  const safeProperties = Object.keys(properties || {}).reduce((result, key) => {
    if (!/currency|reward|drop|inventory|shop|quest|streak|growth|relationship|preference/i.test(key)) {
      result[key] = properties[key];
    }
    return result;
  }, {});
  const event = Object.assign({}, getContext(), safeProperties, { event_name: eventName, event_id: `evt-${time.now()}-${Math.random().toString(36).slice(2, 8)}` });
  const queue = readQueue().concat(event).slice(-200);
  try { storage.set(QUEUE_KEY, queue); } catch (error) { return { ok: false, event }; }
  if (config.backendEnabled && queue.length >= 10) flush();
  return { ok: true, event };
}

function flush() {
  const queuedEvents = readQueue();
  const events = queuedEvents.filter(event => event.mode === 'live' && EVENT_ALLOWLIST.has(event.event_name));
  if (!queuedEvents.length || !config.backendEnabled) return Promise.resolve({ ok: false, pending: events.length });
  if (runtime.getMode() !== 'live') return Promise.resolve({ ok: false, pending: events.length, code: 'LIVE_MODE_REQUIRED' });
  if (!time.isAuthoritative()) return Promise.resolve({ ok: false, pending: events.length, code: 'SERVER_TIME_REQUIRED' });
  if (!events.length) {
    storage.set(QUEUE_KEY, []);
    return Promise.resolve({ ok: true, count: 0, discarded: queuedEvents.length });
  }
  const uploadEvents = events.map(event => {
    if (event.server_ts) return event;
    const hydrated = Object.assign({}, event, { server_ts: time.now() });
    delete hydrated.server_time_pending;
    return hydrated;
  });
  return dataApi.trackEvents(uploadEvents).then(result => {
    if (!result.ok) return { ok: false, pending: events.length };
    const current = readQueue();
    const processedIds = new Set(queuedEvents.map(event => event.event_id));
    storage.set(QUEUE_KEY, current.filter(event => !processedIds.has(event.event_id)));
    return { ok: true, count: events.length };
  }).catch(() => ({ ok: false, pending: events.length }));
}

function clearQueue() {
  try {
    storage.set(QUEUE_KEY, []);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = { EVENT_ALLOWLIST, track, flush, clearQueue };
