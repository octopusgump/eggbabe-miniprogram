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
  homeContext.runSceneEffect = (sceneEffect, eggMotion) => homeContext.setData({ sceneEffect, eggMotion });
  homeContext.clearEffectTimers = () => {};
  homeContext.showFeedback = message => { homeContext.lastFeedback = message; };

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
  homeContext.data.learnUnlocked = false;
  home.onCompanionTap.call(homeContext, { currentTarget: { dataset: { key: 'learn' } } });
  runTimers();
  assert.deepEqual(routes.splice(0), [], '未解锁入口不得导航');
  assert.equal(homeContext.lastFeedback, '蛋宝宝还没到早教的年龄，明天来试试吧。', '未解锁入口必须保留既定的年龄语义反馈');

  homeContext.data.learnUnlocked = true;
  home.onCompanionTap.call(homeContext, { currentTarget: { dataset: { key: 'draw' } } });
  home.clearCompanionNavigation.call(homeContext);
  runTimers();
  assert.deepEqual(routes.splice(0), [], '首页离页清理后不得执行残留导航');

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
  const doodleContext = pageContext(doodle, { saving: true });
  doodleContext.pageActive = true;
  doodle.scheduleReturnToHome.call(doodleContext);
  doodle.onHide.call(doodleContext);
  runTimers();
  assert.deepEqual(routes.splice(0), [], '画画页隐藏后不得执行残留 navigateBack');
  assert.equal(doodleContext.data.saving, false, '画画页隐藏后必须释放保存状态');

  doodle.scheduleReturnToHome.call(doodleContext);
  doodle.onUnload.call(doodleContext);
  runTimers();
  assert.deepEqual(routes.splice(0), [], '画画页卸载后不得执行残留 navigateBack');

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
