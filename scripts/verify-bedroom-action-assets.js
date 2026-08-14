const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const postHatch = require('../miniprogram/config/post-hatch-assets').POST_HATCH;
const characters = ['jade-rabbit', 'boon-koi'];
const actions = ['nap', 'lazy', 'stare', 'read', 'game', 'window', 'draw', 'music'];
const periods = ['day', 'sunset', 'night'];
const canonicalHashes = new Set();
const configuredPaths = new Set();

function imageInfo(file) {
  const output = childProcess.execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'hasAlpha', file], { encoding: 'utf8' });
  const width = Number((output.match(/pixelWidth:\s*(\d+)/) || [])[1]);
  const height = Number((output.match(/pixelHeight:\s*(\d+)/) || [])[1]);
  const hasAlpha = (output.match(/hasAlpha:\s*(\w+)/) || [])[1] === 'yes';
  return { width, height, hasAlpha };
}

characters.forEach(character => {
  const bedroom = path.join(root, 'miniprogram/assets/scenes/lifecycle/post-hatch/60-action-scenes', character, 'home-bedroom');
  const expected = actions.flatMap(action => periods.map(period => `home_bedroom_${action}_${period}_v01.webp`)).sort();
  const available = new Set(fs.readdirSync(bedroom).filter(file => file.endsWith('.webp')));
  const missing = expected.filter(file => !available.has(file));
  assert.deepEqual(missing, [], `${character} 必须包含 24 张 canonical 正式动作 WebP`);

  expected.forEach(file => {
    const absolute = path.join(bedroom, file);
    assert.deepEqual(imageInfo(absolute), { width: 2823, height: 1672, hasAlpha: false }, `${character}/${file} 必须为 2823×1672 不透明 WebP`);
    canonicalHashes.add(crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'));
  });

  const scenes = postHatch.actionPanoramaScenesByCharacter[character] || {};
  assert.equal(Object.keys(scenes).length, actions.length, `${character} 配置必须恰好登记 8 个正式动作`);
  Object.values(scenes).forEach(scene => {
    assert.deepEqual(Object.keys(scene.panoramaByPeriod), periods, `${character} ${scene.stateKey} 必须且只能覆盖三个时段`);
    const paths = Object.values(scene.panoramaByPeriod);
    assert.equal(new Set(paths).size, 3, `${character} ${scene.stateKey} 每个时段必须使用独立文件`);
    assert.equal(paths.every(assetPath => fs.existsSync(path.join(root, 'miniprogram', assetPath.slice(1)))), true, `${character} ${scene.stateKey} 不得引用缺失文件`);
    paths.forEach(assetPath => configuredPaths.add(assetPath));
  });

  const expectedPaths = expected.map(file => `/assets/scenes/lifecycle/post-hatch/60-action-scenes/${character}/home-bedroom/${file}`).sort();
  const actualPaths = Object.values(scenes).flatMap(scene => Object.values(scene.panoramaByPeriod)).sort();
  assert.deepEqual(actualPaths, expectedPaths, `${character} 配置必须精确引用 24 张 canonical 正式动作图`);
});

assert.equal(canonicalHashes.size, 48, '48 张 canonical 正式动作图的 SHA-256 必须全部唯一');
assert.equal(configuredPaths.size, 48, '运行时配置必须恰好登记 48 张正式动作图');

assert.deepEqual(Object.keys(postHatch.panoramaSceneSets), periods, '破壳后空房全景必须且只能保留三个时段键');

const manifest = JSON.parse(childProcess.execFileSync(process.execPath, ['scripts/print-environment-cdn-manifest.js'], { cwd: root, encoding: 'utf8' }));
const actionAssets = manifest.assets.filter(item => item.kind === 'post_hatch_action_panorama');
assert.equal(actionAssets.length, 48, 'CDN 动作清单必须恰好包含 48 张正式动作图');
assert.equal(new Set(actionAssets.map(item => item.cdn_path)).size, 48, 'CDN 动作清单不得重复登记正式动作图');
assert.equal(actionAssets.every(item => item.exists && item.sha256), true, 'CDN 动作清单必须全部存在并带 SHA-256');
assert.deepEqual(actionAssets.map(item => item.cdn_path).sort(), Array.from(configuredPaths).sort(), 'CDN 动作清单必须与运行时配置的 48 张正式动作图完全一致');

console.log('卧室正式动作资源校验通过：玉兔 24 张 + 锦鲤 24 张；破壳后仅 day/sunset/night 三时段。');
