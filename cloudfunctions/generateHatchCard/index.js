const cloud = require('wx-server-sdk');
const crypto = require('crypto');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const CARD_NAME_POOLS = {
  '玉兔': ['望舒', '皎皎', '阿晚', '素素', '小霁', '拾月', '眠云', '阿念', '白露', '阿晴', '浮白', '霜降', '阿静', '月无缺', '幽幽', '秋实', '云间', '阿迟'],
  '锦鲤': ['阿金', '流年', '阿悠', '知足', '小润', '自在', '阿顺', '澄澈', '涟涟', '锦程', '阿漫', '泓泓', '春鱼', '小池', '鱼乐', '阿泓', '清波', '丰年']
};
const ZODIAC_BOUNDARIES = [
  ['01-19', '摩羯座'], ['02-18', '水瓶座'], ['03-20', '双鱼座'], ['04-19', '白羊座'],
  ['05-20', '金牛座'], ['06-21', '双子座'], ['07-22', '巨蟹座'], ['08-22', '狮子座'],
  ['09-22', '处女座'], ['10-23', '天秤座'], ['11-22', '天蝎座'], ['12-21', '射手座'], ['12-31', '摩羯座']
];
const ILLUSTRATION_POOL = {
  '玉兔': [
    { id: 'YT__watercolor__hi', tags: ['E', 'spring', 'festival'] },
    { id: 'YT__watercolor__salute', tags: ['E', 'spring', 'festival'] },
    { id: 'YT__watercolor__dance', tags: ['E', 'festival'] },
    { id: 'YT__watercolor__box', tags: ['I', 'autumn'] },
    { id: 'YT__watercolor__cycle', tags: ['E', 'summer'] },
    { id: 'YT__watercolor__newspaper', tags: ['I', 'N'] },
    { id: 'YT__watercolor__meditate', tags: ['I', 'N', '中秋', '冬至'] },
    { id: 'YT__watercolor__skateboard', tags: ['E', 'summer'] },
    { id: 'YT__watercolor__chemistry', tags: ['I', 'T'] },
    { id: 'YT__watercolor__bath', tags: ['I', 'winter'] }
  ],
  '锦鲤': []
};

function hash(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function pick(seed, values) { return values[parseInt(hash(seed).slice(0, 8), 16) % values.length]; }
function beijingDate(timestamp) { return new Date(timestamp + 8 * 60 * 60 * 1000).toISOString().slice(0, 10); }
function isValidBirthday(value) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const parsed = new Date(`${text}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text;
}
function zodiac(date) {
  if (!isValidBirthday(date)) return '';
  const monthDay = String(date).slice(5, 10);
  const boundary = ZODIAC_BOUNDARIES.find(([end]) => monthDay <= end);
  return boundary ? boundary[1] : '';
}

function weightedIllustration(seed, prototype, mbti, festival) {
  const pool = ILLUSTRATION_POOL[prototype] || [];
  if (!pool.length) return { id: '', personality_tag: String(mbti || '').slice(0, 1), festival: festival || null };
  const personalityTags = [String(mbti || '').slice(0, 1), String(mbti || '').slice(2, 3)].filter(Boolean);
  const weighted = pool.map(item => {
    const personalityWeight = personalityTags.some(tag => item.tags.includes(tag)) ? 5 : 0;
    const festivalWeight = festival && item.tags.includes(festival) ? 10 : 0;
    return { item, weight: 10 + personalityWeight + festivalWeight };
  });
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = (parseInt(hash(`${seed}-illustration`).slice(0, 8), 16) / 0xffffffff) * total;
  const selected = weighted.find(entry => ((cursor -= entry.weight) <= 0)) || weighted[weighted.length - 1];
  return { id: selected.item.id, personality_tag: personalityTags[0] || '', festival: festival || null };
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
function generatedName(pet) {
  return pick(`${pet._id}-name`, CARD_NAME_POOLS[pet.prototype] || CARD_NAME_POOLS['玉兔']);
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
      if (!existing.data.illustration_id) {
        const migratedIllustration = weightedIllustration(pet._id, pet.prototype, existing.data.mbti, '');
        const migration = { illustration_id: migratedIllustration.id, illustration_context: { festival: null, personality_tag: migratedIllustration.personality_tag }, updated_at: db.serverDate() };
        await transaction.collection('hatch_cards').doc(pet.hatch_card_id).update({ data: migration });
        existing.data = Object.assign({}, existing.data, migration);
      }
      return { ok: true, created: false, card: existing.data, serverTs: Date.now() };
    }
    const hatchAt = new Date(pet.hatch_at).getTime();
    if (Date.now() < hatchAt) return { ok: false, code: 'TOO_EARLY', message: '还没到预设破壳时间' };
    const birthday = beijingDate(hatchAt);
    const prototypeCode = pet.prototype === '锦鲤' ? 'KOI' : 'YT';
    const personality = personalityFor(pet);
    const festivalRows = await transaction.collection('festival_configs').where({ date: birthday, mode: 'live', enabled: true }).limit(1).get();
    const festival = festivalRows.data[0] ? festivalRows.data[0].name : '';
    const illustration = weightedIllustration(pet._id, pet.prototype, personality.mbti, festival);
    const counterId = `${prototypeCode}-${birthday.replace(/-/g, '')}`;
    let dailySequence = 1;
    const counters = await transaction.collection('hatch_card_counters').where({ _id: counterId }).limit(1).get();
    if (counters.data.length) {
      dailySequence = Number(counters.data[0].next_sequence) || 1;
      await transaction.collection('hatch_card_counters').doc(counterId).update({ data: { mode: 'live', next_sequence: dailySequence + 1, updated_at: db.serverDate() } });
    } else {
      await transaction.collection('hatch_card_counters').doc(counterId).set({ data: { mode: 'live', next_sequence: 2, created_at: db.serverDate(), updated_at: db.serverDate() } });
    }
    const card = {
      pet_id: pet._id, user_id: user._id, mode: 'live',
      serial: `EGG-${prototypeCode}-${birthday.replace(/-/g, '')}-${String(dailySequence).padStart(6, '0')}`,
      prototype: pet.prototype, style: pet.prototype === '锦鲤' ? '好运红白款' : '月白桂花款', name: pet.name || generatedName(pet), name_by_user: !!pet.name,
      illustration_id: illustration.id, illustration_context: { festival: illustration.festival, personality_tag: illustration.personality_tag },
      birthday, zodiac: zodiac(birthday), gender: pick(`${pet._id}-gender`, ['♀', '♂']), mbti: personality.mbti,
      bloodType: pick(`${pet._id}-blood`, ['A', 'B', 'O', 'AB']), personality: personality.text,
      collectible: pet.limited_batch ? '限定' : '普通', limited_batch: pet.limited_batch || '',
      hatchQuality: (pet.progress || 0) >= 80 ? '完整孵化' : '轻量孵化', originalOwner: user.nickname || '蛋友',
      hatched_at: new Date(hatchAt + 8 * 60 * 60 * 1000).toISOString().replace('Z', '+08:00'), generated_at: db.serverDate(), created_at: db.serverDate()
    };
    const created = await transaction.collection('hatch_cards').add({ data: card });
    await transaction.collection('pets').doc(pet._id).update({ data: { stage: 'hatched', hatch_card_id: created._id, updated_at: db.serverDate() } });
    return { ok: true, created: true, card: Object.assign({ id: created._id }, card), serverTs: Date.now() };
  });
};
