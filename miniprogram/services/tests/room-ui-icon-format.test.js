const assert = require('assert');
const fs = require('fs');
const path = require('path');
const postHatch = require('../../config/post-hatch-assets');
const { resolveCompanionPetImage } = require('../../utils/companion-pet-image');

const miniprogramRoot = path.resolve(__dirname, '../..');
const lifeScene = fs.readFileSync(path.join(miniprogramRoot, 'pages/life-scene/life-scene.js'), 'utf8');

assert.match(
  lifeScene,
  /LETTER_ICON_SRC = '\/assets\/ui\/3d-scene-actions\/runtime\/ui_3d_scene_message_envelope_96_v01\.png'/,
  '左下读信入口必须使用 PNG 信封'
);
assert.match(resolveCompanionPetImage({ prototype: '玉兔' }), /\.png$/, '宠物头像路径必须为 PNG');
assert.doesNotMatch(resolveCompanionPetImage({ prototype: '玉兔' }), /\.webp$/, '左下/听你说头像不得再指向 webp');

const toolbox = postHatch.POST_HATCH.sceneActions.toolboxItems;
['my', 'card', 'postcards', 'activities'].forEach(key => {
  assert.match(toolbox[key], /\.png$/, `百宝箱 ${key} 图标必须为 PNG`);
});

['toolbox', 'toolboxOpen'].forEach(key => {
  assert.match(postHatch.POST_HATCH.sceneActions[key], /\.png$/, `百宝箱木箱 ${key} 必须为 PNG`);
});

const uiRoot = path.join(miniprogramRoot, 'assets/ui');
function countWebp(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) n += countWebp(p);
    else if (entry.name.endsWith('.webp')) n += 1;
  }
  return n;
}
assert.equal(countWebp(uiRoot), 0, '阶段 1：assets/ui 下不得再保留 webp');

console.log('房间左下/右下 UI 图标格式（PNG）校验通过。');
