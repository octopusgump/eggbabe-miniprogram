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
const storageMigration = require('../miniprogram/services/storage-migration');
const fs = require('fs');
const path = require('path');

async function main() {
  const oldBrand = ['egg', 'baby'].join('');
  const oldKey = `${oldBrand}_migration_test_v1`;
  const newKey = 'eggbabe_migration_test_v1';
  wx.setStorageSync(oldKey, { preserved: true });
  assert.deepEqual(storageMigration.read(newKey, null), { preserved: true }, '品牌纠错后必须自动读取旧存储数据');
  assert.deepEqual(wx.getStorageSync(newKey), { preserved: true }, '旧存储数据必须迁移到 eggbabe 新键');
  assert.deepEqual(wx.getStorageSync(oldKey), { preserved: true }, '迁移期必须保留旧键，确保旧版本回退后仍能读取数据');
  const quotaOldKey = `${oldBrand}_quota_test_v1`;
  const quotaNewKey = 'eggbabe_quota_test_v1';
  wx.setStorageSync(quotaOldKey, { stillReadable: true });
  const originalSetStorage = wx.setStorageSync;
  wx.setStorageSync = (key, value) => {
    if (key === quotaNewKey) throw new Error('STORAGE_QUOTA');
    originalSetStorage(key, value);
  };
  assert.deepEqual(storageMigration.read(quotaNewKey, null), { stillReadable: true }, '迁移写入遇到容量限制时仍必须返回旧数据');
  wx.setStorageSync = originalSetStorage;

  runtime.setMode('live');
  const oldScopedPetKey = `${oldBrand}_live_${oldBrand}_mvp_pet_v1_v2`;
  wx.setStorageSync(oldScopedPetKey, { id: 'legacy-pet', ownerId: '', prototype: '玉兔' });
  assert.equal(petStore.getPet().id, 'legacy-pet', '旧品牌命名空间里的宠物数据必须可读取');
  petStore.resetDemo();
  assert.equal(petStore.getPet(), null, '迁移后的数据必须可以正常重置，不能从旧键复活');
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
  assert.equal(scenePage.includes("cardRevealPhase: ''"), true, '场景页必须维护抽卡揭晓阶段');
  assert.equal(scenePage.includes("cardRevealPhase: 'hint'"), true, '卡片出现前必须先进入期待提示阶段');
  assert.equal(scenePage.includes("cardRevealPhase: 'revealed'"), true, '期待提示后必须进入卡面揭晓阶段');
  assert.equal(scenePage.includes('clearTimeout(this.cardRevealTimer)'), true, '离开页面时必须清理抽卡揭晓计时器');
  const sceneTemplate = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/exhibition-scene/exhibition-scene.wxml'), 'utf8');
  assert.equal(sceneTemplate.includes('wx:if="{{cardDrop.image}}"'), true, '掉卡弹层必须优先显示正式卡面图片');
  assert.equal(sceneTemplate.includes('drop-panel--{{cardRevealPhase}}'), true, '掉卡弹层必须绑定揭晓阶段样式');
  const sceneStyles = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/exhibition-scene/exhibition-scene.wxss'), 'utf8');
  assert.equal(sceneStyles.includes('@keyframes drop-card-wait'), true, '抽卡必须有克制的等待动效');
  assert.equal(sceneStyles.includes('.drop-panel--revealed'), true, '抽卡必须有揭晓完成态');

  petStore.endExhibitionDemo();
  assert.equal(runtime.getMode(), 'live', '退出展会必须恢复 live');
  assert.equal(petStore.getPet().id, livePetId, '退出展会必须保留原正式宠物');

  const wrongBrand = new RegExp(oldBrand, 'i');
  const sourceRoots = ['miniprogram', 'cloudfunctions', 'docs', 'README.md', 'project.config.json'];
  const scan = target => {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) return fs.readdirSync(target).forEach(name => scan(path.join(target, name)));
    if (!/\.(js|json|md|wxml|wxss)$/.test(target)) return;
    assert.equal(wrongBrand.test(fs.readFileSync(target, 'utf8')), false, `仍有错误品牌拼写：${target}`);
  };
  sourceRoots.forEach(root => scan(path.join(__dirname, '..', root)));
  console.log('V2 校验通过：数据隔离、角色场景卡池、掉落与每日上限正常。');
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
