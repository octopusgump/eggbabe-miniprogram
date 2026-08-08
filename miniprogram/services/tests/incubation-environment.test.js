const assert = require('assert');
const environment = require('../incubation-environment');

const pet = {
  id: 'egg-environment-test',
  createdAt: new Date(2026, 6, 26, 8, 0, 0).toISOString(),
  companionStartedAt: new Date(2026, 6, 26, 8, 0, 0).toISOString(),
  environmentSeed: 'environment-test-seed',
  environmentVersion: 'environment-v1'
};
const resolveAt = (hour, minute, day, isHatched) => environment.resolve(null, Object.assign({}, pet, {
  timestamp: new Date(2026, 6, day || 26, hour, minute || 0, 0).getTime(), isHatched: Boolean(isHatched)
}));

const day = resolveAt(12, 0, 26);
assert.equal(day.season, 'spring');
assert.equal(day.period, 'day');
assert.equal(day.valid, true);
assert.ok(day.fullSceneImage.endsWith(`/${day.sceneKey}.webp`) || (day.sceneKey === 'spring_clear_night' && day.fullSceneImage.endsWith('/spring_clear_night_moonlight.webp')));
assert.equal(day.backgroundImage, '', '正式运行时不得静默回退到候选房间底图');
assert.equal(day.eggImage.endsWith(`/${day.sceneKey}_egg_right45.webp`), true, '每个环境键必须读取同名蛋体层');
assert.equal(day.nestImage.endsWith(`/${day.sceneKey}_nest_pad.webp`), true, '每个环境键必须读取同名窝垫层');
assert.equal(day.weatherOverlay, '');
assert.equal(environment.resolve({ weather: 'rain' }, Object.assign({}, pet, { timestamp: new Date(2026, 6, 26, 12).getTime() })).weather, day.weather, '旧服务端天气字段不得影响应用内随机结果');

assert.equal(resolveAt(12, 0, 27).season, 'summer');
assert.equal(resolveAt(12, 0, 28).season, 'autumn');
assert.equal(resolveAt(12, 0, 29).season, 'winter');
assert.equal(resolveAt(12, 0, 30).season, 'spring');
assert.equal(resolveAt(5, 59).period, 'night');
assert.equal(resolveAt(6, 0).period, 'day');
assert.equal(resolveAt(17, 0).period, 'sunset');
assert.equal(resolveAt(19, 0).period, 'night');
assert.equal(environment.millisecondsUntilNextEnvironmentBoundary(new Date(2026, 6, 26, 16, 59).getTime()), 60 * 1000);
assert.equal(environment.millisecondsUntilNextEnvironmentBoundary(new Date(2026, 6, 26, 23, 59).getTime()), 60 * 1000);
assert.equal(resolveAt(12, 0, 26, true).season, 'summer', '破壳后按中国上海月份映射季节');
assert.equal(environment.resolveAssetUrl('/assets/scenes/lifecycle/pre-hatch/x.webp', 'https://cdn.example.com/').startsWith('https://cdn.example.com/assets/'), true);

const manifest = JSON.parse(require('child_process').execFileSync(process.execPath, ['scripts/print-environment-cdn-manifest.js'], { cwd: process.cwd(), encoding: 'utf8' }));
assert.equal(manifest.assets.filter(item => item.kind === 'pre_hatch_egg').length, 36, 'CDN 清单必须逐一列出 36 个精确蛋体层，包括尚待补齐的素材');
assert.equal(manifest.assets.filter(item => item.kind === 'pre_hatch_nest').length, 36, 'CDN 清单必须逐一列出 36 个精确窝垫层，包括尚待补齐的素材');

console.log('应用内季节、真实时段与稳定天气环境校验通过。');
