const PET_KEY = 'eggbabe_ordinary_pet_v228';
const USER_KEY = 'eggbabe_ordinary_user_v228';
const IDENTITY_KEY = 'eggbabe_ordinary_identity_v228';

const runtime = require('../services/runtime-context');
const timeService = require('../services/time-service');
const analytics = require('../services/analytics');
const config = require('../config/v2');
const syncQueue = require('../services/sync-queue');
const storage = require('../services/storage-migration');
const chatSafety = require('../services/chat-safety');
const shellArtService = require('../services/egg-shell-art');

let greetingShownThisSession = false;

function scopedKey(key) {
  return runtime.scopedKey(key);
}

function read(key) {
  try { return storage.read(scopedKey(key), null); }
  catch (error) { return null; }
}

function write(key, value) {
  try {
    storage.set(scopedKey(key), value);
    return { ok: true, value };
  } catch (error) {
    analytics.track('data_write_fail', { where: key, error_code: 'LOCAL_WRITE_FAILED' });
    return { ok: false, value, message: '数据保存失败，请重试' };
  }
}

function getUser() {
  const mode = runtime.getMode();
  const user = read(USER_KEY);
  return user && user.mode === mode && user.id ? user : null;
}

function saveUser(user) {
  const source = user || {};
  const current = getUser() || {};
  const mode = runtime.getMode();
  const id = source.id || current.id || '';
  if (!id) return null;
  const normalized = Object.assign({}, current, source, {
    id,
    publicId: source.publicId || current.publicId || '',
    mode
  });
  write(IDENTITY_KEY, { id: normalized.id, publicId: normalized.publicId, mode });
  const result = write(USER_KEY, normalized);
  return result.ok ? result.value : null;
}

function getIdentityId() {
  const mode = runtime.getMode();
  const identity = read(IDENTITY_KEY);
  return identity && identity.mode === mode ? identity.id || '' : '';
}

function clearUser() {
  try {
    storage.remove(scopedKey(USER_KEY));
    storage.remove(scopedKey(PET_KEY));
    storage.remove(scopedKey(IDENTITY_KEY));
    greetingShownThisSession = false;
  }
  catch (error) {}
}

function normalizeLifecycle(value, hasCard) {
  if (hasCard) return 'HATCHED';
  const stage = String(value || '').toUpperCase();
  const aliases = {
    WAITING: 'RESTING',
    HATCHING: 'RESPONSIVE',
    PREPARED: 'READY',
    SOON: 'READY',
    READY: 'HATCHABLE',
    HATCHED: 'HATCHED',
    EXCEPTION: 'EXCEPTION'
  };
  const normalized = aliases[stage] || stage;
  return ['BOUND', 'RESTING', 'RESPONSIVE', 'READY', 'HATCHABLE', 'HATCHED', 'EXCEPTION'].includes(normalized)
    ? normalized
    : 'RESTING';
}

function getPet() {
  const mode = runtime.getMode();
  const user = getUser();
  const pet = read(PET_KEY);
  if (!user || !pet || pet.mode !== mode || !pet.ownerId || pet.ownerId !== user.id) return null;
  pet.shell = shellArtService.normalizeShellArt(pet.shell);
  pet.lifecycleStage = normalizeLifecycle(pet.lifecycleStage || pet.stage, pet.collectionCard);
  return pet;
}

function savePet(pet) {
  const mode = runtime.getMode();
  const normalized = Object.assign({}, pet, {
    mode,
    lifecycleStage: normalizeLifecycle(pet.lifecycleStage || pet.stage, pet.collectionCard)
  });
  delete normalized.progress;
  delete normalized.progressEarned;
  delete normalized.tasks;
  delete normalized.preferences;
  delete normalized.lastInteractionAt;
  const result = write(PET_KEY, normalized);
  return result.ok ? normalized : null;
}

function isBound() {
  return !!getPet();
}

function bindPet() {
  return {
    ok: false,
    code: 'BACKEND_REQUIRED',
    message: '实体蛋绑定服务尚未接入，请稍后重试'
  };
}

function importCloudPet(record, mode) {
  if (runtime.getMode() !== 'live') return { ok: false, message: 'demo 环境不得导入 live 实体蛋' };
  if (mode && mode !== 'live') return { ok: false, message: '普通版只接受 live 数据' };
  const source = record || {};
  if (source.mode !== 'live') return { ok: false, message: '实体蛋数据缺少 live 标识' };
  const id = source.egg_id || source.pet_id || source.id || source._id;
  if (!id) return { ok: false, message: '实体蛋数据缺少服务端编号' };
  const pet = {
    id,
    mode: 'live',
    ownerId: source.user_id || source.ownerId || ((getUser() && getUser().id) || ''),
    prototype: source.prototype || '玉兔',
    style: source.style || '',
    name: source.display_name || source.name || '',
    createdAt: source.created_at || source.createdAt || '',
    hatchAt: source.hatch_at || source.hatchAt || '',
    lifecycleStage: normalizeLifecycle(source.lifecycle_stage || source.lifecycleStage || source.stage, source.collection_card || source.collectionCard),
    afterSaleStatus: source.after_sale_status || source.afterSaleStatus || '',
    serverBacked: true,
    shell: shellArtService.normalizeShellArt(source.shell || source.creation),
    qualitativeStatus: source.qualitative_status || source.qualitativeStatus || source.dailyStatus || null,
    collectionCard: source.collection_card || source.collectionCard || null,
    inviteCodes: source.invite_codes || source.inviteCodes || [],
    messages: source.messages || [],
    nicknamePromptDismissed: !!source.nicknamePromptDismissed
  };
  return savePet(pet) ? { ok: true, pet } : { ok: false, message: '云端数据缓存失败，请重试' };
}

function importDemoPet(record) {
  if (runtime.getMode() !== 'demo') return { ok: false, message: '仅开发验收模式可以导入 demo 实体蛋' };
  const source = record || {};
  if (source.mode !== 'demo' || !source.id || !source.ownerId) return { ok: false, message: 'demo 实体蛋数据无效' };
  const pet = {
    id: source.id,
    mode: 'demo',
    ownerId: source.ownerId,
    prototype: source.prototype || '玉兔',
    style: source.style || '',
    name: source.name || '',
    createdAt: source.createdAt || '',
    hatchAt: source.hatchAt || '',
    lifecycleStage: normalizeLifecycle(source.lifecycleStage, source.collectionCard),
    serverBacked: false,
    shell: shellArtService.normalizeShellArt(source.shell),
    qualitativeStatus: source.qualitativeStatus || null,
    collectionCard: source.collectionCard || null,
    inviteCodes: [],
    messages: source.messages || [],
    nicknamePromptDismissed: !!source.nicknamePromptDismissed
  };
  return savePet(pet) ? { ok: true, pet } : { ok: false, message: 'demo 实体蛋保存失败，请重试' };
}

function validateNickname(name) {
  const value = String(name || '').trim();
  if (!value) return { ok: false, message: '昵称不能为空' };
  if (Array.from(value).length > 10) return { ok: false, message: '昵称最多 10 个字符' };
  if (!chatSafety.isSafeDisplayText(value)) return { ok: false, message: '昵称含有不适合的内容，请换一个' };
  return { ok: true, value };
}

function applyConfirmedNickname(name) {
  const pet = getPet();
  if (!pet) return { ok: false, message: '还没有蛋宝宝' };
  const validation = validateNickname(name);
  if (!validation.ok) return validation;
  const value = validation.value;
  pet.name = value;
  pet.nicknamePromptDismissed = false;
  if (pet.collectionCard) {
    pet.collectionCard.display_name = value;
    pet.collectionCard.name = value;
  }
  if (!savePet(pet)) return { ok: false, message: '昵称保存失败，请重试' };
  return { ok: true, pet };
}

function shouldPromptNickname() {
  const pet = getPet();
  return !!(pet && !pet.name && !pet.nicknamePromptDismissed);
}

function dismissNicknamePrompt() {
  const pet = getPet();
  if (!pet) return { ok: false, message: '还没有蛋宝宝' };
  pet.nicknamePromptDismissed = true;
  return savePet(pet) ? { ok: true, pet } : { ok: false, message: '状态保存失败，请重试' };
}

function shouldShowDailyGreeting() {
  return !!getPet() && !greetingShownThisSession;
}

function markDailyGreetingShown() {
  greetingShownThisSession = true;
  return { ok: true };
}

function recordCompanionInteraction(interactionType, payload) {
  if (config.backendEnabled && runtime.getMode() === 'live') {
    const pet = getPet();
    syncQueue.enqueue('recordCompanionInteraction', {
      egg_id: pet ? pet.id : '',
      interactionType,
      payload: payload || {}
    });
  }
  return { ok: true, added: 0, pet: getPet() };
}

function completeCuddle() {
  return recordCompanionInteraction('cuddle');
}

function completeWish(value) {
  return recordCompanionInteraction('wish', { text_length: Array.from(String(value || '')).length });
}

function completeLesson(value) {
  return recordCompanionInteraction('lesson', { text_length: Array.from(String(value || '')).length });
}

function completeTalk(value) {
  const text = String(value || '').trim();
  if (!text) return { ok: false, message: '先跟我说一句话吧' };
  if (Array.from(text).length > 50) return { ok: false, message: '最多说 50 个字' };
  const assessment = chatSafety.assessInput(text);
  if (!assessment.allowed || assessment.crisis) return { ok: false, message: assessment.message || '换个说法试试' };
  return recordCompanionInteraction('talk', { text_length: Array.from(text).length });
}

function applyConfirmedDoodle(shellInput, colorName, pattern) {
  const pet = getPet();
  if (!pet) return { ok: false, message: '还没有蛋宝宝' };
  const legacyInput = typeof shellInput === 'string' ? { color: shellInput, colorName, pattern } : shellInput;
  pet.shell = shellArtService.normalizeShellArt(legacyInput);
  if (!savePet(pet)) return { ok: false, message: '蛋壳保存失败，请重试' };
  return { ok: true, added: 0, pet };
}

function getStage(pet) {
  if (!pet) return 'empty';
  const lifecycle = normalizeLifecycle(pet.lifecycleStage || pet.stage, pet.collectionCard);
  const stageMap = {
    BOUND: 'waiting',
    RESTING: 'waiting',
    RESPONSIVE: 'waiting',
    READY: 'soon',
    HATCHABLE: 'ready',
    HATCHED: 'hatched',
    EXCEPTION: 'exception'
  };
  return stageMap[lifecycle] || 'waiting';
}

const STAGE_PRESENTATION = {
  waiting: { homeText: '我正在安静地待着', actionLabel: '', myStage: '等待破壳' },
  soon: { homeText: '我们快见面了', actionLabel: '等待破壳', myStage: '临近破壳' },
  ready: { homeText: '我准备好见你了', actionLabel: '承接破壳', myStage: '待承接' },
  hatched: { homeText: '我终于来到你身边啦', actionLabel: '和我说说话', myStage: '已破壳' },
  exception: { homeText: '需要帮助？可以联系我的守护团队', actionLabel: '', myStage: '需要帮助' }
};

function getStagePresentation(stage) {
  return STAGE_PRESENTATION[stage] || STAGE_PRESENTATION.waiting;
}

function getDailyStatus() {
  const pet = getPet();
  if (!pet || getStage(pet) !== 'hatched') return null;
  return pet.qualitativeStatus || {
    line: '我在窗边待了一会儿。',
    mood: '平静',
    source: 'approved-fallback'
  };
}

function recordTouch() {
  return recordCompanionInteraction('touch');
}

function createCollectionCard() {
  return {
    ok: false,
    code: 'BACKEND_REQUIRED',
    message: '收藏卡需要由实体服务确认后生成'
  };
}

function applyCloudHatchCard(card) {
  if (runtime.getMode() !== 'live') return { ok: false, message: 'demo 环境不得写入 live 收藏卡' };
  const pet = getPet();
  if (!pet || !card || card.mode !== 'live' || String(card.egg_id || '') !== String(pet.id)) return { ok: false, message: '收藏卡数据无效' };
  if (!card.card_id || !card.identity_code || !card.illustration_key || !/^https:\/\//i.test(String(card.illustration_url || ''))) {
    return { ok: false, message: '收藏卡数据不完整' };
  }
  pet.collectionCard = card;
  pet.lifecycleStage = 'HATCHED';
  return savePet(pet) ? { ok: true, card, pet } : { ok: false, message: '收藏卡缓存失败，请重试' };
}

function applyDemoHatchCard(card) {
  const pet = getPet();
  if (runtime.getMode() !== 'demo' || !pet || !card || card.mode !== 'demo' || String(card.egg_id || '') !== String(pet.id)) {
    return { ok: false, message: 'demo 收藏卡数据无效' };
  }
  if (!card.card_id || !card.identity_code || !card.illustration_key || !/^\/assets\//.test(String(card.illustration_url || ''))) {
    return { ok: false, message: 'demo 收藏卡数据不完整' };
  }
  pet.collectionCard = card;
  pet.lifecycleStage = 'HATCHED';
  return savePet(pet) ? { ok: true, card, pet } : { ok: false, message: 'demo 收藏卡保存失败，请重试' };
}

function applyConfirmedConversation(messages) {
  const pet = getPet();
  if (!pet) return { ok: false, message: '还没有蛋宝宝' };
  const source = Array.isArray(messages) ? messages : [];
  const mode = runtime.getMode();
  if (source.some(message => !message || message.mode !== mode)) return { ok: false, message: '对话数据无效' };
  pet.messages = source.map(message => {
    const safeMessage = Object.assign({}, message);
    delete safeMessage.preference;
    return safeMessage;
  }).slice(-40);
  return savePet(pet) ? { ok: true } : { ok: false, message: '消息保存失败，请重试' };
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
  importDemoPet,
  validateNickname,
  applyConfirmedNickname,
  shouldPromptNickname,
  dismissNicknamePrompt,
  shouldShowDailyGreeting,
  markDailyGreetingShown,
  completeCuddle,
  completeWish,
  completeLesson,
  completeTalk,
  applyConfirmedDoodle,
  getStage,
  getStagePresentation,
  getDailyStatus,
  recordTouch,
  createCollectionCard,
  applyCloudHatchCard,
  applyDemoHatchCard,
  applyConfirmedConversation
};
