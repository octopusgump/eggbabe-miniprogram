const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '../..');
const wxml = fs.readFileSync(path.join(miniprogramRoot, 'pages/doodle/doodle.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(miniprogramRoot, 'pages/doodle/doodle.wxss'), 'utf8');
const pageScript = fs.readFileSync(path.join(miniprogramRoot, 'pages/doodle/doodle.js'), 'utf8');
const undoIconPath = path.join(miniprogramRoot, 'assets/ui/3d-toolbar/runtime/ui_3d_toolbar_undo_96_v02.webp');
const clearIconPath = path.join(miniprogramRoot, 'assets/ui/3d-toolbar/runtime/ui_3d_toolbar_clear_96_v01.webp');
const disabledUndoIconPath = path.join(miniprogramRoot, 'assets/ui/3d-toolbar/runtime/ui_3d_toolbar_undo_disabled_96_v01.webp');
const disabledClearIconPath = path.join(miniprogramRoot, 'assets/ui/3d-toolbar/runtime/ui_3d_toolbar_clear_disabled_96_v01.webp');

assert.equal(wxml.includes('canvas-expand-button'), false, '画画页不得保留左上角按钮式放大入口');
assert.equal(pageScript.includes('onToggleCanvasSize'), false, '画画页不得保留按钮式放大状态机');
assert.match(
  wxss,
  /\.preview\s*\{[^}]*height:\s*60vh;/,
  '普通绘画舞台必须占视口高度的 60%'
);
assert.match(
  wxss,
  /\.egg-canvas-stack\s*\{[^}]*width:\s*89vw;[^}]*height:\s*89vw;[^}]*transform-origin:\s*center;/,
  '透明蛋壳 Canvas 必须让实际蛋体约占屏幕一半并保持正方形比例'
);
assert.match(wxml, /transform:scale\(\{\{canvasScale\}\}\)/, 'Canvas 必须绑定双指缩放倍率');
assert.match(pageScript, /MAX_CANVAS_SCALE\s*=\s*1\.6/, '双指缩放必须限制在安全倍率内');
assert.match(pageScript, /scaledLeft[\s\S]*localX[\s\S]*\/ scale/, '缩放后绘画触点必须反向映射回原始 Canvas 坐标');
assert.equal(wxml.includes('brush-color-popover'), false, '画笔颜色不得继续使用会被滚动容器裁切的上浮弹窗');
assert.equal(wxml.includes('brush-color-row') && wxml.includes('brush-size-track'), true, '五色与五档笔宽必须放入同一张内嵌设置卡');
assert.equal(wxml.includes('ui_3d_toolbar_undo_96_v02.webp') && wxml.includes('ui_3d_toolbar_clear_96_v01.webp'), true, '撤销和清空必须使用审核通过的 3D 专用图标');
assert.equal(fs.existsSync(undoIconPath), true, '撤销按钮必须包含审核通过的 3D WebP 图标资源');
assert.equal(fs.readFileSync(undoIconPath).subarray(0, 4).toString('ascii'), 'RIFF', '撤销按钮资源必须是有效 WebP');
assert.equal(fs.existsSync(clearIconPath), true, '清空按钮必须包含审核通过的 3D WebP 图标资源');
assert.equal(fs.readFileSync(clearIconPath).subarray(0, 4).toString('ascii'), 'RIFF', '清空按钮资源必须是有效 WebP');
assert.equal(wxml.includes('ui_3d_toolbar_undo_disabled_96_v01.webp') && wxml.includes('ui_3d_toolbar_clear_disabled_96_v01.webp'), true, '撤销和清空必须分别切换到独立的置灰 3D 图标');
assert.equal(fs.existsSync(disabledUndoIconPath) && fs.existsSync(disabledClearIconPath), true, '两枚置灰 3D WebP 图标资源必须存在');
assert.doesNotMatch(wxss, /\.canvas-action-button--disabled\s*\{[^}]*(?:opacity|color)\s*:/, '禁用状态不得降低整颗按钮透明度或淡化文字颜色');

console.log('画画页 50% 蛋体、双指缩放、内嵌画笔设置与统一操作按钮校验通过。');
