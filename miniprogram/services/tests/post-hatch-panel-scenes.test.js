const assert = require('assert');
const fs = require('fs');
const path = require('path');

const preHatch = require('../../config/pre-hatch-assets').PRE_HATCH;
const postHatchAssets = require('../../config/post-hatch-assets');

const sourceScenes = preHatch.sceneTesterOptions || [];
const panoramaSets = postHatchAssets.POST_HATCH.panoramaSceneSets || {};

assert.equal(sourceScenes.length, 36, '全景场景必须严格跟随破壳前启用的 36 个季节/天气/时段状态');
assert.deepEqual(Object.keys(panoramaSets), sourceScenes.map(scene => scene.key), '全景 scene key 必须与破壳前配置同源且顺序一致');

sourceScenes.forEach(scene => {
  const set = panoramaSets[scene.key];
  assert.equal(set.expected.panorama.endsWith(`/panorama-three-screen/scene-sets/${scene.key}_post_hatch_panorama_v01.webp`), true, `${scene.key} 全景文件名不符合规范`);
  assert.equal(set.ready, Boolean(set.panorama), `${scene.key} 必须完整启用一张全景图，不能使用半套切图`);
  const absolute = path.resolve(__dirname, '../..', `.${set.panorama}`);
  assert.equal(fs.existsSync(absolute), true, `${scene.key} 正式运行时全景资源缺失：${set.panorama}`);
  assert.deepEqual(set.windowMeta, postHatchAssets.POST_HATCH.panoramaFallbackMeta, `${scene.key} 必须使用同一套完整全景窗口坐标`);
});

assert.equal(postHatchAssets.resolvePanoramaScene('unknown_scene'), null, '未知 scene key 不得静默混入其他套装');
assert.equal(postHatchAssets.POST_HATCH.characterPoses.stare.sunset.endsWith('/jade-rabbit/stare_sunset_v01.webp'), true, '玉兔发呆日落样张必须使用明确的透明 WebP 文件');
assert.equal(postHatchAssets.POST_HATCH.characterPoses.stare.day, '', '日落样张不得静默复用为日间角色图');
assert.equal(postHatchAssets.POST_HATCH.characterPoses.stare.night, '', '日落样张不得静默复用为夜晚角色图');

const lifeSceneLogic = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.js'), 'utf8');
const lifeSceneWxml = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.wxml'), 'utf8');
const lifeSceneStyles = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.wxss'), 'utf8');
assert.equal(lifeSceneLogic.includes('assets.resolvePanoramaScene(sceneKey, cdnBase)'), true, '全屏生活空间必须按当前环境 scene key 读取单张全景图，并支持备案 CDN');
assert.equal(/assets\.POST_HATCH\.panoramaFallback(?!Meta)/.test(lifeSceneLogic), false, '破壳后背景加载失败不得静默替换为其他天气场景');
assert.equal(lifeSceneLogic.includes("isDemo: config.localDemoEnabled"), true, '破壳后环境测试器只能在开发验收模式启用');
assert.equal(lifeSceneLogic.includes('onSceneTesterSelect(event)'), true, '破壳后必须支持选择同一套环境测试场景');
assert.equal(lifeSceneLogic.includes('onStageTesterSelect(event)'), true, '破壳后必须支持 Day 1–Day 7 与破壳后阶段测试');
assert.equal(lifeSceneLogic.includes('onCompanionStateTesterSelect(event)'), true, '破壳后开发模式必须支持陪伴状态切换测试');
assert.equal(lifeSceneLogic.includes("key: 'home-talk'"), true, '陪伴状态测试必须覆盖在家且可对话');
assert.equal(lifeSceneLogic.includes("key: 'home-busy'"), true, '陪伴状态测试必须覆盖在家不便对话');
assert.equal(lifeSceneLogic.includes("key: 'away-letter'"), true, '陪伴状态测试必须覆盖不在家写信');
assert.equal(lifeSceneLogic.includes('isCompanionStatePreview()'), true, '陪伴状态测试必须明确隔离预览写入');
assert.equal(lifeSceneWxml.includes('wx:if="{{isDemo && currentState && sceneBackgroundReady}}" class="scene-tester'), true, '破壳后右上角环境测试入口必须等全景图就绪后显示');
assert.equal(lifeSceneWxml.includes('wx:if="{{isDemo && currentState && sceneBackgroundReady}}" class="stage-tester"'), true, '破壳后必须恢复开发版阶段切换入口，并等待全景图就绪后显示');
assert.equal(lifeSceneWxml.includes('catchtap="onStageTesterToggle"') && lifeSceneWxml.includes('catchtap="onStageTesterSelect"'), true, '破壳后阶段切换入口必须支持展开并选择 Day 1–Day 7 / 破壳后');
assert.equal(lifeSceneWxml.includes('class="companion-state-tester"'), true, '破壳后必须显示开发模式陪伴状态测试入口');
assert.equal(/pano-static-character|sceneCharacter3d|Three\.js/.test(`${lifeSceneLogic}\n${lifeSceneWxml}`), false, '3D MVP 关闭后，生活空间不得保留 WebGL 角色依赖或调试入口');
assert.equal(lifeSceneLogic.includes('function characterPosePath(key, environment)'), true, '角色图必须按状态与环境时段取图');
assert.equal(lifeSceneLogic.includes('characterPresentation(this.data.pet, currentState, this.data.dailyWindowEnvironment)'), true, '首次加载角色图必须读取当前环境时段');
assert.equal(lifeSceneLogic.includes('const character = characterPresentation(this.data.pet, this.data.currentState, environment);'), true, '切换环境测试场景时必须重新判定角色图');
assert.equal(lifeSceneWxml.includes('showSceneCharacter && sceneCharacterScreen === 1'), true, '中屏发呆角色图必须只渲染到中屏');
assert.equal(lifeSceneStyles.includes('.scene-character--stare'), true, '发呆角色图必须具有独立摆位样式');
assert.equal(lifeSceneLogic.includes('sceneTesterTopPx: Math.round(testerTopPx)'), true, '破壳后环境测试器应与破壳前一样位于第一行');
assert.equal(lifeSceneLogic.includes('stageTesterTopPx: Math.round(testerTopPx + 44)'), true, '破壳后阶段切换入口必须位于场景与状态验收器之间');
assert.equal(lifeSceneLogic.includes('restoreToolboxOnReturn = true') && lifeSceneLogic.includes('toolboxVisible: restoreToolbox'), true, '从百宝箱子页返回生活场景时必须恢复百宝箱，不得只落在空桌面');
assert.equal(lifeSceneWxml.includes('wx:if="{{!sceneEntered && !error}}" class="state-layer"'), true, '首帧必须保持加载层直到全景与目标面板均可淡入');
assert.equal(lifeSceneLogic.includes('sceneBackgroundReady: true, sceneBackgroundError: false'), true, '全景图加载成功后才能安排首帧淡入');
assert.equal(lifeSceneLogic.includes('currentScreen: 1') && lifeSceneLogic.includes('scrollLeft: panelWidth'), true, '首帧必须先定位到中屏，避免异步状态回读时从左屏横向滑入');
assert.equal(lifeSceneLogic.includes('revealInitialScene()') && lifeSceneWxml.includes("scene-stage {{sceneEntered ? 'scene-stage--entered' : ''}}"), true, '进入生活空间必须使用受资源就绪门槛控制的淡入层');
assert.equal(lifeSceneStyles.includes('.scene-stage{position:absolute;inset:0;opacity:0;') && lifeSceneStyles.includes('.scene-stage--entered{opacity:1;'), true, '场景入场必须是渐入，而非横向页面滑动');
assert.equal(lifeSceneWxml.includes('scene-action-talk-badge'), true, '可对话时的找到 ta 按钮必须展示对话标记');
assert.equal(lifeSceneWxml.includes('scene-action-unread-dot'), true, '新明信片必须在场景入口展示红点提示');
assert.equal(lifeSceneWxml.includes('contextActionShowTalkBadge') && lifeSceneWxml.includes('contextActionHasNewMessage'), true, '红点与可对话徽标必须由互斥状态控制');
assert.equal(lifeSceneStyles.includes('.scene-action-button--talkable'), true, '可对话状态必须与不便对话状态有明确的按钮视觉差异');
assert.equal(lifeSceneStyles.includes('background:#F1EC9A'), true, '可对话徽标必须使用晨露黄，表达互动而非成长状态');
assert.equal(lifeSceneStyles.includes('background:#26362B'), true, '可对话徽标图形必须使用深墨绿');
assert.equal(lifeSceneStyles.includes('top:30rpx;right:16rpx') && lifeSceneStyles.includes('background:#D9463C'), true, '新消息红点必须靠近角色头像头部侧边，并使用功能提示红');
assert.equal(lifeSceneWxml.includes('composer-send--paper-plane'), true, '写信发送按钮必须使用与场景操作一致的 3D 纸飞机视觉');
assert.equal(lifeSceneWxml.includes('adjust-position="{{false}}"') && lifeSceneWxml.includes('bindkeyboardheightchange="onLetterKeyboardHeightChange"'), true, '写信栏必须自主响应键盘高度，避免系统与页面双重上推');
assert.equal(lifeSceneLogic.includes('resolveLetterComposerTop(keyboardHeight, panelHeight, panelWidth)'), true, '写信栏必须根据屏幕与键盘可用高度计算安全位置');
assert.equal(lifeSceneStyles.includes('.scene-composer--letter{position:fixed;bottom:auto;'), true, '写信栏必须脱离底部停靠并放到屏幕上中部');
assert.equal(/resolvePanelSceneSet|panelImages|usingPanoramaFallback|scrollIntoView/.test(lifeSceneLogic), false, '生活空间不得保留三张切图或双重滚动定位逻辑');
assert.deepEqual(postHatchAssets.POST_HATCH.panoramaFallbackMeta, {
  width: 2823,
  height: 1672,
  windowRegions: [{ id: 'main-window', x: 1050, y: 0, width: 1570, height: 800 }]
}, '全景图必须声明实际尺寸和原图窗口区域');
assert.equal((lifeSceneWxml.match(/world-panorama-bg/g) || []).length, 3, '场景切换仅允许保留一张淡出的旧全景与一张当前全景');
assert.equal(lifeSceneWxml.includes('src="{{panoramaImage}}"'), true, '运行场景和退场过渡必须使用当前全景图');
assert.equal(/panelImages|class="panel-bg"|scroll-into-view/.test(lifeSceneWxml), false, 'WXML 不得保留三张切图节点或双重滚动定位');
assert.equal(lifeSceneLogic.includes('windowGeometry.mapPanoramaRegions'), true, '全景窗口必须用原图坐标映射到设备屏幕');
assert.equal(lifeSceneWxml.includes('daily-window-hotspot--panel-1'), true, '中屏可见窗户必须有独立点击区');
assert.equal(lifeSceneWxml.includes('daily-window-hotspot--panel-2'), true, '右屏可见窗户必须有独立点击区');
assert.equal(lifeSceneWxml.includes('daily-window-hotspot--panel-0'), true, '左屏必须支持未来可见窗户的统一动态热区');
assert.equal(lifeSceneWxml.includes('bindtouchstart="onDailyWindowTouchStart"') && lifeSceneWxml.includes('bindtouchmove="onDailyWindowTouchMove"') && lifeSceneWxml.includes('bindtouchend="onDailyWindowTouchEnd"'), true, '窗户必须自行仲裁点击、拖动和长按');
assert.equal(lifeSceneWxml.includes('catchtap="onDailyWindowTap"'), false, '窗口不得依赖平台 catchtap 猜测滑动意图');
assert.equal(/daily-window-hotspot--panel-1\{[^}]*left:10%|daily-window-hotspot\{[^}]*height:48%/.test(lifeSceneStyles), false, '窗口热区不得继续使用固定设备百分比');
assert.equal(lifeSceneLogic.indexOf('this.openDailyWindow(windowSelector)') < lifeSceneLogic.indexOf('this.runSceneAction(false);', lifeSceneLogic.indexOf('onDailyWindowTap(event)')), true, '窗景必须先打开，动作写入不得阻断点击');

console.log('破壳后单张连续全景、动态窗户坐标和手势校验通过。');
