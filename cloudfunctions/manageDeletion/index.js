const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const users = await db.collection('users').where({ openid: OPENID }).limit(1).get();
  const user = users.data[0];
  if (!user) return { ok: false, code: 'LOGIN_REQUIRED' };
  const requests = await db.collection('deletion_requests').where({ user_id: user._id, status: 'pending' }).limit(1).get();
  const pending = requests.data[0];
  if (event.action === 'query') return { ok: true, request: pending || null, serverTs: Date.now() };
  if (event.action === 'cancel') {
    if (pending) await db.collection('deletion_requests').doc(pending._id).update({ data: { status: 'cancelled', cancelled_at: db.serverDate() } });
    return { ok: true, request: null, serverTs: Date.now() };
  }
  if (pending) return { ok: true, request: pending, duplicated: true, serverTs: Date.now() };
  const submittedAt = Date.now();
  const request = { user_id: user._id, status: 'pending', submittedAt, endAt: submittedAt + 15 * 24 * 60 * 60 * 1000, created_at: db.serverDate() };
  const created = await db.collection('deletion_requests').add({ data: request });
  return { ok: true, request: Object.assign({ _id: created._id }, request), serverTs: submittedAt };
};
