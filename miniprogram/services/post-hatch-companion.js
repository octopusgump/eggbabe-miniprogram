const config = require('../config/v2');
const runtime = require('./runtime-context');
const timeService = require('./time-service');
const cloudApi = require('./cloud-api');
const storage = require('./storage-migration');
const chatSafety = require('./chat-safety');
const chatService = require('./chat-service');
const lifeScenes = require('../utils/life-scenes');

const STATE_KEY = 'eggbabe_post_hatch_v36';
const SLOT_MS = 5 * 60 * 60 * 1000;
const MOODS = [
  { mood: '平静', line: '今天想把每件小事都慢慢做好。', face: 'quiet' },
  { mood: '好奇', line: '我总觉得窗外又多了一种没见过的颜色。', face: 'curious' },
  { mood: '温暖', line: '今天的光落在身上，很像一条柔软的围巾。', face: 'warm' },
  { mood: '轻快', line: '我走路的时候，脚步好像会自己哼歌。', face: 'bright' }
];

function key() { return runtime.scopedKey(STATE_KEY); }
function readState() {
  const value = storage.read(key(), null);
  if (!value || value.version !== 36) return { version: 36, actions: {}, keepsakes: [], postcards: [] };
  return {
    version: 36,
    actions: value.actions || {},
    keepsakes: Array.isArray(value.keepsakes) ? value.keepsakes : [],
    postcards: Array.isArray(value.postcards) ? value.postcards : []
  };
}
function writeState(value) {
  try { storage.set(key(), value); return { ok: true }; }
  catch (error) { return { ok: false, code: 'LOCAL_WRITE_FAILED', message: '这次没有保存好，请重试' }; }
}
function hash(text) {
  return Array.from(String(text || '')).reduce((result, char) => ((result * 31) + char.charCodeAt(0)) >>> 0, 17);
}
function demoNow() { return Date.now(); }
function businessNow() {
  if (runtime.getMode() === 'demo') return demoNow();
  return timeService.isAuthoritative() ? timeService.now() : 0;
}
function hatchTimestamp(pet) {
  const cardTime = pet && pet.collectionCard && (pet.collectionCard.hatched_at || pet.collectionCard.hatchedAt);
  const candidates = [cardTime, pet && pet.hatchedAt, pet && pet.hatchAt, pet && pet.boundAt, pet && pet.createdAt];
  for (const value of candidates) {
    const parsed = Date.parse(value || '');
    if (Number.isFinite(parsed)) return parsed;
  }
  return hash(pet && pet.id) % SLOT_MS;
}
function slotMeta(pet) {
  const now = businessNow();
  const hatchAt = hatchTimestamp(pet);
  if (!now || !Number.isFinite(hatchAt)) return null;
  const slotIndex = Math.max(0, Math.floor((now - hatchAt) / SLOT_MS));
  const slotStart = hatchAt + slotIndex * SLOT_MS;
  return { slotIndex, slotStart, slotEnd: slotStart + SLOT_MS };
}
function dateKey(timestamp) {
  return new Date(Number(timestamp || businessNow()) + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function moodFor(pet, now) {
  const day = dateKey(now);
  return Object.assign({ businessDate: day, source: 'approved-fallback' }, MOODS[hash(`${pet.id}:${day}`) % MOODS.length]);
}
function normalizeKeepsake(item) {
  const source = item && typeof item === 'object' ? item : {};
  const id = String(source.id || source.keepsake_id || '');
  return Object.assign({}, source, {
    id,
    name: String(source.name || source.title || '一件小东西'),
    story: String(source.story || source.line || ''),
    asset: String(source.asset || source.asset_url || lifeScenes.assets.POST_HATCH.keepsakes[id] || '')
  });
}
function normalizePostcard(item) {
  const source = item && typeof item === 'object' ? item : {};
  const readAt = source.readAt || source.read_at || '';
  const explicitlyUnread = source.unread === true || source.isUnread === true || source.is_unread === true || source.is_read === false || source.read === false;
  return Object.assign({}, source, {
    id: String(source.id || source.postcard_id || ''),
    sceneLabel: String(source.sceneLabel || source.scene_label || ''),
    line: String(source.line || source.story || ''),
    asset: String(source.asset || source.asset_url || ''),
    readAt,
    unread: !readAt && explicitlyUnread
  });
}
function normalizeMemories(memories) {
  const source = memories && typeof memories === 'object' ? memories : {};
  return {
    keepsakes: (Array.isArray(source.keepsakes) ? source.keepsakes : []).map(normalizeKeepsake),
    postcards: (Array.isArray(source.postcards) ? source.postcards : []).map(normalizePostcard),
    cardRecommendation: source.cardRecommendation || source.card_recommendation || null
  };
}
function firstUnreadPostcard(postcards) {
  return (Array.isArray(postcards) ? postcards : []).find(item => item && item.unread) || null;
}
function localSnapshot(pet) {
  const meta = slotMeta(pet);
  if (!meta) return { ok: false, code: 'SERVER_TIME_REQUIRED', message: '正在同步此刻状态，请稍后重试' };
  const state = readState();
  const scene = lifeScenes.stateForSlot(meta.slotIndex, meta.slotStart);
  const actionRecord = scene.atHome ? state.actions[String(meta.slotIndex)] || null : null;
  const memories = normalizeMemories({ keepsakes: state.keepsakes, postcards: state.postcards, cardRecommendation: cardRecommendation(pet) });
  return {
    ok: true,
    mode: runtime.getMode(),
    mood: moodFor(pet, businessNow()),
    currentState: Object.assign({}, scene, meta, {
      actionDone: !!actionRecord,
      actionFeedback: actionRecord ? actionRecord.feedback : ''
    }),
    previewImage: scene.previewImage,
    memories,
    newMessage: firstUnreadPostcard(memories.postcards)
  };
}
function normalizeLiveSnapshot(result) {
  if (!result || !result.ok || result.mode !== 'live' || !result.current_state || !result.mood || typeof result.mood.mood !== 'string') {
    return { ok: false, code: result && result.code || 'POST_HATCH_INVALID', message: result && result.message || '此刻状态没有加载好，请重试' };
  }
  const source = result.current_state;
  if (result.serverTs) timeService.acceptServerTime(result.serverTs);
  const definition = lifeScenes.resolveDefinition(source.major_scene_id, source.small_scene_id);
  const slotStart = Date.parse(source.slot_start);
  const slotEnd = Date.parse(source.slot_end);
  if (!definition || !Number.isFinite(slotStart) || !Number.isFinite(slotEnd) || slotEnd <= slotStart) {
    return { ok: false, code: 'POST_HATCH_INVALID', message: '此刻状态数据不完整，请重试' };
  }
  const state = Object.assign({}, source, definition, {
    // 动作、所在屏和能否说话全部来自审核过的固定映射，服务端不得随机改写。
    line: String(source.line || definition.line),
    slotIndex: Number(source.slot_index),
    slotStart,
    slotEnd,
    actionDone: definition.atHome && !!source.action_done,
    actionFeedback: definition.action ? source.action_feedback || definition.action.feedback : '',
    previewImage: lifeScenes.assets.POST_HATCH.panoramaFallback
  });
  if (!Number.isInteger(state.slotIndex)) {
    return { ok: false, code: 'POST_HATCH_INVALID', message: '此刻状态数据不完整，请重试' };
  }
  const memories = normalizeMemories(result.memories);
  return {
    ok: true,
    mode: 'live',
    mood: result.mood,
    currentState: state,
    previewImage: state.previewImage,
    memories,
    newMessage: firstUnreadPostcard(memories.postcards)
  };
}
function getSnapshot(pet) {
  if (!pet) return Promise.resolve({ ok: false, code: 'PET_REQUIRED', message: '还没有找到蛋宝宝' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    const request = cloudApi.getPostHatchHome(pet.id);
    const normalized = request.then(normalizeLiveSnapshot);
    if (request.abort) normalized.abort = () => request.abort();
    return normalized;
  }
  if (runtime.getMode() !== 'demo') return Promise.resolve({ ok: false, code: 'BACKEND_REQUIRED', message: '破壳后内容服务尚未接入' });
  return Promise.resolve(localSnapshot(pet));
}
function performAction(pet, snapshot) {
  const current = snapshot && snapshot.currentState;
  if (!pet || !current || !current.atHome || !current.action) return Promise.resolve({ ok: false, code: 'ACTION_NOT_AVAILABLE', message: '此刻没有这个动作' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    const requestId = `post-hatch-action-${pet.id}-${current.slotIndex}-${current.action.id}`;
    return cloudApi.performPostHatchAction(pet.id, current.slotIndex, current.action.id, requestId);
  }
  const state = readState();
  const slotKey = String(current.slotIndex);
  if (state.actions[slotKey]) return Promise.resolve({ ok: true, alreadyDone: true, feedback: state.actions[slotKey].feedback, keepsake: null });
  const record = { kind: current.action.kind, actionId: current.action.id, feedback: current.action.feedback, actedAt: businessNow() };
  state.actions[slotKey] = record;
  let keepsake = null;
  if (current.keepsake && !state.keepsakes.some(item => item.id === current.keepsake.id)) {
    keepsake = Object.assign({}, current.keepsake, { appearedAt: businessNow(), sourceScene: current.label });
    state.keepsakes.unshift(keepsake);
  }
  const saved = writeState(state);
  return Promise.resolve(saved.ok ? { ok: true, alreadyDone: false, feedback: record.feedback, keepsake } : saved);
}
function sendSceneMessage(pet, snapshot, text, history) {
  const current = snapshot && snapshot.currentState;
  const value = String(text || '').trim();
  if (!current || !current.canTalk) return Promise.resolve({ ok: false, code: 'TALK_NOT_AVAILABLE', message: '此刻没有说话入口' });
  if (!value) return Promise.resolve({ ok: false, code: 'TALK_EMPTY', message: '先说一句话吧' });
  const assessment = chatSafety.assessInput(value);
  if (!assessment.allowed) return Promise.resolve({ ok: false, code: 'TALK_UNSAFE', message: assessment.message || '换个说法试试' });
  if (assessment.crisis) return Promise.resolve({ ok: true, text: chatSafety.CRISIS_RESPONSE, safety: 'crisis' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    const safeHistory = (Array.isArray(history) ? history : []).slice(-12).map(item => ({
      from: item && (item.from === 'user' || item.role === 'user') ? 'user' : 'assistant',
      text: String(item && (item.text || item.content) || '').slice(0, 500)
    })).filter(item => item.text);
    return chatService.requestReply({ eggId: pet.id, text: value, history: safeHistory, scene: { major: current.major, small: current.key } });
  }
  return Promise.resolve({ ok: true, text: chatService.approvedFallback(snapshot.mood && snapshot.mood.mood), safety: 'approved-fallback' });
}
function cardRecommendation(pet) {
  if (!pet || !pet.collectionCard) return null;
  return { card: pet.collectionCard, line: '今天再看一眼出生那天，光还是落在同一个地方。', source: 'approved-fallback' };
}
function getMemories(pet) {
  if (!pet) return Promise.resolve({ ok: false, code: 'PET_REQUIRED', message: '还没有找到蛋宝宝' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return cloudApi.getPostHatchMemories(pet.id).then(result => {
      if (!result || !result.ok || result.mode !== 'live') return result;
      return Object.assign({ ok: true, mode: 'live' }, normalizeMemories(result));
    });
  }
  if (runtime.getMode() !== 'demo') return Promise.resolve({ ok: false, code: 'BACKEND_REQUIRED', message: '回忆服务尚未接入' });
  const state = readState();
  return Promise.resolve(Object.assign({ ok: true, mode: runtime.getMode() }, normalizeMemories({
    keepsakes: state.keepsakes,
    postcards: state.postcards,
    cardRecommendation: cardRecommendation(pet)
  })));
}

function markPostcardRead(pet, postcardId) {
  if (!pet || !postcardId) return Promise.resolve({ ok: false, code: 'POSTCARD_REQUIRED', message: '没有找到这封明信片' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return Promise.resolve({ ok: false, code: 'POSTCARD_READ_SYNC_REQUIRED', message: '明信片状态正在同步，请稍后重试' });
  }
  if (runtime.getMode() !== 'demo') return Promise.resolve({ ok: false, code: 'BACKEND_REQUIRED', message: '回忆服务尚未接入' });
  const state = readState();
  const postcard = state.postcards.find(item => String(item && item.id || '') === String(postcardId));
  if (!postcard) return Promise.resolve({ ok: false, code: 'POSTCARD_NOT_FOUND', message: '没有找到这封明信片' });
  if (!postcard.unread && postcard.readAt) return Promise.resolve({ ok: true, alreadyRead: true });
  postcard.unread = false;
  postcard.readAt = businessNow();
  const saved = writeState(state);
  return Promise.resolve(saved.ok ? { ok: true, alreadyRead: false } : saved);
}

module.exports = { SLOT_MS, MOODS, slotMeta, getSnapshot, performAction, sendSceneMessage, getMemories, markPostcardRead, normalizeLiveSnapshot };
