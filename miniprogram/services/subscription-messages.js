const config = require('../config/v2');
const analytics = require('./analytics');
const storage = require('./storage-migration');

const KEY = 'eggbabe_subscription_permissions_v216';

function readState() {
  return storage.read(KEY, { hatchDeclined: false, seasonalDeclined: false, accepted: [] });
}

function request(group, templateIds) {
  const state = readState();
  const declineKey = group === 'seasonal' ? 'seasonalDeclined' : 'hatchDeclined';
  const tmplIds = templateIds.filter(Boolean);
  if (!tmplIds.length) return Promise.resolve({ ok: false, code: 'TEMPLATES_NOT_CONFIGURED' });
  if (state[declineKey]) return Promise.resolve({ ok: false, code: 'USER_DECLINED_PREVIOUSLY' });
  if (typeof wx === 'undefined' || !wx.requestSubscribeMessage) return Promise.resolve({ ok: false, code: 'API_UNAVAILABLE' });
  return new Promise(resolve => {
    wx.requestSubscribeMessage({
      tmplIds,
      success: result => {
        const accepted = tmplIds.filter(id => result[id] === 'accept');
        const declined = accepted.length === 0;
        const next = Object.assign({}, state, {
          [declineKey]: declined,
          accepted: Array.from(new Set((state.accepted || []).concat(accepted)))
        });
        try { storage.set(KEY, next); }
        catch (error) { resolve({ ok: false, code: 'LOCAL_WRITE_FAILED' }); return; }
        analytics.track('push_authorized', { group, accepted_count: accepted.length, declined });
        resolve({ ok: accepted.length > 0, accepted, declined });
      },
      fail: () => resolve({ ok: false, code: 'REQUEST_FAILED' })
    });
  });
}

function requestHatchReminders() {
  const ids = config.subscriptionTemplateIds || {};
  return request('hatch', [ids.hatchDay, ids.hatchSoon]);
}

function requestSeasonalUpdates() {
  const ids = config.subscriptionTemplateIds || {};
  return request('seasonal', [ids.seasonal]);
}

module.exports = { readState, requestHatchReminders, requestSeasonalUpdates };
