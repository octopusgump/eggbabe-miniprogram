const assert = require('assert');
const fs = require('fs');
const path = require('path');
const assets = require('../companion-prop-assets');
const catalog = require('../companion-prop-catalog');

const entry = catalog.getById('dried_tea_tag');
assert.ok(entry);
assert.equal(assets.lineSketchPath('dried_tea_tag'), '/assets/keepsakes/turnarounds/line/dried_tea_tag.png');
const duck = catalog.getById('k_r01_yellow_rubber_duck');
assert.ok(duck);
const duckPaths = assets.coloredPaths(duck);
assert.equal(duckPaths[0], '/assets/keepsakes/turnarounds/png/k_r01_yellow_rubber_duck.png');
assert.equal(assets.resolveLinePath(entry), assets.lineSketchPath('dried_tea_tag'));
assert.equal(
  assets.resolveColoredPath(entry),
  '/assets/keepsakes/turnarounds/png/dried_tea_tag.png'
);
assert.equal(catalog.PROPS.length, 41);

const lineDir = path.join(__dirname, '../../assets/keepsakes/turnarounds/line');
const lineFiles = fs.readdirSync(lineDir).filter(name => name.endsWith('.png'));
assert.equal(lineFiles.length, 41);
assert.equal(fs.readdirSync(lineDir).some(name => name.endsWith('.webp')), false, 'line 目录不得再保留 webp');
catalog.PROPS.forEach(prop => {
  assert.ok(
    fs.existsSync(path.join(lineDir, `${prop.id}.png`)),
    `缺少简笔 ${prop.id}.png`
  );
  const colorPath = path.join(__dirname, '../..', `assets/keepsakes/turnarounds/png/${prop.id}.png`);
  assert.ok(fs.existsSync(colorPath), `缺少彩色 ${prop.id}.png`);
});

console.log('道具资源路径与 catalog / line 素材校验通过。');
