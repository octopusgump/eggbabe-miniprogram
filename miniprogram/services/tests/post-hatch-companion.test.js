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
const lifeScenes = require('../../utils/life-scenes');
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

  Date.now = () => baseNow + SLOT_MS - 1;
  const sameSlot = await postHatch.getSnapshot(pet);
  assert.equal(sameSlot.currentState.key, home.currentState.key, '刷新页面不得提前切换 5 小时状态');
  assert.equal(sameSlot.currentState.slotIndex, home.currentState.slotIndex, '同一时段号必须保持稳定');
  Date.now = () => baseNow;

  pet.hatchAt = new Date(baseNow - 3 * SLOT_MS).toISOString();
  const away = await postHatch.getSnapshot(pet);
  assert.equal(away.currentState.atHome, false, '故事线第四个时段必须外出');
  assert.equal(away.currentState.action.kind, 'letter', '外出时唯一入口必须为写信');

  pet.hatchAt = new Date(baseNow - 4 * SLOT_MS).toISOString();
  const returnedWithoutLetter = await postHatch.getSnapshot(pet);
  assert.equal(returnedWithoutLetter.memories.keepsakes.some(item => item.id === 'dali-cloud'), false, '未完成外出对应动作不得补发纪念物');
  pet.hatchAt = new Date(baseNow - 3 * SLOT_MS).toISOString();
  const letter = await postHatch.sendLetter(pet, away, '等你回来，再告诉我风是什么味道。');
  const repeatedLetter = await postHatch.sendLetter(pet, away, '重复寄出');
  assert.equal(letter.ok, true, '外出时必须可寄信');
  assert.equal(repeatedLetter.alreadyDone, true, '同一时段重复寄信必须幂等');
  const delivered = await postHatch.getSnapshot(pet);
  assert.equal(delivered.memories.postcards.length, 1, '寄信后的下一次进入必须收到一次反馈');
  assert.equal(delivered.newMessage && delivered.newMessage.unread, true, '新到回信必须在未查看前展示新消息状态');
  const readPostcard = await postHatch.markPostcardRead(pet, delivered.newMessage.id);
  assert.equal(readPostcard.ok, true, '用户查看回信后必须能写入已读状态');
  assert.equal((await postHatch.getSnapshot(pet)).newMessage, null, '用户查看回信后必须移除新消息状态');

  Date.now = () => baseNow + SLOT_MS;
  const returned = await postHatch.getSnapshot(pet);
  assert.equal(returned.currentState.atHome, true, '下一个故事时段必须回家');
  assert.equal(returned.memories.postcards.length, 1, '重复进入不得重复交付同一封回信');
  assert.equal(returned.memories.keepsakes.some(item => item.id === 'dali-cloud'), true, '外出纪念品必须在回家时带回');

  const expectedTalk = { sleep: false, lazy: false, stare: true, tea: true, drawing: true, gaming: false, window: true };
  lifeScenes.HOME_STATES.forEach(state => {
    const fixed = lifeScenes.resolveDefinition('home', state.key);
    assert.equal(fixed.canTalk, expectedTalk[state.key], `${state.label}的说话权限必须使用固定映射`);
    assert.equal(Boolean(fixed.action && fixed.action.id), true, `${state.label}必须有一个固定对应动作`);
  });

  const normalized = postHatch.normalizeLiveSnapshot({
    ok: true,
    mode: 'live',
    mood: { mood: '平静', line: '我想慢慢待一会儿。' },
    current_state: {
      major_scene_id: 'home',
      small_scene_id: 'sleep',
      can_talk: true,
      action_id: 'random_action',
      action_kind: 'random',
      slot_index: 2,
      slot_start: new Date(baseNow).toISOString(),
      slot_end: new Date(baseNow + SLOT_MS).toISOString(),
      line: '我睡着了。'
    }
  });
  assert.equal(normalized.currentState.canTalk, false, 'live 响应不得随机改写睡觉状态的说话权限');
  assert.equal(normalized.currentState.action.id, 'lamp_off', 'live 响应不得随机改写固定对应动作');

  Date.now = originalNow;
  console.log('破壳后 5 小时状态、固定动作映射、来信与纪念物校验通过。');
})().catch(error => {
  Date.now = originalNow;
  console.error(error);
  process.exit(1);
});
