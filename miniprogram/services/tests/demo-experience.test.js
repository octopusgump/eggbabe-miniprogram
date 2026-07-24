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

assert.equal(config.localDemoEnabled, true, '微信开发版必须启用本地验收模式');
assert.equal(runtime.getMode(), 'demo', '开发版运行时必须使用 demo');

const bootstrap = demoExperience.bootstrap();
assert.equal(bootstrap.ok, true, '开发版授权必须建立 demo 用户');
assert.equal(petStore.getUser().mode, 'demo', 'demo 用户必须明确标记 mode=demo');

const activation = demoExperience.redeemActivationCode('DEMO-YT-001');
assert.equal(activation.ok, true, '开发版激活码必须能绑定固定 demo 实体蛋');
assert.equal(petStore.getPet().mode, 'demo', 'demo 实体蛋必须保存在 demo 命名空间');
assert.equal(petStore.getStage(petStore.getPet()), 'waiting', '绑定后必须先允许测试孵化期互动');

const advanced = demoExperience.advanceToHatchable();
assert.equal(advanced.ok, true, '开发验收控制必须能进入待破壳阶段');
assert.equal(petStore.getStage(petStore.getPet()), 'ready', 'demo 实体蛋必须进入真实破壳页面使用的阶段');

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
