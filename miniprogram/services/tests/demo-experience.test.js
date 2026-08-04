const assert = require('assert');

const storage = new Map();
global.wx = {
  getAccountInfoSync() {
    return { miniProgram: { envVersion: 'develop' } };
  },
  getStorageSync(key) {
    return storage.get(key);
  },
  setStorageSync(key, value) {
    storage.set(key, value);
  },
  removeStorageSync(key) {
    storage.delete(key);
  }
};

const config = require('../../config/v2');
const runtime = require('../runtime-context');
const demoExperience = require('../demo-experience');
const petStore = require('../../utils/pet-store');
const h5Bridge = require('../birth-card-h5');
const incubationPractice = require('../incubation-practice');

assert.equal(config.localDemoEnabled, true, '微信开发版必须启用本地验收模式');
assert.equal(runtime.getMode(), 'demo', '开发版运行时必须使用 demo');

const bootstrap = demoExperience.bootstrap();
assert.equal(bootstrap.ok, true, '开发版授权必须建立 demo 用户');
assert.equal(petStore.getUser().mode, 'demo', 'demo 用户必须明确标记 mode=demo');

assert.equal(demoExperience.DEMO_CODE, 'EGGD1', '开发版下一期固定激活码必须为 EGGD1');
const activation = demoExperience.redeemActivationCode('EGGD1');
assert.equal(activation.ok, true, '开发版激活码必须能绑定固定 demo 实体蛋');
assert.equal(petStore.getPet().mode, 'demo', 'demo 实体蛋必须保存在 demo 命名空间');
assert.equal(petStore.getPet().demoTimelineVersion, 2, '新建 demo 实体蛋必须保存新版时间线标记');
assert.equal(petStore.getStage(petStore.getPet()), 'waiting', '绑定后必须先允许测试孵化期互动');
assert.deepEqual(
  demoExperience.PREVIEW_STAGES.map(item => item.key),
  ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7', 'hatched'],
  '开发验收器必须完整提供理论第 1～7 天和破壳后预览'
);

const previewDay2 = demoExperience.setPreviewStage('day2');
assert.equal(previewDay2.ok, true, '开发验收器必须可以切到第 2 天');
assert.equal(previewDay2.pet.demoPreviewDay, 2, '第 2 天必须写入明确的内容日覆盖值');
assert.equal(incubationPractice.contentDayFor(previewDay2.pet, '2026-08-01', []), 2, '开发验收器必须精确覆盖内容日而非依赖历史登录记录');
assert.equal(petStore.getStage(previewDay2.pet), 'waiting', '第 2 天仍必须属于破壳前阶段');

const previewDay3 = demoExperience.setPreviewStage('day3');
assert.equal(previewDay3.ok, true, '开发验收器必须可以切到第 3 天');
assert.equal(previewDay3.pet.demoPreviewDay, 3, '第 3 天必须写入明确的内容日覆盖值');

['day4', 'day5', 'day6'].forEach((stageKey, index) => {
  const preview = demoExperience.setPreviewStage(stageKey);
  assert.equal(preview.ok, true, `开发验收器必须可以切到第 ${index + 4} 天`);
  assert.equal(preview.pet.demoPreviewDay, index + 4, `第 ${index + 4} 天必须写入明确的内容日覆盖值`);
  assert.equal(preview.pet.demoPreviewInteractionPoints, 0, `第 ${index + 4} 天不得注入破壳互动量`);
  assert.equal(petStore.getStage(preview.pet), 'waiting', `第 ${index + 4} 天不得提前进入待破壳`);
});

const previewDay7 = demoExperience.setPreviewStage('day7');
assert.equal(previewDay7.ok, true, '开发验收器必须可以切到第 7 天');
assert.equal(previewDay7.pet.demoPreviewDay, 7, '第 7 天必须写入明确的内容日覆盖值');
assert.equal(previewDay7.pet.demoPreviewInteractionPoints, 50, '第 7 天验收夹具必须模拟已完成的互动量');
assert.equal(incubationPractice.contentDayFor(previewDay7.pet, '2026-08-01', []), 7, '第 7 天必须固定展示第 7 天内容');

const previewHatched = demoExperience.setPreviewStage('hatched');
assert.equal(previewHatched.ok, true, '开发验收器必须可以直接预览破壳后');
assert.equal(petStore.getStage(previewHatched.pet), 'hatched', '破壳后预览必须进入真实已破壳页面分支');

const previewDay1 = demoExperience.setPreviewStage('day1');
assert.equal(previewDay1.ok, true, '破壳后必须可以返回第 1 天继续验收');
assert.equal(previewDay1.pet.collectionCard, null, '返回破壳前必须清除 demo 收藏卡，避免持续被判定为已破壳');
assert.equal(petStore.getStage(previewDay1.pet), 'waiting', '返回第 1 天后必须恢复破壳前页面');

async function verifyHatchSchedule() {
  const legacyPet = petStore.getPet();
  delete legacyPet.demoTimelineVersion;
  legacyPet.createdAt = '2026-07-24T10:05:00+08:00';
  legacyPet.hatchAt = '2026-07-31T10:05:00+08:00';
  legacyPet.lifecycleStage = 'HATCHABLE';
  petStore.savePet(legacyPet);
  const migratedState = await incubationPractice.getManualState();
  assert.equal(migratedState.contentDay, 1, '旧演示数据必须迁移回第 1 天');
  assert.equal(migratedState.gates.incubation_ready, false, '旧演示数据不得继续显示承接破壳');
  assert.equal(petStore.getStage(migratedState.pet), 'waiting', '旧演示数据迁移后必须清除待破壳状态');

  const nicknameSaved = petStore.applyConfirmedNickname('豆豆');
  assert.equal(nicknameSaved.ok, true, '输入昵称必须可以正常保存');
  const day1State = await incubationPractice.getManualState();
  assert.equal(day1State.gates.incubation_ready, false, '第 1 天输入昵称后不得显示承接破壳');
  assert.equal(petStore.getStage(day1State.pet), 'waiting', '第 1 天输入昵称后必须保持破壳前阶段');

  demoExperience.setPreviewStage('day6');
  const day6State = await incubationPractice.getManualState();
  assert.equal(day6State.gates.incubation_ready, false, '第 6 天即使互动量充足也不得提前承接破壳');
  assert.equal(petStore.getStage(day6State.pet), 'waiting', '第 6 天不得进入待破壳阶段');

  demoExperience.setPreviewStage('day7');
  const day7State = await incubationPractice.getManualState();
  assert.equal(day7State.gates.incubation_ready, true, '第 7 天且互动量达标时必须允许承接破壳');
  assert.equal(petStore.getStage(day7State.pet), 'ready', '第 7 天验收夹具必须进入真实待破壳阶段');
}

verifyHatchSchedule().then(() => {
  const hatch = demoExperience.generateHatchCard();
  assert.equal(hatch.ok, true, '开发版必须生成固定 demo 收藏卡');
  assert.equal(hatch.mode, 'demo', 'demo 收藏卡不得伪装成 live');
  assert.equal(petStore.getStage(petStore.getPet()), 'hatched', '生成收藏卡后必须进入已破壳状态');

  const card = h5Bridge.toH5Card(petStore.getPet());
  assert.equal(card.mode, 'demo', '原生收藏卡必须保留 demo 标识');
  assert.equal(card.illustration_url.startsWith('/assets/'), true, 'demo 收藏卡必须使用本地素材');
  assert.equal(h5Bridge.buildH5Url('https://eggbabe.com/card', card, 'https://api.eggbabe.com'), '', 'demo 收藏卡不得进入正式 H5');

  const keys = Array.from(storage.keys());
  assert.equal(keys.some(key => key.includes('eggbabe_demo_')), true, 'demo 数据必须进入独立命名空间');
  assert.equal(keys.some(key => key.includes('eggbabe_live_')), false, 'demo 流程不得写入 live 命名空间');

  console.log('开发版完整 demo 数据隔离校验通过。');
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
