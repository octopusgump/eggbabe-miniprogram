const assert = require('assert');

const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const environment = require('../incubation-environment');
const createdAt = '2026-07-26T08:00:00+08:00';
const firstDayNoon = Date.parse('2026-07-26T12:00:00+08:00');
const firstDayNight = Date.parse('2026-07-26T21:00:00+08:00');
const secondDayNoon = Date.parse('2026-07-27T12:00:00+08:00');
const fourthDayNoon = Date.parse('2026-07-29T12:00:00+08:00');

assert.equal(
  environment.sceneAssetPath('autumn', 'night'),
  '/assets/scenes/incubation/webp/incubation_autumn_night.webp'
);
assert.equal(
  environment.sceneAssetPath('unknown', 'unknown'),
  '/assets/scenes/incubation/webp/incubation_spring_day.webp',
  '非法季节或昼夜枚举必须降级到安全素材'
);
assert.equal(
  environment.resolve({ season: 'winter', weather: 'rain', period: 'night' }, { createdAt, timestamp: firstDayNoon }).backgroundImage,
  '/assets/scenes/incubation/webp/incubation_spring_day.webp',
  '昼夜和四季必须按上海太阳时间与孵化天数选择本地素材'
);
assert.equal(
  environment.resolve({}, { createdAt, timestamp: firstDayNoon }).season,
  'spring',
  '孵化第 1 天必须是春天'
);
assert.equal(environment.resolve({}, { createdAt, timestamp: secondDayNoon }).season, 'summer', '孵化第 2 天必须是夏天');
assert.equal(environment.resolve({}, { createdAt, timestamp: fourthDayNoon }).season, 'winter', '孵化第 4 天必须是冬天');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDayNight }).period, 'night', '上海日落后必须使用夜景');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDayNoon }).period, 'day', '上海日出后、日落前必须使用日景');
assert.equal(environment.resolve({ weather: 'storm' }, { createdAt, timestamp: firstDayNoon }).weather, 'sunny', '未知天气必须降级为晴天');

const solarTimes = environment.shanghaiSolarTimes(firstDayNoon);
assert.equal(solarTimes.sunriseMinutes > 240 && solarTimes.sunriseMinutes < 420, true, '上海日出时间应落在合理范围');
assert.equal(solarTimes.sunsetMinutes > 1020 && solarTimes.sunsetMinutes < 1200, true, '上海日落时间应落在合理范围');

console.log('V3.5 上海日出日落、昼夜素材与孵化日四季循环校验通过。');
