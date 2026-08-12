const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const postHatch = require('../miniprogram/config/post-hatch-assets').POST_HATCH;
const characters = ['jade-rabbit', 'boon-koi'];
const actions = ['nap', 'lazy', 'stare', 'read', 'game', 'window', 'draw', 'music'];
const periods = ['day', 'sunset', 'night'];

characters.forEach(character => {
  const bedroom = path.join(root, 'miniprogram/assets/scenes/lifecycle/post-hatch/60-action-scenes', character, 'home-bedroom');
  const expected = actions.flatMap(action => periods.map(period => `home_bedroom_${action}_${period}_v01.webp`)).sort();
  const actual = fs.readdirSync(bedroom).filter(file => file.endsWith('.webp')).sort();
  assert.deepEqual(actual, expected, `${character} 根目录必须恰好包含 24 张正式动作 WebP`);

  Object.values(postHatch.actionPanoramaScenesByCharacter[character]).forEach(scene => {
    assert.deepEqual(Object.keys(scene.panoramaByPeriod), periods, `${character} ${scene.stateKey} 必须且只能覆盖三个时段`);
    const paths = Object.values(scene.panoramaByPeriod);
    assert.equal(new Set(paths).size, 3, `${character} ${scene.stateKey} 每个时段必须使用独立文件`);
    assert.equal(paths.every(assetPath => fs.existsSync(path.join(root, 'miniprogram', assetPath.slice(1)))), true, `${character} ${scene.stateKey} 不得引用缺失文件`);
  });
});

assert.deepEqual(Object.keys(postHatch.panoramaSceneSets), periods, '破壳后空房全景必须且只能保留三个时段键');

const manifest = JSON.parse(childProcess.execFileSync(process.execPath, ['scripts/print-environment-cdn-manifest.js'], { cwd: root, encoding: 'utf8' }));
const actionAssets = manifest.assets.filter(item => item.kind === 'post_hatch_action_panorama');
assert.equal(actionAssets.length, 48, 'CDN 动作清单必须恰好包含 48 张正式动作图');
assert.equal(new Set(actionAssets.map(item => item.cdn_path)).size, 48, 'CDN 动作清单不得重复登记正式动作图');
assert.equal(actionAssets.every(item => item.exists && item.sha256), true, 'CDN 动作清单必须全部存在并带 SHA-256');

console.log('卧室正式动作资源校验通过：玉兔 24 张 + 锦鲤 24 张；破壳后仅 day/sunset/night 三时段。');
