const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogram = path.resolve(__dirname, '../..');
const assets = require('../../config/post-hatch-assets');
const tokyo = assets.POST_HATCH.magicWindow.tokyo;

assert.ok(tokyo && tokyo.base && tokyo.clouds && tokyo.koi, '东京魔法窗必须配置底图、云层和锦鲤三层');
assert.ok(tokyo.koi.includes('standard_v02'), '东京必须使用 Standard_02 统一后的锦鲤 v02');
assert.equal(tokyo.koi.includes('koi_walk_v01'), false, '东京不得继续接入旧锦鲤 v01');

for (const source of [tokyo.base, tokyo.clouds, tokyo.koi]) {
  const file = path.join(miniprogram, source.replace(/^\//, ''));
  assert.equal(fs.existsSync(file), true, `魔法窗分层素材不存在：${source}`);
}

const wxml = fs.readFileSync(path.join(miniprogram, 'pages/life-scene/life-scene.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(miniprogram, 'pages/life-scene/life-scene.wxss'), 'utf8');
const js = fs.readFileSync(path.join(miniprogram, 'pages/life-scene/life-scene.js'), 'utf8');

for (const marker of ['magic-window-cloud-track', 'magic-window-koi-track', 'onOpenMagicWindow', 'onCloseMagicWindow']) {
  assert.equal(wxml.includes(marker), true, `东京魔法窗模板缺少：${marker}`);
}
for (const animation of ['magic-window-cloud-drift', 'magic-koi-travel', 'magic-koi-ripple']) {
  assert.equal(wxss.includes(animation), true, `东京魔法窗样式缺少：${animation}`);
}
assert.equal(js.includes('magicWindowReducedMotion'), true, '东京魔法窗必须支持弱动效模式');
assert.equal(js.includes("element_id: 'far_glow'"), true, '东京魔法窗必须从远方微光进入并记录交互');

console.log('东京魔法窗分层、标准锦鲤与动效接入校验通过。');
