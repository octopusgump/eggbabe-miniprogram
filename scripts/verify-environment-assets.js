const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const preHatch = require('../miniprogram/config/pre-hatch-assets').PRE_HATCH;
const postHatch = require('../miniprogram/config/post-hatch-assets').POST_HATCH;
const expectedCount = 36;

function absolute(runtimePath) {
  return path.join(root, 'miniprogram', `.${String(runtimePath || '')}`);
}

function dimensions(file) {
  const output = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
  const width = Number((output.match(/pixelWidth:\s*(\d+)/) || [])[1]);
  const height = Number((output.match(/pixelHeight:\s*(\d+)/) || [])[1]);
  return { width, height };
}

const scenes = preHatch.sceneTesterOptions || [];
assert.equal(scenes.length, expectedCount, `环境场景必须为 ${expectedCount} 个状态`);
assert.equal(new Set(scenes.map(scene => scene.key)).size, expectedCount, '环境 scene key 不得重复');

scenes.forEach(scene => {
  assert.ok(scene.background.endsWith('.webp'), `${scene.key} 预孵化图必须为 WebP`);
  const preFile = absolute(scene.background);
  assert.ok(fs.existsSync(preFile), `${scene.key} 缺少预孵化中央裁图：${scene.background}`);
  assert.deepEqual(dimensions(preFile), { width: 941, height: 1672 }, `${scene.key} 预孵化图尺寸必须为 941×1672`);

  const panorama = postHatch.panoramaSceneSets[scene.key];
  assert.ok(panorama && panorama.ready, `${scene.key} 缺少正式全景配置`);
  assert.ok(panorama.panorama.endsWith('.webp'), `${scene.key} 全景图必须为 WebP`);
  const panoramaFile = absolute(panorama.panorama);
  assert.ok(fs.existsSync(panoramaFile), `${scene.key} 缺少破壳后全景图：${panorama.panorama}`);
  assert.deepEqual(dimensions(panoramaFile), { width: 2823, height: 1672 }, `${scene.key} 全景图尺寸必须为 2823×1672`);
});

console.log(`环境资源校验通过：${expectedCount} 个预孵化中央裁图与 ${expectedCount} 个破壳后全景图均为正确尺寸的 WebP。`);
