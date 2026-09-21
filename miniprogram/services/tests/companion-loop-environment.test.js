// 每日陪伴主循环环境策略：今日陪伴、陪伴星星、明日钩子是正式用户功能，
// develop / trial / release 一致；只有调试工具限 develop。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const roomTemplate = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.wxml'), 'utf8');
const roomLogic = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.js'), 'utf8');
const configSource = fs.readFileSync(path.join(root, 'config/v2.js'), 'utf8');
const todayAdapterSource = fs.readFileSync(path.join(root, 'services/iaa-today-companion-adapter.js'), 'utf8');
const starAdapterSource = fs.readFileSync(path.join(root, 'services/iaa-star-unlock-adapter.js'), 'utf8');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));

// 静态结构：正式功能与开发工具使用不同开关。
assert.equal(configSource.includes('todayCompanionEnabled: true'), true, '正式用户功能必须有独立于 localDemoEnabled 的开关');
assert.equal(roomTemplate.includes('today-companion-entry="{{todayCompanionEnabled}}"'), true, '房间左上角今日心情入口必须由正式功能开关控制');
assert.equal(roomTemplate.includes('today-companion-entry="{{isDemo}}"'), false, '正式入口不得再由开发调试开关控制');
assert.equal(roomLogic.includes('if (!this.data.todayCompanionEnabled || this.data.todayCompanionVisible) return Promise.resolve();'), true, '打开信件只检查正式功能开关');
for (const tester of ['class="stage-tester"', 'class="scene-tester', 'class="mood-tester"', 'class="companion-state-tester"', 'class="prototype-tester"']) {
  const index = roomTemplate.indexOf(tester);
  assert.equal(index >= 0 && roomTemplate.lastIndexOf('wx:if="{{isDemo', index) > roomTemplate.lastIndexOf('</view>', index), true, `调试工具 ${tester} 必须仍由 isDemo 保护`);
}
assert.equal(app.pages[0], 'pages/welcome/welcome', '正式启动页保持欢迎页');
assert.equal(/tabBar[\s\S]*iaa-core-review/.test(JSON.stringify(app.tabBar)), false, '开发验收页不得进入正式 tabBar');
assert.equal(/wx\.request|wx\.cloud|cloud\.callFunction|database\(|getStorage|setStorage|Math\.random|Date\.now/.test(`${todayAdapterSource}\n${starAdapterSource}`), false, '本次不得新增网络、数据库、存储或服务端成功模拟');
assert.equal(roomLogic.includes('已经留下') || roomLogic.includes('还差 ${remaining}'), false, '纪念册暂停期间房间不得宣称纪念进度或纪念已可进入');
assert.equal(/newlyUnlockedMemory|helperText|iaa-memory-album-demo/.test(`${roomTemplate}\n${roomLogic}`), false, '房间不得渲染纪念解锁结果或跳转到暂停中的纪念册');

const overlayStart = roomTemplate.indexOf('class="today-companion-overlay"');
const overlayEnd = roomTemplate.indexOf('<daily-window-detail', overlayStart);
const overlayTemplate = roomTemplate.slice(overlayStart, overlayEnd);
assert.equal(overlayStart > 0 && !overlayTemplate.includes('<image') && !overlayTemplate.includes('navigateTo'), true, 'overlay 留在原房间，不渲染第二张场景图');
assert.equal(overlayTemplate.includes('<text>明天呢？</text>') && !/wx:if="\{\{todayCompanionInteractionDone\}\}"[^>]*today-companion-letter__tomorrow/.test(overlayTemplate), true, '“明天呢？”必须初始可见，不依赖完成陪伴');
assert.equal((overlayTemplate.match(/wx:if="\{\{todayCompanionTomorrowVisible\}\}"/g) || []).length, 1, '点击“明天呢？”后只展开一句明日内容');

function stubWx(envVersion) {
  return {
    getAccountInfoSync() { return { miniProgram: { envVersion } }; },
    getWindowInfo() { return { statusBarHeight: 22, windowWidth: 375, windowHeight: 667 }; },
    getSystemInfoSync() { return { statusBarHeight: 22, windowWidth: 375, windowHeight: 667 }; },
    getMenuButtonBoundingClientRect() { return { bottom: 80 }; },
    getStorageSync() { return ''; },
    setStorageSync() {},
    removeStorageSync() {},
    showToast() {},
    switchTab() {},
    navigateTo() { throw new Error('主循环不得跳转页面'); },
    redirectTo() { throw new Error('主循环不得跳转页面'); },
    reLaunch() { throw new Error('主循环不得跳转页面'); },
    createSelectorQuery() { return { select() { return this; }, boundingClientRect() { return this; }, exec(callback) { if (callback) callback([]); } }; },
    onAppShow() {}, offAppShow() {}, onAppHide() {}, offAppHide() {},
    getNetworkType() {}, onNetworkStatusChange() {}
  };
}

function loadRoomPage(envVersion) {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(path.join(root, 'config')) || key.startsWith(path.join(root, 'pages')) || key.startsWith(path.join(root, 'services')) || key.startsWith(path.join(root, 'utils'))) {
      delete require.cache[key];
    }
  }
  let definition;
  global.Page = page => { definition = page; };
  global.Component = () => {};
  global.App = () => {};
  global.getApp = () => ({ globalData: {} });
  global.getCurrentPages = () => [{}];
  global.wx = stubWx(envVersion);
  require('../../pages/life-scene/life-scene');
  const starAdapter = require('../iaa-star-unlock-adapter');
  starAdapter.resetRoomStarView('AVAILABLE');
  const page = Object.assign({}, definition, {
    pageActive: true,
    data: Object.assign({}, definition.data, { pet: { id: 'test', name: '玉兔' } }),
    setData(patch) { Object.assign(this.data, patch); }
  });
  return { page, config: require('../../config/v2') };
}

async function runLoop(envVersion) {
  const { page, config } = loadRoomPage(envVersion);
  await page.loadCompanionStar();
  const snapshot = {
    envVersion,
    isDemo: page.data.isDemo,
    todayCompanionEnabled: page.data.todayCompanionEnabled,
    localDemoEnabled: config.localDemoEnabled,
    balanceBefore: page.data.companionStarBalance,
    progressText: page.data.companionStarProgressText
  };

  await page.onOpenTodayCompanion();
  snapshot.opened = page.data.todayCompanionVisible === true && Boolean(page.data.todayCompanionView);
  snapshot.tomorrowVisibleInitially = page.data.todayCompanionTomorrowVisible;
  snapshot.tomorrowQuestionAvailable = Boolean(page.data.todayCompanionView && page.data.todayCompanionView.today.tomorrowHint);

  await page.onTodayCompanionInteract();
  snapshot.letterAward = page.data.todayCompanionAwardedStars;
  snapshot.roomAwardWhileOpen = page.data.companionStarAwardVisible;
  snapshot.tomorrowAfterInteract = page.data.todayCompanionTomorrowVisible;
  snapshot.balanceAfter = page.data.companionStarBalance;
  snapshot.progressAfter = page.data.companionStarProgressText;

  page.onCloseTodayCompanion();
  snapshot.closed = page.data.todayCompanionVisible === false;
  snapshot.roomAwardAfterClose = page.data.companionStarAwardVisible;

  await page.onOpenTodayCompanion();
  page.onTodayCompanionRevealTomorrow();
  snapshot.tomorrowRevealed = page.data.todayCompanionTomorrowVisible;
  snapshot.doneOnReopen = page.data.todayCompanionInteractionDone;
  page.onCloseTodayCompanion();
  clearTimeout(page.companionStarAwardTimer);
  return snapshot;
}

(async () => {
  const develop = await runLoop('develop');
  const trial = await runLoop('trial');
  const release = await runLoop('release');

  assert.equal(develop.isDemo, true, 'develop 保留开发调试工具');
  assert.equal(trial.isDemo, false, 'trial 不得暴露开发调试工具');
  assert.equal(release.isDemo, false, 'release 不得暴露开发调试工具');
  assert.equal(trial.localDemoEnabled, false);
  assert.equal(release.localDemoEnabled, false);

  for (const result of [develop, trial, release]) {
    assert.equal(result.todayCompanionEnabled, true, `${result.envVersion} 今日陪伴必须开放`);
    assert.equal(result.opened, true, `${result.envVersion} 必须能从房间左上角打开信件`);
    assert.equal(result.balanceBefore, 2, `${result.envVersion} 房间左上角显示当前星星`);
    assert.equal(result.tomorrowVisibleInitially, false, `${result.envVersion} 明日内容初始不展开`);
    assert.equal(result.tomorrowQuestionAvailable, true, `${result.envVersion} “明天呢？”初始可见`);
    assert.equal(result.letterAward, 1, `${result.envVersion} 完成陪伴后信件显示 +1`);
    assert.equal(result.roomAwardWhileOpen, false, `${result.envVersion} 信件未关闭前房间 +1 先保留`);
    assert.equal(result.tomorrowAfterInteract, false, `${result.envVersion} 完成陪伴不得自动展开明日内容`);
    assert.equal(result.balanceAfter, 3, `${result.envVersion} 星星累计更新`);
    assert.equal(result.closed, true);
    assert.equal(result.roomAwardAfterClose, true, `${result.envVersion} 关闭信件后房间左上角显示 +1`);
    assert.equal(result.tomorrowRevealed, true, `${result.envVersion} 点击“明天呢？”展开一句明日内容`);
    assert.equal(result.doneOnReopen, true, `${result.envVersion} 同日再次进入不得重复领取`);
    assert.equal(result.progressText, '', `${result.envVersion} 房间不显示纪念进度`);
    assert.equal(result.progressAfter, '', `${result.envVersion} 满星后不得宣称纪念已可进入`);
  }

  const trialKeys = Object.keys(trial).filter(key => key !== 'envVersion');
  assert.deepEqual(trialKeys.map(key => trial[key]), trialKeys.map(key => release[key]), 'trial 与 release 主循环行为必须完全一致');

  // 旧路由在 trial / release 回到正式入口，不再显示阻断页。
  for (const envVersion of ['trial', 'release']) {
    for (const key of Object.keys(require.cache)) {
      if (key.startsWith(path.join(root, 'config')) || key.startsWith(path.join(root, 'pages'))) delete require.cache[key];
    }
    let legacyDefinition;
    const redirects = [];
    global.Page = page => { legacyDefinition = page; };
    global.wx = Object.assign(stubWx(envVersion), { redirectTo({ url }) { redirects.push(url); } });
    require('../../pages/iaa-today-companion/iaa-today-companion');
    const legacyPage = Object.assign({}, legacyDefinition, { data: Object.assign({}, legacyDefinition.data), setData(patch) { Object.assign(this.data, patch); } });
    const result = await legacyDefinition.onLoad.call(legacyPage, {});
    assert.equal(result.redirected, true, `${envVersion} 旧今日陪伴路由必须回到房间入口`);
    assert.deepEqual(redirects, ['/pages/life-scene/life-scene?open=today-companion']);
    assert.equal(legacyPage.data.isDev, false, `${envVersion} 不得暴露 fixture 切换器`);
  }

  console.log('每日陪伴主循环环境策略校验通过：develop / trial / release 一致开放，调试工具限 develop。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
