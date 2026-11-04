const assert = require('assert');
const fs = require('fs');
const path = require('path');
const route = require('../doodle-prop-share-route');

const miniprogramRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(miniprogramRoot, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(miniprogramRoot, relativePath), 'utf8');
}

function collectSkylineJson(dir, acc) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSkylineJson(full, acc);
      return;
    }
    if (!entry.name.endsWith('.json')) return;
    const json = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (json.renderer === 'skyline') acc.push(path.relative(miniprogramRoot, full));
  });
  return acc;
}

function sliceFirstTag(markup, tag) {
  const start = markup.indexOf(`<${tag}`);
  const end = markup.indexOf(`</${tag}>`);
  assert.ok(start >= 0 && end > start, `${tag} 必须成对出现`);
  return markup.slice(start, end);
}

const app = JSON.parse(read('app.json'));
const activitiesJson = JSON.parse(read('pages/iaa-activities/iaa-activities.json'));
const doodleJson = JSON.parse(read('pages/doodle/doodle.json'));
const project = JSON.parse(fs.readFileSync(path.join(repoRoot, 'project.config.json'), 'utf8'));
const activitiesWxml = read('pages/iaa-activities/iaa-activities.wxml');
const activitiesWxss = read('pages/iaa-activities/iaa-activities.wxss');
const activitiesJs = read('pages/iaa-activities/iaa-activities.js');
const doodleWxml = read('pages/doodle/doodle.wxml');
const doodleWxss = read('pages/doodle/doodle.wxss');
const doodleScript = read('pages/doodle/doodle-definition.js');
const appScript = read('app.js');
const listShare = sliceFirstTag(activitiesWxml, 'share-element');
const doodleShare = sliceFirstTag(doodleWxml, 'share-element');
const skylineJson = collectSkylineJson(path.join(miniprogramRoot, 'pages'), []).sort();

assert.equal(app.renderer, undefined, '不得把整个小程序默认切到 Skyline');
assert.equal(app.lazyCodeLoading, 'requiredComponents', 'Skyline 依赖按需注入');
assert.equal(app.rendererOptions.skyline.defaultDisplayBlock, true);
assert.equal(app.rendererOptions.skyline.defaultContentBox, true);
assert.equal(app.rendererOptions.skyline.tagNameStyleIsolation, 'legacy');
assert.equal(app.rendererOptions.skyline.keyframeStyleIsolation, 'legacy');
assert.deepEqual(skylineJson, [
  'pages/doodle/doodle.json',
  'pages/iaa-activities/iaa-activities.json'
], '第一版只给可玩列表和 doodle 打开 Skyline');
assert.equal(activitiesJson.renderer, 'skyline');
assert.equal(activitiesJson.componentFramework, 'glass-easel');
assert.equal(activitiesJson.navigationStyle, 'custom');
assert.equal(activitiesJson.disableScroll, true);
assert.equal(doodleJson.renderer, 'skyline');
assert.equal(doodleJson.componentFramework, 'glass-easel');
assert.equal(doodleJson.navigationStyle, 'custom');
assert.equal(doodleJson.disableScroll, true);
assert.equal(doodleJson.disableSwipeBack, true, '画布页继续关闭边缘右滑，避免涂抹误触返回');
assert.equal(project.setting.compileWorklet, true, '自定义路由的 worklet 必须参与编译');
assert.equal(project.setting.skylineRenderEnable, true);

assert.equal(route.ROUTE_TYPE, 'propPaper');
assert.equal(route.SHARE_ELEMENT_KEY, 'propPaperCard');
assert.equal(route.PROP_PAPER_WIDTH_OVER_HEIGHT, 88 / 120);
assert.equal(route.PROP_PAPER_TRANSITION_MS, 320);
assert.match(doodleScript, /const PAGE_TRANSITION_MS = 320/, 'Canvas defer 须仍与 320ms 转场对齐，不得比 main 更晚');
assert.match(doodleScript, /PROP_CANVAS_SETUP_DEFER_MS = PAGE_TRANSITION_MS/);
assert.match(doodleScript, /revealPatch\.pageTransitionPhase = 'visible'/);
assert.equal((activitiesWxml.match(/<share-element/g) || []).length, 1);
assert.equal((doodleWxml.match(/<share-element/g) || []).length, 1);
assert.equal(listShare.includes('key="propPaperCard"'), true);
assert.equal(doodleShare.includes('key="propPaperCard"'), true);
assert.equal(listShare.includes('activities-row__icon') || listShare.includes('item.icon'), false, '不得用调色板图标做共享元素');
assert.match(listShare, /activities-prop-paper-card/);
assert.match(listShare, /activities-prop-paper-dash/);
assert.equal(doodleShare.includes('<canvas') || doodleShare.includes('cover-view'), false, '共享元素只包画纸，不包 Canvas');
assert.match(doodleShare, /class="prop-paper-board"/);
assert.match(doodleShare, /class="prop-paper-dash"/);
assert.match(doodleWxml, /wx:else class="prop-paper-board"/, '降级时仍渲染原来的画纸');
assert.match(doodleWxml, /<canvas[\s\S]*type="2d"[\s\S]*id="eggBaseCanvas"/);
assert.match(doodleWxml, /<canvas[\s\S]*type="2d"[\s\S]*id="eggArtCanvas"/);
assert.match(doodleWxml, /<root-portal>[\s\S]*<cover-view class="doodle-nav-cover"/);
assert.match(doodleWxml, /<cover-view wx:if="\{\{colorPickerOpen\}\}" class="brush-color-popover"/);
assert.match(activitiesWxss, /width:\s*calc\(80rpx \* 88 \/ 120\)/);
assert.match(activitiesWxss, /height:\s*80rpx;/);
assert.doesNotMatch(activitiesWxss, /\.activities-prop-paper-share\s*\{[^}]*transform:/, '列表占位不能用 transform 居中');
assert.match(doodleWxss, /\.prop-paper-stage\s*\{[^}]*width:\s*88vw;[^}]*height:\s*120vw;/);
assert.match(doodleWxss, /\.prop-paper-share\s*\{[^}]*pointer-events:\s*none;/);

assert.equal(route.isActivityPropDoodleUrl(route.ACTIVITY_PROP_DOODLE_URL), true);
assert.equal(route.isActivityPropDoodleUrl('/pages/doodle/doodle?entry=companion&mode=prop&source=letter'), false);
assert.equal(route.isActivityPropDoodleUrl('/pages/doodle/doodle?entry=companion&mode=prop&source=activity2'), false);
assert.equal(route.isActivityPropDoodleUrl('/pages/listen/listen'), false);
assert.equal(route.isActivityPropDoodleUrl('/pages/doodle/doodle?entry=shell'), false);

const router = { addRouteBuilder() {} };
assert.equal(route.shouldMountActivityListShare({ renderer: 'skyline', router }), true);
assert.equal(route.shouldMountActivityListShare({ renderer: 'webview', router }), false);
assert.equal(route.shouldMountActivityListShare({ renderer: 'skyline', router: null }), false);
assert.equal(route.shouldMountDoodlePropPaperShare({
  renderer: 'skyline',
  router,
  query: { entry: 'companion', mode: 'prop', source: 'activity' }
}), true);
assert.equal(route.shouldMountDoodlePropPaperShare({
  renderer: 'skyline',
  router,
  query: { entry: 'companion', mode: 'prop', source: 'letter' }
}), false, '信件入口第一版不挂共享元素');
assert.equal(route.shouldMountDoodlePropPaperShare({
  renderer: 'webview',
  router,
  query: { entry: 'companion', mode: 'prop', source: 'activity' }
}), false);
assert.equal(route.shouldMountDoodlePropPaperShare({
  renderer: 'skyline',
  router,
  query: { entry: 'shell' }
}), false, '蛋壳涂鸦不挂共享元素');

const gestureContext = {
  primaryAnimation: { value: 0.5 },
  secondaryAnimation: { value: 1 },
  userGestureInProgress: { value: 1 }
};
const gestureRoute = route.buildPropPaperRoute(gestureContext);
assert.equal(gestureRoute.opaque, false);
assert.equal(gestureRoute.allowEnterRouteSnapshotting, false);
assert.equal(gestureRoute.fullscreenDrag, false);
assert.equal(gestureRoute.handlePrimaryAnimation().opacity, 0.5, '手势中必须跟手，不另做曲线');
assert.equal(JSON.stringify(gestureRoute.handlePrimaryAnimation()).includes('translateX'), false);
assert.equal(gestureRoute.handleSecondaryAnimation().opacity, 0.96);
assert.equal(JSON.stringify(gestureRoute.handlePreviousPageAnimation()).includes('translateX'), false);
gestureContext.userGestureInProgress.value = 0;
assert.ok(Math.abs(gestureRoute.handlePrimaryAnimation().opacity - 0.875) < 0.001);
gestureContext.primaryAnimation.value = 0;
assert.equal(gestureRoute.handlePrimaryAnimation().opacity, 0);
gestureContext.primaryAnimation.value = 1;
assert.equal(gestureRoute.handlePrimaryAnimation().opacity, 1);
assert.equal(route.buildPropPaperRoute.toString().includes('translateX'), false);
assert.equal(fs.readFileSync(path.join(miniprogramRoot, 'services/doodle-prop-share-route.js'), 'utf8').includes('translateX'), false);

const previousWx = global.wx;
global.wx = { getSystemSetting: () => ({ reducedMotion: true }) };
try {
  const reduced = route.buildPropPaperRoute(gestureContext);
  assert.equal(reduced.transitionDuration, 1);
  assert.equal(reduced.reverseTransitionDuration, 1);
} finally {
  global.wx = previousWx;
}

route.resetPropPaperRouteForTests();
const registrations = [];
const navigations = [];
const wxApi = {
  router: {
    addRouteBuilder(type, builder) {
      registrations.push(type);
      assert.equal(typeof builder, 'function');
    }
  },
  navigateTo(options) { navigations.push(options); }
};
const opened = route.navigateToActivityPropDoodle({
  wx: wxApi,
  url: route.ACTIVITY_PROP_DOODLE_URL,
  renderer: 'skyline',
  onFail() { throw new Error('不应失败'); }
});
assert.equal(opened.routeType, 'propPaper');
assert.deepEqual(registrations, ['propPaper']);
route.navigateToActivityPropDoodle({
  wx: wxApi,
  url: route.ACTIVITY_PROP_DOODLE_URL,
  renderer: 'skyline'
});
assert.deepEqual(registrations, ['propPaper'], '同一路由只注册一次');
assert.equal(navigations.length, 2);
assert.equal(navigations[1].routeType, 'propPaper');

const degraded = [];
route.navigateToActivityPropDoodle({
  wx: { router: wxApi.router, navigateTo(options) { degraded.push(options); } },
  url: route.ACTIVITY_PROP_DOODLE_URL,
  renderer: 'webview'
});
assert.equal(degraded[0].routeType, undefined, 'WebView 降级不得带 routeType');
assert.equal(degraded[0].url, route.ACTIVITY_PROP_DOODLE_URL);

const letterNav = [];
route.navigateToActivityPropDoodle({
  wx: { router: wxApi.router, navigateTo(options) { letterNav.push(options); } },
  url: '/pages/doodle/doodle?entry=companion&mode=prop&source=letter',
  renderer: 'skyline'
});
assert.equal(letterNav[0].routeType, undefined);

route.resetPropPaperRouteForTests();
const thrown = [];
const brokenWx = {
  router: { addRouteBuilder() { throw new Error('unsupported'); } },
  navigateTo(options) { thrown.push(options); }
};
const fallback = route.navigateToActivityPropDoodle({
  wx: brokenWx,
  url: route.ACTIVITY_PROP_DOODLE_URL,
  renderer: 'skyline'
});
assert.equal(fallback.routeType, undefined, '注册失败时退回默认 navigateTo');
assert.equal(thrown.length, 1);

let failed = false;
route.navigateToActivityPropDoodle({
  wx: { navigateTo(options) { options.fail(); } },
  url: route.ACTIVITY_PROP_DOODLE_URL,
  renderer: 'webview',
  onFail() { failed = true; }
});
assert.equal(failed, true);

const drawingBlock = activitiesJs.slice(
  activitiesJs.indexOf("item.key === 'drawing'"),
  activitiesJs.indexOf('findComingSoonRow')
);
assert.ok(drawingBlock.indexOf('warmPropDoodleEntry') >= 0, '须保留进页预热');
assert.ok(
  drawingBlock.indexOf('warmPropDoodleEntry') < drawingBlock.indexOf('navigateToActivityPropDoodle'),
  '预热必须发生在跳转前'
);
assert.equal(drawingBlock.includes('routeType'), false, 'routeType 只应由路由模块在支持时加上');
const genericNavigate = activitiesJs.slice(activitiesJs.lastIndexOf('wx.navigateTo'));
assert.equal(genericNavigate.includes('routeType'), false, '听你说等其它行保持原 navigateTo');
assert.match(appScript, /ensurePropPaperRoute\(typeof wx === 'undefined' \? null : wx\)/);
assert.match(doodleScript, /shouldMountDoodlePropPaperShare/);
assert.doesNotMatch(doodleWxml, /prop-entry-loading|propTutorialVisible|loading-orbit/);

function assertSkylineFlex(relativePath) {
  const css = read(relativePath);
  assert.equal(/inset\s*:/.test(css), false, `${relativePath} 不得使用 Skyline 不解析的 inset`);
  assert.equal(/display\s*:\s*grid|grid-template/.test(css), false, `${relativePath} 不得使用 Skyline 不支持的 grid`);
  const blocks = css.match(/\{[^{}]*\}/g) || [];
  blocks.forEach(block => {
    if (!/display\s*:\s*flex\b/.test(block)) return;
    assert.match(block, /flex-direction\s*:/, `${relativePath} 的 flex 必须写明方向`);
  });
}
[
  'pages/doodle/doodle.wxss',
  'pages/iaa-activities/iaa-activities.wxss',
  'components/nav-bar/nav-bar.wxss',
  'components/inline-notice/inline-notice.wxss',
  'components/companion-star/companion-star.wxss'
].forEach(assertSkylineFlex);
assert.match(read('components/companion-star/companion-star.wxss'), /\.companion-star__body\{[^}]*top:0;right:0;bottom:0;left:0\}/);
assert.match(doodleWxss, /\.prop-paper-board\s*\{[^}]*top:\s*0;[^}]*right:\s*0;[^}]*bottom:\s*0;[^}]*left:\s*0;/);
assert.match(doodleWxss, /\.prop-canvas-slot\s*\{[^}]*top:\s*30rpx;[^}]*right:\s*30rpx;[^}]*bottom:\s*30rpx;[^}]*left:\s*30rpx;/);

console.log('道具临摹 Skyline 共享元素转场单测通过。');
