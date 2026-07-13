const cloud = require('wx-server-sdk');
const crypto = require('crypto');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function publicId(openid) {
  const date = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
  return `EB-${date}-${crypto.createHash('sha256').update(openid).digest('hex').slice(0, 10).toUpperCase()}`;
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const users = db.collection('users');
  const found = await users.where({ openid: OPENID }).limit(1).get();
  let user = found.data[0];
  if (!user) {
    const data = { openid: OPENID, public_id: publicId(OPENID), created_at: db.serverDate(), updated_at: db.serverDate(), status: 'active' };
    const created = await users.add({ data });
    user = Object.assign({ _id: created._id }, data);
  }
  const pets = await db.collection('pets').where({ user_id: user._id, mode: 'live' }).limit(1).get();
  if (pets.data[0] && !pets.data[0].hatch_card_id) {
    const remaining = new Date(pets.data[0].hatch_at).getTime() - Date.now();
    if (remaining <= 0) pets.data[0].stage = 'ready';
    else if (remaining <= 24 * 60 * 60 * 1000) pets.data[0].stage = 'soon';
    else if ((pets.data[0].progress || 0) >= 100) pets.data[0].stage = 'prepared';
  }
  const sceneCards = await db.collection('scene_cards').where({ user_id: user._id, mode: 'live' }).orderBy('obtained_at', 'desc').limit(100).get();
  let messages = [];
  let hatchCard = null;
  if (pets.data[0]) {
    const messageResult = await db.collection('messages').where({ pet_id: pets.data[0]._id, mode: 'live' }).orderBy('created_at', 'desc').limit(40).get();
    messages = messageResult.data.reverse().map(item => ({ id: item.client_id || item._id, from: item.role, text: item.text }));
    if (pets.data[0].hatch_card_id) {
      try { hatchCard = (await db.collection('hatch_cards').doc(pets.data[0].hatch_card_id).get()).data; } catch (error) { hatchCard = null; }
    }
  }
  return { ok: true, serverTs: Date.now(), user, pet: pets.data[0] || null, hatchCard, sceneCards: sceneCards.data, messages };
};
