const assert = require('assert');
const catalog = require('../companion-prop-catalog');

assert.equal(catalog.PROPS.length, 41);

const low = catalog.pickRandom('scope-a', { roll: 0 });
const high = catalog.pickRandom('scope-a', { roll: 0.999999999 });
assert.ok(low && high);
assert.notEqual(low.id, high.id, '不同 roll 须能抽到不同道具');

const daily = catalog.pickDaily('2026-11-04', 'scope-a');
assert.equal(daily.id, catalog.pickDaily('2026-11-04', 'scope-a').id, 'pickDaily 仍须按日稳定');

console.log('道具 catalog 随机与按日抽取单测通过。');
