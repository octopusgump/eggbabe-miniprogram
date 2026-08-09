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
  assert.equal(away.currentState.action, null, '外出时不得暴露写信或留言动作');
  assert.equal(away.currentState.canTalk, false, '外出时不开放实时对话');
  assert.equal(typeof postHatch.sendLetter, 'undefined', '陪伴服务不得保留写信接口');

  pet.hatchAt = new Date(baseNow - 4 * SLOT_MS).toISOString();
  const returned = await postHatch.getSnapshot(pet);
  assert.equal(returned.currentState.atHome, true, '后续故事时段必须回家');
  assert.equal(returned.memories.postcards.length, 0, '不得因本地写信逻辑派生回信');
  assert.equal(returned.memories.keepsakes.some(item => item.id === 'dali-cloud'), false, '不得因已移除的写信动作派生纪念物');

  lifeScenes.HOME_STATES.forEach(state => {
    const fixed = lifeScenes.resolveDefinition('home', state.key);
    assert.equal(fixed.canTalk, true, `${state.label}必须开放场景内对话`);
    assert.equal(Boolean(fixed.action && fixed.action.id), true, `${state.label}必须有一个固定对应动作`);
  });

  const normalized = postHatch.normalizeLiveSnapshot({
    ok: true,
    mode: 'live',
    mood: { mood: '平静', line: '我想慢慢待一会儿。' },
    current_state: {
      major_scene_id: 'home',
      small_scene_id: 'sleep',
      can_talk: false,
      action_id: 'random_action',
      action_kind: 'random',
      slot_index: 2,
      slot_start: new Date(baseNow).toISOString(),
      slot_end: new Date(baseNow + SLOT_MS).toISOString(),
      line: '我睡着了。'
    }
  });
  assert.equal(normalized.currentState.canTalk, true, 'live 响应不得关闭任何居家状态的对话权限');
  assert.equal(normalized.currentState.action.id, 'lamp_off', 'live 响应不得随机改写固定对应动作');

  Date.now = originalNow;
  console.log('破壳后 5 小时状态、居家固定动作与外出无写信入口校验通过。');
})().catch(error => {
  Date.now = originalNow;
  console.error(error);
  process.exit(1);
});
