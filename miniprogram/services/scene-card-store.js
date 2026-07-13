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

function importCloudCards(cards) {
  const normalized = (cards || []).map(card => Object.assign({}, card, {
    id: card.id || card._id,
    cardId: card.cardId || card.card_key,
    templateId: card.templateId || card.template_id,
    sceneKey: card.sceneKey || card.scene_id,
    pointId: card.pointId || card.point_id,
    obtainedAt: card.obtainedAt || card.obtained_at
  }));
  return write('scene_cards', normalized, 'live');
}

function cacheCloudCard(card) {
  const current = list();
  const normalized = Object.assign({}, card, { id: card.id || card._id, cardId: card.cardId || card.card_key, templateId: card.templateId || card.template_id, sceneKey: card.sceneKey || card.scene_id, pointId: card.pointId || card.point_id });
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

function markSaved(cardId) {
  const result = updateCard(cardId, { saved: true });
  if (result.ok) analytics.track('scene_card_save', { card_id: cardId });
  return result;
}

function markShared(cardId) {
  const result = updateCard(cardId, { shared: true });
  if (result.ok) analytics.track('scene_card_share', { card_id: cardId });
  return result;
}

function collectionSummary(character) {
  const cards = list().filter(card => card.character === character);
  const scenes = sceneConfig.getScenesForCharacter(character).map(scene => {
    const pool = sceneConfig.getCardPool(character, scene.key);
    const owned = new Set(cards.filter(card => card.sceneKey === scene.key || card.scene_id === scene.key).map(card => card.cardId || card.templateId || card.template_id));
    return { sceneKey: scene.key, label: scene.label, owned: pool.filter(item => owned.has(item.cardId)).length, total: pool.length, complete: pool.length > 0 && pool.every(item => owned.has(item.cardId)) };
  });
  const completed = scenes.filter(scene => scene.complete);
  const tracked = read('completed_scene_sets', []);
  const nextTracked = tracked.slice();
  completed.forEach(scene => {
    const setId = `${character}:${scene.sceneKey}`;
    if (nextTracked.includes(setId)) return;
    nextTracked.push(setId);
    analytics.track('card_set_complete', { set_id: setId, set_type: 'single_scene' });
    analytics.track('ecommerce_unlock', { set_id: setId, unlock_sku: 'scene-set-access' });
  });
  if (nextTracked.length !== tracked.length) write('completed_scene_sets', nextTracked);
  return { scenes, completed, unlocked: completed.length > 0, completedCount: completed.length };
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

function localAttemptDrop(sceneKey, pointId, character) {
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
  const card = Object.assign({}, template, {
    id: `${template.cardId}-${obtainedAt}`,
    sceneKey,
    character: character || '玉兔',
    pointId,
    obtainedAt,
    obtainedDate: time.beijingDateKey(obtainedAt),
    mode,
    saved: false,
    shared: false
  });
  const cards = list().concat(card);
  const saved = write('scene_cards', cards);
  if (!saved.ok) return saved;
  state.count += 1;
  write('scene_card_daily', state);
  analytics.track('scene_card_drop', { card_id: card.id, scene_id: sceneKey, character: card.character, rarity: card.rarity, point_id: pointId });
  return { ok: true, dropped: true, card, dailyCount: state.count, dailyLimit: config.sceneCardDailyLimit };
}

function attemptDrop(sceneKey, pointId, character) {
  if (runtime.getMode() === 'live' && config.cloudEnabled) {
    return cloudApi.evaluateSceneCardDrop({ scene_id: sceneKey, point_id: pointId, character }).then(result => {
      if (result.ok && result.dropped) {
        result.card = cacheCloudCard(result.card);
        analytics.track('scene_card_drop', { card_id: result.card.id, scene_id: sceneKey, character, rarity: result.card.rarity, point_id: pointId });
      }
      return result;
    });
  }
  return Promise.resolve(localAttemptDrop(sceneKey, pointId, character));
}

module.exports = { list, importCloudCards, attemptDrop, dailyState, markSaved, markShared, collectionSummary };
