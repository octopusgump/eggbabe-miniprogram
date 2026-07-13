const cloud = require('wx-server-sdk');
const crypto = require('crypto');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function beijingDateKey() { return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10); }
function roll() { return crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF; }

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const sceneId = String(event.scene_id || '');
  const pointId = String(event.point_id || '');
  if (!sceneId || !pointId) return { ok: false, code: 'INVALID_ARGUMENT' };
  return db.runTransaction(async transaction => {
    const userResult = await transaction.collection('users').where({ openid: OPENID }).limit(1).get();
    const user = userResult.data[0];
    if (!user) return { ok: false, code: 'LOGIN_REQUIRED' };
    const petResult = await transaction.collection('pets').where({ user_id: user._id, mode: 'live', stage: 'hatched' }).limit(1).get();
    const pet = petResult.data[0];
    if (!pet) return { ok: false, code: 'PET_NOT_HATCHED' };
    const date = beijingDateKey();
    const counterId = `${user._id}_${date}`;
    let counter;
    try { counter = (await transaction.collection('scene_card_daily').doc(counterId).get()).data; } catch (error) { counter = null; }
    const count = counter ? counter.count || 0 : 0;
    const attempts = (counter ? counter.attempts || 0 : 0) + 1;
    const attemptKey = `${sceneId}:${pointId}`;
    const attemptedPoints = counter ? counter.attempted_points || [] : [];
    if (attemptedPoints.includes(attemptKey)) return { ok: true, dropped: false, repeated: true, dailyCount: count, dailyLimit: 2 };
    attemptedPoints.push(attemptKey);
    if (count >= 2) return { ok: true, dropped: false, capped: true, dailyCount: count, dailyLimit: 2 };
    if (roll() >= 0.28) {
      if (counter) await transaction.collection('scene_card_daily').doc(counterId).update({ data: { attempts, attempted_points: attemptedPoints, updated_at: db.serverDate() } });
      else await transaction.collection('scene_card_daily').doc(counterId).set({ data: { user_id: user._id, date, count: 0, attempts, attempted_points: attemptedPoints, updated_at: db.serverDate() } });
      return { ok: true, dropped: false, dailyCount: count, dailyLimit: 2 };
    }
    const poolResult = await transaction.collection('scene_card_pools').where({ character: pet.prototype, scene_id: sceneId, active: true }).get();
    if (!poolResult.data.length) return { ok: true, dropped: false, code: 'EMPTY_POOL' };
    const template = poolResult.data[Math.floor(roll() * poolResult.data.length)];
    const cardData = { user_id: user._id, pet_id: pet._id, mode: 'live', template_id: template._id, card_key: template.card_key || template._id, character: pet.prototype, scene_id: sceneId, point_id: pointId, name: template.name, image: template.image || '', tint: template.tint || '#DDE9B9', mark: template.mark || '景', rarity: template.rarity || '普通', limited_batch: template.limited_batch || '', obtained_at: db.serverDate(), saved: false, shared: false };
    const created = await transaction.collection('scene_cards').add({ data: cardData });
    if (counter) await transaction.collection('scene_card_daily').doc(counterId).update({ data: { count: db.command.inc(1), attempts, attempted_points: attemptedPoints, updated_at: db.serverDate() } });
    else await transaction.collection('scene_card_daily').doc(counterId).set({ data: { user_id: user._id, date, count: 1, attempts, attempted_points: attemptedPoints, updated_at: db.serverDate() } });
    return { ok: true, dropped: true, card: Object.assign({ id: created._id }, cardData), dailyCount: count + 1, dailyLimit: 2 };
  });
};
