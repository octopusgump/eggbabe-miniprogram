const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '../..');
const wxml = fs.readFileSync(path.join(miniprogramRoot, 'pages/doodle/doodle.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(miniprogramRoot, 'pages/doodle/doodle.wxss'), 'utf8');
const pageScript = fs.readFileSync(path.join(miniprogramRoot, 'pages/doodle/doodle.js'), 'utf8');
const iconPath = path.join(
  miniprogramRoot,
  'assets/ui/3d-toolbar/runtime/ui_3d_toolbar_canvas_expand_96_v01.webp'
);

assert.match(
  wxml,
  /ui_3d_toolbar_canvas_expand_96_v01\.webp/,
  '画画页必须使用新版 3D Canvas 放大图标'
);
assert.match(
  wxml,
  /canvas-expand-icon--collapse/,
  '展开状态必须保留可辨识的缩小图标状态'
);
assert.match(
  wxss,
  /\.preview\s*\{[^}]*height:\s*60vh;/,
  '普通绘画舞台必须占视口高度的 60%'
);
assert.match(
  wxss,
  /\.egg-canvas-stack\s*\{[^}]*width:\s*78vw;[^}]*max-width:\s*52vh;[^}]*height:\s*78vw;[^}]*max-height:\s*52vh;/,
  '蛋壳 Canvas 必须随视口放大并保留正方形比例'
);
assert.ok(fs.existsSync(iconPath), '3D Canvas 放大图标运行时资源必须存在');
assert.equal(fs.readFileSync(iconPath, { encoding: null }).subarray(0, 4).toString('ascii'), 'RIFF', '运行时图标必须为有效 WebP');
assert.match(
  pageScript,
  /onToggleCanvasSize\(\)[\s\S]*wx\.nextTick\(\(\) => this\.setupCanvases\(\)\)/,
  'Canvas 尺寸切换后必须按新布局重新初始化绘图层'
);

console.log('画画页 60% 舞台与 3D 放大图标校验通过。');
