const assert = require('assert');
const bridge = require('../../../miniprogram/services/birth-card-h5');

const pet = {
  id: 'egg-1',
  name: '',
  prototype: '玉兔',
  collectionCard: {
    card_id: 'card-1',
    egg_id: 'egg-1',
    mode: 'live',
    prototype: 'YT',
    style: '月白桂花款',
    display_name: '我的蛋宝宝',
    hatched_at: '2026-07-24T02:00:00.000Z',
    identity_code: 'EGG-YT-20260724-000001',
    source_batch: 'BATCH-01',
    illustration_key: 'YT__moon_white',
    illustration_url: 'https://cdn.eggbabe.com/cards/yt-moon-white.webp'
  }
};

const data = bridge.toH5Card(pet);
assert.equal(data.mode, 'live');
assert.equal(data.prototype, 'YT');
assert.equal(data.display_name, '我的蛋宝宝');
assert.equal(data.identity_code, 'EGG-YT-20260724-000001');
assert.equal(bridge.isValidH5BaseUrl('http://example.com/card'), false);
assert.equal(bridge.isValidH5BaseUrl('https://example.com/card'), true);
assert.equal(
  bridge.buildH5Url('https://example.com/card', data, 'https://api.example.com'),
  'https://example.com/card?card_id=card-1&mode=live'
);
assert.equal(bridge.buildH5Url('https://example.com/card', data, ''), '');
assert.equal(bridge.toH5Card(Object.assign({}, pet, {
  collectionCard: Object.assign({}, pet.collectionCard, { mode: 'demo' })
})), null, '普通版桥接必须拒绝 demo 卡');

console.log('H5 普通版桥接校验通过。');
