const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const originalNow = Date.now;
const originalTimers = { setTimeout, clearTimeout, setInterval, clearInterval };
const now = Date.parse('2026-10-19T12:00:00+08:00');
Date.now = () => now;
let timerId = 0;
global.setTimeout = global.setInterval = () => ++timerId;
global.clearTimeout = global.clearInterval = () => {};

(async () => {
  for (const environment of ['develop']) {
    for (const key of Object.keys(require.cache)) if (key.startsWith(root)) delete require.cache[key];
    const storage = new Map();
    let definition, navigation;
    global.wx = {
      getAccountInfoSync: () => ({ miniProgram: { envVersion: environment } }),
      getStorageSync: key => storage.get(key),
      setStorageSync: (key, value) => storage.set(key, structuredClone(value)),
      onAppShow() {}, onAppHide() {}, onNetworkStatusChange() {}, getNetworkType() {}, showToast() {},
      getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667 }),
      navigateTo: options => { navigation = options; }
    };
    global.getApp = () => ({ globalData: {} });
    global.Component = () => {};
    global.Page = value => { definition = value; };
    require('../../pages/life-scene/life-scene');
    const stars = require('../iaa-star-unlock-adapter');
    const snapshots = require('../post-hatch-companion');
    for (const successAfterHide of [false, true]) {
      const pet = { id: `listen-return-${environment}-${successAfterHide}`, ownerId: 'test-owner', prototype: 'boon-koi',
        lifecycleStage: 'HATCHED', hatchedAt: new Date(now - 3600000).toISOString() };
      stars.configureRoom(pet.id, pet);
      stars.getDailyInvitation(['listen'], () => 0);
      const snapshot = await snapshots.getSnapshot(pet);
      const page = Object.assign({}, definition, {
        pageActive: true, hasShownOnce: true, letterDate: '2026-10-19', data: structuredClone(definition.data),
        setData(patch, callback) {
          for (const [key, value] of Object.entries(patch)) {
            const parts = key.split('.'); let target = this.data;
            for (const part of parts.slice(0, -1)) target = target[part] || (target[part] = {});
            target[parts[parts.length - 1]] = value;
          }
          if (callback) callback();
        }
      });
      page.setData({ pet, snapshot, currentState: snapshot.currentState, panelWidth: 375, panelHeight: 667,
        dailyWindowEnvironment: { period: 'day', lightPhase: 'day', weather: 'sunny', season: 'autumn' },
        sceneEntered: true, initialViewportReady: true });
      await page.loadCompanionStar();
      await page.onOpenTodayCompanion();
      assert.equal(page.data.todayCompanionView.today.activityKind, 'listen');
      const sameLetter = page.data.todayCompanionView;
      page.onTodayCompanionAction();
      assert.equal(navigation.url, '/pages/listen/listen');
      assert.equal(page.data.todayCompanionVisible, true, '进入听你说不关闭信件');
      if (!successAfterHide) navigation.success();
      page.onHide();
      if (successAfterHide) navigation.success();
      page.onOpenTodayCompanion = () => { throw Error('中退不能依赖关闭重开信件'); };
      page.onShow();
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(page.data.todayCompanionVisible, true);
      assert.equal(page.data.todayCompanionView, sameLetter);
      assert.equal(page.data.todayCompanionTomorrowAvailable, true, '返回时立即出现明天入口');
      assert.equal(page.data.todayCompanionTomorrowVisible, false);
      assert.equal(page.data.companionNavigating, false);
      page.onUnload();
    }
  }
  console.log('听你说中退直接返回通过：信件保持展开，明天入口可见且未展开，与一起画返回对齐。');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  Date.now = originalNow;
  Object.assign(global, originalTimers);
});
