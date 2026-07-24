const assert = require('assert');
const model = require('../card-model');

const raw = {
  card_id: 'card-1',
  egg_id: 'egg-1',
  mode: 'live',
  prototype: '玉兔',
  style: '月白桂花款',
  display_name: '我的蛋宝宝',
  hatched_at: '2026-07-24T02:00:00.000Z',
  identity_code: 'EGG-YT-20260724-000001',
  source_batch: 'BATCH-01',
  illustration_key: 'YT__moon_white',
  illustration_url: 'https://cdn.eggbabe.com/cards/yt-moon-white.webp'
};
const normalized = model.normalizeCard(raw);
assert.equal(normalized.prototype, 'YT');
assert.equal(normalized.prototypeLabel, '玉兔');
assert.equal(normalized.displayName, '我的蛋宝宝');
assert.equal(normalized.hatchedAtLabel, '2026年7月24日');
assert.equal(normalized.identityCode, raw.identity_code);
assert.throws(() => model.normalizeCard(Object.assign({}, raw, { mode: 'demo' })), /INVALID_CARD/);
assert.throws(() => model.normalizeCard(Object.assign({}, raw, { identity_code: '' })), /INVALID_CARD/);
assert.throws(() => model.normalizeCard(Object.assign({}, raw, { prototype: 'FOX' })), /INVALID_CARD/);

console.log('H5 v2.28 收藏卡模型校验通过。');
