const cloud = require('wx-server-sdk');
const crypto = require('crypto');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function hash(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function pick(seed, values) { return values[parseInt(hash(seed).slice(0, 8), 16) % values.length]; }
function beijingDate(timestamp) { return new Date(timestamp + 8 * 60 * 60 * 1000).toISOString().slice(0, 10); }
function zodiac(date) {
  const key = Number(date.slice(5, 7)) * 100 + Number(date.slice(8, 10));
  if (key >= 1222 || key <= 119) return '摩羯座'; if (key <= 218) return '水瓶座'; if (key <= 320) return '双鱼座';
  if (key <= 419) return '白羊座'; if (key <= 520) return '金牛座'; if (key <= 621) return '双子座';
  if (key <= 722) return '巨蟹座'; if (key <= 822) return '狮子座'; if (key <= 922) return '处女座';
  if (key <= 1023) return '天秤座'; if (key <= 1122) return '天蝎座'; return '射手座';
}
function personalityFor(pet) {
  const preferences = pet.preferences || { lessons: [], wishes: [] };
  const lesson = preferences.lessons && preferences.lessons.length ? preferences.lessons[preferences.lessons.length - 1].value : '';
  const wish = preferences.wishes && preferences.wishes.length ? preferences.wishes[preferences.wishes.length - 1].value : '';
  const preferenceMap = { 学会勇敢: 'ENTJ', 学会讲冷笑话: 'ENFP', 学会撒娇: 'ESFP', 安静陪伴你: 'INFP', 聪明帮你出主意: 'INTJ', 活泼逗你开心: 'ENFP' };
  const preference = preferenceMap[lesson] || preferenceMap[wish] || '';
  const prototype = pet.prototype === '锦鲤' ? 'ENFP' : 'INFP';
  const randomPool = ['INFP', 'INFJ', 'INTJ', 'INTP', 'ENFP', 'ENFJ', 'ENTJ', 'ENTP', 'ISFP', 'ISFJ', 'ISTJ', 'ISTP', 'ESFP', 'ESFJ', 'ESTJ', 'ESTP'];
  const random = randomPool[parseInt(hash(`${pet._id}-mbti`).slice(0, 8), 16) % randomPool.length];
  const scores = {};
  if (preference) scores[preference] = (scores[preference] || 0) + 60;
  scores[prototype] = (scores[prototype] || 0) + 25;
  scores[random] = (scores[random] || 0) + 15;
  const mbti = Object.keys(scores).sort((a, b) => scores[b] - scores[a] || a.localeCompare(b))[0];
  const descriptions = { ENTJ: '勇敢、有主见，也会把你护在身后。', ENFP: '热烈又古灵精怪，总想逗你开心。', ESFP: '亲近、柔软，很会表达对你的喜欢。', INFP: '温柔、细腻，擅长安静地陪伴。', INTJ: '冷静又聪明，喜欢陪你把事情想清楚。' };
  return { mbti, text: descriptions[mbti] || '有自己的小脾气，也在慢慢学会陪伴你。' };
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  return db.runTransaction(async transaction => {
    const users = await transaction.collection('users').where({ openid: OPENID }).limit(1).get();
    const user = users.data[0];
    if (!user) return { ok: false, code: 'LOGIN_REQUIRED', message: '请重新登录后再试' };
    const pets = await transaction.collection('pets').where({ user_id: user._id, mode: 'live' }).limit(1).get();
    const pet = pets.data[0];
    if (!pet) return { ok: false, code: 'PET_NOT_FOUND', message: '还没有蛋宝宝' };
    if (pet.hatch_card_id) {
      const existing = await transaction.collection('hatch_cards').doc(pet.hatch_card_id).get();
      return { ok: true, created: false, card: existing.data, serverTs: Date.now() };
    }
    const hatchAt = new Date(pet.hatch_at).getTime();
    if (Date.now() < hatchAt) return { ok: false, code: 'TOO_EARLY', message: '还没到预设破壳时间' };
    const birthday = beijingDate(hatchAt);
    const prototypeCode = pet.prototype === '锦鲤' ? 'KOI' : 'RABBIT';
    const personality = personalityFor(pet);
    const card = {
      pet_id: pet._id, user_id: user._id, mode: 'live',
      serial: `EGG-${prototypeCode}-${birthday.replace(/-/g, '')}-${hash(pet._id).slice(0, 6).toUpperCase()}`,
      prototype: pet.prototype, style: pet.prototype === '锦鲤' ? '好运红白款' : '月白桂花款', name: pet.name || pet.prototype,
      birthday, zodiac: zodiac(birthday), gender: pick(`${pet._id}-gender`, ['♀', '♂']), mbti: personality.mbti,
      bloodType: pick(`${pet._id}-blood`, ['A', 'B', 'O', 'AB']), personality: personality.text,
      collectible: pet.limited_batch ? '限定' : '普通', limited_batch: pet.limited_batch || '',
      hatchQuality: (pet.progress || 0) >= 80 ? '完整孵化' : '轻量孵化', originalOwner: user.nickname || '蛋友', created_at: db.serverDate()
    };
    const created = await transaction.collection('hatch_cards').add({ data: card });
    await transaction.collection('pets').doc(pet._id).update({ data: { stage: 'hatched', hatch_card_id: created._id, updated_at: db.serverDate() } });
    return { ok: true, created: true, card: Object.assign({ id: created._id }, card), serverTs: Date.now() };
  });
};
