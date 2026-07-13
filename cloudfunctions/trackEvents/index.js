const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async event => {
  const context = cloud.getWXContext();
  const events = Array.isArray(event.events) ? event.events.slice(0, 50) : [];
  if (!events.length) return { ok: true, count: 0 };
  const rows = events.map(item => Object.assign({}, item, {
    openid: context.OPENID,
    received_at: db.serverDate()
  }));
  await Promise.all(rows.map(row => db.collection('analytics_events').add({ data: row })));
  return { ok: true, count: rows.length };
};
