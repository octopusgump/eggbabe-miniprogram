const assert = require('assert');

const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;
const originalWx = global.wx;
const originalPage = global.Page;
const originalComponent = global.Component;

let timerSequence = 0;
const timers = new Map();

global.setTimeout = (callback, delay) => {
  const id = timerSequence += 1;
  timers.set(id, { callback, delay: Number(delay) || 0, id });
  return id;
};
global.clearTimeout = id => timers.delete(id);
global.setInterval = () => 0;
global.clearInterval = () => {};

const routes = [];
const navigateOptions = [];
const toasts = [];
let navigateMode = 'success';
let switchMode = 'success';
global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getStorageSync() { return undefined; },
  setStorageSync() {},
  removeStorageSync() {},
  navigateTo(options) {
    routes.push(options.url);
    navigateOptions.push(options);
    if (navigateMode === 'success') {
      if (options.success) options.success();
      if (options.complete) options.complete();
      return;
    }
    if (options.fail) options.fail({ errMsg: 'navigateTo:fail test' });
    if (options.complete) options.complete();
  },
  switchTab(options) {
    routes.push(options.url);
    if (switchMode === 'success') {
      if (options.success) options.success();
      if (options.complete) options.complete();
      return;
    }
    if (options.fail) options.fail({ errMsg: 'switchTab:fail test' });
    if (options.complete) options.complete();
  },
  navigateBack(options) {
    routes.push('BACK');
    if (options && options.success) options.success();
    if (options && options.complete) options.complete();
  },
  showToast(options) { toasts.push(options.title); }
};

function runTimers() {
  while (timers.size) {
    const next = Array.from(timers.values()).sort((a, b) => a.delay - b.delay || a.id - b.id)[0];
    timers.delete(next.id);
    next.callback();
  }
}

function loadPage(relativePath) {
  let definition;
  global.Page = page => { definition = page; };
  delete require.cache[require.resolve(relativePath)];
  require(relativePath);
  return definition;
}

function loadComponent(relativePath) {
  let definition;
  global.Component = component => { definition = component; };
  delete require.cache[require.resolve(relativePath)];
  require(relativePath);
  return definition;
}

function pageContext(page, data) {
  return Object.assign({}, page, {
    data: Object.assign({}, page.data || {}, data || {}),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    }
  });
}

function componentContext(component, data) {
  return Object.assign({}, component.methods || {}, {
    data: Object.assign({}, component.data || {}, data || {}),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    }
  });
}

try {
  const home = loadPage('../../pages/home/home');
  const homeContext = pageContext(home, {
    wishUnlocked: true,
    learnUnlocked: true,
    companionHintKey: '',
    companionHintVisible: false
  });
  homeContext.pageActive = true;
  homeContext.showCompanionHint = () => {};
  homeContext.cancelCompanionFirstHint = () => {};
  homeContext.clearCuddleTimers = () => {};
  homeContext.clearCompanionHintTimers = () => {};
  homeContext.runSceneEffect = (sceneEffect, eggMotion) => homeContext.setData({ sceneEffect, eggMotion });
  homeContext.clearEffectTimers = () => {};
  homeContext.showFeedback = message => { homeContext.lastFeedback = message; };
  let homeSuspensions = 0;
  homeContext.suspendHomeForDoodle = () => { homeSuspensions += 1; };

  const customizedHomeContext = pageContext(home, { pet: { shell: { operations: [{ type: 'sticker' }] } }, stage: 'waiting' });
  customizedHomeContext.sceneTestOverride = { key: 'summer-clear-day' };
  customizedHomeContext.sceneLayerEggActive = false;
  customizedHomeContext.homeEggLayersReady = true;
  let customizedEggRenders = 0;
  customizedHomeContext.renderHomeEgg = () => { customizedEggRenders += 1; };
  home.setupHomeEgg.call(customizedHomeContext);
  assert.equal(customizedEggRenders, 1, '已保存的自定义蛋壳在测试场景中也必须重新合成到桌面蛋体');

  const closingDoodleContext = pageContext(home, {
    doodleEditorVisible: true,
    homeStagePhase: 'visible',
    homeEggArtPreview: 'wxfile://tmp/stale-art.png'
  });
  let homeResumeCalls = 0;
  closingDoodleContext.onShow = () => { homeResumeCalls += 1; };
  home.onDoodleEditorClose.call(closingDoodleContext);
  assert.equal(closingDoodleContext.data.doodleEditorVisible, false, '关闭画画编辑器后必须恢复首页');
  assert.equal(closingDoodleContext.data.homeStagePhase, 'hidden', '首页重建前必须保持隐藏，避免退出动画从可见帧重新播放');
  assert.equal(closingDoodleContext.data.homeEggArtPreview, '', '清空作品返回首页前必须先清除旧蛋壳预览缓存');
  assert.equal(homeResumeCalls, 1, '清理旧预览后必须继续恢复首页资源');

  home.onCompanionTap.call(homeContext, { currentTarget: { dataset: { key: 'wish' } } });
  home.onCompanionTap.call(homeContext, { currentTarget: { dataset: { key: 'draw' } } });
  runTimers();
  assert.deepEqual(routes.splice(0), ['/pages/wish/wish'], '首页快速连点必须只保留首次有效导航');

  home.clearCompanionNavigation.call(homeContext);
  home.onCompanionTouchStart.call(homeContext, { currentTarget: { dataset: { key: 'learn' } } });
  home.onCompanionLongPress.call(homeContext, { currentTarget: { dataset: { key: 'learn' } } });
  home.onCompanionTouchEnd.call(homeContext, { currentTarget: { dataset: { key: 'learn' } } });
  home.onCompanionTap.call(homeContext, { currentTarget: { dataset: { key: 'learn' } } });
  runTimers();
  assert.deepEqual(routes.splice(0), [], '同一次长按后的 tap 必须被拦截');

  home.onCompanionTouchStart.call(homeContext, { currentTarget: { dataset: { key: 'learn' } } });
  home.onCompanionTouchEnd.call(homeContext, { currentTarget: { dataset: { key: 'learn' } } });
  home.onCompanionTap.call(homeContext, { currentTarget: { dataset: { key: 'learn' } } });
  runTimers();
  assert.deepEqual(routes.splice(0), ['/pages/lesson/lesson'], '长按后的下一次新短点必须可正常导航');

  home.clearCompanionNavigation.call(homeContext);
  home.onCompanionTap.call(homeContext, { currentTarget: { dataset: { key: 'draw' } } });
  runTimers();
  assert.deepEqual(routes.splice(0), [], '画画入口不得再调用原生页面路由');
  assert.equal(homeContext.data.doodleEditorVisible, true, '画画入口必须在首页内嵌打开编辑器');
  assert.equal(homeSuspensions, 1, '画画编辑器挂载前必须暂停首页后台资源');
  homeContext.setData({ doodleEditorVisible: false });

  home.clearCompanionNavigation.call(homeContext);
  homeContext.data.learnUnlocked = false;
  home.onCompanionTap.call(homeContext, { currentTarget: { dataset: { key: 'learn' } } });
  runTimers();
  assert.deepEqual(routes.splice(0), [], '未解锁入口不得导航');
  assert.equal(homeContext.lastFeedback, '蛋宝宝还没到早教的年龄。', '未解锁入口必须保留既定的年龄语义反馈');
  // design.md §6：状态反馈不得出现诱导回访表达。
  assert.doesNotMatch(homeContext.lastFeedback, /明天|再来|试试吧|每天|别忘了/, '锁定态反馈不得出现催回访文案');

  homeContext.data.learnUnlocked = true;
  home.onCompanionTap.call(homeContext, { currentTarget: { dataset: { key: 'draw' } } });
  home.clearInteractionTimers.call(homeContext);
  runTimers();
  assert.deepEqual(routes.splice(0), [], '首页离页清理后不得执行残留画画操作');
  assert.equal(homeContext.data.doodleEditorVisible, false, '首页离页清理后不得延迟挂载画画编辑器');

  navigateMode = 'fail';
  home.onCompanionTap.call(homeContext, { currentTarget: { dataset: { key: 'wish' } } });
  runTimers();
  assert.equal(homeContext.companionNavigationPending, false, 'navigateTo 失败必须释放导航锁');
  assert.equal(homeContext.lastFeedback, '页面暂时没有打开，请再试一次。', 'navigateTo 失败必须给出轻量反馈');
  routes.splice(0);
  navigateMode = 'success';

  const tab = loadComponent('../../custom-tab-bar/index');
  const tabContext = componentContext(tab, { selected: 0, hidden: false, elevated: false });
  tabContext.tabAttached = true;
  tabContext.showTabHint = () => {};
  tabContext.cancelProfileFirstHint = () => {};

  tab.methods.onSwitch.call(tabContext, { currentTarget: { dataset: { index: 1 } } });
  tab.methods.onSwitch.call(tabContext, { currentTarget: { dataset: { index: 1 } } });
  runTimers();
  assert.deepEqual(routes.splice(0), ['/pages/my/my'], '“我的”快速连点必须只切换一次');

  tab.methods.clearHintTimers.call(tabContext);
  tab.methods.onTouchStart.call(tabContext, { currentTarget: { dataset: { index: 1 } } });
  tab.methods.onLongPress.call(tabContext, { currentTarget: { dataset: { index: 1 } } });
  tab.methods.onTouchEnd.call(tabContext, { currentTarget: { dataset: { index: 1 } } });
  tab.methods.onSwitch.call(tabContext, { currentTarget: { dataset: { index: 1 } } });
  runTimers();
  assert.deepEqual(routes.splice(0), [], '“我的”同一次长按后的 tap 必须被拦截');

  tab.methods.onSwitch.call(tabContext, { currentTarget: { dataset: { index: 1 } } });
  tab.pageLifetimes.hide.call(tabContext);
  runTimers();
  assert.deepEqual(routes.splice(0), [], '自定义 Tab 页面隐藏后不得执行残留切换');

  switchMode = 'fail';
  tabContext.tabAttached = true;
  tab.methods.onSwitch.call(tabContext, { currentTarget: { dataset: { index: 1 } } });
  runTimers();
  assert.equal(tabContext.tabSwitchPending, false, 'switchTab 失败必须释放导航锁');
  assert.equal(toasts.pop(), '页面暂时没有打开，请再试一次。', 'switchTab 失败必须给出轻量反馈');
  routes.splice(0);
  switchMode = 'success';

  const doodle = loadPage('../../pages/doodle/doodle');
  const doodleContext = pageContext(doodle, { saving: false, saveStatus: 'unsaved' });
  doodleContext.pageActive = true;
  doodleContext.editRevision = 1;
  doodleContext.savedRevision = 0;
  let autoSaveCalls = 0;
  doodleContext.persistCurrent = () => { autoSaveCalls += 1; };
  doodle.scheduleAutoSave.call(doodleContext);
  doodle.onHide.call(doodleContext);
  runTimers();
  assert.equal(autoSaveCalls, 0, '画画页隐藏后不得执行残留自动保存定时器');

  doodle.onShow.call(doodleContext);
  runTimers();
  assert.equal(autoSaveCalls, 1, '未保存作品回到前台后必须恢复自动保存');

  doodleContext.pageActive = true;
  doodle.scheduleAutoSave.call(doodleContext);
  doodle.onUnload.call(doodleContext);
  runTimers();
  assert.equal(autoSaveCalls, 1, '画画页卸载后不得执行残留自动保存');

  console.log('交互导航状态机校验通过。');
} finally {
  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
  global.setInterval = originalSetInterval;
  global.clearInterval = originalClearInterval;
  global.wx = originalWx;
  global.Page = originalPage;
  global.Component = originalComponent;
}
