const assert = require('assert');
const environment = require('../environment-state');
const assets = require('../../config/pre-hatch-assets').PRE_HATCH;

function at(hour, minute, day) {
  return new Date(2026, 7, day || 4, hour, minute || 0, 0, 0).getTime();
}

const egg = {
  eggId: 'egg-test-1',
  environmentSeed: 'seed-test-1',
  companionStartedAt: new Date(2026, 7, 1, 10, 0, 0, 0).toISOString()
};

assert.equal(environment.periodFromLocalTime(at(5, 59)), 'night');
assert.equal(environment.periodFromLocalTime(at(6, 0)), 'day');
assert.equal(environment.periodFromLocalTime(at(16, 59)), 'day');
assert.equal(environment.periodFromLocalTime(at(17, 0)), 'sunset');
assert.equal(environment.periodFromLocalTime(at(18, 59)), 'sunset');
assert.equal(environment.periodFromLocalTime(at(19, 0)), 'night');

assert.equal(environment.seasonBeforeHatch(egg.companionStartedAt, at(12, 0, 1)), 'spring');
assert.equal(environment.seasonBeforeHatch(egg.companionStartedAt, at(12, 0, 2)), 'summer');
assert.equal(environment.seasonBeforeHatch(egg.companionStartedAt, at(12, 0, 3)), 'autumn');
assert.equal(environment.seasonBeforeHatch(egg.companionStartedAt, at(12, 0, 4)), 'winter');
assert.equal(environment.seasonBeforeHatch(egg.companionStartedAt, at(12, 0, 5)), 'spring');

assert.equal(environment.seasonAfterHatch(Date.parse('2026-04-01T12:00:00+08:00')), 'spring');
assert.equal(environment.seasonAfterHatch(Date.parse('2026-08-01T12:00:00+08:00')), 'summer');
assert.equal(environment.seasonAfterHatch(Date.parse('2026-10-01T12:00:00+08:00')), 'autumn');
assert.equal(environment.seasonAfterHatch(Date.parse('2026-01-01T12:00:00+08:00')), 'winter');

const first = environment.resolve(Object.assign({}, egg, { timestamp: at(12, 0, 2) }));
const again = environment.resolve(Object.assign({}, egg, { timestamp: at(12, 15, 2) }));
assert.deepEqual(first, again, '同一蛋宝宝同一陪伴日同一时段必须稳定');
const nextDay = environment.resolve(Object.assign({}, egg, { timestamp: at(12, 0, 3) }));
assert.notEqual(first.dateKey, nextDay.dateKey);
const changedOnAnotherDay = Array.from({ length: 28 }, (_, index) => environment.resolve(Object.assign({}, egg, {
  timestamp: at(12, 0, 3 + index)
}))).find(item => item.weather !== first.weather);
assert.ok(changedOnAnotherDay, '不同陪伴日的天气必须允许变化');

const different = Array.from({ length: 32 }, (_, index) => environment.resolve(Object.assign({}, egg, {
  eggId: `egg-other-${index}`, environmentSeed: `seed-other-${index}`, timestamp: at(12, 0, 2)
}))).find(item => item.weather !== first.weather);
assert.ok(different, '不同蛋宝宝应可得到不同天气');

const keys = new Set(assets.sceneTesterOptions.map(item => item.key));
Object.keys(environment.WEATHER_POOLS).forEach(season => {
  environment.WEATHER_POOLS[season].forEach(weather => {
    environment.PERIODS.forEach(period => {
      assert.ok(keys.has(environment.sceneKey(season, weather, period)), `缺少资源映射：${season}/${weather}/${period}`);
    });
  });
});

console.log('environment-state.test.js passed');
