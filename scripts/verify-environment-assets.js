const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const preHatch = require('../miniprogram/config/pre-hatch-assets').PRE_HATCH;
const postHatch = require('../miniprogram/config/post-hatch-assets').POST_HATCH;
const expectedPreHatchCount = 36;
const expectedPostHatchPeriods = ['day', 'sunset', 'night'];

function absolute(runtimePath) {
  return path.join(root, 'miniprogram', `.${String(runtimePath || '')}`);
}

function imageInfo(file) {
  const output = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'hasAlpha', file], { encoding: 'utf8' });
  const width = Number((output.match(/pixelWidth:\s*(\d+)/) || [])[1]);
  const height = Number((output.match(/pixelHeight:\s*(\d+)/) || [])[1]);
  const hasAlpha = (output.match(/hasAlpha:\s*(\w+)/) || [])[1] === 'yes';
  return { width, height, hasAlpha };
}

const scenes = preHatch.sceneTesterOptions || [];
assert.equal(scenes.length, expectedPreHatchCount, `破壳前环境场景必须为 ${expectedPreHatchCount} 个状态`);
assert.equal(new Set(scenes.map(scene => scene.key)).size, expectedPreHatchCount, '破壳前环境 scene key 不得重复');

scenes.forEach(scene => {
  assert.ok(scene.background.endsWith('.webp'), `${scene.key} 预孵化图必须为 WebP`);
  const preFile = absolute(scene.background);
  assert.ok(fs.existsSync(preFile), `${scene.key} 缺少预孵化中央裁图：${scene.background}`);
  const preInfo = imageInfo(preFile);
  assert.deepEqual({ width: preInfo.width, height: preInfo.height }, { width: 941, height: 1672 }, `${scene.key} 预孵化图尺寸必须为 941×1672`);

  assert.ok(scene.egg.endsWith(`/${scene.key}_egg_right45.webp`), `${scene.key} 必须读取同名蛋体层`);
  const eggFile = absolute(scene.egg);
  assert.ok(fs.existsSync(eggFile), `${scene.key} 缺少蛋体层：${scene.egg}`);
  assert.deepEqual(imageInfo(eggFile), { width: 1254, height: 1254, hasAlpha: true }, `${scene.key} 蛋体层必须为带透明通道的 1254×1254 WebP`);

  assert.ok(scene.nest.endsWith(`/${scene.key}_nest_pad.webp`), `${scene.key} 必须读取同名窝垫层`);
  const nestFile = absolute(scene.nest);
  assert.ok(fs.existsSync(nestFile), `${scene.key} 缺少窝垫层：${scene.nest}`);
  assert.deepEqual(imageInfo(nestFile), { width: 1254, height: 1254, hasAlpha: true }, `${scene.key} 窝垫层必须为带透明通道的 1254×1254 WebP`);

});

assert.deepEqual(Object.keys(postHatch.panoramaSceneSets), expectedPostHatchPeriods, '破壳后只允许 day/sunset/night 三个时段');
expectedPostHatchPeriods.forEach(period => {
  const panorama = postHatch.panoramaSceneSets[period];
  assert.ok(panorama, `${period} 缺少破壳后正式全景配置`);
  assert.ok(panorama.panorama.endsWith('.webp'), `${period} 全景图必须为 WebP`);
  const panoramaFile = absolute(panorama.panorama);
  assert.ok(fs.existsSync(panoramaFile), `${period} 缺少破壳后全景图：${panorama.panorama}`);
  const panoramaInfo = imageInfo(panoramaFile);
  assert.deepEqual({ width: panoramaInfo.width, height: panoramaInfo.height }, { width: 2823, height: 1672 }, `${period} 全景图尺寸必须为 2823×1672`);
});

console.log(`环境资源校验通过：破壳前 ${expectedPreHatchCount} 个环境键保持不变；破壳后仅 ${expectedPostHatchPeriods.length} 个时段全景。`);
