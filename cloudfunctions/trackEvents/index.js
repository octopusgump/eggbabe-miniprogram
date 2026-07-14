const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async event => {
  const context = cloud.getWXContext();
  const events = Array.isArray(event.events) ? event.events.slice(0, 50) : [];
  if (!events.length) return { ok: true, count: 0 };
  const rows = events.map(item => Object.assign({}, item, {
    mode: item.mode === 'demo' ? 'demo' : 'live',
    openid: context.OPENID,
    server_ts: db.serverDate(),
    received_at: db.serverDate()
  }));
  await Promise.all(rows.map(row => db.collection('analytics_events').add({ data: row })));
  const preferenceNames = new Set(['scene_enter', 'scene_exit', 'interaction_point_tap', 'scene_card_save', 'scene_card_share', 'card_share']);
  const preferenceRows = rows.filter(row => row.mode === 'live' && preferenceNames.has(row.event_name));
  await Promise.all(preferenceRows.map(row => db.collection('preference_events').add({ data: {
    user_id: row.user_id || '', pet_id: row.pet_id || '', mode: 'live', event_type: row.event_name,
    scene_id: row.scene_id || '', point_id: row.point_id || '', card_id: row.card_id || '',
    duration: Number(row.dwell_time || 0), server_ts: db.serverDate()
  } })));
  return { ok: true, count: rows.length };
};
