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
      const pet = { id: `return-${environment}-${successAfterHide}`, ownerId: 'test-owner', prototype: '玉兔',
        lifecycleStage: 'HATCHED', hatchedAt: new Date(now - 3600000).toISOString() };
      stars.configureRoom(pet.id, pet);
      stars.getDailyInvitation(['drawing'], () => 0);
      const snapshot = await snapshots.getSnapshot(pet);
      assert.equal(snapshot.currentState.atHome, true);
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
      const before = (await stars.getRoomStarView()).data.star;
      assert.equal(page.data.todayCompanionTomorrowAvailable, false);
      const sameLetter = page.data.todayCompanionView;
      page.onTodayCompanionAction();
      assert.equal(navigation.url, '/pages/doodle/doodle?entry=companion');
      if (!successAfterHide) navigation.success();
      page.onHide();
      if (successAfterHide) navigation.success();
      // 直接执行原生返回时的生命周期；不调用关闭或重开信件方法。
      page.onOpenTodayCompanion = () => { throw Error('中退不能依赖关闭重开信件'); };
      page.onShow();
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(page.data.todayCompanionVisible, true);
      assert.equal(page.data.todayCompanionView, sameLetter);
      assert.equal(page.data.todayCompanionTomorrowAvailable, true, '返回时立即出现明天入口');
      assert.equal(page.data.todayCompanionTomorrowVisible, false, '返回不自动展开明日文案');
      assert.equal(page.data.companionNavigating, false, '返回后按钮恢复可点');
      assert.equal(page.data.todayCompanionInteractionDone, false, '中退不算完成');
      assert.deepEqual((await stars.getRoomStarView()).data.star, before, '中退不改变星星或有效日');
      page.onUnload();
    }
  }
  console.log('一起画中退直接返回通过：真实页面生命周期、两种回调顺序，无需重开，明天入口可见且未展开，按钮/奖励状态正确。');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  Date.now = originalNow;
  Object.assign(global, originalTimers);
});
