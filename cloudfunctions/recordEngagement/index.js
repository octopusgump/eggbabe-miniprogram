const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const RULES = {
  daily_visit: { grant: 5, cap: 5 },
  pet_touch: { grant: 1, cap: 5 },
  daily_status_view: { grant: 3, cap: 3 }
};
function beijingDateKey() { return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10); }

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const source = String(event.source || '');
  const rule = RULES[source];
  if (!rule) return { ok: false, code: 'INVALID_SOURCE' };
  return db.runTransaction(async transaction => {
    const users = await transaction.collection('users').where({ openid: OPENID }).limit(1).get();
    const user = users.data[0];
    if (!user) return { ok: false, code: 'LOGIN_REQUIRED' };
    const pets = await transaction.collection('pets').where({ user_id: user._id, mode: 'live' }).limit(1).get();
    if (!pets.data[0]) return { ok: false, code: 'PET_NOT_FOUND' };
    const date = beijingDateKey();
    const counterId = `${user._id}-live-${date}-${source}`;
    const counters = await transaction.collection('daily_earn_counters').where({ counter_id: counterId, mode: 'live' }).limit(1).get();
    const current = Number((counters.data[0] || {}).amount || 0);
    const granted = Math.min(rule.grant, Math.max(0, rule.cap - current));
    if (!granted) return { ok: true, granted: 0, capped: true, serverTs: Date.now() };
    const balances = await transaction.collection('currency_balances').where({ user_id: user._id, mode: 'live' }).limit(1).get();
    const currentBalance = Number((balances.data[0] || {}).amount || 0);
    const nextBalance = currentBalance + granted;
    if (balances.data[0]) await transaction.collection('currency_balances').doc(balances.data[0]._id).update({ data: { amount: nextBalance, updated_at: db.serverDate() } });
    else await transaction.collection('currency_balances').add({ data: { user_id: user._id, mode: 'live', amount: nextBalance, created_at: db.serverDate(), updated_at: db.serverDate() } });
    if (counters.data[0]) await transaction.collection('daily_earn_counters').doc(counters.data[0]._id).update({ data: { amount: current + granted, server_ts: db.serverDate() } });
    else await transaction.collection('daily_earn_counters').add({ data: { counter_id: counterId, user_id: user._id, mode: 'live', date, source, amount: granted, server_ts: db.serverDate() } });
    await transaction.collection('currency_ledger').add({ data: { user_id: user._id, mode: 'live', direction: 'earn', source, amount: granted, balance_after: nextBalance, server_ts: db.serverDate() } });
    return { ok: true, granted, balance: nextBalance, serverTs: Date.now() };
  });
};
