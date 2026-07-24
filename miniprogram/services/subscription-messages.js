const config = require('../config/v2');
const storage = require('./storage-migration');
const runtime = require('./runtime-context');

const KEY = 'eggbabe_subscription_permissions_v216';

function readState() {
  return storage.read(runtime.scopedKey(KEY), { hatchDeclined: false, accepted: [] });
}

function request(templateIds) {
  if (runtime.getMode() !== 'live') return Promise.resolve({ ok: false, code: 'LIVE_MODE_REQUIRED' });
  const state = readState();
  const tmplIds = templateIds.filter(Boolean);
  if (!tmplIds.length) return Promise.resolve({ ok: false, code: 'TEMPLATES_NOT_CONFIGURED' });
  if (state.hatchDeclined) return Promise.resolve({ ok: false, code: 'USER_DECLINED_PREVIOUSLY' });
  if (typeof wx === 'undefined' || !wx.requestSubscribeMessage) return Promise.resolve({ ok: false, code: 'API_UNAVAILABLE' });
  return new Promise(resolve => {
    wx.requestSubscribeMessage({
      tmplIds,
      success: result => {
        const accepted = tmplIds.filter(id => result[id] === 'accept');
        const declined = accepted.length === 0;
        const next = Object.assign({}, state, {
          hatchDeclined: declined,
          accepted: Array.from(new Set((state.accepted || []).concat(accepted)))
        });
        try { storage.set(runtime.scopedKey(KEY), next); }
        catch (error) { resolve({ ok: false, code: 'LOCAL_WRITE_FAILED' }); return; }
        resolve({ ok: accepted.length > 0, accepted, declined });
      },
      fail: () => resolve({ ok: false, code: 'REQUEST_FAILED' })
    });
  });
}

function requestHatchReminders() {
  const ids = config.subscriptionTemplateIds || {};
  return request([ids.hatchDay, ids.hatchSoon]);
}

module.exports = { readState, requestHatchReminders };
