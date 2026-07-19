const assert = require('assert');

const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const runtime = require('../runtime-context');
const environment = require('../incubation-environment');

runtime.setMode('demo');

assert.equal(environment.seasonFromBeijingDate(Date.parse('2026-02-03T12:00:00+08:00')), 'winter');
assert.equal(environment.seasonFromBeijingDate(Date.parse('2026-02-04T12:00:00+08:00')), 'spring');
assert.equal(environment.seasonFromBeijingDate(Date.parse('2026-05-05T12:00:00+08:00')), 'summer');
assert.equal(environment.seasonFromBeijingDate(Date.parse('2026-08-07T12:00:00+08:00')), 'autumn');
assert.equal(environment.seasonFromBeijingDate(Date.parse('2026-11-07T12:00:00+08:00')), 'winter');
assert.equal(environment.periodFromBeijingTime(Date.parse('2026-07-19T06:00:00+08:00')), 'day');
assert.equal(environment.periodFromBeijingTime(Date.parse('2026-07-19T18:00:00+08:00')), 'night');
assert.deepEqual(
  environment.resolve({ season: 'summer', weather: 'rain', period: 'night' }),
  {
    season: 'summer',
    weather: 'rain',
    period: 'night',
    backgroundImage: '',
    locationLabel: '上海',
    className: 'season-summer weather-rain period-night'
  }
);
assert.equal(environment.resolve({ weather: 'storm' }).weather, 'sunny', '未知天气必须降级为晴天');

runtime.setMode('live');
assert.equal(
  environment.resolve().season,
  'spring',
  'live 模式缺少服务端环境枚举时不得使用 demo 预览季节'
);

console.log('v2.23 孵化场景季节、天气与昼夜表现层校验通过。');
