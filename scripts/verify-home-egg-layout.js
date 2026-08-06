const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const template = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.wxss'), 'utf8');
const source = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.js'), 'utf8');
const depthOverlay = path.join(root, 'miniprogram/assets/scenes/lifecycle/pre-hatch/30-character/egg/egg_shell_depth_overlay_512_v01.webp');
const specularOverlay = path.join(root, 'miniprogram/assets/scenes/lifecycle/pre-hatch/30-character/egg/egg_shell_specular_overlay_512_v01.webp');

const visibleEggMatch = template.match(/<view wx:if="\{\{stage !== 'hatched'\}\}" class="egg egg-shell[\s\S]*?<\/view>/);
assert.ok(visibleEggMatch, '首页必须保留位于孵化窝中的可交互蛋体容器');
assert.equal(visibleEggMatch[0].includes('<canvas'), false, '可见蛋体容器不得直接嵌套原生 Canvas，否则滚动时会脱离孵化窝');
assert.equal(visibleEggMatch[0].includes('egg-shell-preview'), true, '可见蛋体必须使用 Canvas 导出的预览图片');
assert.equal(template.includes('class="egg-shell-specular"'), true, '真实蛋体必须保留可随触摸响应的表面光泽层');
assert.equal(template.includes('class="egg-shell-depth"'), true, '真实蛋体必须保留贴近窝垫的柔和体积层');
assert.equal(template.includes('egg_shell_depth_overlay_512_v01.webp') && template.includes('egg_shell_specular_overlay_512_v01.webp'), true, '蛋体光影必须通过 image 组件读取本地 WebP');
assert.equal(fs.existsSync(depthOverlay) && fs.existsSync(specularOverlay), true, '蛋体体积与高光 WebP 必须存在');
assert.equal(fs.readFileSync(depthOverlay, { encoding: null }).subarray(0, 4).toString('ascii'), 'RIFF', '体积层必须为 WebP');
assert.equal(fs.readFileSync(specularOverlay, { encoding: null }).subarray(0, 4).toString('ascii'), 'RIFF', '高光层必须为 WebP');
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
assert.equal(template.includes('wx:if="{{!doodleEditorVisible && isDemo && pet && stage !== \'hatched\'}}" class="stage-tester '), true, '开发版阶段验收控件只能出现在破壳前，且画画时必须卸载');
assert.equal(template.includes('wx:if="{{pet && stage === \'hatched\'}}" class="post-hatch-redirect"'), true, '破壳后首页跳转期间必须有与生活空间连续的过渡层');
assert.equal(source.includes('this.postHatchLandingActive = false'), true, '返回首页时必须复位破壳后跳转锁，避免永久停在空白首页');
assert.equal(template.includes('class="scene-tester ') && template.includes('onSceneTesterSelect'), true, '开发版必须提供 36 场景季节天气验收下拉控件');
assert.equal(source.includes('wx.getImageInfo'), false, '本地 WebP 场景不得再依赖 wx.getImageInfo 预检查');
assert.equal((template.match(/class="scene-preloader-image"/g) || []).length, 3, '背景、窝垫和蛋体必须分别使用真实 image 组件预加载');
assert.equal(template.includes('bindload="onScenePreloadLoad"') && template.includes('binderror="onScenePreloadError"'), true, '场景预加载必须同时处理成功和失败状态');
assert.equal(source.includes("background: '背景'") && source.includes("nest: '窝垫'") && source.includes("egg: '蛋体'"), true, '场景预加载失败必须能区分背景、窝垫和蛋体');
assert.equal(source.includes('scenePreloadRequestToken') && source.includes("every(key => this.scenePreloadLoaded[key])"), true, '场景预加载必须忽略过期请求，并在三层全部成功后提交');
assert.match(styles, /\.stage-tester\s*\{[^}]*position:\s*fixed;[^}]*right:\s*28rpx;/s, '阶段验收控件必须固定在胶囊下方右侧测试位');
assert.match(styles, /\.scene-tester\s*\{[^}]*position:\s*fixed;[^}]*right:\s*28rpx;/s, '场景验收控件必须固定在阶段验收控件上方的右侧测试位');
assert.match(styles, /\.egg-shell-preview--art\s*\{[^}]*z-index:\s*4;/s, '用户贴纸和手绘必须位于动态光泽反馈之上');
assert.match(styles, /\.egg-shell-depth,\s*\.egg-shell-specular\s*\{[^}]*opacity:\s*0;[^}]*will-change:\s*transform, opacity;/s, '表面光泽与体积 WebP 必须默认隐藏并支持动态反馈');
assert.equal(/(?:mask-image|background-image)\s*:\s*url\([^)]*\/assets\//.test(styles), false, 'WXSS 不得通过 url() 读取本地图片');
assert.match(styles, /\.egg\.egg--wobble \.egg-shell-specular\s*\{[^}]*animation:\s*shell-glint-touch/s, '轻触蛋宝宝时高光必须产生即时位移反馈');
assert.match(styles, /@keyframes shell-glint-touch\s*\{[^}]*transform:/s, '触摸高光 WebP 必须保留动态位移反馈');
assert.equal(template.includes('home-stage--{{homeStagePhase}}') && source.includes("homeStagePhase: 'hidden'"), true, '蛋体、场景和首页 UI 必须由同一入场状态控制');
assert.equal((template.match(/home-stage--\{\{homeStagePhase\}\}/g) || []).length, 3, '蛋体场景、场景验收器与阶段验收器必须同步入场');
assert.match(styles, /\.home-stage--entering\s*\{[^}]*home-stage-fade-in 320ms/s, '首页整体必须使用 320ms 淡入');
assert.equal(source.includes('HOME_STAGE_TRANSITION_MS = 320') && source.includes('openDoodleEditor()') && !source.includes("route: '/pages/doodle/doodle'"), true, '画画入口必须使用首页内嵌编辑器，从根源避免微信默认右滑路由');
assert.equal(template.includes('<doodle-editor') && template.includes('wx:if="{{doodleEditorVisible}}"') && template.includes('bindclose="onDoodleEditorClose"'), true, '首页必须在当前页内打开并关闭画画编辑器');
assert.equal(source.includes('suspendHomeForDoodle()') && source.includes('this.stopClock();') && source.includes('this.stopWindowWeatherAnimation();') && source.includes('this.clearTimeSceneTimers();'), true, '内嵌画画编辑器挂载前必须暂停首页时钟、天气动画与场景定时器');
assert.equal(template.includes('<scroll-view wx:if="{{!doodleEditorVisible}}"') && template.includes('wx:if="{{!doodleEditorVisible && pet && stage !== \'hatched\'}}" type="2d" id="homeEggBaseCanvas"'), true, '画画时必须卸载首页可见场景与屏幕外蛋体 Canvas，避免原生节点并发占用');
assert.match(source, /onDoodleEditorClose\(\)[\s\S]*?doodleEditorVisible:\s*false,[\s\S]*?homeStagePhase:\s*'hidden',[\s\S]*?homeEggArtPreview:\s*''/, '清空作品返回首页时必须先隐藏舞台并清除旧蛋壳预览，避免旧图案闪现');
assert.doesNotMatch(source, /setupHomeEgg\(\)\s*\{[^}]*sceneTestOverride/, '场景测试覆盖只能改变环境，不得阻止已保存蛋壳重新合成');
assert.doesNotMatch(source, /renderHomeEgg\(\)\s*\{[^}]*sceneTestOverride/, '桌面蛋体渲染不得因场景测试覆盖而丢失已保存笔迹');
assert.match(source, /onScenePreloadLoad\(event\)[\s\S]*?this\.setupHomeEgg\(\);[\s\S]*?已切换：/, '切换测试场景后必须重新合成自定义蛋壳');
assert.equal(source.includes('wx.getSystemSetting') && !/prefersReducedMotion\(\)[\s\S]*?const system = wx\.getSystemInfoSync\(\)/.test(source), true, '弱动效检测必须优先使用拆分后的新系统接口，避免每次转场产生弃用警告');
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
