const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const users = await db.collection('users').where({ openid: OPENID }).limit(1).get();
  const user = users.data[0];
  if (!user) return { ok: false, code: 'LOGIN_REQUIRED' };
  const cards = await db.collection('scene_cards').where({ _id: String(event.cardId || ''), user_id: user._id, mode: 'live' }).limit(1).get();
  if (!cards.data.length) return { ok: false, code: 'CARD_NOT_FOUND' };
  const source = event.changes || {};
  const changes = {};
  if (source.shared !== undefined) changes.shared = !!source.shared;
  changes.updated_at = db.serverDate();
  await db.collection('scene_cards').doc(cards.data[0]._id).update({ data: changes });
  return { ok: true };
};
