const runtime = require('./runtime-context');
const time = require('./time-service');
const analytics = require('./analytics');
const config = require('../config/v2');
const sceneConfig = require('../utils/exhibition-scenes');
const cloudApi = require('./cloud-api');
const syncQueue = require('./sync-queue');
const storage = require('./storage-migration');

function key(name, mode) { return runtime.scopedKey(name, mode); }

function read(name, fallback) {
  return storage.read(key(name), fallback);
}

function write(name, value, mode) {
  try {
    storage.set(key(name, mode), value);
    return { ok: true, value };
  } catch (error) {
    analytics.track('data_write_fail', { where: `scene_card.${name}`, error_code: 'LOCAL_WRITE_FAILED' });
    return { ok: false, error: { code: 'LOCAL_WRITE_FAILED', message: '卡片保存失败，请重试' } };
  }
}

function list() { return read('scene_cards', []); }

function normalizeSceneCard(card) {
  return Object.assign({}, card, {
    id: card.id || card._id,
    cardId: card.cardId || card.card_key,
    templateId: card.templateId || card.template_id,
    sceneKey: card.sceneKey || card.scene_id,
    pointId: card.pointId || card.point_id,
    obtainedAt: card.obtainedAt || card.obtained_at,
    setCode: card.setCode || card.set_code,
    setName: card.setName || card.set_name,
    collectorNumber: card.collectorNumber || card.collector_number,
    collectorLabel: card.collectorLabel || card.collector_label,
    checklistNumber: card.checklistNumber || card.checklist_number,
    checklistTotal: card.checklistTotal || card.checklist_total,
    uniqueCode: card.uniqueCode || card.unique_code,
    copyCount: card.copyCount || card.copy_count,
    isNewDefinition: card.isNewDefinition === undefined ? card.is_new_definition : card.isNewDefinition,
    heroAssetId: card.heroAssetId || card.hero_asset_id
  });
}

function importCloudCards(cards) {
  const normalized = (cards || []).map(normalizeSceneCard);
  return write('scene_cards', normalized, 'live');
}

function cacheCloudCard(card) {
  const current = list();
  const normalized = normalizeSceneCard(card);
  if (!current.some(item => item.id === normalized.id)) write('scene_cards', current.concat(normalized));
  return normalized;
}

function updateCard(cardId, changes) {
  const cards = list();
  const index = cards.findIndex(card => card.id === cardId);
  if (index < 0) return { ok: false, message: '没有找到这张卡' };
  cards[index] = Object.assign({}, cards[index], changes);
  const result = write('scene_cards', cards);
  if (result.ok && runtime.getMode() === 'live' && config.cloudEnabled) syncQueue.enqueue('updateSceneCard', { cardId, changes });
  return result.ok ? { ok: true, card: cards[index] } : result;
}

function markShared(cardId) {
  const result = updateCard(cardId, { shared: true });
  if (result.ok) analytics.track('scene_card_share', { card_id: cardId });
  return result;
}

function collectionSummary(character) {
  const set = sceneConfig.getCardSetForCharacter(character);
  if (!set) return { setCode: '', setName: '', slots: [], ownedUnique: 0, total: 0, duplicateCount: 0, complete: false, unlocked: false };
  const definitions = new Set(set.cards.map(card => card.cardId));
  const cards = list().filter(card => card.character === character && definitions.has(card.cardId || card.card_key || card.templateId || card.template_id));
  const slots = set.cards.map(definition => {
    const copies = cards
      .filter(card => (card.cardId || card.card_key || card.templateId || card.template_id) === definition.cardId)
      .map(normalizeSceneCard)
      .map(card => Object.assign({}, card, { obtainedLabel: formatObtainedAt(card.obtainedAt), uniqueCode: card.uniqueCode || card.unique_code || '' }))
      .sort((left, right) => timestamp(right.obtainedAt) - timestamp(left.obtainedAt));
    const latestCopy = copies[0] || null;
    return Object.assign({}, definition, {
      owned: copies.length > 0,
      quantity: copies.length,
      copies,
      latestCopy,
      instanceId: latestCopy ? latestCopy.id : '',
      uniqueCode: latestCopy ? (latestCopy.uniqueCode || latestCopy.unique_code || '') : '',
      obtainedAt: latestCopy ? (latestCopy.obtainedAt || latestCopy.obtained_at || 0) : 0,
      obtainedLabel: latestCopy ? latestCopy.obtainedLabel : ''
    });
  });
  const ownedUnique = slots.filter(slot => slot.owned).length;
  const duplicateCount = slots.reduce((total, slot) => total + Math.max(0, slot.quantity - 1), 0);
  const complete = set.cards.length > 0 && ownedUnique === set.cards.length;
  const tracked = read('completed_card_sets', []);
  if (complete && !tracked.includes(set.setCode)) {
    write('completed_card_sets', tracked.concat(set.setCode));
    analytics.track('card_set_complete', { set_id: set.setCode, set_type: 'checklist' });
    analytics.track('ecommerce_unlock', { set_id: set.setCode, unlock_sku: 'scene-set-access' });
  }
  return { setCode: set.setCode, setName: set.setName, slots, ownedUnique, total: set.cards.length, duplicateCount, complete, unlocked: complete };
}

function dailyState() {
  const date = time.beijingDateKey();
  const state = read('scene_card_daily', null);
  return state && state.date === date ? state : { date, count: 0, attempts: 0, attemptedPoints: [] };
}

function deterministicRoll(seed) {
  const value = Array.from(seed).reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) % 10000, 17);
  return value / 10000;
}

function timestamp(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatObtainedAt(value) {
  const valueTimestamp = timestamp(value);
  if (!valueTimestamp) return '';
  const date = new Date(valueTimestamp);
  const pad = number => String(number).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function snapshotHash(value) {
  const hash = Array.from(String(value)).reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
  return `demo-${hash.toString(16).padStart(8, '0')}`;
}

function nextLocalUniqueCode(character, obtainedAt) {
  const date = time.beijingDateKey(obtainedAt).replace(/-/g, '');
  const state = read('scene_card_issue_counter', { date, count: 0 });
  const next = state.date === date ? Number(state.count || 0) + 1 : 1;
  write('scene_card_issue_counter', { date, count: next });
  const characterCode = character === '锦鲤' ? 'KOI' : 'YT';
  return `EGG-${characterCode}-${date}-${String(next).padStart(6, '0')}`;
}

function localAttemptDrop(sceneKey, pointId, character) {
  const timeGate = time.requireAuthoritative();
  if (!timeGate.ok) return timeGate;
  const state = dailyState();
  state.attemptedPoints = state.attemptedPoints || [];
  const attemptKey = `${sceneKey}:${pointId}`;
  if (state.attemptedPoints.includes(attemptKey)) return { ok: true, dropped: false, repeated: true };
  state.attemptedPoints.push(attemptKey);
  state.attempts += 1;
  if (state.count >= config.sceneCardDailyLimit) {
    write('scene_card_daily', state);
    return { ok: true, dropped: false, capped: true };
  }

  const mode = runtime.getMode();
  const seed = `${time.beijingDateKey()}-${sceneKey}-${pointId}-${state.attempts}-${mode}`;
  const forcedDemoFirstDrop = mode === 'demo' && state.count === 0 && state.attempts >= 2;
  if (!forcedDemoFirstDrop && deterministicRoll(seed) >= config.sceneCardDropRate) {
    write('scene_card_daily', state);
    return { ok: true, dropped: false };
  }

  const pool = sceneConfig.getCardPool(character || '玉兔', sceneKey);
  if (!pool.length) return { ok: true, dropped: false };
  const template = pool[Math.floor(deterministicRoll(`${seed}-card`) * pool.length)];
  const obtainedAt = time.now();
  const uniqueCode = nextLocalUniqueCode(character || '玉兔', obtainedAt);
  const existingCopyCount = list().filter(item => (item.cardId || item.card_key) === template.cardId).length;
  const copyId = `${template.cardId}-${obtainedAt}-${state.attempts}`;
  const cardSnapshotHash = snapshotHash([copyId, uniqueCode, template.cardId, template.setCode, template.collectorNumber, template.treatment, template.heroAssetId, 1, 1].join('|'));
  const card = Object.assign({}, template, {
    id: copyId,
    copyId,
    sceneKey,
    character: character || '玉兔',
    pointId,
    obtainedAt,
    obtainedDate: time.beijingDateKey(obtainedAt),
    issuedAt: obtainedAt,
    issuedMode: mode,
    heroAssetVersion: 1,
    cardTemplateVersion: 1,
    cardSnapshotHash,
    provenanceEvents: [{ type: 'issued', mode, date: time.beijingDateKey(obtainedAt), sceneKey, pointId }],
    uniqueCode,
    copyCount: existingCopyCount + 1,
    isNewDefinition: existingCopyCount === 0,
    mode,
    shared: false
  });
  const cards = list().concat(card);
  const saved = write('scene_cards', cards);
  if (!saved.ok) return saved;
  state.count += 1;
  write('scene_card_daily', state);
  analytics.track('scene_card_drop', { card_id: card.id, card_definition_id: card.cardId, set_code: card.setCode, scene_id: sceneKey, character: card.character, treatment: card.treatment, point_id: pointId });
  return { ok: true, dropped: true, card, dailyCount: state.count, dailyLimit: config.sceneCardDailyLimit };
}

function attemptDrop(sceneKey, pointId, character) {
  if (runtime.getMode() === 'live' && config.cloudEnabled) {
    return cloudApi.evaluateSceneCardDrop({ scene_id: sceneKey, point_id: pointId, character }).then(result => {
      if (result.ok && result.dropped) {
        result.card = cacheCloudCard(result.card);
        analytics.track('scene_card_drop', { card_id: result.card.id, card_definition_id: result.card.cardId, set_code: result.card.setCode || result.card.set_code, scene_id: sceneKey, character, treatment: result.card.treatment || 'BASE', point_id: pointId });
      }
      return result;
    });
  }
  if (runtime.getMode() === 'live') return Promise.resolve({ ok: false, code: 'SERVER_DECISION_REQUIRED', message: '正在连接服务器，请稍后再试' });
  return Promise.resolve(localAttemptDrop(sceneKey, pointId, character));
}

module.exports = { list, importCloudCards, attemptDrop, dailyState, markShared, collectionSummary };
