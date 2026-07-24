const config = require('../config/v2');
const runtime = require('./runtime-context');
const petStore = require('../utils/pet-store');

const DEMO_CODE = 'DEMO-YT-001';
const DEMO_USER_ID = 'demo-user-v228';
const DEMO_EGG_ID = 'demo-egg-v228';

function allowed() {
  return config.localDemoEnabled && runtime.getMode() === 'demo';
}

function reject() {
  return { ok: false, code: 'DEMO_NOT_ALLOWED', message: '仅微信开发版可以使用本地验收数据' };
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
  if (existing) return { ok: true, mode: 'demo', pet: existing };
  const imported = petStore.importDemoPet({
    id: DEMO_EGG_ID,
    ownerId: user.id,
    mode: 'demo',
    prototype: '玉兔',
    style: '',
    name: '',
    createdAt: '2026-07-24T10:05:00+08:00',
    hatchAt: '2026-07-24T10:30:00+08:00',
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

function generateHatchCard() {
  if (!allowed()) return reject();
  const pet = petStore.getPet();
  if (!pet || petStore.getStage(pet) !== 'ready') return { ok: false, code: 'DEMO_HATCH_NOT_READY', message: '请先进入开发验收破壳阶段' };
  const card = {
    card_id: 'demo-card-v228',
    egg_id: pet.id,
    mode: 'demo',
    prototype: 'YT',
    style: '月白桂花款（开发验收）',
    display_name: pet.name || '小月',
    hatched_at: '2026-07-24T10:30:00+08:00',
    identity_code: 'EGG-DEMO-YT-000001',
    source_batch: 'DEMO-ONLY',
    illustration_key: 'YT-S01-001-DEMO',
    illustration_url: '/assets/cards/YT-S01/yt-s01-001.webp',
    mini_program_code_url: '/assets/tab/egg.png'
  };
  const applied = petStore.applyDemoHatchCard(card);
  return applied.ok ? { ok: true, mode: 'demo', card, pet: applied.pet } : applied;
}

module.exports = {
  DEMO_CODE,
  bootstrap,
  redeemActivationCode,
  advanceToHatchable,
  generateHatchCard
};
