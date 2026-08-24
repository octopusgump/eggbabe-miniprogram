const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const app = JSON.parse(read('miniprogram/app.json'));

const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const config = require('../miniprogram/config/v2');
const runtime = require('../miniprogram/services/runtime-context');
const petStore = require('../miniprogram/utils/pet-store');
const analytics = require('../miniprogram/services/analytics');
const h5Bridge = require('../miniprogram/services/birth-card-h5');

assert.equal(config.version, '3.7.0-ordinary', '前端版本必须对齐 V3.7 普通版');
assert.equal(config.buildTarget, 'ordinary-live', '生产构建必须明确为普通版 live');
assert.equal(runtime.getMode(), 'live', '普通版运行时只能使用 live');
assert.equal(runtime.setMode('demo').ok, false, '普通版不得切换到 demo');

assert.equal(app.pages.includes('pages/shop/shop'), false, '普通版不得注册商店');
assert.equal(app.pages.includes('pages/bag/bag'), false, '普通版不得注册背包');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/pages/shop/shop.js')), false, '普通版源码不得保留商店页面');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/pages/bag/bag.js')), false, '普通版源码不得保留背包页面');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/services/currency-store.js')), false, '普通版源码不得保留货币服务');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/services/scene-card-store.js')), false, '普通版源码不得保留场景产卡服务');

const homeTemplate = read('miniprogram/pages/home/home.wxml');
const homeLogic = read('miniprogram/pages/home/home.js');
const homeStyles = read('miniprogram/pages/home/home.wxss');
const lifeSceneTemplate = read('miniprogram/pages/life-scene/life-scene.wxml');
const lifeSceneLogic = read('miniprogram/pages/life-scene/life-scene.js');
const postHatchCompanion = read('miniprogram/services/post-hatch-companion.js');
const lifeSceneStyles = read('miniprogram/pages/life-scene/life-scene.wxss');
const sceneFeedbackTemplate = read('miniprogram/components/scene-feedback-stack/scene-feedback-stack.wxml');
const sceneFeedbackStyles = read('miniprogram/components/scene-feedback-stack/scene-feedback-stack.wxss');
const petAvatarTemplate = read('miniprogram/components/pet-avatar/pet-avatar.wxml');
const dailyWindowTemplate = read('miniprogram/components/daily-window-detail/daily-window-detail.wxml');
const dailyWindowLogic = read('miniprogram/components/daily-window-detail/daily-window-detail.js');
const dailyWindowStyles = read('miniprogram/components/daily-window-detail/daily-window-detail.wxss');
const windowWeatherCanvas = read('miniprogram/utils/window-weather-canvas.js');
const postHatchAssets = read('miniprogram/config/post-hatch-assets.js');
const customTabTemplate = read('miniprogram/custom-tab-bar/index.wxml');
const customTabStyles = read('miniprogram/custom-tab-bar/index.wxss');
const myTemplate = read('miniprogram/pages/my/my.wxml');
const myLogic = read('miniprogram/pages/my/my.js');
const navBarLogic = read('miniprogram/components/nav-bar/nav-bar.js');
assert.equal(/露珠|余额|孵化进度|conic-gradient|商店|背包/.test(homeTemplate), false, '首页不得显示虚拟资源、百分比或停用入口');
assert.equal(homeTemplate.includes('id="windowWeatherCanvas"') && homeTemplate.includes('catchtap="onWindowTap"'), true, '窗户必须使用 Canvas 天气层并保留直接点击互动');
assert.equal(homeLogic.includes("result: 'daily_detail_opened'") && homeLogic.includes('dailyWindowVisible: true') && homeLogic.includes('windowFogVisible: false'), true, '点击窗户必须进入日常窗外详情，同时完整露出窗景');
assert.equal(homeTemplate.includes('wx:if="{{!dailyWindowVisible}}" class="window-effects"') && homeLogic.includes("this.setData({ dailyWindowVisible: false }, () => {") && homeLogic.includes('this.setupWindowWeatherCanvas();'), true, '进入日常窗外详情时必须卸载首页窗玻璃遮罩，返回后重新创建首页天气 Canvas');
assert.equal(windowWeatherCanvas.includes('function drawFog') && windowWeatherCanvas.includes('function drawRain') && windowWeatherCanvas.includes('function drawSnow'), true, '雾、雨、雪必须由共用窗户 Canvas 模块绘制');
assert.equal(/incubation-weather-overlay|window-fog-overlay|weather-overlays\//.test(`${homeTemplate}\n${homeLogic}\n${read('miniprogram/config/pre-hatch-assets.js')}`), false, '窗户天气不得再引用透明 overlay 图片');
['w_f_fog.webp', 'w_r_rain.webp', 'w_s_snow.webp'].forEach(file => {
  assert.equal(fs.existsSync(path.join(root, 'miniprogram/assets/scenes/lifecycle/shared/40-interaction-fx/weather-overlays', file)), false, `${file} 已由 Canvas 替代，不得残留`);
});
assert.match(homeStyles, /\.window-effects\s*\{[^}]*right:\s*0;[^}]*left:\s*58%;[^}]*height:\s*50%;[^}]*border-radius:\s*0 0 0 30rpx;/s, '窗户互动区必须覆盖包含透视下沿的完整玻璃区域');
assert.match(homeStyles, /\.window-visual-effects\s*\{[^}]*clip-path:\s*polygon\(0 0,\s*100% 0,\s*100% 98%,\s*0 88%\)/s, '窗户装饰效果必须沿玻璃斜边裁剪');
assert.equal(homeTemplate.includes('class="window-visual-effects"'), true, '窗户装饰效果必须与规则点击热区分层');
assert.equal(windowWeatherCanvas.includes('clipWindowGlass(context, width, height)') && windowWeatherCanvas.includes('if (settings.clipGlass) clipWindowGlass'), true, 'Canvas 天气必须共用可适配屏幕尺寸的玻璃多边形裁剪');
assert.equal(homeLogic.includes('const frameTime = Date.now();'), true, 'Canvas 连续天气帧必须统一使用绝对时间，避免动画停在第一帧');
assert.equal(homeLogic.includes('frameTime - this.windowWeatherLastDrawAt >= 33') && homeLogic.includes('setTimeout(render, 33)'), true, 'Canvas 天气动画必须以约 30 FPS 平滑绘制');
assert.equal(homeLogic.includes('staticFrameTime = 4200') && homeLogic.includes('{ reducedMotion: true }'), true, '减少动态效果模式必须绘制稳定且可辨识的静态天气帧');
assert.match(windowWeatherCanvas, /if \(!reducedMotion && \(weather === 'storm' \|\| summerStorm\)\)/, '减少动态效果模式不得播放闪电');
assert.equal(homeLogic.includes("require('../../utils/window-weather-canvas')") && dailyWindowLogic.includes("require('../../utils/window-weather-canvas')"), true, '首页窗玻璃与日常窗外详情必须共用同一套 Canvas 天气逻辑');
assert.equal(
  homeTemplate.includes('class="time-atmosphere"')
    && ['midday', 'sunset', 'night'].every(phase => homeStyles.includes(`.light-${phase}`)),
  true,
  '房间必须支持本机日间、日落、夜晚三档环境表现'
);
assert.equal(
  ['cloudy', 'rain', 'storm', 'fog', 'snow'].every(weather => homeStyles.includes(`.weather-${weather} .time-beam`))
    && ['cloudy', 'rain', 'storm', 'fog', 'snow'].every(weather => homeStyles.includes(`.weather-${weather} .time-mote`)),
  true,
  '阴、雨、雷雨、雾与雪必须覆盖晴天时段光束和浮尘，避免天气语义冲突'
);
assert.equal(
  homeLogic.includes('millisecondsUntilNextEnvironmentBoundary()')
    && homeLogic.includes('scheduleTimeSceneRefresh()')
    && homeTemplate.includes('bindload="onTimeSceneImageLoad"')
    && homeTemplate.includes('incubation-full-scene-image--revealing'),
  true,
  '本机时段边界必须自动刷新，并在新底图预载完成后淡化切换'
);
assert.equal(
  homeLogic.includes('clearTimeSceneTimers()')
    && homeTemplate.includes('wx:if="{{!dailyWindowVisible}}" class="window-effects"')
    && homeStyles.includes('.scene-paused .egg'),
  true,
  '日常窗外打开或离页时必须暂停并清理房间时段动效'
);
// 「减少动态效果」必须走 JS 类名 + 媒体查询双通道，并用 !important 覆盖
// .egg--wobble、.light-*、.season-* 等特异性更高的状态动画，否则动画仍会播放。
assert.equal(homeTemplate.includes("reducedMotion ? 'page--reduced' : ''"), true, '首页根节点必须绑定 page--reduced');
assert.equal(/reducedMotion = this\.prefersReducedMotion\(\)/.test(homeLogic), true, '首页必须在 onShow 重新读取系统减少动态效果设置');
assert.equal(homeStyles.includes('@media (prefers-reduced-motion: reduce)'), true, '首页必须保留媒体查询作为双保险');
['.page--reduced .egg,', '.page--reduced .egg .egg-shell-specular,', '.page--reduced .time-night-glint,', '.page--reduced .season-piece,'].forEach(selector => {
  assert.equal(homeStyles.includes(selector), true, `减少动态效果必须覆盖高特异性状态动画：${selector}`);
});
assert.equal((homeStyles.match(/animation:\s*none\s*!important;/g) || []).length >= 2, true, '减少动态效果的停用规则必须使用 !important，否则会被状态类覆盖');
assert.equal(homeLogic.includes('windowImage: environmentService.windowAssetPath(target.weather, target.period)'), true, '季节天气验收状态必须同步替换日常窗外图片，不得沿用切换前窗景');
assert.equal(homeTemplate.includes('<daily-window-detail') && lifeSceneTemplate.includes('<daily-window-detail'), true, '破壳前后房间必须共用日常窗外详情组件');
assert.equal(
  homeTemplate.includes('light-phase="{{dailyWindowEnvironment.lightPhase}}"')
    && lifeSceneTemplate.includes('light-phase="{{dailyWindowEnvironment.lightPhase}}"')
    && dailyWindowLogic.includes("lightPhase: { type: String, value: 'midday' }")
    && ['midday', 'sunset', 'night'].every(phase => dailyWindowStyles.includes(`daily-window--time-${phase}`)),
  true,
  '全屏日常窗外必须复用本机日间、日落、夜晚状态'
);
assert.equal(
  dailyWindowTemplate.includes('daily-window__time-atmosphere')
    && dailyWindowTemplate.includes('daily-window__ambient-bird--seven')
    && dailyWindowTemplate.includes('bindtap="onSceneTap"')
    && dailyWindowLogic.includes('birdInteractionEnabled()')
    && dailyWindowLogic.includes('}, 2050);')
    && dailyWindowStyles.includes('daily-window-tap-bird 2s ease-out both'),
  true,
  '清晨必须显示多只鸟影，点击空白景色后的小鸟必须在约 2 秒内淡出'
);
assert.equal(
  ['cloudy', 'rain', 'storm', 'fog', 'snow'].every(weather => dailyWindowStyles.includes(`daily-window--weather-${weather} .daily-window__time-beam`))
    && dailyWindowLogic.includes('clearTapBirds()')
    && dailyWindowStyles.includes('.daily-window--reduced .daily-window__tap-bird')
    && /createInnerAudioContext|playBackgroundAudio|<audio/i.test(`${dailyWindowLogic}\n${dailyWindowTemplate}`) === false,
  true,
  '全屏天气必须覆盖晴天光束，鸟影必须支持弱动效与清理且不得添加音频'
);
assert.equal(windowWeatherCanvas.includes("weather === 'postSnow' && period === 'night'") && windowWeatherCanvas.includes('drawIceGlints'), true, '雪后夜间必须补充冰晶微光，避免全屏窗外静止');
assert.equal(
  lifeSceneTemplate.includes('<daily-window-detail')
    && lifeSceneTemplate.includes('magic-enabled="{{magicWindowEnabled}}"')
    && lifeSceneTemplate.includes('bindmagic="onOpenMagicWindow"')
    && dailyWindowTemplate.includes('daily-window__magic-entry')
    && dailyWindowLogic.includes("this.triggerEvent('magic')")
    && lifeSceneLogic.includes('magicWindowPresentation()')
    && lifeSceneLogic.includes('TOKYO_MAGIC_WINDOW_PREVIEW') === false
    && /destinations:\s*\{[^}]*tokyo/.test(postHatchAssets) === false,
  true,
  '正式三景区素材未齐时，魔法窗入口必须由正式配置关闭且不得混入东京预览'
);
assert.equal(dailyWindowTemplate.includes('正在靠近窗外') && dailyWindowTemplate.includes('窗外还没有准备好') && dailyWindowTemplate.includes('窗外景色没有加载好') && dailyWindowTemplate.includes('onRetry'), true, '日常窗外详情必须覆盖加载、空状态、失败与重试');
assert.equal(dailyWindowLogic.includes('reducedMotionEnabled') && dailyWindowLogic.includes('drawFrame(4200, true)') && dailyWindowLogic.includes('cleanup()'), true, '日常窗外详情必须支持弱动效与离页清理');
assert.equal(dailyWindowStyles.includes('@keyframes daily-window-fade-in') && dailyWindowStyles.includes('@keyframes daily-window-fade-out') && /fade-in\{from\{opacity:0\}to\{opacity:1\}\}/.test(dailyWindowStyles), true, '日常窗外详情必须使用稳定的全屏淡入淡出，不做几何位移');
assert.equal(homeTemplate.includes('class="name-actions"') && homeTemplate.includes('class="name-save"') && homeTemplate.includes('class="name-skip"') && homeTemplate.includes('bindinput="onNameInput" focus') === false && homeStyles.includes('align-items: flex-end') && homeStyles.includes('animation: name-sheet-rise') && homeStyles.includes('.name-actions { display: flex') && homeLogic.includes('Number(state.contentDay) === 1'), true, '首次命名必须只在第 1 天以可见房间的底部抽屉出现，且保存与暂不命名并排显示');
assert.equal(customTabTemplate.includes('wx:if="{{!hidden}}"') && homeLogic.includes("tabBar.setData({ hidden: true })") && homeLogic.includes('hidden: this.data.showNameSheet') && homeLogic.includes('hidden: hatched || showNameSheet'), true, '日常窗外详情完全展开时必须隐藏底部 Tab；命名页与破壳后也不得露出入口');
assert.equal(customTabTemplate.includes('wx:if="{{selected !== index}}"') && customTabTemplate.includes('src="{{item.selectedIconPath}}"') && customTabTemplate.includes('tab-text') === false, true, '底部导航只显示前往另一页的小圆图标，不得保留当前页标签或文字');
assert.match(customTabStyles, /\.tab-bar\s*\{[^}]*pointer-events:\s*none;[^}]*background:\s*transparent;/s, '底部导航必须移除整块白色 Tab 背景');
assert.match(customTabStyles, /\.tab-item\s*\{[^}]*width:\s*112rpx;[^}]*height:\s*112rpx;[^}]*border-radius:\s*50%;[^}]*background:\s*#FFF;/s, '“我的”必须作为独立的圆形底部入口');
assert.equal(customTabTemplate.includes('class="tab-hint') && customTabTemplate.includes('bindlongpress="onLongPress"'), true, '“我的”图标必须支持点击短提示与长按再次查看');
assert.match(customTabStyles, /\.tab-hint\s*\{[^}]*bottom:\s*calc\(100% \+ 10rpx\);[^}]*background:\s*rgba\(255,255,255,\.96\);[^}]*color:\s*rgba\(25,30,26,\.96\);/s, '“我的”提示必须使用图标上方的白底深色文字胶囊');
assert.equal(myLogic.includes("selected: 1, hidden: true") && myTemplate.includes('fallback-url="/pages/home/home"'), true, '我的页必须隐藏右下导航按钮，并使用左上角返回入口');
assert.equal(navBarLogic.includes('pages.length > 1') && navBarLogic.includes('this.properties.fallbackUrl') && navBarLogic.includes('wx.switchTab'), true, '左上角返回必须优先返回上一页，并在 Tab 页面栈为空时回到指定首页');
assert.equal(dailyWindowLogic.includes('getMenuButtonBoundingClientRect') && dailyWindowLogic.includes('menuBottom + 14') && dailyWindowTemplate.includes('top:{{topbarTopPx}}px'), true, '日常窗外返回按钮必须放在微信胶囊下方的安全位置');
assert.equal(/daily-window__subject|daily-window__egg-placeholder|daily-window__character-placeholder/.test(dailyWindowTemplate), false, '日常窗外详情不得显示蛋或角色占位层');
assert.equal(dailyWindowTemplate.includes('daily-window__feedback-bubble') && dailyWindowStyles.includes('border-radius:28rpx 28rpx 28rpx 8rpx') && dailyWindowStyles.includes('color:#3D4930') && dailyWindowStyles.includes('font-size:25rpx'), true, '窗外底部文字框必须与房间内现有反馈气泡视觉一致');
assert.equal(dailyWindowStyles.includes('background:rgba(255,255,255,.80)'), true, '窗外独立陪伴文字框必须继续使用既定 80% 白色背景');
assert.equal(sceneFeedbackTemplate.includes('scene-feedback-stack__back') && sceneFeedbackStyles.includes('background:rgba(255,253,247,.94)') && sceneFeedbackStyles.includes('background:rgba(18,21,18,.72)'), true, '场景页共享反馈组件必须同时提供白底对白与黑底系统卡');
assert.equal(
  dailyWindowLogic.includes('FEEDBACK_MESSAGES')
    && dailyWindowLogic.includes('nextFeedbackMessage()')
    && dailyWindowLogic.includes('onFeedbackTap()')
    && dailyWindowTemplate.includes('{{feedbackText}}')
    && dailyWindowTemplate.includes('bindtap="onFeedbackTap"')
    && dailyWindowStyles.includes('daily-window__feedback-bubble--out')
    && dailyWindowStyles.includes('--daily-window-feedback-duration'),
  true,
  '窗外必须随机展示多条第一人称陪伴文案，并支持点击淡出淡入换句'
);
const windowWeatherAssets = ['w_01_clear_day.webp', 'w_02_clear_sunset.webp', 'w_03_clear_night.webp', 'w_04_cloudy_day.webp', 'w_05_cloudy_night.webp', 'w_06_snow_day.webp', 'w_07_snow_night.webp'];
windowWeatherAssets.forEach(file => assert.equal(fs.existsSync(path.join(root, 'miniprogram/assets/scenes/lifecycle/shared/10-background/window-weather', file)), true, `缺少日常窗外素材：${file}`));
assert.equal(homeTemplate.includes('room-lamp-hotspot') && homeLogic.includes('onLampTap'), true, '台灯必须融入房间画面并可直接开关');
assert.equal(homeTemplate.includes('incubation-scene-error') && homeTemplate.includes('bindtap="onRetryFullSceneImage"') && homeTemplate.includes('incubation-room-lighting-image') === false, true, '完整房间图失败时必须显示明确错误与重试，不能叠加未完成的房间光影占位层');
assert.equal(/room-lamp-state|period-night\.room-lamp-off[^}]*brightness|rgba\(8,15,25/.test(`${homeTemplate}\n${homeStyles}`), false, '房间变黑变暗不得使用 CSS 遮罩或 brightness 滤镜渲染');
assert.equal(homeTemplate.includes('room-clock') && homeLogic.includes('onClockTap'), true, '孵化房间左上角必须保留可交互设备时钟');
assert.equal(homeLogic.includes("require('../../services/device-clock')") && homeLogic.includes('millisecondsUntilNextSecond'), true, '设备时钟必须按手机本地时间整秒校准');
assert.equal(/class="room-clock"[^>]*(?:longpress|longtap)|onClock(?:Long|Press)|12\/24|十二小时|二十四小时/.test(`${homeTemplate}\n${homeLogic}`), false, '设备时钟不得加入长按或 12/24 小时设置');
assert.equal(homeLogic.includes("key: 'draw'") && homeLogic.includes('openDoodleEditor()') && !homeLogic.includes("route: '/pages/doodle/doodle'"), true, '画画必须与许愿池、早教班同列，并在首页内嵌打开');
assert.equal(homeLogic.includes("analytics.track('room_element_interaction'"), true, '房间小物必须只发送白名单可用性事件');
assert.equal(/coffee|scarf|room-element-layer|roomSound/.test(`${homeTemplate}\n${homeLogic}\n${homeStyles}`), false, '咖啡机、围巾及旧物件按钮层必须完全移除');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/services/room-sound.js')), false, '咖啡机声音服务必须移除');
const incubationEnvironment = read('miniprogram/services/incubation-environment.js');
assert.equal(incubationEnvironment.includes("require('./environment-state')") && incubationEnvironment.includes('environmentCdnBase'), true, '环境必须由本机时段与稳定种子计算，并支持备案 CDN');
assert.equal(/tapEggCurrency|currencyAccount|requestDewForTap/.test(homeLogic), false, '轻触蛋体不得请求虚拟资源');
assert.equal(homeTemplate.includes('egg_on_nest.webp') || homeLogic.includes('shellArtService.drawEggBase'), true, '必须保留真实蛋体渲染');

const lifeScene = lifeSceneLogic;
assert.equal(/scene-card|attemptDrop|cardDrop|collectorLabel|drop-mask/.test(`${lifeScene}\n${lifeSceneTemplate}`), false, '生活场景只能返回内容反馈');
assert.equal(app.pages.includes('pages/chat/chat'), true, '居家对话必须注册完整聊天页');
assert.equal(app.pages.includes('pages/decor-studio/decor-studio'), false, '主 PRD 未放行的 AI 布置额度页面不得注册');
assert.equal(lifeSceneTemplate.includes('world-panel--living') && lifeSceneTemplate.includes('world-panel--desk') && lifeSceneTemplate.includes('world-panel--decor'), true, '破壳后必须使用三屏连续生活空间');
assert.equal(lifeSceneLogic.includes('/pages/chat/chat?state_key=') && lifeSceneTemplate.includes('wx:if="{{currentState && currentState.atHome}}" class="scene-context-entry"') && lifeSceneLogic.includes("chatAccess.status !== 'available'"), true, '左下角仅在居家时显示陪伴入口；只有服务端允许聊天时才进入完整对话页');
assert.equal(lifeSceneLogic.includes('onCharacterTouchStart') && lifeSceneLogic.includes('clearCuddleTimers'), true, '破壳后三屏必须保留长按贴贴并清理定时器');
assert.equal(/memory-entry|memory-rail|state-pill|scene-copy/.test(lifeSceneTemplate), false, '全屏生活空间不得恢复旧回忆条或常驻状态卡');
assert.equal(/demo-scene-badge|>DEMO</.test(lifeSceneTemplate), false, '破壳后正式页面不得显示 DEMO 调试标识');
assert.equal(/bed-placeholder|bed-pillow|bed-blanket|lamp-placeholder|decor-placeholder|这里留着一块安静的空地/.test(lifeSceneTemplate), false, '三屏背景上不得叠加临时床铺或安静空地占位层');
assert.equal(/sceneCharacterImage|scene-character__pose-image|scene-character__floor-shadow|class="panel-tone"|class="scene-prop/.test(`${lifeSceneLogic}\n${lifeSceneTemplate}`), false, '角色与动作道具必须烘焙进正式全景，不得叠加透明角色、接触阴影、CSS 道具或色调层');
assert.equal(lifeSceneLogic.includes('assets.resolveActionPanorama') && lifeSceneTemplate.includes('class="scene-character-hotspot') && lifeSceneTemplate.includes('bindtap="onCharacterTap"'), true, '生活空间必须使用正式动作全景，并以透明热区保留角色互动');
assert.equal(petAvatarTemplate.includes("petType === '玉兔' || petType === 'YT'") && /wx:else\s+class="koi"/.test(petAvatarTemplate) === false, true, 'YT 原型不得错误渲染成锦鲤');
assert.equal(lifeSceneTemplate.includes('wx:if="{{currentState && currentState.atHome}}" class="scene-context-entry"') && !lifeSceneTemplate.includes('class="away-status-') && !lifeSceneTemplate.includes('外出中') && lifeSceneTemplate.includes('class="scene-action-dock"') && lifeSceneTemplate.includes('contextActionIcon') && lifeSceneTemplate.includes('mySettingsIcon') && lifeSceneTemplate.includes('aria-label="打开我的和设置"') && lifeSceneLogic.includes('scene_chat_button') && lifeSceneLogic.includes('statusBubbleFor'), true, '居家使用左下陪伴入口，外出时左下留空，右下我的/设置保持可用');
assert.equal(/scene-talk-nudge|home-locator-focus|onOpenTalkComposer|composerVisible && currentState\.atHome/.test(`${lifeSceneTemplate}\n${lifeSceneLogic}`), false, '居家入口不得恢复聚焦光圈、三点提示或场景内对话弹层');
assert.equal(/toolboxVisible|onToggleToolbox|onToolboxItemTap|data-target="(?:card|postcards|keepsakes)"|scene-action-unread-dot/.test(`${lifeSceneTemplate}\n${lifeSceneLogic}`), false, 'V3.6 / V3.7 不得暴露百宝箱弹层、复杂内容入口或未读提示');
assert.equal(lifeSceneLogic.includes("onOpenMySettings() {\n    wx.switchTab({ url: '/pages/my/my' });"), true, '右下我的/设置必须直接打开我的页');
// 已完成素材保留在配置中，供后续版本重新评估时使用；V3.6 / V3.7 模板不得读取。
assert.doesNotMatch(lifeSceneTemplate, /src="[^"]*\/assets\//, '生活空间模板不得写死资源路径');
const toolboxItemIcons = require('../miniprogram/config/post-hatch-assets').POST_HATCH.sceneActions.toolboxItems;
assert.equal(
  toolboxItemIcons.my.endsWith('/ui_3d_tabbar_interaction_gear_flat_96_v04_p8_v01.png')
    && ['card', 'postcards', 'keepsakes'].every(key => toolboxItemIcons[key])
    && Object.values(toolboxItemIcons).some(icon => icon.includes('ui_3d_toolbox_settings_gear_96_v03.webp')) === false,
  true,
  '我的/设置必须复用现有设置图标，并保留已完成的复杂内容图标资产'
);
assert.equal(homeLogic.includes('/pages/life-scene/life-scene?entry=post-hatch-landing'), true, '破壳后进入首页必须直接落到全屏生活空间');
assert.equal(/post-hatch-landing__memory|看看回忆/.test(homeTemplate), false, '首页不得保留空的破壳后落地层或重复的回忆入口');
assert.equal(homeLogic.includes('wx.redirectTo') && homeLogic.includes('生活空间没有打开，请重试'), true, '生活空间常规跳转失败时必须替换跳转，不能回退为空房间');
assert.equal(read('miniprogram/services/post-hatch-companion.js').includes('5 * 60 * 60 * 1000'), true, '破壳后当前状态必须按 5 小时时段推进');

const album = read('miniprogram/pages/album/album.wxml');
assert.equal(album.includes('title="我的收藏卡"'), true, '收藏页标题必须为“我的收藏卡”');
assert.equal(/收集系列|空卡位|尚未遇见|\/ 10|集齐/.test(album), false, '单蛋收藏页不得显示系列进度或空卡位');
assert.equal(album.includes('一蛋一份'), true, '收藏页必须表达一蛋一份');

const cloudApi = read('miniprogram/services/cloud-api.js');
assert.equal(/currency|inventory|shop|sceneCardDrop|updateSceneCard/i.test(cloudApi), false, 'live 服务适配层不得暴露停用接口');
assert.equal(cloudApi.includes('recordCompanionInteraction'), true, '服务层必须预留自由互动接口');
assert.equal(cloudApi.includes('recordRoomElementInteraction'), true, '服务层必须预留房间小物接口');
assert.equal(cloudApi.includes('chatReply'), true, '服务层必须预留正式对话回复接口');
assert.equal(cloudApi.includes('saveEggCreation'), true, '服务层必须预留蛋壳创作写入接口');
assert.equal(cloudApi.includes('getPostHatchHome') && cloudApi.includes('performPostHatchAction') && cloudApi.includes('getPostHatchMemories'), true, '服务层必须保留主 PRD 的破壳后读取与居家动作接口');
assert.equal(/sendLetter|sendPostHatchLetter|onSendLetter|onLetterInput|scene-composer--letter|composer-send--paper-plane|write_letter|scene_letter_button/.test(`${lifeSceneLogic}\n${lifeSceneTemplate}\n${postHatchCompanion}\n${cloudApi}`), false, '写信的界面、事件、服务和云接口必须完全移除');
assert.equal(/getPostHatchDecorations|createRoomDecoration|moveRoomDecoration/.test(cloudApi), false, '服务层不得预留装饰额度或装饰物库接口');
assert.equal(cloudApi.includes("mode: 'live'") && cloudApi.includes('request_id'), true, '正式请求必须带 live 与唯一请求 ID');
assert.equal(read('miniprogram/services/chat-service.js').includes("result && result.ok && result.mode === 'live'"), true, '对话适配层必须只接受 live 成功回复');

const forbiddenEvents = Array.from(analytics.EVENT_ALLOWLIST).filter(name => /(?:^|_)(?:currency|reward|drop|inventory|shop|quest|streak|growth|relationship)(?:_|$)/i.test(name));
assert.deepEqual(forbiddenEvents, [], '埋点白名单不得包含游戏经济或成长事件');
assert.equal(analytics.EVENT_ALLOWLIST.has('room_element_interaction'), true, '房间互动事件必须在白名单');
assert.equal(analytics.EVENT_ALLOWLIST.has('companion_interaction'), true, '自由互动事件必须在白名单');

petStore.saveUser({ id: 'user-live-1', publicId: 'EB-LIVE-1', nickname: '微信用户' });
const imported = petStore.importCloudPet({
  egg_id: 'egg-live-1',
  user_id: 'user-live-1',
  mode: 'live',
  prototype: '玉兔',
  lifecycle_stage: 'RESTING',
  shell: {}
}, 'live');
assert.equal(imported.ok, true, '必须可以导入服务端 live 实体蛋');
assert.equal(petStore.importCloudPet({ egg_id: 'legacy-egg' }, 'live').ok, false, '不得把缺少 mode 的旧记录包装成 live');
assert.equal(petStore.getStage(imported.pet), 'waiting', 'RESTING 必须映射为等待破壳');
petStore.saveUser({ id: 'user-live-2', publicId: 'EB-LIVE-2' });
assert.equal(petStore.getPet(), null, '切换账号时不得读取上一账号的实体蛋缓存');
petStore.saveUser({ id: 'user-live-1', publicId: 'EB-LIVE-1' });
assert.equal(petStore.completeWish('希望今天慢一点').added, 0, '自由互动不得产生累计值');
const storedPet = petStore.getPet();
assert.equal('progress' in storedPet, false, 'live 实体蛋不得保存孵化百分比');
assert.equal('tasks' in storedPet, false, 'live 实体蛋不得保存任务记录');
assert.equal('preferences' in storedPet, false, 'live 实体蛋不得保存互动偏好画像');

const card = {
  card_id: 'card-live-1',
  egg_id: 'egg-live-1',
  mode: 'live',
  prototype: 'YT',
  style: '月白桂花款',
  display_name: '我的蛋宝宝',
  hatched_at: '2026-07-24T02:00:00.000Z',
  identity_code: 'EGG-YT-20260724-000001',
  source_batch: 'BATCH-01',
  illustration_key: 'YT__moon_white',
  illustration_url: 'https://cdn.eggbabe.com/cards/yt-moon-white.webp'
};
assert.equal(petStore.applyCloudHatchCard(card).ok, true, '收藏卡必须消费服务端已确定结果');
assert.equal(petStore.applyCloudHatchCard(Object.assign({}, card, { mode: undefined })).ok, false, '不得把缺少 mode 的卡包装成 live');
const h5Data = h5Bridge.toH5Card(petStore.getPet());
assert.equal(h5Data.identity_code, card.identity_code, 'H5 桥接必须传递身份编号');
assert.equal(h5Data.display_name, '我的蛋宝宝', '未命名回退必须固定');
assert.equal(h5Bridge.buildH5Url('https://eggbabe.com/card', h5Data, 'https://api.eggbabe.com').includes('card_data='), false, 'live H5 不得注入客户端业务结果');
petStore.clearUser();
assert.equal(petStore.getPet(), null, '退出登录必须清除本机实体蛋缓存');

[
  'build-environment.test.js',
  'demo-experience.test.js',
  'demo-network-isolation.test.js',
  'demo-pages.test.js',
  'daily-mood.test.js',
  'device-clock.test.js',
  'environment-state.test.js',
  'incubation-environment.test.js',
  'navigation-interactions.test.js',
  'post-hatch-companion.test.js',
  'release-gate.test.js',
  'window-weather-canvas.test.js'
].forEach(test => {
  execFileSync(process.execPath, [path.join(root, 'miniprogram/services/tests', test)], { stdio: 'pipe' });
});

console.log('V3.7 普通小程序核心合规回归通过。');
