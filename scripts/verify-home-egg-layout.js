const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const template = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.wxss'), 'utf8');

const visibleEggMatch = template.match(/<view wx:if="\{\{stage !== 'hatched'\}\}" class="egg egg-shell[\s\S]*?<\/view>/);
assert.ok(visibleEggMatch, '首页必须保留位于孵化窝中的可交互蛋体容器');
assert.equal(visibleEggMatch[0].includes('<canvas'), false, '可见蛋体容器不得直接嵌套原生 Canvas，否则滚动时会脱离孵化窝');
assert.equal(visibleEggMatch[0].includes('egg-shell-preview'), true, '可见蛋体必须使用 Canvas 导出的预览图片');
assert.equal(template.includes('class="egg-shell-specular"'), true, '真实蛋体必须保留可随触摸响应的表面光泽层');
assert.equal(template.includes('class="egg-shell-depth"'), true, '真实蛋体必须保留贴近窝垫的柔和体积层');
assert.equal(template.includes('class="egg-render-cache egg-render-cache--base"'), true, '底层合成 Canvas 必须移到屏幕外');
assert.equal(template.includes('class="egg-render-cache egg-render-cache--art"'), true, '装饰合成 Canvas 必须移到屏幕外');
assert.match(styles, /\.egg-render-cache\s*\{[^}]*position:\s*fixed;[^}]*left:\s*-2000px;/s, '合成 Canvas 必须直接固定在屏幕外，不能占据首页布局');
assert.match(styles, /\.egg-shell-preview--art\s*\{[^}]*z-index:\s*4;/s, '用户贴纸和手绘必须位于动态光泽反馈之上');
assert.match(styles, /\.egg-shell-depth,\s*\.egg-shell-specular\s*\{[^}]*opacity:\s*0;[^}]*-webkit-mask-image:\s*url\(['"]?\/assets\/scenes\/incubation\/webp\/egg_base_day\.webp/s, '表面光泽与体积反馈必须默认隐藏，并共享真实蛋体 Alpha 裁切');
assert.match(styles, /\.egg-shell-specular\s*\{[^}]*radial-gradient/s, '表面光泽必须使用克制的渐变增强互动瞬间');
assert.match(styles, /\.egg\.egg--wobble \.egg-shell-specular\s*\{[^}]*animation:\s*shell-glint-touch/s, '轻触蛋宝宝时高光必须产生即时位移反馈');
assert.match(styles, /@keyframes shell-glint-touch\s*\{[\s\S]*background-position/s, '触摸高光反馈必须在蛋体 Alpha 内移动，而不是让整个遮罩越出蛋壳');

const canvas2d = require(path.join(root, 'miniprogram/utils/canvas-2d'));
const layer = { canvas: { width: 560, height: 800 }, width: 280, height: 400 };
global.wx = {
  canvasToTempFilePath(options) {
    assert.equal(options.canvas, layer.canvas, '必须导出当前屏幕外 Canvas 节点');
    assert.equal(options.fileType, 'png', '装饰层必须导出支持透明通道的 PNG');
    options.success({ tempFilePath: 'wxfile://tmp/home-egg-preview.png' });
  }
};

canvas2d.exportImage(layer).then(previewPath => {
  assert.equal(previewPath, 'wxfile://tmp/home-egg-preview.png', 'Canvas 预览路径必须交给窝内普通图片显示');
  console.log('首页蛋体定位校验通过：可见蛋体使用预览图，Canvas 保持在屏幕外。');
}).catch(error => {
  console.error(error);
  process.exit(1);
});
