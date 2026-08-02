const assert = require('assert');

const storage = new Map();
global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const originalNow = Date.now;
const baseNow = Date.parse('2026-08-01T00:00:00.000Z');
Date.now = () => baseNow;

const postHatch = require('../post-hatch-companion');
const SLOT_MS = postHatch.SLOT_MS;
const pet = {
  id: 'post-hatch-test-egg',
  prototype: '玉兔',
  hatchAt: new Date(baseNow).toISOString(),
  collectionCard: { card_id: 'card-test' }
};

(async () => {
  const home = await postHatch.getSnapshot(pet);
  assert.equal(home.ok, true, '第一个 5 小时时段必须可加载');
  assert.equal(home.currentState.atHome, true, '故事线第一个时段必须在家');
  const firstAction = await postHatch.performAction(pet, home);
  const repeatedAction = await postHatch.performAction(pet, home);
  assert.equal(firstAction.ok && Boolean(firstAction.keepsake), true, '首次原生动作必须生成一次纪念品');
  assert.equal(repeatedAction.alreadyDone, true, '同一时段重复动作必须幂等');

  pet.hatchAt = new Date(baseNow - 3 * SLOT_MS).toISOString();
  const away = await postHatch.getSnapshot(pet);
  assert.equal(away.currentState.atHome, false, '故事线第四个时段必须外出');
  assert.equal(away.currentState.action.kind, 'letter', '外出时唯一入口必须为写信');
  const letter = await postHatch.sendLetter(pet, away, '等你回来，再告诉我风是什么味道。');
  const repeatedLetter = await postHatch.sendLetter(pet, away, '重复寄出');
  assert.equal(letter.ok, true, '外出时必须可寄信');
  assert.equal(repeatedLetter.alreadyDone, true, '同一时段重复寄信必须幂等');
  assert.equal((await postHatch.getSnapshot(pet)).memories.postcards.length, 1, '寄信后的下一次进入必须收到一次反馈');

  Date.now = () => baseNow + SLOT_MS;
  const returned = await postHatch.getSnapshot(pet);
  assert.equal(returned.currentState.atHome, true, '下一个故事时段必须回家');
  assert.equal(returned.memories.postcards.length, 1, '重复进入不得重复交付同一封回信');
  assert.equal(returned.memories.keepsakes.some(item => item.id === 'dali-cloud'), true, '外出纪念品必须在回家时带回');

  assert.equal((await postHatch.getDecorationState(pet)).remaining, 3, '首次进入装扮页必须返回每日三次额度');
  const firstDecoration = await postHatch.createDecoration(pet, '一把小椅子');
  assert.equal(firstDecoration.ok, true, '每日第一次装扮许愿必须成功');
  assert.equal((await postHatch.moveDecoration(pet, firstDecoration.decoration.id, 70, 62)).ok, true, '用户必须能保存装饰物在右屏的位置');
  assert.equal((await postHatch.getDecorationState(pet)).decorations[0].x, 70, '重复进入后必须恢复装饰物位置');
  assert.equal((await postHatch.createDecoration(pet, '一盏灯')).ok, true, '每日第二次装扮许愿必须成功');
  assert.equal((await postHatch.createDecoration(pet, '一只花瓶')).ok, true, '每日第三次装扮许愿必须成功');
  const fourthWish = await postHatch.createDecoration(pet, '第四件家具');
  assert.equal(fourthWish.code, 'DAILY_LIMIT', '每日第四次装扮许愿必须被固定额度拦截');

  Date.now = originalNow;
  console.log('破壳后 5 小时状态、动作幂等、来信、纪念品与每日装扮额度校验通过。');
})().catch(error => {
  Date.now = originalNow;
  console.error(error);
  process.exit(1);
});
