const assert = require('assert');

const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const runtime = require('../miniprogram/services/runtime-context');
const petStore = require('../miniprogram/utils/pet-store');
const sceneConfig = require('../miniprogram/utils/exhibition-scenes');
const sceneCards = require('../miniprogram/services/scene-card-store');
const fs = require('fs');
const path = require('path');

async function main() {
  runtime.setMode('live');
  petStore.saveUser({ id: 'test-user', nickname: '测试蛋友', registeredAt: Date.now() });
  const bound = petStore.bindPet('DEMO-KOI', Date.now());
  assert.equal(bound.ok, true, '正式模式应能绑定测试蛋');
  const livePetId = bound.pet.id;

  const demoPet = petStore.startExhibitionDemo();
  assert.equal(runtime.getMode(), 'demo', '展会体验必须切换到 demo');
  assert.equal(demoPet.demoMode, true, '展会宠物必须标记 demoMode');
  assert.notEqual(demoPet.id, livePetId, '展会宠物不得复用正式宠物 ID');

  for (const scene of sceneConfig.getScenesForCharacter('玉兔')) {
    assert.equal(sceneConfig.getCardPool('玉兔', scene.key).length > 0, true, `${scene.label}必须配置场景卡池`);
  }

  await sceneCards.attemptDrop('grass', '小花', '玉兔');
  await sceneCards.attemptDrop('grass', '蝴蝶', '玉兔');
  assert.equal(sceneCards.list().length >= 1, true, '展会第二次互动前必须至少掉落一张场景卡');
  const attemptsBeforeRepeat = sceneCards.dailyState().attempts;
  const repeated = await sceneCards.attemptDrop('grass', '小花', '玉兔');
  assert.equal(repeated.repeated, true, '重复点击同一互动点不得再次参与掉落判定');
  assert.equal(sceneCards.dailyState().attempts, attemptsBeforeRepeat, '重复点击不得增加掉落尝试次数');
  for (let index = 0; index < 20; index += 1) await sceneCards.attemptDrop('grass', `互动${index}`, '玉兔');
  assert.equal(sceneCards.list().length <= 2, true, '场景卡每日掉落不得超过 2 张');
  const firstCard = sceneCards.list()[0];
  assert.equal(sceneCards.markSaved(firstCard.id).ok, true, '场景卡必须可以标记保存');
  assert.equal(sceneCards.list()[0].saved, true, '保存状态必须写入当前模式卡册');

  const scenePage = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/exhibition-scene/exhibition-scene.js'), 'utf8');
  assert.equal(scenePage.includes("petStore.getStage(pet) !== 'hatched'"), true, '正式已破壳宠物进入场景时不得切换到 demo');

  petStore.endExhibitionDemo();
  assert.equal(runtime.getMode(), 'live', '退出展会必须恢复 live');
  assert.equal(petStore.getPet().id, livePetId, '退出展会必须保留原正式宠物');
  console.log('V2 校验通过：数据隔离、角色场景卡池、掉落与每日上限正常。');
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
