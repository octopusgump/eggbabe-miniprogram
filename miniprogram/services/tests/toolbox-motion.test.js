const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const logic = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.js'), 'utf8');
const wxml = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.wxss'), 'utf8');
const assets = require('../../config/post-hatch-assets');

assert.ok(assets.POST_HATCH.sceneActions.toolboxOpen, '百宝箱开盖图标必须配置');
assert.match(assets.POST_HATCH.sceneActions.toolbox, /toolbox_closed_chest_96_v02/, '百宝箱合盖应使用 v02 定稿素材');
assert.match(logic, /startToolboxOpen\(\)/, '必须实现打开动效入口');
assert.match(logic, /closeToolbox\(/, '必须实现可动画的收起');
assert.match(logic, /toolboxMotion/, '必须用 toolboxMotion 区分开合阶段');
assert.match(logic, /reducedMotion[\s\S]*onToggleToolbox|onToggleToolbox[\s\S]*reducedMotion/, '减少动效时百宝箱须瞬时切态');
assert.match(wxml, /companion-toolbox--\{\{toolboxMotion\}\}/, '面板须绑定 motion 类名');
assert.match(wxml, /toolboxIconOpen/, '须渲染开盖 crossfade 图层');
assert.match(wxss, /transform-origin:100% 100%/, '面板 transform-origin 须在右下角');
assert.match(wxss, /cubic-bezier\(\.34,1\.56,\.64,1\)/, '打开须使用 Motion Note 弹簧缓动');
assert.match(wxss, /@keyframes toolbox-panel-close/, '收起须使用 scale+opacity 关键帧');
assert.match(wxss, /toolbox-panel-close \.16s ease-in/, '收起时长约 160ms ease-in');
assert.match(wxss, /page--reduced .companion-toolbox/, '减少动效须关闭百宝箱动画');

console.log('百宝箱开合动效静态契约通过。');
