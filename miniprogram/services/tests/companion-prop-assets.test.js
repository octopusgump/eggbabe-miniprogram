const assert = require('assert');
const fs = require('fs');
const path = require('path');
const assets = require('../companion-prop-assets');
const catalog = require('../companion-prop-catalog');

const entry = catalog.getById('dried_tea_tag');
assert.ok(entry);
assert.equal(assets.lineSketchPath('dried_tea_tag'), '/assets/keepsakes/turnarounds/line/dried_tea_tag.webp');
assert.equal(assets.resolveLinePath(entry), assets.lineSketchPath('dried_tea_tag'));
assert.equal(assets.resolveColoredPath(entry), assets.coloredPaths(entry)[0]);
assert.ok(assets.coloredPaths(entry).some(item => item.includes('keepsake_dried_tea_tag')));
assert.equal(catalog.PROPS.length, 41);

const lineDir = path.join(__dirname, '../../assets/keepsakes/turnarounds/line');
const lineFiles = fs.readdirSync(lineDir).filter(name => name.endsWith('.webp'));
assert.equal(lineFiles.length, 41);
catalog.PROPS.forEach(prop => {
  assert.ok(
    fs.existsSync(path.join(lineDir, `${prop.id}.webp`)),
    `缺少简笔 ${prop.id}.webp`
  );
  const colorCandidates = assets.coloredPaths(prop).map(item => path.join(__dirname, '../..', item.replace(/^\//, '')));
  assert.ok(
    colorCandidates.some(file => fs.existsSync(file)),
    `缺少彩色资源 ${prop.id}（catalog colorFile 或 webp）`
  );
});

console.log('道具资源路径与 catalog / line 素材校验通过。');
