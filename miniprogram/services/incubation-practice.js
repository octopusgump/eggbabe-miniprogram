const cloudApi = require('./cloud-api');
const runtime = require('./runtime-context');
const storage = require('./storage-migration');
const timeService = require('./time-service');
const petStore = require('../utils/pet-store');

const RECORD_KEY = 'eggbabe_incubation_practice_v35';
const DAILY_MODULES = new Set(['touch', 'wish_pool', 'doodle', 'edu_class', 'pre_hatch_talk']);
const ONCE_MODULES = new Set(['nickname', 'heartbeat', 'birth_gift', 'personality_test', 'review']);
const MODULE_POINTS = {
  nickname: 5,
  wish_pool: 4,
  touch: 1,
  doodle: 2,
  edu_class: 5,
  pre_hatch_talk: 1,
  heartbeat: 1,
  birth_gift: 5,
  personality_test: 3,
  review: 1
};
const MODULE_DAY = {
  nickname: 1,
  wish_pool: 1,
  touch: 1,
  doodle: 1,
  edu_class: 2,
  pre_hatch_talk: 3,
  heartbeat: 4,
  birth_gift: 5,
  personality_test: 6,
  review: 7
};

const WISH_QUESTIONS = [
  {
    id: 'WP-001',
    text: '今天与我的蛋宝宝一起……',
    options: [
      { id: '001-A', label: '🐠 去深海潜水' },
      { id: '001-B', label: '☁️ 做个云朵棉花糖 SPA' },
      { id: '001-C', label: '🌙 月光牛奶浴' },
      { id: '001-D', label: '🎠 坐星光旋转木马' },
      { id: '001-E', label: '🌿 听树洞收音机' },
      { id: '001-F', label: '🥐 在面包房打盹' }
    ]
  },
  {
    id: 'WP-N01',
    text: '你希望蛋宝宝破壳后，第一眼看到的“世界”是什么颜色？',
    options: [
      { id: 'N01-A', label: '🌿 森林绿' },
      { id: 'N01-B', label: '🌊 海洋蓝' },
      { id: 'N01-C', label: '🌸 樱花粉' },
      { id: 'N01-D', label: '🌅 夕阳橙' },
      { id: 'N01-E', label: '🌌 星空紫' }
    ]
  },
  {
    id: 'WP-N02',
    text: '你希望蛋宝宝是早睡早起型，还是陪你熬夜型？',
    options: [
      { id: 'N02-A', label: '🐦 早鸟型' },
      { id: 'N02-B', label: '🦉 夜猫型' },
      { id: 'N02-C', label: '🌓 跟随型' }
    ]
  },
  {
    id: 'WP-N03',
    text: '你希望蛋宝宝破壳后，性别是？',
    options: [
      { id: 'N03-A', label: '♂️ 小男孩' },
      { id: 'N03-B', label: '♀️ 小女孩' },
      { id: 'N03-C', label: '🌈 让蛋宝宝自己选' }
    ]
  },
  {
    id: 'WP-N04',
    text: '你更希望蛋宝宝像哪种小生命？',
    options: [
      { id: 'N04-A', label: '🌞 小太阳' },
      { id: 'N04-B', label: '🌙 小月亮' },
      { id: 'N04-C', label: '🌪️ 小风' },
      { id: 'N04-D', label: '🪨 小石头' }
    ]
  },
  {
    id: 'WP-N05',
    text: '你希望蛋宝宝是哪种小动物的灵魂？',
    options: [
      { id: 'N05-A', label: '🐶 小狗型' },
      { id: 'N05-B', label: '🐱 小猫型' },
      { id: 'N05-C', label: '🐰 小兔型' },
      { id: 'N05-D', label: '🦥 小树懒型' }
    ]
  },
  {
    id: 'WP-N06',
    text: '你希望蛋宝宝睁开眼睛时，这个世界是什么味道的？',
    options: [
      { id: 'N06-A', label: '🍃 雨后青草味' },
      { id: 'N06-B', label: '🍞 烤面包味' },
      { id: 'N06-C', label: '🌸 晒过的被子味' },
      { id: 'N06-D', label: '🍊 橘子汽水味' }
    ]
  },
  {
    id: 'WP-N07',
    text: '如果蛋宝宝身体里住着一种天气，你希望是？',
    options: [
      { id: 'N07-A', label: '🌤️ 晴天' },
      { id: 'N07-B', label: '🌧️ 小雨' },
      { id: 'N07-C', label: '⛅ 多云' },
      { id: 'N07-D', label: '🌈 彩虹' }
    ]
  }
];

const EDU_OPTIONS = [
  { id: 'EDU-A', label: '👋 学会打招呼', animation: 'hello', response: '我会打招呼啦，你好呀。' },
  { id: 'EDU-B', label: '🙏 学会说谢谢', animation: 'thanks', response: '我记住啦，谢谢你。' },
  { id: 'EDU-C', label: '😴 学会好好睡觉', animation: 'sleep', response: '我把呼吸放慢一点，晚安。' },
  { id: 'EDU-D', label: '🫧 学会自己洗澡', animation: 'bath', response: '洗得亮晶晶的。' },
  { id: 'EDU-E', label: '🤝 学会分享', animation: 'share', response: '我也想把好东西分给你。' },
  { id: 'EDU-F', label: '🎵 学会哼歌', animation: 'song', response: '嗯哼，我唱得还不错吧。' }
];

function hash(value) {
  return Array.from(String(value || '')).reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 0);
}

function demoDateKey() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function dateKey() {
  if (runtime.getMode() === 'demo') return demoDateKey();
  const required = timeService.requireAuthoritative();
  return required.ok ? timeService.beijingDateKey(required.now) : '';
}

function dayNumber(value) {
  const parsed = Date.parse(`${value || '1970-01-01'}T00:00:00+08:00`);
  return Number.isFinite(parsed) ? Math.floor(parsed / 86400000) : 0;
}

function questionFor(pet, serverDate) {
  const boundDate = String((pet && pet.createdAt) || serverDate || '').slice(0, 10);
  const elapsed = Math.max(0, dayNumber(serverDate) - dayNumber(boundDate));
  return WISH_QUESTIONS[(hash(pet && pet.id) + elapsed) % WISH_QUESTIONS.length];
}

function emptyDemoState() {
  return { records: [], loginDates: [] };
}

function readDemoState() {
  const value = storage.read(runtime.scopedKey(RECORD_KEY), emptyDemoState());
  if (Array.isArray(value)) return { records: value, loginDates: [] };
  return {
    records: Array.isArray(value && value.records) ? value.records : [],
    loginDates: Array.isArray(value && value.loginDates) ? value.loginDates : []
  };
}

function writeDemoState(state) {
  storage.set(runtime.scopedKey(RECORD_KEY), {
    records: (state.records || []).slice(-240),
    loginDates: (state.loginDates || []).slice(-30)
  });
}

function findRecord(records, eggId, module, serverDate, once) {
  return records.find(item => (
    item.egg_id === eggId
    && item.module === module
    && (once || item.server_date === serverDate)
  )) || null;
}

function consecutiveDaysEndingAt(loginDates, serverDate) {
  const unique = Array.from(new Set((loginDates || []).concat(serverDate))).sort((a, b) => dayNumber(a) - dayNumber(b));
  let streak = 0;
  let expected = dayNumber(serverDate);
  for (let index = unique.length - 1; index >= 0; index -= 1) {
    const current = dayNumber(unique[index]);
    if (current > expected) continue;
    if (current !== expected) break;
    streak += 1;
    expected -= 1;
  }
  return streak;
}

function contentDayFor(pet, serverDate, loginDates) {
  const demoPreviewDay = runtime.getMode() === 'demo' ? Number(pet && pet.demoPreviewDay) : 0;
  if (Number.isInteger(demoPreviewDay) && demoPreviewDay >= 1 && demoPreviewDay <= 7) return demoPreviewDay;
  const boundDate = String((pet && pet.createdAt) || serverDate || '').slice(0, 10);
  const naturalDay = Math.max(1, Math.min(7, dayNumber(serverDate) - dayNumber(boundDate) + 1));
  const streak = consecutiveDaysEndingAt(loginDates, serverDate);
  const compressed = streak >= 5 ? 7 : (streak === 4 ? 6 : (streak === 3 ? 4 : streak));
  return Math.max(naturalDay, compressed || 1);
}

function unlockedModules(contentDay) {
  return Object.keys(MODULE_DAY).filter(module => MODULE_DAY[module] <= contentDay);
}

function activePoints(records, eggId) {
  return (records || [])
    .filter(record => record.egg_id === eggId)
    .reduce((total, record) => total + Number(record.incubation_points || MODULE_POINTS[record.module] || 0), 0);
}

function passivePoints(pet, now) {
  const createdAt = Date.parse((pet && pet.createdAt) || '');
  const current = Number(now);
  if (!Number.isFinite(createdAt) || !Number.isFinite(current)) return 0;
  return Math.max(0, Math.min(100, Math.floor((current - createdAt) / 86400000) * 10));
}

function estimatedHatchAt(pet, active) {
  const created = Date.parse((pet && pet.createdAt) || '');
  if (!Number.isFinite(created)) return (pet && pet.hatchAt) || '';
  const passiveDaysNeeded = Math.max(0, Math.ceil((100 - active) / 10));
  return new Date(created + passiveDaysNeeded * 86400000).toISOString();
}

function applyDemoSnapshot(pet, state, serverDate) {
  const active = activePoints(state.records, pet.id);
  const passive = passivePoints(pet, Date.now());
  const total = Math.min(100, active + passive);
  const hatchAt = estimatedHatchAt(pet, active);
  pet.hatchAt = hatchAt;
  if (total >= 100 && petStore.getStage(pet) !== 'hatched') pet.lifecycleStage = 'HATCHABLE';
  petStore.savePet(pet);
  return { active, passive, total, hatchAt };
}

function normalizeResponse(response, fallback) {
  const source = response || {};
  const alreadyDone = source.code === 'already_done' || !!source.already_done;
  return {
    ok: source.ok !== false || alreadyDone,
    code: source.code || (alreadyDone ? 'already_done' : 'recorded'),
    alreadyDone,
    serverDate: source.server_date || fallback.serverDate || '',
    record: source.record || fallback.record || null,
    hatchAt: source.hatch_at || fallback.hatchAt || '',
    pointsAdded: Number(source.incubation_points_added || source.incubation_points || fallback.pointsAdded || 0),
    responseLine: source.response_line || ''
  };
}

function applyLiveLifecycle(response) {
  const current = petStore.getPet();
  if (!current) return null;
  const lifecycle = response && (response.lifecycle_stage || response.lifecycleStage);
  if (lifecycle) current.lifecycleStage = lifecycle;
  else if (response && response.gates && response.gates.incubation_ready && petStore.getStage(current) !== 'hatched') {
    current.lifecycleStage = 'HATCHABLE';
  }
  if (response && response.hatch_at) current.hatchAt = response.hatch_at;
  if (lifecycle || (response && response.hatch_at) || (response && response.gates && response.gates.incubation_ready)) {
    petStore.savePet(current);
  }
  return petStore.getPet();
}

async function getManualState() {
  const pet = petStore.getPet();
  if (!pet) return { ok: false, code: 'EGG_REQUIRED', message: '还没有蛋宝宝' };
  if (runtime.getMode() === 'live') {
    const response = await cloudApi.getIncubationManual(pet.id);
    if (!response.ok) return response;
    const updatedPet = applyLiveLifecycle(response);
    return {
      ok: true,
      pet: updatedPet,
      serverDate: response.server_date || '',
      contentDay: Number(response.content_day || 1),
      unlockedModules: response.unlocked_modules || [],
      records: response.records || [],
      hatchAt: response.hatch_at || pet.hatchAt || '',
      points: response.points || null,
      gates: response.gates || {}
    };
  }
  const serverDate = dateKey();
  const state = readDemoState();
  state.loginDates = Array.from(new Set(state.loginDates.concat(serverDate))).sort();
  writeDemoState(state);
  const contentDay = contentDayFor(pet, serverDate, state.loginDates);
  const snapshot = applyDemoSnapshot(pet, state, serverDate);
  const gift = findRecord(state.records, pet.id, 'birth_gift', '', true);
  const review = findRecord(state.records, pet.id, 'review', '', true);
  return {
    ok: true,
    pet: petStore.getPet(),
    serverDate,
    contentDay,
    unlockedModules: unlockedModules(contentDay),
    records: state.records.filter(record => record.egg_id === pet.id),
    hatchAt: snapshot.hatchAt,
    points: {
      active: snapshot.active,
      passive: snapshot.passive,
      total: snapshot.total
    },
    gates: {
      incubation_ready: snapshot.total >= 100 || petStore.getStage(pet) === 'ready',
      nickname_ready: !!String(pet.name || '').trim(),
      birth_gift_ready: !!gift,
      review_ready: !!review
    }
  };
}

async function getState(module) {
  if (!DAILY_MODULES.has(module)) return { ok: false, code: 'MODULE_INVALID', message: '互动类型无效' };
  const pet = petStore.getPet();
  if (!pet) return { ok: false, code: 'EGG_REQUIRED', message: '还没有蛋宝宝' };
  if (runtime.getMode() === 'live') {
    const response = await cloudApi.getIncubationPractice(pet.id, module);
    if (!response.ok) return response;
    const serverDate = response.server_date || '';
    return {
      ok: true,
      serverDate,
      record: response.record || null,
      question: module === 'wish_pool' ? (response.question || questionFor(pet, serverDate)) : null,
      options: module === 'edu_class' ? (response.options || EDU_OPTIONS) : null
    };
  }
  const manual = await getManualState();
  if (!manual.ok) return manual;
  if (!(manual.unlockedModules || []).includes(module)) {
    return { ok: false, code: 'CONTENT_NOT_AVAILABLE', message: '这里还在安静准备中' };
  }
  const record = findRecord(manual.records, pet.id, module, manual.serverDate, false);
  return {
    ok: true,
    serverDate: manual.serverDate,
    record,
    question: module === 'wish_pool' ? questionFor(pet, manual.serverDate) : null,
    options: module === 'edu_class' ? EDU_OPTIONS : null
  };
}

async function submit(module, input) {
  if (!DAILY_MODULES.has(module)) return { ok: false, code: 'MODULE_INVALID', message: '互动类型无效' };
  const pet = petStore.getPet();
  if (!pet) return { ok: false, code: 'EGG_REQUIRED', message: '还没有蛋宝宝' };
  const payload = input || {};
  if (runtime.getMode() === 'live') {
    const response = await cloudApi.submitIncubationAction(pet.id, module, payload.questionId, payload.optionId, payload);
    if (!response.ok && response.code !== 'already_done') return response;
    applyLiveLifecycle(response);
    return normalizeResponse(response, {});
  }
  const manual = await getManualState();
  if (!(manual.unlockedModules || []).includes(module)) {
    return { ok: false, code: 'CONTENT_NOT_AVAILABLE', message: '这里还在安静准备中' };
  }
  const state = readDemoState();
  const existing = findRecord(state.records, pet.id, module, manual.serverDate, false);
  if (existing) {
    return normalizeResponse({ ok: true, code: 'already_done', record: existing, hatch_at: pet.hatchAt }, { serverDate: manual.serverDate });
  }
  const points = MODULE_POINTS[module];
  const record = {
    record_id: `demo-${pet.id}-${module}-${manual.serverDate}`,
    egg_id: pet.id,
    user_id: pet.ownerId,
    module,
    question_id: payload.questionId || '',
    option_id: payload.optionId || '',
    text_length: Number(payload.textLength || 0),
    server_date: manual.serverDate,
    answered_at: new Date().toISOString(),
    incubation_points: points
  };
  state.records = state.records.concat(record);
  writeDemoState(state);
  const snapshot = applyDemoSnapshot(pet, state, manual.serverDate);
  return normalizeResponse({
    ok: true,
    code: 'recorded',
    record,
    server_date: manual.serverDate,
    hatch_at: snapshot.hatchAt,
    incubation_points_added: points
  }, {});
}

async function submitOnce(module, input) {
  if (!ONCE_MODULES.has(module)) return { ok: false, code: 'MODULE_INVALID', message: '互动类型无效' };
  const pet = petStore.getPet();
  if (!pet) return { ok: false, code: 'EGG_REQUIRED', message: '还没有蛋宝宝' };
  const payload = input || {};
  if (runtime.getMode() === 'live') {
    const response = await cloudApi.submitIncubationAction(pet.id, module, payload.questionId, payload.optionId, payload);
    if (!response.ok && response.code !== 'already_done') return response;
    applyLiveLifecycle(response);
    return normalizeResponse(response, {});
  }
  const manual = await getManualState();
  if (!(manual.unlockedModules || []).includes(module) && module !== 'nickname') {
    return { ok: false, code: 'CONTENT_NOT_AVAILABLE', message: '这里还在安静准备中' };
  }
  const state = readDemoState();
  const existing = findRecord(state.records, pet.id, module, '', true);
  if (existing) return normalizeResponse({ ok: true, code: 'already_done', record: existing, hatch_at: pet.hatchAt }, { serverDate: manual.serverDate });
  const points = MODULE_POINTS[module];
  const record = {
    record_id: `demo-${pet.id}-${module}`,
    egg_id: pet.id,
    user_id: pet.ownerId,
    module,
    question_id: payload.questionId || '',
    option_id: payload.optionId || '',
    server_date: manual.serverDate,
    answered_at: new Date().toISOString(),
    incubation_points: points
  };
  state.records = state.records.concat(record);
  writeDemoState(state);
  const snapshot = applyDemoSnapshot(pet, state, manual.serverDate);
  return normalizeResponse({
    ok: true,
    code: 'recorded',
    record,
    server_date: manual.serverDate,
    hatch_at: snapshot.hatchAt,
    incubation_points_added: points
  }, {});
}

async function getHatchGateState() {
  const state = await getManualState();
  if (!state.ok) return state;
  const gates = state.gates || {};
  return {
    ok: true,
    canStartReview: !!(gates.incubation_ready && gates.nickname_ready && gates.birth_gift_ready),
    canHatch: !!(gates.incubation_ready && gates.nickname_ready && gates.birth_gift_ready && gates.review_ready),
    gates,
    records: state.records || []
  };
}

function optionById(options, id) {
  return (options || []).find(option => option.id === id) || null;
}

module.exports = {
  WISH_QUESTIONS,
  EDU_OPTIONS,
  MODULE_POINTS,
  MODULE_DAY,
  dateKey,
  questionFor,
  contentDayFor,
  unlockedModules,
  getManualState,
  getHatchGateState,
  getState,
  submit,
  submitOnce,
  optionById
};
