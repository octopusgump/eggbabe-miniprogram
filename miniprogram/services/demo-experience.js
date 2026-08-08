const config = require('../config/v2');
const runtime = require('./runtime-context');
const petStore = require('../utils/pet-store');

const DEMO_CODE = 'EGGD1';
const DEMO_USER_ID = 'demo-user-v228';
const DEMO_EGG_ID = 'demo-egg-v228';
const DAY_MS = 86400000;
const DEMO_TIMELINE_VERSION = 2;
const PREVIEW_PROTOTYPES = Object.freeze([
  Object.freeze({ key: '玉兔', label: '玉兔', cardCode: 'YT', cardSeries: 'YT-S01', cardFile: 'yt-s01-001.webp' }),
  Object.freeze({ key: '锦鲤', label: '锦鲤', cardCode: 'KOI', cardSeries: 'KOI-S01', cardFile: 'koi-s01-001.webp' })
]);
const PREVIEW_STAGES = Object.freeze([
  { key: 'day1', label: '第 1 天', day: 1 },
  { key: 'day2', label: '第 2 天', day: 2 },
  { key: 'day3', label: '第 3 天', day: 3 },
  { key: 'day4', label: '第 4 天', day: 4 },
  { key: 'day5', label: '第 5 天', day: 5 },
  { key: 'day6', label: '第 6 天', day: 6 },
  { key: 'day7', label: '第 7 天', day: 7 },
  { key: 'hatched', label: '破壳后', day: 0 }
]);

function allowed() {
  return config.localDemoEnabled && runtime.getMode() === 'demo';
}

function reject() {
  return { ok: false, code: 'DEMO_NOT_ALLOWED', message: '仅微信开发版可以使用本地验收数据' };
}

function previewPrototype(value) {
  const key = String(value || '');
  return PREVIEW_PROTOTYPES.find(item => item.key === key || item.cardCode === key) || null;
}

function bootstrap() {
  if (!allowed()) return reject();
  const existing = petStore.getUser();
  if (existing) return { ok: true, mode: 'demo', user: existing };
  const user = petStore.saveUser({
    id: DEMO_USER_ID,
    publicId: 'EB-DEMO-000001',
    nickname: '开发验收用户',
    avatarUrl: '',
    registeredAt: '2026-07-24T10:00:00+08:00'
  });
  return user ? { ok: true, mode: 'demo', user } : { ok: false, code: 'DEMO_USER_WRITE_FAILED', message: '开发验收用户创建失败' };
}

function redeemActivationCode(code) {
  if (!allowed()) return reject();
  if (String(code || '').trim().toUpperCase() !== DEMO_CODE) {
    return { ok: false, code: 'DEMO_CODE_INVALID', message: `开发验收码为 ${DEMO_CODE}` };
  }
  const user = petStore.getUser();
  if (!user) return { ok: false, code: 'DEMO_USER_REQUIRED', message: '请先完成开发版授权' };
  const existing = petStore.getPet();
  if (existing) return { ok: true, mode: 'demo', pet: normalizeDemoTimeline(existing) };
  const createdAt = demoCreatedAt(1);
  const imported = petStore.importDemoPet({
    id: DEMO_EGG_ID,
    ownerId: user.id,
    mode: 'demo',
    prototype: '玉兔',
    style: '',
    name: '',
    createdAt,
    companionStartedAt: createdAt,
    environmentSeed: DEMO_EGG_ID,
    environmentVersion: 'environment-v1',
    hatchAt: new Date(Date.parse(createdAt) + 7 * DAY_MS).toISOString(),
    demoTimelineVersion: DEMO_TIMELINE_VERSION,
    lifecycleStage: 'RESTING',
    shell: {},
    messages: []
  });
  return imported.ok ? { ok: true, mode: 'demo', pet: imported.pet } : imported;
}

function advanceToHatchable() {
  if (!allowed()) return reject();
  const pet = petStore.getPet();
  if (!pet) return { ok: false, code: 'DEMO_PET_REQUIRED', message: '请先绑定开发验收蛋宝宝' };
  pet.lifecycleStage = 'HATCHABLE';
  const saved = petStore.savePet(pet);
  return saved ? { ok: true, mode: 'demo', pet: saved } : { ok: false, code: 'DEMO_PET_WRITE_FAILED', message: '开发验收状态保存失败' };
}

function demoCreatedAt(day) {
  const beijing = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const dateKey = beijing.toISOString().slice(0, 10);
  const today = Date.parse(`${dateKey}T10:05:00+08:00`);
  return new Date(today - Math.max(0, Number(day || 1) - 1) * DAY_MS).toISOString();
}

// 兼容已保存在开发者工具中的旧演示蛋：旧版使用了固定的历史创建日期，
// 会在今天被误判为已经满足破壳条件。仅重置未破壳的 demo 时间线，不清除昵称和互动记录。
function normalizeDemoTimeline(pet) {
  if (!pet || pet.mode !== 'demo' || pet.collectionCard || pet.lifecycleStage === 'HATCHED') return pet;
  if (Number(pet.demoTimelineVersion) >= DEMO_TIMELINE_VERSION) return pet;
  const createdAt = demoCreatedAt(1);
  pet.createdAt = createdAt;
  pet.companionStartedAt = createdAt;
  pet.hatchAt = new Date(Date.parse(createdAt) + 7 * DAY_MS).toISOString();
  pet.originalHatchAt = pet.hatchAt;
  pet.lifecycleStage = 'RESTING';
  pet.demoPreviewDay = 1;
  pet.demoPreviewStage = 'day1';
  pet.demoPreviewInteractionPoints = 0;
  pet.demoTimelineVersion = DEMO_TIMELINE_VERSION;
  return petStore.savePet(pet) || pet;
}

function demoHatchCard(pet) {
  const prototype = previewPrototype(pet && pet.prototype) || PREVIEW_PROTOTYPES[0];
  return {
    card_id: 'demo-card-v228',
    egg_id: pet.id,
    mode: 'demo',
    prototype: prototype.cardCode,
    prototype_name: prototype.label,
    style: prototype.key === '锦鲤' ? '锦鲤绒面款（开发验收）' : '月白桂花款（开发验收）',
    display_name: pet.name || (prototype.key === '锦鲤' ? '小锦' : '小月'),
    hatched_at: pet.hatchAt || new Date().toISOString(),
    identity_code: `EGG-DEMO-${prototype.cardCode}-000001`,
    source_batch: 'DEMO-ONLY',
    illustration_key: `${prototype.cardSeries}-001-DEMO`,
    illustration_url: `/assets/cards/${prototype.cardSeries}/${prototype.cardFile}`,
    mini_program_code_url: '/assets/tab/egg.png'
  };
}

// DEV-ONLY：切换本地验收角色，绝不进入 live 数据或服务端接口。
function setPreviewPrototype(prototypeKey) {
  if (!allowed()) return reject();
  const pet = petStore.getPet();
  if (!pet) return { ok: false, code: 'DEMO_PET_REQUIRED', message: '请先绑定开发验收蛋宝宝' };
  const prototype = previewPrototype(prototypeKey);
  if (!prototype) return { ok: false, code: 'DEMO_PROTOTYPE_INVALID', message: '测试角色无效' };
  pet.prototype = prototype.key;
  if (pet.collectionCard || pet.lifecycleStage === 'HATCHED') pet.collectionCard = demoHatchCard(pet);
  const saved = petStore.savePet(pet);
  return saved ? { ok: true, mode: 'demo', pet: saved, prototype } : { ok: false, code: 'DEMO_PET_WRITE_FAILED', message: '测试角色保存失败，请重试' };
}

// DEV-ONLY: 首页阶段验收器使用。正式发布前可整体删除此函数与对应 UI。
function setPreviewStage(stageKey) {
  if (!allowed()) return reject();
  const pet = normalizeDemoTimeline(petStore.getPet());
  if (!pet) return { ok: false, code: 'DEMO_PET_REQUIRED', message: '请先绑定开发验收蛋宝宝' };
  const target = PREVIEW_STAGES.find(item => item.key === stageKey);
  if (!target) return { ok: false, code: 'DEMO_STAGE_INVALID', message: '测试阶段无效' };

  if (target.key === 'hatched') {
    pet.hatchAt = new Date().toISOString();
    pet.lifecycleStage = 'HATCHED';
    pet.collectionCard = demoHatchCard(pet);
    pet.demoPreviewDay = 0;
    pet.demoPreviewInteractionPoints = 0;
  } else {
    const createdAt = demoCreatedAt(target.day);
    pet.collectionCard = null;
    pet.lifecycleStage = 'RESTING';
    pet.createdAt = createdAt;
    pet.companionStartedAt = createdAt;
    pet.hatchAt = new Date(Date.parse(createdAt) + 7 * DAY_MS).toISOString();
    pet.originalHatchAt = pet.hatchAt;
    pet.demoPreviewDay = target.day;
    // 第 7 天测试夹具同时模拟累计达标的互动量；第 1～6 天始终不会提前进入待破壳。
    pet.demoPreviewInteractionPoints = target.day === 7 ? 50 : 0;
  }
  pet.demoPreviewStage = target.key;
  pet.demoTimelineVersion = DEMO_TIMELINE_VERSION;
  const saved = petStore.savePet(pet);
  return saved
    ? { ok: true, mode: 'demo', pet: saved, stage: target }
    : { ok: false, code: 'DEMO_PET_WRITE_FAILED', message: '测试阶段保存失败，请重试' };
}

function generateHatchCard() {
  if (!allowed()) return reject();
  const pet = petStore.getPet();
  if (!pet || petStore.getStage(pet) !== 'ready') return { ok: false, code: 'DEMO_HATCH_NOT_READY', message: '请先进入开发验收破壳阶段' };
  const card = demoHatchCard(pet);
  const applied = petStore.applyDemoHatchCard(card);
  return applied.ok ? { ok: true, mode: 'demo', card, pet: applied.pet } : applied;
}

module.exports = {
  DEMO_CODE,
  PREVIEW_PROTOTYPES,
  PREVIEW_STAGES,
  normalizeDemoTimeline,
  bootstrap,
  redeemActivationCode,
  advanceToHatchable,
  setPreviewPrototype,
  setPreviewStage,
  generateHatchCard
};
