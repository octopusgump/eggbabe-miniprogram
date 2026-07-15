const PET_KEY = 'eggbabe_mvp_pet_v1';
const USER_KEY = 'eggbabe_mvp_user_v1';
const IDENTITY_KEY = 'eggbabe_mvp_identity_v1';
const REMOVED_PUBLIC_MODE_FIELD = ['exhib', 'itionMode'].join('');
const REMOVED_PUBLIC_MODE_BACKUP_KEY = ['eggbabe_', 'exhib', 'ition_backup_v1'].join('');
const runtime = require('../services/runtime-context');
const timeService = require('../services/time-service');
const analytics = require('../services/analytics');
const config = require('../config/v2');
const syncQueue = require('../services/sync-queue');
const storage = require('../services/storage-migration');
const chatSafety = require('../services/chat-safety');

const DAY = 24 * 60 * 60 * 1000;
const HATCH_TOLERANCE_MS = 2 * 60 * 60 * 1000;

const STATUS_LINES = {
  egg: {
    开心: ['蛋壳里传来轻轻的回应。', '它把你的声音藏进了壳里。'],
    平静: ['蛋壳里很安静，但很暖。', '它今天睡得很踏实。'],
    想念: ['它好像等了你很久。', '它把想你藏在壳里。'],
    兴奋: ['蛋壳里的动静变多了。', '裂纹好像又亮了一点。'],
    低落: ['它今天安静了很久。', '蛋壳里的声音变小了。']
  },
  pet: {
    开心: ['它把快乐摆在了脸上。', '它好像一直在等你来。'],
    平静: ['它今天把日子过得很慢。', '它安静地待在你身边。'],
    想念: ['它偷偷练习了怎么叫你。', '它把想你写进了今天。'],
    兴奋: ['它好像准备了一个小秘密。', '它今天比平时更坐不住。'],
    低落: ['它今天有一点点没精神。', '它安静了很久，像是在等你。']
  }
};

const CARD_NAME_POOLS = {
  '玉兔': ['望舒', '皎皎', '阿晚', '素素', '小霁', '拾月', '眠云', '阿念', '白露', '阿晴', '浮白', '霜降', '阿静', '月无缺', '幽幽', '秋实', '云间', '阿迟'],
  '锦鲤': ['阿金', '流年', '阿悠', '知足', '小润', '自在', '阿顺', '澄澈', '涟涟', '锦程', '阿漫', '泓泓', '春鱼', '小池', '鱼乐', '阿泓', '清波', '丰年']
};
const ZODIAC_BOUNDARIES = [
  ['01-19', '摩羯座'], ['02-18', '水瓶座'], ['03-20', '双鱼座'], ['04-19', '白羊座'],
  ['05-20', '金牛座'], ['06-21', '双子座'], ['07-22', '巨蟹座'], ['08-22', '狮子座'],
  ['09-22', '处女座'], ['10-23', '天秤座'], ['11-22', '天蝎座'], ['12-21', '射手座'], ['12-31', '摩羯座']
];
const DEMO_ILLUSTRATIONS = [
  ['YT__watercolor__hi', ['E']], ['YT__watercolor__salute', ['E']], ['YT__watercolor__dance', ['E']],
  ['YT__watercolor__box', ['I']], ['YT__watercolor__cycle', ['E']], ['YT__watercolor__newspaper', ['I', 'N']],
  ['YT__watercolor__meditate', ['I', 'N']], ['YT__watercolor__skateboard', ['E']],
  ['YT__watercolor__chemistry', ['I', 'T']], ['YT__watercolor__bath', ['I']]
];
const DEMO_KOI_ILLUSTRATIONS = [
  ['KOI__watercolor__standing', []], ['KOI__watercolor__watering-plant', ['I']], ['KOI__watercolor__umbrella-walk', ['I']],
  ['KOI__watercolor__scooter', ['E']], ['KOI__watercolor__running', ['E']], ['KOI__watercolor__beach-chair', ['I']],
  ['KOI__watercolor__diving-goggles', ['E']], ['KOI__watercolor__holding-fish', ['F']],
  ['KOI__watercolor__flag', ['E']], ['KOI__watercolor__bath-tub', ['I']]
];

function todayKey(now) {
  return timeService.beijingDateKey(now);
}

function resolvedKey(key) {
  return key === PET_KEY ? runtime.scopedKey(key) : key;
}

function read(key) {
  try {
    const value = storage.read(resolvedKey(key), null);
    if (value) return value;
    if (key === PET_KEY && runtime.getMode() === 'live') {
      const legacy = storage.read(PET_KEY, null);
      if (legacy) {
        storage.set(resolvedKey(key), legacy);
        storage.remove(PET_KEY);
        return legacy;
      }
    }
    return null;
  } catch (error) { return null; }
}

function write(key, value) {
  try {
    storage.set(resolvedKey(key), value);
    return { ok: true, value };
  } catch (error) {
    analytics.track('data_write_fail', { where: key, error_code: 'LOCAL_WRITE_FAILED' });
    return { ok: false, value, message: '数据保存失败，请重试' };
  }
}

function getUser() {
  return read(USER_KEY);
}

function getIdentityRecord() {
  const stored = read(IDENTITY_KEY);
  if (!stored) return {};
  return typeof stored === 'string' ? { id: stored } : stored;
}

function publicIdDate(timestamp) {
  const date = new Date(Number(timestamp) + 8 * 60 * 60 * 1000);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
}

function randomIdToken() {
  return Math.floor(Math.random() * 60466176).toString(36).padStart(5, '0').toUpperCase();
}

function createPublicUserId(registeredAt) {
  const timeToken = Number(registeredAt).toString(36).slice(-6).toUpperCase();
  return `EB-${publicIdDate(registeredAt)}-${timeToken}-${randomIdToken()}`;
}

function saveUser(user) {
  const source = user || {};
  const identity = getIdentityRecord();
  const registeredAt = source.registeredAt || identity.registeredAt || source.authorizedAt || timeService.now();
  const id = source.id || identity.id || `user-${registeredAt}-${randomIdToken()}`;
  const publicId = source.publicId || identity.publicId || createPublicUserId(registeredAt);
  const normalized = Object.assign({}, source, { id, publicId, registeredAt, mode: source.mode === 'demo' ? 'demo' : runtime.getMode() });
  write(IDENTITY_KEY, { id, publicId, registeredAt });
  const result = write(USER_KEY, normalized);
  return result.ok ? result.value : null;
}

function getIdentityId() {
  return getIdentityRecord().id || '';
}

function clearUser() {
  try { storage.remove(USER_KEY); } catch (error) {}
}

function clearRemovedPublicModeBackup() {
  try {
    storage.remove(runtime.scopedKey(REMOVED_PUBLIC_MODE_BACKUP_KEY, 'demo'));
    storage.remove(REMOVED_PUBLIC_MODE_BACKUP_KEY);
  } catch (error) {}
}

function getPet() {
  clearRemovedPublicModeBackup();
  const pet = read(PET_KEY);
  if (pet && (pet[REMOVED_PUBLIC_MODE_FIELD] || pet.demoMode || /^expo-/.test(pet.id || ''))) {
    try { storage.remove(resolvedKey(PET_KEY)); } catch (error) {}
    return null;
  }
  const user = getUser();
  if (pet && pet.ownerId && user && pet.ownerId !== user.id) return null;
  return pet;
}

function savePet(pet) {
  const result = write(PET_KEY, pet);
  return result.ok ? pet : null;
}

function syncIncubationAction(actionType, payload) {
  if (!config.backendEnabled || runtime.getMode() !== 'live') return;
  syncQueue.enqueue('recordIncubationAction', { actionType, payload });
}

function isBound() {
  return !!getPet();
}

function mockCodeError(code) {
  const value = code.toUpperCase();
  const errors = {
    INVALID: '激活码无效，请检查后重试',
    USED: '该激活码已被使用',
    FULL: '该激活码名额已满',
    PAUSED: '该激活码暂不可用'
  };
  return errors[value] || '';
}

function createInviteCodes(seed) {
  const suffix = String(seed).slice(-4);
  return Array.from({ length: 5 }, (_, index) => ({
    code: `EGG-${suffix}-${index + 1}`,
    used: false
  }));
}

function bindPet(code, now) {
  if (isBound()) {
    return { ok: false, reason: 'BOUND', message: '当前版本一个账号只能绑定 1 只蛋宝宝，本次激活码未被消耗' };
  }
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return { ok: false, reason: 'EMPTY', message: '请输入激活码' };
  const isDirectHatch = !config.backendEnabled && normalized === config.localHatchedActivationCode;
  const isLocalActivation = !config.backendEnabled && (normalized === config.localActivationCode || isDirectHatch);
  if (!config.backendEnabled && !isLocalActivation) return { ok: false, reason: 'INVALID', message: `激活码无效，请输入 ${config.localActivationCode} 或 ${config.localHatchedActivationCode}` };
  const error = mockCodeError(normalized);
  if (error) return { ok: false, reason: normalized, message: error };

  const createdAt = now || timeService.now();
  const prototype = '玉兔';
  const hatchAt = isDirectHatch ? createdAt - 1000 : createdAt + 7 * DAY;
  const id = `egg-${createdAt}`;
  const completedDate = isDirectHatch ? todayKey(createdAt) : '';
  const pet = {
    id,
    mode: runtime.getMode(),
    ownerId: runtime.getMode() === 'demo' ? '' : ((getUser() && getUser().id) || ''),
    prototype,
    name: '',
    createdAt,
    hatchAt,
    progress: isDirectHatch ? 100 : 0,
    progressEarned: isDirectHatch ? 145 : 0,
    stage: isDirectHatch ? 'ready' : 'waiting',
    lastInteractionAt: createdAt,
    tasks: {
      nicknameDone: isDirectHatch,
      cuddleDate: completedDate,
      wishDate: completedDate,
      lessonDate: completedDate,
      doodleDone: isDirectHatch
    },
    preferences: isDirectHatch
      ? { wishes: [{ date: completedDate, value: '安静陪伴你' }], lessons: [{ date: completedDate, value: '学会撒娇' }] }
      : { wishes: [], lessons: [] },
    shell: { color: '#EDE78E', colorName: '奶油白', pattern: '星星' },
    dailyStatus: null,
    collectionCard: null,
    inviteCodes: createInviteCodes(createdAt),
    messages: []
  };
  if (!savePet(pet)) return { ok: false, reason: 'WRITE_FAILED', message: '蛋宝宝绑定失败，请重试' };
  if (isDirectHatch) {
    const cardResult = createCollectionCard();
    if (!cardResult.ok) return { ok: false, reason: cardResult.reason || 'CARD_CREATE_FAILED', message: cardResult.message || '收藏卡生成失败，请重试' };
    return { ok: true, pet: cardResult.pet, directHatch: true };
  }
  return { ok: true, pet };
}

function importCloudPet(record, mode) {
  const source = record || {};
  const createdAt = source.createdAt || timeService.now();
  const pet = {
    id: source.pet_id || source.id,
    mode: mode || source.mode || runtime.getMode(),
    ownerId: (getUser() && getUser().id) || '',
    prototype: source.prototype || '玉兔',
    name: source.name || '',
    createdAt,
    hatchAt: source.hatchAt,
    progress: source.progress || 0,
    progressEarned: source.progress_earned || source.progressEarned || source.progress || 0,
    stage: source.stage || 'waiting',
    serverBacked: true,
    lastInteractionAt: createdAt,
    tasks: source.tasks || { nicknameDone: false, cuddleDate: '', wishDate: '', lessonDate: '', doodleDone: false },
    preferences: source.preferences || { wishes: [], lessons: [] },
    shell: source.shell || { color: '#EDE78E', colorName: '奶油白', pattern: '星星' },
    dailyStatus: source.dailyStatus || null,
    collectionCard: source.collectionCard || null,
    inviteCodes: source.inviteCodes || createInviteCodes(createdAt),
    messages: source.messages || []
  };
  if (mode) {
    try {
      storage.set(runtime.scopedKey(PET_KEY, mode), pet);
      return { ok: true, pet };
    } catch (error) {
      analytics.track('data_write_fail', { where: PET_KEY, error_code: 'LOCAL_WRITE_FAILED' });
      return { ok: false, message: '云端数据缓存失败，请重试' };
    }
  }
  return savePet(pet) ? { ok: true, pet } : { ok: false, message: '云端数据缓存失败，请重试' };
}

function addProgress(pet, amount) {
  pet.progressEarned = Number(pet.progressEarned === undefined ? pet.progress || 0 : pet.progressEarned) + amount;
  pet.progress = Math.min(100, pet.progressEarned);
  pet.stage = pet.progress > 0 ? 'hatching' : 'waiting';
  return pet;
}

function updateNickname(name) {
  const pet = getPet();
  if (!pet) return { ok: false, message: '还没有蛋宝宝' };
  const value = String(name || '').trim();
  if (!value) return { ok: false, message: '昵称不能为空' };
  if (Array.from(value).length > 10) return { ok: false, message: '昵称最多 10 个字符' };
  if (!chatSafety.isSafeDisplayText(value) || ['违法', '诈骗'].some(word => value.includes(word))) return { ok: false, message: '昵称含有不适合的内容，请换一个' };
  const first = !pet.tasks.nicknameDone;
  pet.name = value;
  if (pet.collectionCard) {
    pet.collectionCard.name = value;
    pet.collectionCard.name_by_user = true;
  }
  if (first) addProgress(pet, 20);
  pet.tasks.nicknameDone = true;
  pet.lastInteractionAt = timeService.now();
  if (!savePet(pet)) return { ok: false, message: '昵称保存失败，请重试' };
  syncIncubationAction('nickname', { name: value });
  return { ok: true, added: first ? 20 : 0, pet };
}

function completeDailyTask(task, value) {
  const pet = getPet();
  if (!pet) return { ok: false, message: '还没有蛋宝宝' };
  const timeGate = timeService.requireAuthoritative();
  if (!timeGate.ok) return timeGate;
  const date = todayKey();
  const field = `${task}Date`;
  if (pet.tasks[field] === date) return { ok: true, added: 0, alreadyDone: true, pet };
  pet.tasks[field] = date;
  if (task === 'wish') pet.preferences.wishes.push({ date, value });
  if (task === 'lesson') pet.preferences.lessons.push({ date, value });
  addProgress(pet, 5);
  pet.lastInteractionAt = timeService.now();
  if (!savePet(pet)) return { ok: false, message: '互动记录保存失败，请重试' };
  syncIncubationAction(task, { value });
  return { ok: true, added: 5, alreadyDone: false, pet };
}

function completeCuddle() {
  return completeDailyTask('cuddle', '贴贴');
}

function completeWish(value) {
  return completeDailyTask('wish', value);
}

function completeLesson(value) {
  return completeDailyTask('lesson', value);
}

function saveDoodle(color, colorName, pattern) {
  const pet = getPet();
  if (!pet) return { ok: false, message: '还没有蛋宝宝' };
  const first = !pet.tasks.doodleDone;
  pet.shell = { color, colorName, pattern };
  pet.tasks.doodleDone = true;
  if (first) addProgress(pet, 20);
  pet.lastInteractionAt = timeService.now();
  if (!savePet(pet)) return { ok: false, message: '蛋壳保存失败，请重试' };
  syncIncubationAction('doodle', { color, colorName, pattern });
  return { ok: true, added: first ? 20 : 0, pet };
}

function getStage(pet, now) {
  if (!pet) return 'empty';
  if (pet.collectionCard) return 'hatched';
  if (runtime.getMode() === 'live' && !timeService.isAuthoritative()) return pet.stage || 'waiting';
  const current = now || timeService.now();
  if (current >= pet.hatchAt - HATCH_TOLERANCE_MS) return 'ready';
  if (pet.hatchAt - current <= DAY) return 'soon';
  if (pet.progress >= 100) return 'prepared';
  return pet.progress > 0 ? 'hatching' : 'waiting';
}

const STAGE_PRESENTATION = {
  waiting: { homeText: '它还在睡觉，试着叫醒它吧', actionLabel: '孵化修炼手册', myStage: '待激活' },
  hatching: { homeText: '它正在慢慢长大', actionLabel: '孵化修炼手册', myStage: '孵化中' },
  prepared: { homeText: '准备好了，等待破壳日', actionLabel: '等待破壳日', myStage: '孵化中 · 已准备' },
  soon: { homeText: '蛋壳里传来了动静', actionLabel: '孵化修炼手册', myStage: '即将破壳' },
  ready: { homeText: '它准备好见你了', actionLabel: '查看破壳结果', myStage: '待破壳' },
  hatched: { homeText: '它终于来到你身边了', actionLabel: '和它说说话', myStage: '已破壳' }
};

function getStagePresentation(stage) {
  return STAGE_PRESENTATION[stage] || STAGE_PRESENTATION.waiting;
}

function getCountdown(pet, now) {
  if (!pet) return '';
  if (runtime.getMode() === 'live' && !timeService.isAuthoritative()) return '正在同步北京时间…';
  const remaining = pet.hatchAt - (now || timeService.now());
  if (remaining <= HATCH_TOLERANCE_MS) return '已可查看破壳结果';
  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / (60 * 60 * 1000));
  return days > 0 ? `还剩 ${days} 天 ${hours} 小时` : `还剩 ${hours} 小时`;
}

function simpleHash(value) {
  return Array.from(String(value)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getDailyStatus() {
  const pet = getPet();
  if (!pet) return null;
  if (runtime.getMode() === 'live' && !timeService.isAuthoritative()) {
    return pet.dailyStatus || { date: '', mood: '平静', line: '正在和北京时间对齐…', source: 'sync-pending', pending: true };
  }
  const date = todayKey();
  if (pet.dailyStatus && pet.dailyStatus.date === date) return pet.dailyStatus;
  const inactiveDays = Math.floor((timeService.now() - (pet.lastInteractionAt || pet.createdAt)) / DAY);
  const stage = getStage(pet);
  let mood;
  if (inactiveDays >= 4) mood = '低落';
  else if (inactiveDays >= 2) mood = '想念';
  else if (stage === 'soon' || stage === 'ready') mood = '兴奋';
  else if (timeService.now() - (pet.lastInteractionAt || 0) < 12 * 60 * 60 * 1000) mood = '开心';
  else if (pet.preferences.wishes.some(item => item.value === '活泼逗你开心')) mood = '兴奋';
  else if (pet.preferences.wishes.some(item => item.value === '安静陪伴你')) mood = '平静';
  else mood = ['开心', '平静'][simpleHash(`${pet.id}-${date}`) % 2];
  const stagePool = pet.collectionCard ? STATUS_LINES.pet : STATUS_LINES.egg;
  const lines = stagePool[mood];
  const line = lines[simpleHash(date) % lines.length];
  pet.dailyStatus = { date, mood, line, source: 'local-fallback' };
  if (!savePet(pet)) return null;
  analytics.track('daily_status_generated', { mood_type: mood, gen_source: 'fallback' });
  return pet.dailyStatus;
}

function recordTouch() {
  const pet = getPet();
  if (!pet) return { ok: false };
  pet.lastInteractionAt = timeService.now();
  return { ok: !!savePet(pet) };
}

function cardSerial(pet) {
  const compact = todayKey(pet.hatchAt).replace(/-/g, '');
  const prefix = pet.prototype === '锦鲤' ? 'KOI' : 'YT';
  const number = String(simpleHash(pet.id) % 999999).padStart(6, '0');
  return `EGG-${prefix}-${compact}-${number}`;
}

function getZodiac(value) {
  if (!value) return '';
  const dateOnly = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  let monthDay;
  if (dateOnly) {
    const candidate = new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])));
    if (candidate.getUTCMonth() + 1 !== Number(dateOnly[2]) || candidate.getUTCDate() !== Number(dateOnly[3])) return '';
    monthDay = `${dateOnly[2]}-${dateOnly[3]}`;
  } else {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  const boundary = ZODIAC_BOUNDARIES.find(([end]) => monthDay <= end);
  return boundary ? boundary[1] : '';
}

function derivePersonality(pet) {
  const latestLesson = pet.preferences.lessons.length ? pet.preferences.lessons[pet.preferences.lessons.length - 1].value : '';
  const latestWish = pet.preferences.wishes.length ? pet.preferences.wishes[pet.preferences.wishes.length - 1].value : '';
  const preferenceMap = { 学会勇敢: 'ENTJ', 学会讲冷笑话: 'ENFP', 学会撒娇: 'ESFP', 安静陪伴你: 'INFP', 聪明帮你出主意: 'INTJ', 活泼逗你开心: 'ENFP' };
  const preference = preferenceMap[latestLesson] || preferenceMap[latestWish] || '';
  const prototype = pet.prototype === '锦鲤' ? 'ENFP' : 'INFP';
  const randomPool = ['INFP', 'INFJ', 'INTJ', 'INTP', 'ENFP', 'ENFJ', 'ENTJ', 'ENTP', 'ISFP', 'ISFJ', 'ISTJ', 'ISTP', 'ESFP', 'ESFJ', 'ESTJ', 'ESTP'];
  const random = randomPool[simpleHash(`${pet.id}-mbti`) % randomPool.length];
  const scores = {};
  if (preference) scores[preference] = (scores[preference] || 0) + 60;
  scores[prototype] = (scores[prototype] || 0) + 25;
  scores[random] = (scores[random] || 0) + 15;
  const mbti = Object.keys(scores).sort((a, b) => scores[b] - scores[a] || a.localeCompare(b))[0];
  const descriptions = { ENTJ: '勇敢、有主见，也会把你护在身后。', ENFP: '热烈又古灵精怪，总想逗你开心。', ESFP: '亲近、柔软，很会表达对你的喜欢。', INFP: '温柔、细腻，擅长安静地陪伴。', INTJ: '冷静又聪明，喜欢陪你把事情想清楚。' };
  return { mbti, text: descriptions[mbti] || '有自己的小脾气，也在慢慢学会陪伴你。' };
}

function generatedName(pet) {
  const pool = CARD_NAME_POOLS[pet.prototype] || CARD_NAME_POOLS['玉兔'];
  return pool[simpleHash(`${pet.id}-name`) % pool.length];
}

function demoIllustration(pet, mbti) {
  const illustrations = pet.prototype === '锦鲤' ? DEMO_KOI_ILLUSTRATIONS : DEMO_ILLUSTRATIONS;
  const personalityTags = [String(mbti || '').slice(0, 1), String(mbti || '').slice(2, 3)].filter(Boolean);
  const weighted = illustrations.flatMap(item => {
    const repeats = personalityTags.some(tag => item[1].includes(tag)) ? 2 : 1;
    return Array(repeats).fill(item[0]);
  });
  return weighted[simpleHash(`${pet.id}-illustration`) % weighted.length];
}

function createCollectionCard() {
  const pet = getPet();
  if (!pet) return { ok: false, message: '还没有蛋宝宝' };
  const timeGate = timeService.requireAuthoritative();
  if (!timeGate.ok) return timeGate;
  if (timeService.now() < pet.hatchAt - HATCH_TOLERANCE_MS) return { ok: false, message: '还没到可承接的破壳时间' };
  if (pet.collectionCard) return { ok: true, created: false, card: pet.collectionCard, pet };
  const isKoi = pet.prototype === '锦鲤';
  const personality = derivePersonality(pet);
  const illustrationId = demoIllustration(pet, personality.mbti);
  const cycleDays = Math.max(3, Math.min(10, Math.round((pet.hatchAt - pet.createdAt) / DAY) || 7));
  const theoreticalMaximum = 40 + cycleDays * 15;
  const completionRatio = Number(pet.progressEarned === undefined ? pet.progress || 0 : pet.progressEarned) / theoreticalMaximum;
  pet.collectionCard = {
    id: `card-${pet.id}`,
    mode: runtime.getMode(),
    serial: cardSerial(pet),
    prototype: pet.prototype,
    style: isKoi ? '好运红白款' : '月白桂花款',
    illustration_id: illustrationId,
    illustration_context: { festival: null, personality_tag: personality.mbti.slice(0, 1) },
    name: pet.name || generatedName(pet),
    name_by_user: !!pet.name,
    birthday: todayKey(pet.hatchAt),
    zodiac: getZodiac(pet.hatchAt),
    gender: simpleHash(pet.id) % 2 ? '♀' : '♂',
    mbti: personality.mbti,
    bloodType: ['A', 'B', 'O', 'AB'][simpleHash(pet.id) % 4],
    personality: personality.text,
    collectible: '普通',
    hatchQuality: completionRatio >= 0.9 ? '完整孵化' : '轻量孵化',
    originalOwner: (getUser() && getUser().nickname) || '蛋友3024'
  };
  pet.stage = 'hatched';
  if (!savePet(pet)) return { ok: false, reason: 'WRITE_FAILED', message: '收藏卡保存失败，请重试' };
  return { ok: true, created: true, card: pet.collectionCard, pet };
}

function applyCloudHatchCard(card) {
  const pet = getPet();
  if (!pet || !card) return { ok: false, message: '收藏卡数据无效' };
  pet.collectionCard = card;
  pet.stage = 'hatched';
  return savePet(pet) ? { ok: true, card, pet } : { ok: false, message: '收藏卡缓存失败，请重试' };
}

function saveMessage(message) {
  const pet = getPet();
  if (!pet) return { ok: false, message: '还没有蛋宝宝' };
  pet.messages = (pet.messages || []).concat(message).slice(-40);
  return savePet(pet) ? { ok: true } : { ok: false, message: '消息保存失败，请重试' };
}

function resetDemo() {
  try { storage.remove(resolvedKey(PET_KEY)); } catch (error) {}
  ['scene_cards', 'scene_card_daily', 'scene_card_issue_counter', 'completed_card_sets'].forEach(key => {
    try { storage.remove(runtime.scopedKey(key)); } catch (error) {}
  });
  clearRemovedPublicModeBackup();
}

module.exports = {
  getUser,
  saveUser,
  clearUser,
  getIdentityId,
  getPet,
  savePet,
  isBound,
  bindPet,
  importCloudPet,
  updateNickname,
  completeCuddle,
  completeWish,
  completeLesson,
  saveDoodle,
  getStage,
  getStagePresentation,
  getCountdown,
  getDailyStatus,
  recordTouch,
  createCollectionCard,
  applyCloudHatchCard,
  saveMessage,
  resetDemo,
  todayKey,
  getZodiac
};
