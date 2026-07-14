const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function todayKey() { return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10); }

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const action = String(event.actionType || '');
  const payload = event.payload || {};
  if (!['nickname', 'cuddle', 'wish', 'lesson', 'doodle'].includes(action)) return { ok: false, code: 'INVALID_ACTION' };
  return db.runTransaction(async transaction => {
    const users = await transaction.collection('users').where({ openid: OPENID }).limit(1).get();
    const user = users.data[0];
    if (!user) return { ok: false, code: 'LOGIN_REQUIRED' };
    const pets = await transaction.collection('pets').where({ user_id: user._id, mode: 'live' }).limit(1).get();
    const pet = pets.data[0];
    if (!pet) return { ok: false, code: 'PET_NOT_FOUND' };
    if (pet.stage === 'hatched' && action !== 'nickname') return { ok: false, code: 'ALREADY_HATCHED' };
    const tasks = pet.tasks || { nicknameDone: false, cuddleDate: '', wishDate: '', lessonDate: '', doodleDone: false };
    const preferences = pet.preferences || { wishes: [], lessons: [] };
    const updates = { tasks, preferences, updated_at: db.serverDate() };
    let delta = 0;
    const date = todayKey();
    if (action === 'nickname') {
      const name = String(payload.name || '').trim().slice(0, 10);
      if (!name) return { ok: false, code: 'EMPTY_NAME' };
      updates.name = name;
      if (!tasks.nicknameDone) { tasks.nicknameDone = true; delta = 20; }
    } else if (action === 'doodle') {
      updates.shell = { color: payload.color, colorName: payload.colorName, pattern: payload.pattern };
      if (!tasks.doodleDone) { tasks.doodleDone = true; delta = 20; }
    } else {
      const field = `${action}Date`;
      if (tasks[field] !== date) {
        tasks[field] = date; delta = 5;
        if (action === 'wish') preferences.wishes = (preferences.wishes || []).concat({ date, value: String(payload.value || '').slice(0, 40) }).slice(-30);
        if (action === 'lesson') preferences.lessons = (preferences.lessons || []).concat({ date, value: String(payload.value || '').slice(0, 40) }).slice(-30);
      }
    }
    updates.progress = Math.min(100, (pet.progress || 0) + delta);
    updates.stage = pet.stage === 'hatched' ? 'hatched' : (updates.progress > 0 ? 'hatching' : 'waiting');
    await transaction.collection('pets').doc(pet._id).update({ data: updates });
    if (action === 'nickname' && pet.hatch_card_id) {
      await transaction.collection('hatch_cards').doc(pet.hatch_card_id).update({ data: { name: updates.name, name_by_user: true, updated_at: db.serverDate() } });
    }
    return { ok: true, added: delta, progress: updates.progress, serverTs: Date.now() };
  });
};
