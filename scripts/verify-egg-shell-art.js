const assert = require('assert');
const fs = require('fs');
const path = require('path');
const shellArt = require('../miniprogram/services/egg-shell-art');

assert.equal(shellArt.COLORS.length >= 6 && shellArt.COLORS.length <= 8, true, '蛋壳颜色必须为 6–8 种');
assert.equal(shellArt.BRUSH_COLORS.length, 10, '画笔必须提供精选 10 色');
assert.deepEqual(shellArt.BRUSH_COLORS.slice(0, 5).map(item => item.value), ['#526B4D', '#D98652', '#5F8FA8', '#C97682', '#8573A3'], '第一排必须保留五种品牌色，并以森林绿为默认色');
assert.deepEqual(shellArt.BRUSH_COLORS.slice(5).map(item => item.value), ['#AFC29A', '#E6CE73', '#9EC7D8', '#7B3E52', '#B9ABD2'], '第二排必须提供与品牌色对应的五种色阶变化');
assert.equal(['#526B4D', '#D98652', '#5F8FA8', '#C97682', '#8573A3'].every(value => shellArt.BRUSH_COLORS.some(item => item.value === value)), true, '原有五种品牌色必须全部保留');
assert.deepEqual(shellArt.BRUSH_SIZES.map(item => item.pixels), [2, 5, 8, 12, 18], '画笔必须使用五档可视笔宽轨，默认档包含 5px');
assert.deepEqual(shellArt.ERASER_SIZES.map(item => item.pixels), [6, 10, 15, 22, 30], '橡皮擦必须使用五档可视尺寸，默认档保持 15px');
assert.deepEqual(shellArt.PATTERNS.map(item => item.type), ['star', 'heart', 'leaf'], '首版图样只保留星星、爱心、叶子');

const blank = shellArt.defaultShellArt();
assert.equal(blank.version, 3, '绘图记录必须使用可变笔宽与像素贴纸结构');
assert.equal(blank.operations.length, 0, '新蛋默认不得自带装饰');
assert.equal(blank.baseAsset, shellArt.BASE_ASSET, '母版蛋必须使用受控本地素材');
assert.equal(blank.colorToken, 'white', '配置缺失时必须回退白色母版');
assert.equal(blank.colorAlpha, 0, '白色回退不得自动叠加奶油色');

const incompatibleColor = shellArt.normalizeShellArt({ colorToken: 'uploaded-texture', color: '#123456' });
assert.equal(incompatibleColor.colorToken, 'white', '不兼容颜色配置必须回退白色母版');
assert.equal(incompatibleColor.colorAlpha, 0, '不兼容颜色不得污染白色母版');

const legacy = shellArt.normalizeShellArt({ color: '#BFD9C1', colorName: '薄荷绿', pattern: '星星' });
assert.equal(legacy.colorToken, 'mint', '旧颜色记录必须可以迁移');
assert.equal(legacy.operations[0].pattern, 'star', '旧星星纹理必须迁移为图样操作');

const remoteAttempt = shellArt.normalizeShellArt({
  baseAsset: 'https://unsafe.example.com/upload.png',
  colorToken: 'blush',
  operations: [
    { type: 'sticker', pattern: 'heart', x: 2, y: -1, scale: 8 },
    { type: 'stroke', tool: 'eraser', width: 99, points: [{ x: -1, y: 2 }] },
    { type: 'sticker', pattern: 'photo-upload', x: 0.5, y: 0.5 }
  ]
});
assert.equal(remoteAttempt.baseAsset, shellArt.BASE_ASSET, '不得接受用户上传或远程母版');
assert.equal(remoteAttempt.operations.length, 2, '非法上传型图样必须被过滤');
assert.deepEqual(remoteAttempt.operations[1].points[0], { x: 0, y: 1 }, '手绘坐标必须归一化');
assert.equal(remoteAttempt.operations[0].scale, 1, '贴纸必须统一为固定像素尺寸');
assert.equal(remoteAttempt.operations[0].rotation, 0, '像素贴纸不得发生旋转插值');
const positionedSticker = shellArt.createSticker('star', 1, { x: 0.7, y: 0.4 });
assert.equal(positionedSticker.x, 0.7, '贴纸必须可以按用户点击位置落在蛋壳上');
assert.equal(positionedSticker.y, 0.4, '贴纸纵向位置必须使用画布点击坐标');
assert.equal(remoteAttempt.operations[1].width, shellArt.ERASER_MAX_WIDTH, '异常橡皮擦大小必须收敛到安全上限');
const thinBrush = shellArt.createStroke('brush', [{ x: 0.5, y: 0.5 }], 1, shellArt.BRUSH_SIZES[0].width);
const thickBrush = shellArt.createStroke('brush', [{ x: 0.5, y: 0.5 }], 2, shellArt.BRUSH_SIZES[3].width);
assert.equal(thinBrush.width < thickBrush.width, true, '画笔必须支持多档粗细');
const berryBrush = shellArt.createStroke('brush', [{ x: 0.5, y: 0.5 }], 2, shellArt.BRUSH_SIZES[1].width, '#C97682');
assert.equal(berryBrush.color, '#C97682', '每一笔必须独立保存当时选中的画笔颜色');
assert.equal(shellArt.normalizeShellArt({ operations: [berryBrush] }).operations[0].color, '#C97682', '重新打开作品时不得丢失笔迹颜色');
const inkBrush = shellArt.createStroke('brush', [{ x: 0.4, y: 0.6 }], 3, shellArt.BRUSH_SIZES[1].width, '#3F4547');
assert.equal(shellArt.normalizeShellArt({ operations: [inkBrush] }).operations[0].color, '#3F4547', '从面板移出的旧颜色仍必须逐笔保存并可在重新打开后恢复');
assert.equal(shellArt.brushWidthForPixels(5, 320) * 320, 5, '默认画笔在当前 Canvas 上必须保持 5px 逻辑笔宽');
const smallEraser = shellArt.createStroke('eraser', [{ x: 0.5, y: 0.5 }], 3, shellArt.eraserWidthForPixels(4));
const largeEraser = shellArt.createStroke('eraser', [{ x: 0.5, y: 0.5 }], 4, shellArt.eraserWidthForPixels(30));
assert.equal(smallEraser.width < largeEraser.width, true, '橡皮擦必须支持多档大小');
assert.equal(shellArt.eraserWidthForPixels(15, 320) * 320, 15, '橡皮擦档位数值必须与当前 Canvas 的实际擦除像素一致');

const withOperations = shellArt.normalizeShellArt({
  colorToken: 'lavender',
  operations: [
    shellArt.createSticker('leaf', 0),
    shellArt.createStroke('brush', [{ x: 0.2, y: 0.3 }, { x: 0.5, y: 0.6 }], 1),
    shellArt.createStroke('eraser', [{ x: 0.4, y: 0.5 }], 2)
  ]
});
const summary = shellArt.operationSummary(withOperations);
assert.deepEqual(summary, {
  color_token: 'lavender',
  pattern_ids: ['leaf'],
  sticker_count: 1,
  stroke_count: 1,
  used_eraser: true
}, '埋点摘要不得包含用户具体手绘轨迹');

assert.equal(JSON.stringify(summary).includes('points'), false, '埋点不得上传手绘点列');

function createContextLog() {
  const composites = [];
  const drawImages = [];
  const gradient = { addColorStop() {} };
  const context = {
    clearRect() {}, drawImage(...args) { drawImages.push(args); }, save() {}, restore() {}, fillRect() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, bezierCurveTo() {},
    quadraticCurveTo() {}, arc() {}, ellipse() {}, fill() {}, stroke() {}, clip() {},
    translate() {}, rotate() {},
    createLinearGradient() { return gradient; },
    createRadialGradient() { return gradient; }
  };
  Object.defineProperty(context, 'globalCompositeOperation', {
    set(value) { composites.push(value); },
    get() { return composites[composites.length - 1] || 'source-over'; }
  });
  return { context, composites, drawImages };
}

const originalBaseLog = createContextLog();
shellArt.drawEggBase(originalBaseLog.context, {}, 280, 400, blank);
assert.equal(originalBaseLog.drawImages.length, 1, '默认蛋体必须直接绘制交付的真实 WebP 母版');
assert.equal(originalBaseLog.composites.includes('source-in'), false, '不得再用中性渐变覆盖真实母版的原始高光与体积阴影');
assert.equal(originalBaseLog.composites.includes('source-atop'), false, '原生蛋色不得额外覆盖人工色层或体积层');

const tintedBaseLog = createContextLog();
shellArt.drawEggBase(tintedBaseLog.context, {}, 280, 400, withOperations);
assert.equal(tintedBaseLog.drawImages.length, 1, '换色蛋也必须先绘制交付的真实 WebP 母版');
assert.equal(tintedBaseLog.composites.includes('source-in'), false, '换色不得抹掉真实母版 RGB 质感');
assert.equal(tintedBaseLog.composites.includes('source-atop'), true, '用户颜色层必须在真实蛋体 Alpha 内半透明混色');

const artLog = createContextLog();
shellArt.drawEggArt(artLog.context, {}, 280, 400, withOperations);
assert.equal(artLog.composites.includes('destination-out'), true, '橡皮擦必须只作用于装饰画布');
assert.equal(artLog.composites.includes('destination-in'), true, '装饰必须裁切在蛋体 Alpha 内');

const doodleStyles = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/doodle/doodle.wxss'), 'utf8');
assert.match(doodleStyles, /\.egg-canvas-stack\s*\{[^}]*width:\s*89vw;[^}]*height:\s*89vw;/s, '透明母版画布必须保持 1:1，并让实际蛋体约占屏幕宽度 50%');

console.log('蛋壳绘图校验通过：像素画笔、可变尺寸橡皮擦、固定像素贴纸和安全边界正常。');
