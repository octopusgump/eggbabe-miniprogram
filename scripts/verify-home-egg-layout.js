const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const template = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.wxss'), 'utf8');
const source = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.js'), 'utf8');

const visibleEggMatch = template.match(/<view wx:if="\{\{stage !== 'hatched'\}\}" class="egg egg-shell[\s\S]*?<\/view>/);
assert.ok(visibleEggMatch, '首页必须保留位于孵化窝中的可交互蛋体容器');
assert.equal(visibleEggMatch[0].includes('<canvas'), false, '可见蛋体容器不得直接嵌套原生 Canvas，否则滚动时会脱离孵化窝');
assert.equal(visibleEggMatch[0].includes('egg-shell-preview'), true, '可见蛋体必须使用 Canvas 导出的预览图片');
assert.equal(template.includes('class="egg-shell-specular"'), true, '真实蛋体必须保留可随触摸响应的表面光泽层');
assert.equal(template.includes('class="egg-shell-depth"'), true, '真实蛋体必须保留贴近窝垫的柔和体积层');
assert.equal(template.includes('class="egg-render-cache egg-render-cache--base"'), true, '底层合成 Canvas 必须移到屏幕外');
assert.equal(template.includes('class="egg-render-cache egg-render-cache--art"'), true, '装饰合成 Canvas 必须移到屏幕外');
assert.match(styles, /\.egg-render-cache\s*\{[^}]*position:\s*fixed;[^}]*left:\s*-2000px;/s, '合成 Canvas 必须直接固定在屏幕外，不能占据首页布局');
assert.equal(template.includes(`style="{{stage !== 'hatched' ? 'top:' + nameTopPx + 'px;' : ''}}"`), true, '孵化首页昵称必须使用独立安全区锚点');
assert.equal(template.includes(`class="feedback-bubble" style="{{stage !== 'hatched' ? 'top:' + nameTopPx + 'px;' : ''}}"`), true, '孵化首页提示气泡上沿必须与昵称上沿对齐');
assert.equal(source.includes('clockTopPx: Math.round(nameTopPx + 44)'), true, '时钟必须位于昵称下方并保留稳定间距，不能与昵称重叠');
assert.match(styles, /\.pet-view--incubating \.top-row\s*\{[^}]*top:\s*88px;/s, '昵称动态定位前必须提供安全的首屏回退位置');
assert.match(styles, /\.pet-name-row\s*\{[^}]*border-radius:\s*999rpx;[^}]*background:\s*rgba\(255,252,243,\.82\)/s, '昵称必须使用蛋宝宝奶油色圆角铭牌保证可读性');
assert.match(styles, /\.incubation-nest-image\s*\{[^}]*margin:\s*-20rpx 0 0 -250rpx;/s, '窝垫必须下移到桌面落点，同时保持与蛋体分层');
assert.match(styles, /\.egg-zone--incubating \.egg\s*\{[^}]*margin-top:\s*-142rpx;/s, '孵化中蛋体必须下沉到窝垫中心，呈现被承托的关系');
assert.equal(template.includes('incubation-nest-shadow'), false, '窝垫下方不得再叠加代码阴影，地板环境光影必须来自完整背景图');
assert.equal(template.includes('egg-contact-shadow'), false, '蛋体接触阴影必须烘焙进透明蛋体层，避免运行时代码阴影割裂');
assert.equal(template.includes('wx:if="{{isDemo && pet}}" class="stage-tester"'), true, '开发版必须提供显式隔离的阶段验收下拉控件');
assert.equal(template.includes('class="scene-tester"') && template.includes('onSceneTesterSelect'), true, '开发版必须提供 36 场景季节天气验收下拉控件');
assert.equal(source.includes('wx.getImageInfo'), false, '本地 WebP 场景不得再依赖 wx.getImageInfo 预检查');
assert.equal((template.match(/class="scene-preloader-image"/g) || []).length, 3, '背景、窝垫和蛋体必须分别使用真实 image 组件预加载');
assert.equal(template.includes('bindload="onScenePreloadLoad"') && template.includes('binderror="onScenePreloadError"'), true, '场景预加载必须同时处理成功和失败状态');
assert.equal(source.includes("background: '背景'") && source.includes("nest: '窝垫'") && source.includes("egg: '蛋体'"), true, '场景预加载失败必须能区分背景、窝垫和蛋体');
assert.equal(source.includes('scenePreloadRequestToken') && source.includes("every(key => this.scenePreloadLoaded[key])"), true, '场景预加载必须忽略过期请求，并在三层全部成功后提交');
assert.match(styles, /\.stage-tester\s*\{[^}]*position:\s*fixed;[^}]*right:\s*28rpx;/s, '阶段验收控件必须固定在胶囊下方右侧测试位');
assert.match(styles, /\.scene-tester\s*\{[^}]*position:\s*fixed;[^}]*right:\s*28rpx;/s, '场景验收控件必须固定在阶段验收控件上方的右侧测试位');
assert.match(styles, /\.egg-shell-preview--art\s*\{[^}]*z-index:\s*4;/s, '用户贴纸和手绘必须位于动态光泽反馈之上');
assert.match(styles, /\.egg-shell-depth,\s*\.egg-shell-specular\s*\{[^}]*opacity:\s*0;[^}]*-webkit-mask-image:\s*url\(['"]?\/assets\/scenes\/lifecycle\/pre-hatch\/30-character\/egg\/egg_on_nest\.webp/s, '表面光泽与体积反馈必须默认隐藏，并共享真实蛋体 Alpha 裁切');
assert.match(styles, /\.egg-shell-specular\s*\{[^}]*radial-gradient/s, '表面光泽必须使用克制的渐变增强互动瞬间');
assert.match(styles, /\.egg\.egg--wobble \.egg-shell-specular\s*\{[^}]*animation:\s*shell-glint-touch/s, '轻触蛋宝宝时高光必须产生即时位移反馈');
assert.match(styles, /@keyframes shell-glint-touch\s*\{[\s\S]*background-position/s, '触摸高光反馈必须在蛋体 Alpha 内移动，而不是让整个遮罩越出蛋壳');
assert.equal(template.includes('class="companion-primary-dock"') && !/<view\s+wx:if="\{\{item\.key/.test(template) && template.includes('draw-action-spark'), true, '许愿池、早教班与画画必须共用同一枚三等分柔光 Dock');
assert.equal(template.includes('completed-check') || template.includes('completed-mark'), false, '首页入口不得出现完成勾选或完成章');
assert.match(styles, /\.companion-section--incubating\s*\{[^}]*right:\s*162rpx;[^}]*bottom:\s*calc\(24rpx \+ env\(safe-area-inset-bottom\)\)/s, '三等分功能胶囊必须为独立圆形设置按钮留出间距，并避开底部安全区');
assert.match(styles, /\.companion-grid\s*\{[^}]*flex-direction:\s*row;[^}]*gap:\s*0;/s, '许愿池、早教班与画画必须保持同一行');
assert.match(styles, /\.companion-primary-dock\s*\{[^}]*width:\s*368rpx;[^}]*height:\s*112rpx;[^}]*flex-direction:\s*row;[^}]*padding:\s*0 15rpx;[^}]*box-sizing:\s*border-box;[^}]*border-radius:\s*56rpx;[^}]*background:\s*#FFF;/s, '许愿池、早教班与画画必须作为带左右留白的统一白色三等分功能胶囊');
assert.match(styles, /\.companion-primary-dock \.companion-item\s*\{[^}]*width:\s*112rpx;[^}]*height:\s*112rpx;[^}]*flex:\s*0 0 112rpx;/s, '三个入口必须等宽并保持不小于 44px 的有效触控区域');
assert.equal(template.includes('class="companion-title"'), false, '许愿池与早教班不得保留常驻文字');
assert.equal(template.includes('bindlongpress="onCompanionLongPress"') && source.includes('scheduleCompanionFirstHint') && source.includes('COMPANION_HINT_STORAGE_KEY'), true, '无文字入口必须支持首次短提示与长按再次查看');
assert.equal(template.includes('companion-icon-hint--wish') && template.includes('companion-icon-hint--learn') && template.includes('companion-icon-hint--draw'), true, '许愿池、早教班与画画的短提示必须各自锚定在对应图标上方');
assert.match(styles, /\.companion-icon-hint\s*\{[^}]*bottom:\s*calc\(100% \+ 10rpx\);[^}]*background:\s*rgba\(255,255,255,\.96\);[^}]*color:\s*rgba\(25,30,26,\.96\);[^}]*opacity:\s*0;[^}]*transition:\s*opacity 180ms ease-out/s, '入口名称必须在对应图标上方使用白底深色文字轻量淡入淡出');
assert.match(source, /onCompanionTap\(event\)[\s\S]*?if \(key === 'wish' \|\| key === 'learn' \|\| key === 'draw'\) this\.showCompanionHint\(key\);[\s\S]*?const routes =/s, '点击许愿池、早教班或画画时必须先显示对应的就地名称');
assert.match(styles, /\.companion-item--learn::before, \.companion-item--draw::before\s*\{[^}]*left:\s*0;[^}]*top:\s*22rpx;[^}]*bottom:\s*22rpx;[^}]*width:\s*1rpx;/s, '三等分功能胶囊必须在两个分界处使用克制的竖向分隔线');
assert.equal(source.includes('蛋宝宝还没到早教的年龄，明天来试试吧。'), true, '第 1 天早教班必须使用年龄语义说明次日再来');
assert.match(styles, /\.companion-item--locked \.companion-icon-wrap::after\s*\{[^}]*background:\s*rgba\(112,117,108,\.24\);/s, '锁定中的早教班必须只在图标上覆盖灰色蒙层');
assert.match(styles, /\.companion-item--locked\s*\{[^}]*opacity:\s*1;/s, '早教班锁定时不得让整个 Dock 按钮降透明度');
assert.match(styles, /\.companion-primary-dock \.companion-item\s*\{[^}]*width:\s*112rpx;[^}]*height:\s*112rpx;/s, '画画入口必须在统一胶囊内保留不小于 44px 的触控区域');
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.companion-item--pressed\s*\{[^}]*transform:\s*none;/s, '弱动效模式必须取消入口缩放反馈');

const preHatch = require(path.join(root, 'miniprogram/config/pre-hatch-assets')).PRE_HATCH;
assert.equal(preHatch.sceneTesterOptions.length, 36, '季节天气验收器必须完整覆盖 36 个选项');
preHatch.sceneTesterOptions.forEach(option => {
  assert.ok(fs.existsSync(path.join(root, 'miniprogram', option.background)), `缺少场景背景：${option.key}`);
  assert.ok(fs.existsSync(path.join(root, 'miniprogram', option.egg)), `缺少蛋体层：${option.key}`);
  assert.ok(fs.existsSync(path.join(root, 'miniprogram', option.nest)), `缺少窝垫层：${option.key}`);
});

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
