const assert = require('assert');
const fs = require('fs');
const path = require('path');

const preHatch = require('../../config/pre-hatch-assets').PRE_HATCH;
const postHatchAssets = require('../../config/post-hatch-assets');

const sourceScenes = preHatch.sceneTesterOptions || [];
const panoramaSets = postHatchAssets.POST_HATCH.panoramaSceneSets || {};

assert.equal(sourceScenes.length, 20, '全景场景必须严格跟随破壳前当前启用的 20 个状态');
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

const lifeSceneLogic = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.js'), 'utf8');
const lifeSceneWxml = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.wxml'), 'utf8');
const lifeSceneStyles = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.wxss'), 'utf8');
assert.equal(lifeSceneLogic.includes('assets.resolvePanoramaScene(sceneKey)'), true, '全屏生活空间必须按当前环境 scene key 读取单张全景图');
assert.equal(/resolvePanelSceneSet|panelImages|usingPanoramaFallback|scrollIntoView/.test(lifeSceneLogic), false, '生活空间不得保留三张切图或双重滚动定位逻辑');
assert.deepEqual(postHatchAssets.POST_HATCH.panoramaFallbackMeta, {
  width: 2823,
  height: 1672,
  windowRegions: [{ id: 'main-window', x: 1050, y: 0, width: 1570, height: 800 }]
}, '全景图必须声明实际尺寸和原图窗口区域');
assert.equal((lifeSceneWxml.match(/class="world-panorama-bg"/g) || []).length, 1, '运行场景必须只渲染一个连续全景节点');
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
