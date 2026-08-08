const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const preHatch = require('../miniprogram/config/pre-hatch-assets').PRE_HATCH;
const postHatch = require('../miniprogram/config/post-hatch-assets').POST_HATCH;

function local(runtimePath) {
  return path.join(root, 'miniprogram', `.${runtimePath}`);
}

function entry(kind, sceneKey, runtimePath) {
  const file = local(runtimePath);
  return {
    kind,
    scene_key: sceneKey,
    local_path: file,
    cdn_path: runtimePath,
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : ''
  };
}

const assets = [];
(preHatch.sceneTesterOptions || []).forEach(scene => {
  assets.push(entry('pre_hatch_center', scene.key, scene.background));
  assets.push(entry('pre_hatch_egg', scene.key, scene.egg));
  assets.push(entry('pre_hatch_nest', scene.key, scene.nest));
  const panorama = postHatch.panoramaSceneSets[scene.key];
  assets.push(entry('post_hatch_panorama', scene.key, panorama && panorama.panorama || ''));
});
(Object.entries(postHatch.actionPanoramaScenesByCharacter || {})).forEach(([characterKey, scenes]) => {
  Object.entries(scenes || {}).forEach(([stateKey, scene]) => {
    Object.entries(scene.panoramaByPeriod || {}).forEach(([period, runtimePath]) => {
      if (runtimePath) assets.push(entry('post_hatch_action_panorama', `${characterKey}:${stateKey}:${period}`, runtimePath));
    });
    Object.entries(scene.panoramaBySceneKey || {}).forEach(([sceneKey, runtimePath]) => {
      if (runtimePath) assets.push(entry('post_hatch_action_panorama', `${characterKey}:${stateKey}:${sceneKey}`, runtimePath));
    });
    Object.entries(scene.panoramaAfterAction || {}).forEach(([period, runtimePath]) => {
      if (runtimePath) assets.push(entry('post_hatch_action_panorama', `${characterKey}:${stateKey}:${period}:after-action`, runtimePath));
    });
  });
});
console.log(JSON.stringify({ version: 'environment-v1', assets }, null, 2));
