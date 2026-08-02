const assert = require('assert');
const fs = require('fs');
const path = require('path');

const preHatch = require('../../config/pre-hatch-assets').PRE_HATCH;
const postHatchAssets = require('../../config/post-hatch-assets');

const sourceScenes = preHatch.sceneTesterOptions || [];
const panelSets = postHatchAssets.POST_HATCH.panelSceneSets || {};

assert.equal(sourceScenes.length, 20, '三屏套装必须严格跟随破壳前当前启用的 20 个状态');
assert.deepEqual(Object.keys(panelSets), sourceScenes.map(scene => scene.key), '三屏 scene key 必须与破壳前配置同源且顺序一致');

sourceScenes.forEach(scene => {
  const set = panelSets[scene.key];
  assert.equal(set.expected.centerDesk, scene.background, `${scene.key} 中屏必须直接复用破壳前正式背景`);
  assert.equal(set.expected.leftLiving.endsWith(`/${scene.key}_left_living.webp`), true, `${scene.key} 左屏文件名不符合规范`);
  assert.equal(set.expected.rightDecor.endsWith(`/${scene.key}_right_decor.webp`), true, `${scene.key} 右屏文件名不符合规范`);
  assert.equal(set.ready, Boolean(set.leftLiving && set.centerDesk && set.rightDecor), `${scene.key} 不得半套启用`);
  if (!set.ready) assert.equal(postHatchAssets.resolvePanelSceneSet(scene.key), null, `${scene.key} 未完成时必须继续使用全景兜底`);
});

assert.equal(postHatchAssets.resolvePanelSceneSet('unknown_scene'), null, '未知 scene key 不得静默混入其他套装');

const lifeSceneLogic = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.js'), 'utf8');
assert.equal(lifeSceneLogic.includes('assets.resolvePanelSceneSet(sceneKey)'), true, '全屏生活空间必须按当前环境 scene key 读取三屏套装');
assert.equal(lifeSceneLogic.includes("sceneSetId: 'panorama-fallback'"), true, '正式套装未齐时必须保留全景兜底');

console.log('破壳后三屏 20 状态同源、命名和成套启用门禁校验通过。');
