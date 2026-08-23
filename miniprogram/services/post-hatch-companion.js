const config = require('../config/v2');
const runtime = require('./runtime-context');
const timeService = require('./time-service');
const cloudApi = require('./cloud-api');
const storage = require('./storage-migration');
const chatService = require('./chat-service');
const chatDemoFixture = require('./chat-demo-fixture');
const lifeScenes = require('../utils/life-scenes');
const dailyMoodConfig = require('../config/daily-mood');

const STATE_KEY = 'eggbabe_post_hatch_v36';
const SLOT_MS = 5 * 60 * 60 * 1000;
const CHAT_MAX_UNICODE_CHARACTERS = 120;

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
function defaultChatAccess(status, definition, fields) {
  const current = definition || {};
  const place = [current.majorLabel, current.label].filter(Boolean).join(' · ');
  const defaults = status === 'available'
    ? { reason: 'AT_HOME', message: '' }
    : { reason: status === 'away' ? 'AWAY' : 'UNAVAILABLE', message: place ? `蛋宝宝正在${place}，暂时不能聊天。` : '现在暂时不能聊天，请稍后再试。' };
  return Object.assign({ status, nextAvailableAt: '' }, defaults, fields || {});
}
function demoChatAccess(definition) {
  return definition && definition.canTalk
    ? defaultChatAccess('available', definition)
    : defaultChatAccess('away', definition);
}
function normalizeChatAccess(source, definition) {
  const raw = source && typeof source === 'object' ? source : null;
  const status = String(raw && raw.status || '').toLowerCase();
  const unsynced = () => defaultChatAccess('unavailable', null, {
      reason: 'CHAT_ACCESS_UNSYNCED',
      message: '聊天权限正在同步，请稍后再试。'
    });
  if (!['available', 'away', 'unavailable'].includes(status)) return unsynced();
  const reason = String(raw.reason || '').trim();
  const message = typeof raw.message === 'string' ? raw.message : '';
  if (!reason || (status !== 'available' && !message.trim())) return unsynced();
  const nextValue = raw.next_available_at !== undefined ? raw.next_available_at : raw.nextAvailableAt;
  const nextAvailableAt = nextValue === null || nextValue === undefined || nextValue === '' ? '' : String(nextValue);
  if (nextAvailableAt && !chatService.isAuthoritativeTimestamp(nextAvailableAt)) return unsynced();
  return { status, reason, message, nextAvailableAt };
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
    mood: dailyMoodConfig.mockDailyMood('post-hatch', dailyMoodConfig.DEFAULT_MOOD_TYPE),
    currentState: Object.assign({}, scene, meta, {
      actionDone: !!actionRecord,
      actionFeedback: actionRecord ? actionRecord.feedback : ''
    }),
    // demo 仅为验收模拟服务端合同；正式环境不允许使用这个本地判断放行聊天。
    chatAccess: demoChatAccess(scene),
    previewImage: scene.previewImage,
    memories,
    newMessage: firstUnreadPostcard(memories.postcards)
  };
}
function normalizeLiveSnapshot(result) {
  if (!result || !result.ok || result.mode !== 'live' || !result.current_state) {
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
    // 动作和所在屏来自审核过的固定映射；聊天权限只读服务端 chat_access。
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
  const chatAccess = normalizeChatAccess(result.chat_access || result.chatAccess, definition);
  return {
    ok: true,
    mode: 'live',
    // 每日心情是独立的纯前端静态 UI，不读取接口中的心情字段。
    mood: dailyMoodConfig.mockDailyMood('post-hatch', dailyMoodConfig.DEFAULT_MOOD_TYPE),
    currentState: state,
    chatAccess,
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
function sendSceneMessage(pet, snapshot, text, clientMessageId) {
  const stableId = String(clientMessageId || '');
  if (!pet || !pet.id || !stableId) {
    return Promise.resolve({ ok: false, code: 'CHAT_REQUEST_INVALID', message: '消息请求不完整，请重试' });
  }
  const chatAccess = snapshot && snapshot.chatAccess;
  if (!chatAccess || chatAccess.status !== 'available') {
    return Promise.resolve({ ok: false, code: 'TALK_NOT_AVAILABLE', message: chatAccess && chatAccess.message || '此刻没有说话入口' });
  }
  const value = String(text || '');
  const mode = runtime.getMode();
  if (mode === 'live') {
    return chatService.requestReply({ eggId: pet.id, text: value, clientMessageId: stableId });
  }
  if (mode !== 'demo') return Promise.resolve({ ok: false, code: 'BACKEND_REQUIRED', message: '聊天服务尚未接入' });
  // develop 的 fixture 模拟服务端合同：页面交互可提前禁用空草稿，但最终拒绝仍在服务端。
  if (!value.trim()) return Promise.resolve({ ok: false, mode: 'demo', code: 'INPUT_EMPTY', resultType: 'INPUT_REJECTED', message: '请输入想说的话。' });
  if (Array.from(value).length > CHAT_MAX_UNICODE_CHARACTERS) {
    return Promise.resolve({ ok: false, mode: 'demo', code: 'INPUT_TOO_LONG', resultType: 'INPUT_REJECTED', message: '最多 120 个字，请精简后再发送。' });
  }
  const createdAt = new Date(businessNow()).toISOString();
  const result = {
    ok: true,
    mode: 'demo',
    resultType: 'REPLY',
    requestId: stableId,
    messageId: `demo-reply-${stableId}`,
    userMessageId: `demo-user-${stableId}`,
    clientMessageId: stableId,
    createdAt,
    userCreatedAt: createdAt,
    text: chatDemoFixture.replyFor(),
    safety: 'approved-fallback',
    fallbackUsed: true
  };
  return Promise.resolve(result);
}
function normalizeChatHistoryMessage(item) {
  const source = item && typeof item === 'object' ? item : {};
  const role = String(source.role || '');
  const id = String(source.message_id || source.id || '');
  const text = String(source.text || source.content || '');
  const createdAt = String(source.created_at || source.createdAt || '');
  const clientMessageId = String(source.client_message_id || source.clientMessageId || '');
  if (!id || !['user', 'assistant'].includes(role) || !text.trim() || !chatService.isAuthoritativeTimestamp(createdAt)) return null;
  if (role === 'user' && !clientMessageId) return null;
  return {
    id,
    role,
    text,
    createdAt,
    clientMessageId
  };
}
function getChatHistory(pet, cursor, limit) {
  if (!pet) return Promise.resolve({ ok: false, code: 'PET_REQUIRED', message: '还没有找到蛋宝宝' });
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return cloudApi.getChatHistory(pet.id, cursor, limit).then(result => {
      if (!result || !result.ok) return result || { ok: false, code: 'CHAT_HISTORY_INVALID', message: '聊天记录没有加载好' };
      if (result.mode !== 'live') return { ok: false, code: 'CHAT_HISTORY_INVALID', message: '聊天记录环境标识无效，请重试' };
      if (!Array.isArray(result.messages)) return { ok: false, code: 'CHAT_HISTORY_INVALID', message: '聊天记录数据不完整，请重试' };
      const source = result.messages;
      const pageSize = Math.min(20, Math.max(1, Number(limit) || 20));
      const messages = source.map(normalizeChatHistoryMessage);
      const ids = new Set();
      const hasInvalidMessage = messages.some((item, index) => {
        if (!item || ids.has(item.id)) return true;
        ids.add(item.id);
        if (index === 0) return false;
        return Date.parse(item.createdAt) < Date.parse(messages[index - 1].createdAt);
      });
      const hasMore = result.has_more !== undefined ? result.has_more : result.hasMore;
      const nextCursorValue = result.next_cursor !== undefined ? result.next_cursor : result.nextCursor;
      const nextCursor = nextCursorValue === undefined || nextCursorValue === null ? '' : String(nextCursorValue);
      if (source.length > pageSize || hasInvalidMessage || typeof hasMore !== 'boolean' || (hasMore && !nextCursor)) {
        return { ok: false, code: 'CHAT_HISTORY_INVALID', message: '聊天记录数据不完整，请重试' };
      }
      return {
        ok: true,
        mode: 'live',
        messages,
        nextCursor,
        hasMore
      };
    });
  }
  if (runtime.getMode() !== 'demo') return Promise.resolve({ ok: false, code: 'BACKEND_REQUIRED', message: '聊天记录服务尚未接入' });
  return Promise.resolve({ ok: true, mode: 'demo', messages: [], nextCursor: '', hasMore: false });
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

module.exports = { SLOT_MS, slotMeta, getSnapshot, getChatHistory, performAction, sendSceneMessage, getMemories, markPostcardRead, normalizeLiveSnapshot, normalizeChatHistoryMessage, normalizeChatAccess };
