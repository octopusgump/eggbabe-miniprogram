const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ALLOWED = ['nickname', 'avatar_url', 'gender', 'birthday', 'zodiac', 'city', 'mbti', 'genderLocked', 'birthdayLocked'];

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const source = event.profile || {};
  const profile = {};
  ALLOWED.forEach(key => { if (source[key] !== undefined) profile[key] = source[key]; });
  profile.updated_at = db.serverDate();
  const users = await db.collection('users').where({ openid: OPENID }).limit(1).get();
  if (!users.data.length) return { ok: false, code: 'LOGIN_REQUIRED', message: '请重新登录后再试' };
  await db.collection('users').doc(users.data[0]._id).update({ data: profile });
  return { ok: true };
};
