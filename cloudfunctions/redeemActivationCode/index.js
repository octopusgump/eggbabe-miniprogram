const cloud = require('wx-server-sdk');
const crypto = require('crypto');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function codeHash(code) { return crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex'); }

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const normalized = String(event.code || '').trim().toUpperCase();
  if (!normalized) return { ok: false, code: 'EMPTY', message: '请输入激活码' };
  return db.runTransaction(async transaction => {
    const userResult = await transaction.collection('users').where({ openid: OPENID }).limit(1).get();
    const user = userResult.data[0];
    if (!user) return { ok: false, code: 'LOGIN_REQUIRED', message: '请重新登录后再试' };
    const bound = await transaction.collection('pets').where({ user_id: user._id, mode: 'live' }).limit(1).get();
    if (bound.data.length) return { ok: false, code: 'BOUND', message: '当前版本一个账号只能绑定 1 只蛋宝宝，本次激活码未被消耗' };
    const codeResult = await transaction.collection('activation_codes').where({ code_hash: codeHash(normalized), mode: 'live' }).limit(1).get();
    const record = codeResult.data[0];
    if (!record) return { ok: false, code: 'INVALID', message: '激活码无效，请检查后重试' };
    if (record.status === 'paused') return { ok: false, code: 'PAUSED', message: '该激活码暂不可用' };
    if (record.status === 'used') return { ok: false, code: 'USED', message: '该激活码已被使用' };
    if ((record.used_count || 0) >= (record.usage_limit || 1)) return { ok: false, code: 'FULL', message: '该激活码名额已满' };
    const now = Date.now();
    const hatchAt = record.hatch_at || now + 7 * 24 * 60 * 60 * 1000;
    const petResult = await transaction.collection('pets').add({ data: { user_id: user._id, mode: 'live', prototype: record.prototype || '玉兔', stage: 'waiting', progress: 0, created_at: db.serverDate(), hatch_at: new Date(hatchAt), source_channel: record.channel || '', activation_code_id: record._id } });
    await transaction.collection('activation_codes').doc(record._id).update({ data: { used_count: db.command.inc(1), status: (record.used_count || 0) + 1 >= (record.usage_limit || 1) ? 'used' : record.status, updated_at: db.serverDate() } });
    return { ok: true, pet_id: petResult._id, prototype: record.prototype || '玉兔', hatchAt, serverTs: now };
  });
};
