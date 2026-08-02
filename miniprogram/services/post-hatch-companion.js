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
  return value && value.version === 36 ? value : { version: 36, actions: {}, keepsakes: [], letters: [], postcards: [], decorations: [], wishes: {} };
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
  const candidates = [cardTime, pet && pet.hatchAt, pet && pet.createdAt];
  for (const value of candidates) {
    const parsed = Date.parse(value || '');
    if (Number.isFinite(parsed)) return parsed;
  }
  return businessNow();
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
function normalizeDecorations(items) {
  const position = (value, fallback, min, max) => {
    const number = Number(value);
    return Math.max(min, Math.min(max, Number.isFinite(number) ? number : fallback));
  };
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const source = item && typeof item === 'object' ? item : {};
    return Object.assign({}, source, {
      id: String(source.id || `decor-${index}`),
      label: String(source.label || '我的小家具'),
      asset: String(source.asset || source.image_url || ''),
      x: position(source.x, 32 + (index % 3) * 20, 12, 88),
      y: position(source.y, 54 + (index % 2) * 12, 24, 76),
      z: position(source.z, index + 1, 1, 50),
      renderZ: 4 + position(source.z, index + 1, 1, 50)
    });
  });
}
function deliverReplies(state) {
  let changed = false;
  state.letters.forEach(letter => {
    if (letter.direction !== 'out' || letter.replyDelivered) return;
    letter.replyDelivered = true;
    state.postcards.unshift({
      id: `reply-${letter.id}`,
      direction: 'in',
      sceneLabel: letter.sceneLabel,
      sentAt: letter.sentAt,
      deliveredAt: businessNow(),
      line: `我收到你的信了。${letter.sceneLabel}的风很远，你写的字却像在我旁边。`,
      asset: ''
    });
    changed = true;
  });
  return changed;
}
function deliverAwayKeepsakes(state, scene) {
  if (!scene.atHome) return false;
  const pending = state.letters.filter(letter => letter.direction === 'out' && letter.keepsake && !letter.keepsakeDelivered);
  pending.forEach(letter => {
    letter.keepsakeDelivered = true;
    if (!state.keepsakes.some(item => item.id === letter.keepsake.id)) {
      state.keepsakes.unshift(Object.assign({}, letter.keepsake, { appearedAt: businessNow(), sourceScene: letter.sceneLabel }));
    }
  });
  return pending.length > 0;
}
function localSnapshot(pet) {
  const meta = slotMeta(pet);
  if (!meta) return { ok: false, code: 'SERVER_TIME_REQUIRED', message: '正在同步此刻状态，请稍后重试' };
  const state = readState();
  const scene = lifeScenes.stateForSlot(meta.slotIndex, meta.slotStart);
  const repliesChanged = deliverReplies(state);
  const keepsakesChanged = deliverAwayKeepsakes(state, scene);
  const changed = repliesChanged || keepsakesChanged;
  if (changed) {
    const saved = writeState(state);
    if (!saved.ok) return saved;
  }
  const actionRecord = state.actions[String(meta.slotIndex)] || null;
  return {
    ok: true,
    mode: runtime.getMode(),
    mood: moodFor(pet, meta.slotStart),
    currentState: Object.assign({}, scene, meta, {
      actionDone: !!actionRecord,
      actionFeedback: actionRecord ? actionRecord.feedback : '',
      letterSent: !!(actionRecord && actionRecord.kind === 'letter')
    }),
    previewImage: scene.previewImage,
    memories: { keepsakes: state.keepsakes, postcards: state.postcards, cardRecommendation: cardRecommendation(pet) },
    decorations: normalizeDecorations(state.decorations)
  };
}
function normalizeLiveSnapshot(result) {
  if (!result || !result.ok || result.mode !== 'live' || !result.current_state || !result.mood || typeof result.mood.mood !== 'string') {
    return { ok: false, code: result && result.code || 'POST_HATCH_INVALID', message: result && result.message || '此刻状态没有加载好，请重试' };
  }
  const source = result.current_state;
  const actionSource = source.action || {};
  const screenValue = source.screen_index !== undefined ? source.screen_index : source.screen;
  const actionScreenValue = actionSource.screen_index !== undefined ? actionSource.screen_index : actionSource.screen;
  const state = Object.assign({}, source, {
    key: source.small_scene_id,
    major: source.major_scene_id,
    majorLabel: source.major_scene_label,
    label: source.small_scene_label,
    line: source.line,
    screen: Number(screenValue !== undefined ? screenValue : 1),
    atHome: source.major_scene_id === 'home',
    canTalk: source.major_scene_id === 'home' && !!source.can_talk,
    action: {
      id: actionSource.id || actionSource.action_id || source.action_id || '',
      kind: actionSource.kind || actionSource.action_kind || source.action_kind || '',
      screen: Number(actionScreenValue !== undefined ? actionScreenValue : screenValue !== undefined ? screenValue : 1),
      feedback: actionSource.feedback || source.action_feedback || ''
    },
    slotIndex: source.slot_index,
    slotStart: Date.parse(source.slot_start),
    slotEnd: Date.parse(source.slot_end),
    actionDone: !!source.action_done,
    letterSent: !!source.letter_sent,
    previewImage: source.preview_image || lifeScenes.assets.POST_HATCH.panoramaFallback
  });
  if (!['home', 'travel', 'work', 'school'].includes(state.major)
    || !state.key || !state.label || !state.action.id || !state.action.kind
    || !Number.isFinite(state.slotStart) || !Number.isFinite(state.slotEnd)
    || state.slotEnd <= state.slotStart) {
    return { ok: false, code: 'POST_HATCH_INVALID', message: '此刻状态数据不完整，请重试' };
  }
  return { ok: true, mode: 'live', mood: result.mood, currentState: state, previewImage: state.previewImage, memories: result.memories || { keepsakes: [], postcards: [], cardRecommendation: null }, decorations: normalizeDecorations(result.decorations) };
}
function getSnapshot(pet) {
  if (!pet) return Promise.resolve({ ok: false, code: 'PET_REQUIRED', message: '还没有找到蛋宝宝' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return cloudApi.getPostHatchHome(pet.id).then(normalizeLiveSnapshot);
  }
  if (runtime.getMode() !== 'demo') return Promise.resolve({ ok: false, code: 'BACKEND_REQUIRED', message: '破壳后内容服务尚未接入' });
  return Promise.resolve(localSnapshot(pet));
}
function performAction(pet, snapshot) {
  const current = snapshot && snapshot.currentState;
  if (!pet || !current || !current.atHome) return Promise.resolve({ ok: false, code: 'ACTION_NOT_AVAILABLE', message: '此刻没有这个动作' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return cloudApi.performPostHatchAction(pet.id, current.slotIndex, current.action.id);
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
function sendLetter(pet, snapshot, text) {
  const current = snapshot && snapshot.currentState;
  const value = String(text || '').trim();
  if (!current || current.atHome) return Promise.resolve({ ok: false, code: 'LETTER_NOT_AVAILABLE', message: 'ta 现在就在家里' });
  if (!value) return Promise.resolve({ ok: false, code: 'LETTER_EMPTY', message: '写一句话再寄出吧' });
  if (Array.from(value).length > 120) return Promise.resolve({ ok: false, code: 'LETTER_TOO_LONG', message: '这封信最多写 120 个字' });
  const assessment = chatSafety.assessInput(value);
  if (!assessment.allowed || assessment.crisis) return Promise.resolve({ ok: false, code: 'LETTER_UNSAFE', message: assessment.message || '换个说法试试' });
  if (runtime.getMode() === 'live' && config.backendEnabled) return cloudApi.sendPostHatchLetter(pet.id, current.slotIndex, value);
  const state = readState();
  const slotKey = String(current.slotIndex);
  if (state.actions[slotKey]) return Promise.resolve({ ok: true, alreadyDone: true, feedback: state.actions[slotKey].feedback });
  const letter = {
    id: `letter-${pet.id}-${current.slotIndex}`,
    direction: 'out', slotIndex: current.slotIndex, sceneLabel: `${current.majorLabel} · ${current.label}`,
    text: value, sentAt: businessNow(), replyDelivered: false, keepsakeDelivered: false, keepsake: current.keepsake
  };
  state.letters.unshift(letter);
  state.actions[slotKey] = { kind: 'letter', feedback: current.action.feedback, actedAt: letter.sentAt };
  const saved = writeState(state);
  return Promise.resolve(saved.ok ? { ok: true, alreadyDone: false, feedback: current.action.feedback } : saved);
}
function sendSceneMessage(pet, snapshot, text) {
  const current = snapshot && snapshot.currentState;
  const value = String(text || '').trim();
  if (!current || !current.canTalk) return Promise.resolve({ ok: false, code: 'TALK_NOT_AVAILABLE', message: '此刻没有说话入口' });
  if (!value) return Promise.resolve({ ok: false, code: 'TALK_EMPTY', message: '先说一句话吧' });
  const assessment = chatSafety.assessInput(value);
  if (!assessment.allowed) return Promise.resolve({ ok: false, code: 'TALK_UNSAFE', message: assessment.message || '换个说法试试' });
  if (assessment.crisis) return Promise.resolve({ ok: true, text: chatSafety.CRISIS_RESPONSE, safety: 'crisis' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return chatService.requestReply({ eggId: pet.id, text: value, history: [], scene: { major: current.major, small: current.key } });
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
    return cloudApi.getPostHatchMemories(pet.id).then(result => result && result.ok ? {
      ok: true,
      mode: 'live',
      keepsakes: Array.isArray(result.keepsakes) ? result.keepsakes : [],
      postcards: Array.isArray(result.postcards) ? result.postcards : [],
      cardRecommendation: result.cardRecommendation || result.card_recommendation || null
    } : result);
  }
  if (runtime.getMode() !== 'demo') return Promise.resolve({ ok: false, code: 'BACKEND_REQUIRED', message: '回忆服务尚未接入' });
  const state = readState();
  return Promise.resolve({ ok: true, mode: runtime.getMode(), keepsakes: state.keepsakes, postcards: state.postcards, cardRecommendation: cardRecommendation(pet) });
}
function localDecorationState() {
  const state = readState();
  const today = dateKey();
  const used = Number(state.wishes[today] || 0);
  return { ok: true, remaining: Math.max(0, 3 - used), decorations: state.decorations };
}
function getDecorationState(pet) {
  if (!pet) return Promise.resolve({ ok: false, code: 'PET_REQUIRED', message: '还没有找到蛋宝宝' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return cloudApi.getPostHatchDecorations(pet.id).then(result => result && result.ok ? {
      ok: true,
      mode: 'live',
      remaining: Number(result.remaining !== undefined ? result.remaining : result.remaining_wishes || 0),
      decorations: normalizeDecorations(result.decorations)
    } : result);
  }
  if (runtime.getMode() !== 'demo') return Promise.resolve({ ok: false, code: 'BACKEND_REQUIRED', message: '装扮服务尚未接入' });
  const local = localDecorationState();
  return Promise.resolve(Object.assign({}, local, { decorations: normalizeDecorations(local.decorations) }));
}
function createDecoration(pet, sketchSummary) {
  const value = String(sketchSummary || '').trim();
  if (!value) return Promise.resolve({ ok: false, code: 'SKETCH_EMPTY', message: '先画一点什么吧' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return cloudApi.createRoomDecoration(pet.id, value).then(result => {
      if (!result || !result.ok) return result;
      const decoration = normalizeDecorations([result.decoration])[0];
      if (!result.decoration || !decoration.asset) return { ok: false, code: 'DECORATION_INVALID', message: '生成结果没有准备好，请重试' };
      return {
        ok: true,
        mode: 'live',
        decoration,
        remaining: Number(result.remaining !== undefined ? result.remaining : result.remaining_wishes || 0)
      };
    });
  }
  if (runtime.getMode() !== 'demo') return Promise.resolve({ ok: false, code: 'BACKEND_REQUIRED', message: '绘画转译服务尚未接入' });
  const state = readState();
  const today = dateKey();
  const used = Number(state.wishes[today] || 0);
  if (used >= 3) return Promise.resolve({ ok: false, code: 'DAILY_LIMIT', message: '今天的许愿次数用完了' });
  const decoration = { id: `decor-${today}-${used + 1}`, label: `我的小家具 ${used + 1}`, placeholder: true, x: 32 + used * 20, y: 56 + (used % 2) * 10, z: used + 1, renderZ: used + 5, createdAt: businessNow() };
  state.wishes[today] = used + 1;
  state.decorations.push(decoration);
  const saved = writeState(state);
  return Promise.resolve(saved.ok ? { ok: true, decoration, remaining: 2 - used } : saved);
}

function moveDecoration(pet, decorationId, x, y, z) {
  const normalized = normalizeDecorations([{ id: decorationId, x, y, z }])[0];
  if (!pet || !decorationId) return Promise.resolve({ ok: false, code: 'DECORATION_REQUIRED', message: '没有找到这件装饰' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return cloudApi.moveRoomDecoration(pet.id, decorationId, normalized.x, normalized.y, normalized.z);
  }
  if (runtime.getMode() !== 'demo') return Promise.resolve({ ok: false, code: 'BACKEND_REQUIRED', message: '装扮服务尚未接入' });
  const state = readState();
  const index = state.decorations.findIndex(item => item.id === decorationId);
  if (index < 0) return Promise.resolve({ ok: false, code: 'DECORATION_NOT_FOUND', message: '没有找到这件装饰' });
  state.decorations[index] = Object.assign({}, state.decorations[index], { x: normalized.x, y: normalized.y, z: normalized.z, movedAt: businessNow() });
  const saved = writeState(state);
  return Promise.resolve(saved.ok ? { ok: true, x: normalized.x, y: normalized.y, z: normalized.z } : saved);
}

module.exports = { SLOT_MS, MOODS, slotMeta, getSnapshot, performAction, sendLetter, sendSceneMessage, getMemories, getDecorationState, createDecoration, moveDecoration };
