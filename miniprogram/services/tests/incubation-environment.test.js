const assert = require('assert');

const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const environment = require('../incubation-environment');

assert.equal(
  environment.sceneAssetPath('autumn', 'night'),
  '/assets/scenes/incubation/webp/incubation_autumn_night.webp'
);
assert.equal(
  environment.sceneAssetPath('unknown', 'unknown'),
  '/assets/scenes/incubation/webp/incubation_spring_day.webp',
  '非法季节或昼夜枚举必须降级到安全素材'
);
assert.deepEqual(
  environment.resolve({ season: 'summer', weather: 'rain', period: 'night' }),
  {
    season: 'summer',
    weather: 'rain',
    period: 'night',
    backgroundImage: '/assets/scenes/incubation/webp/incubation_summer_night.webp',
    eggImage: '/assets/scenes/incubation/webp/egg_base_day.webp',
    locationLabel: '上海',
    className: 'season-summer weather-rain period-night'
  }
);
assert.equal(
  environment.resolve({ season: 'winter', period: 'day', backgroundImage: 'https://cdn.example.com/incubation.webp' }).backgroundImage,
  'https://cdn.example.com/incubation.webp',
  '服务端下发的备案 HTTPS 场景图优先于本地素材'
);
assert.equal(environment.resolve({ weather: 'storm' }).weather, 'sunny', '未知天气必须降级为晴天');

assert.equal(
  environment.resolve().season,
  'spring',
  'live 模式缺少服务端环境枚举时必须使用固定安全回退'
);

console.log('v2.28 孵化场景服务端枚举与安全回退校验通过。');
