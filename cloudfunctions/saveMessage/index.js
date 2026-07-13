const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const message = event.message || {};
  const text = String(message.text || '').trim().slice(0, 1000);
  const role = message.from === 'egg' ? 'egg' : 'user';
  if (!text) return { ok: false, code: 'EMPTY_MESSAGE', message: '消息不能为空' };
  const users = await db.collection('users').where({ openid: OPENID }).limit(1).get();
  const user = users.data[0];
  if (!user) return { ok: false, code: 'LOGIN_REQUIRED', message: '请重新登录后再试' };
  const pets = await db.collection('pets').where({ user_id: user._id, mode: 'live', stage: 'hatched' }).limit(1).get();
  const pet = pets.data[0];
  if (!pet) return { ok: false, code: 'PET_NOT_HATCHED', message: '破壳后才可以对话' };
  const duplicate = await db.collection('messages').where({ pet_id: pet._id, client_id: String(message.id || '') }).limit(1).get();
  if (duplicate.data.length) return { ok: true, duplicated: true };
  await db.collection('messages').add({ data: { pet_id: pet._id, user_id: user._id, mode: 'live', client_id: String(message.id || ''), role, text, created_at: db.serverDate() } });
  return { ok: true };
};
