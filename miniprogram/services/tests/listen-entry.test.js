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
    const starRules = require('../companion-star-rules');
    assert.equal(page.data.todayCompanionAwardedStars, starRules.dailyStars(1), '开信收星动效仅反映 §5.1 当日基础星，不是互动 +10');
    assert.equal(page.data.todayCompanionView.today.activityKind, 'listen');
    assert.equal(page.data.todayCompanionView.pet.name, '小鲤鱼');
    assert.equal(page.data.companionDays, 0); assert.equal(page.data.todayCompanionInteractionDone, false);
    assert.equal(page.data.todayCompanionTomorrowAvailable, false, '小游戏初次开信不展示明天入口');
    storage.set(page.letterProgressKey(), { date: require('../companion-star-rules').shanghaiDate(), tomorrow: true });
    assert.equal(page.readLetterProgress().available, false, '旧的明日展开记录不能冒充进入活动');

    page.onTodayCompanionAction(); assert.equal(navigation.url, '/pages/listen/listen');
    assert.equal(page.data.todayCompanionVisible, true, '进入听你说不关闭信件');
    navigation.fail(); assert.equal(page.data.todayCompanionVisible, true); assert.equal(page.data.companionNavigating, false);
    assert.equal(page.data.todayCompanionTomorrowAvailable, false, '导航失败不解锁明天入口');
    const beforeEnter = (await stars.getRoomStarView()).data.star;
    page.onTodayCompanionAction();
    const inFlight = navigation;
    page.onTodayCompanionAction();
    assert.equal(navigation, inFlight, '导航期间重复点按不再进入一次');
    navigation.success();
    assert.equal(page.data.todayCompanionTomorrowAvailable, false, '听你说邀请信不含明天呢入口');
    assert.equal(page.data.todayCompanionTomorrowVisible, false, '进入不自动展开明日内容');
    assert.equal(page.data.todayCompanionInteractionDone, false, '进入不算完成');
    assert.deepEqual((await stars.getRoomStarView()).data.star, beforeEnter, '进入不改星星或有效陪伴日');
    const loadSnapshot = page.loadSnapshot;
    page.loadSnapshot = () => {};
    page.onHide();
    page.onShow();
    await new Promise(resolve => setImmediate(resolve));
    page.loadSnapshot = loadSnapshot;
    assert.equal(page.data.todayCompanionVisible, true, '中途返回信件仍展开');
    assert.equal(page.data.todayCompanionTomorrowAvailable, false, '中途返回仍不展示明天呢');
    assert.equal(page.data.todayCompanionTomorrowVisible, false);
    assert.equal(page.data.companionNavigating, false);

    const draft = listen.startGroup('habits').data;
    for (const q of rules.groupById(draft.groupId).group.questions) draft.answers[q.id] = { optionId: q.options[4].id, text: '' };
    draft.questionIndex = 4; listen.saveDraft(draft); assert.equal((await listen.completeGroup(draft.groupId)).awardedStars, 10);
    assert.equal(stars.getActivityCompleted('drawing'), false, '答题领过星不冒充画画完成');
    assert.equal(page.data.todayCompanionView.today.activityKind, 'listen', '同日不更换随机邀请');
    const balanceBeforeReopen = (await stars.getRoomStarView()).data.star.balance;
    assert.equal(stars.getActivityCompleted('listen'), true, '首组答完即记为听你说完成');
    page.setData({
      todayCompanionVisible: true,
      todayCompanionInteractionDone: true,
      snapshot: { chatAccess: { status: 'available' } },
      currentState: { atHome: true }
    });
    page.returningFromChild = true;
    const snapshotLoader = page.loadSnapshot;
    page.loadSnapshot = () => Promise.resolve();
    page.onShow();
    page.loadSnapshot = snapshotLoader;
    page.syncRoomContextEntry();
    assert.equal(page.data.todayCompanionVisible, false, '听你说完成后回到房间仅展示场景');
    assert.equal(page.data.contextEntryOpensListen, true, '首组完成后仍有类别时左下为宠物并继续听你说');
    assert.equal(page.data.contextEntryOpensChat, false);
    page.onContextActionTap();
    assert.match(navigation && navigation.url, /pages\/listen\/listen/, '左下宠物直达听你说页，不展开已完成信卡');
    page.onCloseTodayCompanion();
    page.syncRoomContextEntry();
    assert.equal(page.data.todayCompanionVisible, false, '用户关信后房间只保留场景');
    assert.equal(page.data.contextEntryFlatEnvelope, false, '首组后左下不再是信封');
    assert.equal(page.data.contextEntryOpensListen, true, '关信后仍可从宠物入口再进听你说答 2–5 组');
    page.setData({ companionNavigating: false });
    navigation = null;
    await page.onOpenTodayCompanion();
    assert.match(navigation && navigation.url, /pages\/listen\/listen/, '再次点陪伴入口仍直达听你说，不弹出已完成信卡');
    assert.equal(page.data.todayCompanionVisible, false);
    assert.equal((await stars.getRoomStarView()).data.star.balance, balanceBeforeReopen, '完成后不重复发星');
    page.clearStarAwardFeedback();
    page.startClock = page.refreshEnvironment = page.loadSnapshot = () => {};
    page.hasShownOnce = true;
    now += 86400000; Math.random = () => 0.999;
    page.onShow();
    await page.onOpenTodayCompanion();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(page.data.todayCompanionView.dateKey, require('../companion-star-rules').shanghaiDate());
    assert.equal(page.data.todayCompanionView.today.activityKind, 'drawing', '跨日返回重载当天随机活动');
    assert.equal(page.data.todayCompanionTomorrowAvailable, false, '新一天重新等待进入小游戏');
    assert.equal(page.data.todayCompanionTomorrowVisible, false);

    assert.equal(page.data.todayCompanionAwardedStars, 12, '跨日自动重开信发放当日基础星动效');
    const view = page.data.todayCompanionView;
    page.data.pendingCompanionMemory = { id: 'saved-drawing', image: '/test.webp' };
    now += 86400000; page.onShow();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(page.data.todayCompanionView, view, '待收下作品不被跨日邀请替换');
    page.clearStarAwardFeedback();
    page.stopClock();
  }
  console.log('听你说真实房间入口通过：三环境一致、每日稳定邀请、正确导航、失败可重试、活动完成与领奖分开。');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Date.now = originalNow; Math.random = originalRandom; });
