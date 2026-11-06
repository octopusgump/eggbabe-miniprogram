const assert = require('assert');
const fs = require('fs');
const path = require('path');
const entry = require('../companion-prop-doodle-entry');
const stars = require('../iaa-star-unlock-adapter');

const root = path.resolve(__dirname, '../..');
const homeLogic = fs.readFileSync(path.join(root, 'pages/home/home.js'), 'utf8');
const homeTemplate = fs.readFileSync(path.join(root, 'pages/home/home.wxml'), 'utf8');

assert.match(homeLogic, /title: '一起画'/);
assert.match(homeLogic, /openPropTogetherDraw\(\)/);
assert.match(homeLogic, /buildPropDoodleUrl\(\{ source: 'home' \}\)/);
assert.match(homeLogic, /onCompanionLongPress[\s\S]*key === 'draw'[\s\S]*openDoodleEditor\(\)/, '长按仍保留画我的蛋壳编辑器');
assert.match(homeTemplate, /star-balance="\{\{companionStarBalance\}\}"/);
assert.equal(entry.buildPropDoodleUrl({ source: 'home' }).includes('source=home'), true);

(async () => {
  const storage = new Map();
  global.wx = Object.assign(global.wx || {}, {
    getStorageSync: key => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value)
  });
  stars.configureRoom('pre-hatch-pet', { id: 'pre-hatch-pet', ownerId: 'owner-a', prototype: '玉兔' });
  const before = (await stars.getRoomStarView()).data.star.balance;
  assert.equal((await stars.beginCompanionPropDrawing()).cost, 0);
  assert.equal((await stars.getRoomStarView()).data.star.balance, before);
  const done = await stars.recordPropDrawingComplete(await stars.getRoomStarView().then(r => r.data), 'pre-hatch-work-1');
  assert.equal(done.awardedStars, 10);
  stars.configureRoom('pre-hatch-pet', { id: 'pre-hatch-pet', ownerId: 'owner-a', prototype: '玉兔', lifecycleStage: 'HATCHED' });
  assert.equal((await stars.getRoomStarView()).data.star.balance, before + 10, '破壳后同一 pet 余额不清零');
  console.log('破壳前一起画入口与星星累计口径通过。');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
