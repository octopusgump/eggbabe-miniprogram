const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const originalNow = Date.now, originalRandom = Math.random;
let now = Date.parse('2026-10-19T12:00:00+08:00');
Date.now = () => now;
(async () => {
  for (const environment of ['develop', 'trial', 'release']) {
    for (const key of Object.keys(require.cache)) if (key.startsWith(root)) delete require.cache[key];
    const storage = new Map(); let definition, navigation;
    global.wx = {
      getAccountInfoSync: () => ({ miniProgram: { envVersion: environment } }),
      getStorageSync: key => storage.get(key), setStorageSync: (key, value) => storage.set(key, structuredClone(value)),
      getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667 }),
      onAppShow() {}, onAppHide() {}, onNetworkStatusChange() {}, getNetworkType() {}, showToast() {},
      navigateTo: options => { navigation = options; }, request: () => { throw Error('不得联网'); }
    };
    global.getApp = () => ({ globalData: {} }); global.Component = () => {}; global.Page = value => { definition = value; };
    require('../../pages/life-scene/life-scene');
    const stars = require('../iaa-star-unlock-adapter');
    const listen = require('../listen-adapter');
    const rules = require('../listen-rules');
    const pet = { id: 'entry-' + environment, ownerId: 'owner', prototype: '锦鲤', name: '小鲤鱼', lifecycleStage: 'HATCHED' };
    stars.configureRoom(pet.id, pet); stars.getDailyInvitation(['listen'], () => 0);
    const page = Object.assign({}, definition, { pageActive: true, data: Object.assign({}, definition.data, { pet, currentState: { atHome: true } }), setData(patch) { Object.assign(this.data, patch); } });
    await page.loadCompanionStar(); await page.onOpenTodayCompanion();
    assert.equal(page.data.todayCompanionView.today.activityKind, 'listen');
    assert.equal(page.data.todayCompanionView.pet.name, '小鲤鱼');
    assert.equal(page.data.companionDays, 0); assert.equal(page.data.todayCompanionInteractionDone, false);
    assert.equal(page.data.todayCompanionTomorrowAvailable, false, '小游戏初次开信不展示明天入口');
    storage.set(page.letterProgressKey(), { date: require('../companion-star-rules').shanghaiDate(), tomorrow: true });
    assert.equal(page.readLetterProgress().available, false, '旧的明日展开记录不能冒充进入活动');

    page.onTodayCompanionAction(); assert.equal(navigation.url, '/pages/listen/listen');
    assert.equal(page.data.todayCompanionVisible, false);
    navigation.fail(); assert.equal(page.data.todayCompanionVisible, true); assert.equal(page.data.companionNavigating, false);
    assert.equal(page.data.todayCompanionTomorrowAvailable, false, '导航失败不解锁明天入口');
    const beforeEnter = (await stars.getRoomStarView()).data.star;
    page.onTodayCompanionAction();
    const inFlight = navigation;
    page.onTodayCompanionAction();
    assert.equal(navigation, inFlight, '导航期间重复点按不再进入一次');
    navigation.success();
    assert.equal(page.data.todayCompanionTomorrowAvailable, true, '成功进入小游戏后解锁明天入口');
    assert.equal(page.data.todayCompanionTomorrowVisible, false, '进入不自动展开明日内容');
    assert.equal(page.data.todayCompanionInteractionDone, false, '进入不算完成');
    assert.deepEqual((await stars.getRoomStarView()).data.star, beforeEnter, '进入不改星星或有效陪伴日');
    page.setData({ companionNavigating: false });
    await page.onOpenTodayCompanion();
    assert.equal(page.data.todayCompanionTomorrowAvailable, true, '中途返回重开仍显示明天入口');
    assert.equal(page.data.todayCompanionTomorrowVisible, false);
    page.onTodayCompanionRevealTomorrow();
    assert.equal(page.data.todayCompanionTomorrowVisible, true, '再点明天入口才展开内容');
    assert.equal(page.data.companionRoleEntering, false, '小游戏宠物不播放滑入动画');
    clearTimeout(page.companionRoleTimer);
    page.onCloseTodayCompanion();
    await page.onOpenTodayCompanion();
    assert.equal(page.data.todayCompanionTomorrowVisible, true, '同日关闭再开保留展开状态');

    const draft = listen.startGroup('habits').data;
    for (const q of rules.groupById(draft.groupId).group.questions) draft.answers[q.id] = { optionId: q.options[4].id, text: '' };
    draft.questionIndex = 4; listen.saveDraft(draft); assert.equal((await listen.completeGroup(draft.groupId)).awardedStars, 10);
    assert.equal(stars.getActivityCompleted('drawing'), false, '答题领过星不冒充画画完成');
    page.onCloseTodayCompanion(); await page.onOpenTodayCompanion();
    assert.equal(page.data.todayCompanionView.today.activityKind, 'listen', '同日不更换随机邀请');
    assert.equal(page.data.todayCompanionInteractionDone, true); assert.equal(page.data.todayCompanionAwardedStars, 0);
    const balanceBeforeReopen = (await stars.getRoomStarView()).data.star.balance;
    page.onCloseTodayCompanion(); await page.onOpenTodayCompanion();
    assert.equal(page.data.todayCompanionInteractionDone, true, '完成后重开保留完成状态');
    assert.equal((await stars.getRoomStarView()).data.star.balance, balanceBeforeReopen, '完成后重开不重复发星');
    page.clearStarAwardFeedback();
    page.letterDate = require('../companion-star-rules').shanghaiDate();
    page.startClock = page.refreshEnvironment = page.loadSnapshot = () => {};
    page.hasShownOnce = true;
    now += 86400000; Math.random = () => 0.999;
    page.onShow();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(page.data.todayCompanionView.dateKey, require('../companion-star-rules').shanghaiDate());
    assert.equal(page.data.todayCompanionView.today.activityKind, 'drawing', '跨日返回重载当天随机活动');
    assert.equal(page.data.todayCompanionTomorrowAvailable, false, '新一天重新等待进入小游戏');
    assert.equal(page.data.todayCompanionTomorrowVisible, false);

    assert.equal(page.data.todayCompanionAwardedStars, 0);
    const view = page.data.todayCompanionView;
    page.data.pendingCompanionMemory = { id: 'saved-drawing', image: '/test.webp' };
    now += 86400000; page.onShow();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(page.data.todayCompanionView, view, '待收下作品不被跨日邀请替换');
    page.clearStarAwardFeedback();
  }
  console.log('听你说真实房间入口通过：三环境一致、每日稳定邀请、正确导航、失败可重试、活动完成与领奖分开。');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Date.now = originalNow; Math.random = originalRandom; });
