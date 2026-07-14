const assert = require('assert');

const storage = new Map([['eggbabe_runtime_mode_v2', 'demo']]);
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const bridge = require('../../../miniprogram/services/birth-card-h5');

const pet = {
  id: 'pet-1', name: '月团', hatchAt: Date.UTC(2026, 6, 14), prototype: '玉兔',
  collectionCard: {
    id: 'card-1', serial: 'EGG-RABBIT-20260714-000001', prototype: '玉兔', style: '月白桂花款', name: '月团',
    birthday: '2026-07-14', zodiac: '巨蟹座', gender: '♀', mbti: 'INFP', bloodType: 'O', personality: '温柔地陪伴你。',
    collectible: '普通', hatchQuality: '完整孵化', originalOwner: '蛋友'
  }
};

const data = bridge.toH5Card(pet, { miniProgramCodeUrl: 'https://cdn.example.com/code.png' });
assert.equal(data.mode, 'demo');
assert.equal(data.prototype, 'YT');
assert.equal(data.gender, 'FEMALE');
assert.equal(data.name_by_user, true);
assert.equal(data.mini_program_code_url, 'https://cdn.example.com/code.png');
assert.equal(bridge.isValidH5BaseUrl('http://example.com/card'), false);
assert.equal(bridge.isValidH5BaseUrl('https://example.com/card'), true);
const url = bridge.buildH5Url('https://example.com/card', 'profile', data, 'https://api.example.com');
assert.equal(url.includes('view=profile'), true);
assert.equal(url.includes('card_data='), true);
assert.equal(url.includes('api_base='), false, '可信 API 地址不得暴露为可编辑 URL 参数');
assert.equal(bridge.buildH5Url('', 'card', data), '');
const liveData = Object.assign({}, data, { mode: 'live' });
assert.equal(bridge.buildH5Url('https://example.com/card', 'card', liveData), '', '正式卡缺少可信 API 时必须回退原生页');
const liveUrl = bridge.buildH5Url('https://example.com/card', 'card', liveData, 'https://api.example.com');
assert.equal(liveUrl.includes('card_data='), false, '正式卡不得通过可编辑 URL 注入卡片内容');
assert.equal(liveUrl.includes('api_base='), false, '正式卡 API 必须固定在 H5 部署配置中');
assert.equal(bridge.toH5Card(Object.assign({}, pet, { collectionCard: Object.assign({}, pet.collectionCard, { id: '', _id: 'cloud-card-id' }) })).card_id, 'cloud-card-id');

const collectibleData = bridge.toH5CollectibleCard(pet, {
  id: 'copy-7', cardId: 'yt-s01-007', name: '月下冥想', setCode: 'YT-S01', setName: '玉兔初见·水彩日常',
  collectorLabel: '007/010', treatment: 'BASE', heroAssetId: 'YT__watercolor__meditate', uniqueCode: 'EGG-YT-20260714-000007', mode: 'demo'
}, {});
assert.equal(collectibleData.card_type, 'collectible', '套装卡必须使用收藏卡数据类型');
assert.equal(collectibleData.name, '月团', '套装卡正面显示用户确定的角色名');
assert.equal(collectibleData.card_title, '月下冥想', '套装卡必须保留固定卡名');
assert.equal(collectibleData.birthday, '2026-07-14', '套装卡动态信息来自已生成的破壳身份');
assert.equal(collectibleData.hero_asset_id, 'YT__watercolor__meditate', '套装卡必须关联固定完整 Hero');

console.log('H5 小程序桥接校验通过。');
