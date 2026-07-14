const runtime = require('./runtime-context');
const time = require('./time-service');
const config = require('../config/v2');

const storage = require('./storage-migration');
const QUEUE_KEY = 'eggbabe_analytics_queue_v2';

function readQueue() {
  return storage.read(QUEUE_KEY, []);
}

function getContext() {
  const petStore = require('../utils/pet-store');
  const pet = petStore.getPet();
  const user = petStore.getUser();
  const mode = runtime.getMode();
  return {
    user_id: mode === 'demo' ? '' : (user ? user.id : ''),
    mode,
    server_ts: time.isAuthoritative() || mode === 'demo' ? time.now() : null,
    session_id: runtime.getSessionId(),
    egg_id: pet ? pet.id : '',
    pet_id: pet && pet.collectionCard ? pet.id : '',
    prototype: pet ? pet.prototype : '',
    stage: pet ? petStore.getStage(pet) : 'empty',
    source_channel: pet ? (pet.sourceChannel || '') : ''
  };
}

function track(eventName, properties) {
  const event = Object.assign({}, getContext(), properties || {}, { event_name: eventName, event_id: `evt-${time.now()}-${Math.random().toString(36).slice(2, 8)}` });
  const queue = readQueue().concat(event).slice(-200);
  try { storage.set(QUEUE_KEY, queue); } catch (error) { return { ok: false, event }; }
  if (config.cloudEnabled && wx.cloud && queue.length >= 10) flush();
  return { ok: true, event };
}

function flush() {
  const events = readQueue();
  if (!events.length || !config.cloudEnabled || !wx.cloud) return Promise.resolve({ ok: false, pending: events.length });
  return wx.cloud.callFunction({ name: 'trackEvents', data: { events } }).then(() => {
    const current = readQueue();
    const uploadedIds = new Set(events.map(event => event.event_id));
    storage.set(QUEUE_KEY, current.filter(event => !uploadedIds.has(event.event_id)));
    return { ok: true, count: events.length };
  }).catch(() => ({ ok: false, pending: events.length }));
}

module.exports = { track, flush };
