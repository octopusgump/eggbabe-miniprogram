const assert = require('assert');
const assets = require('../companion-prop-assets');
const catalog = require('../companion-prop-catalog');

const entry = catalog.getById('dried_tea_tag');
assert.ok(entry);
assert.equal(assets.lineSketchPath('dried_tea_tag'), '/assets/keepsakes/turnarounds/line/dried_tea_tag.webp');
assert.ok(assets.coloredPaths(entry).some(path => path.includes('keepsake_dried_tea_tag')));
assert.equal(catalog.PROPS.length, 41);

console.log('道具资源路径与 catalog 数量校验通过。');
