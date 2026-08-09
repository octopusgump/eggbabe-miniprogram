const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const storage = new Map();

global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const runtime = require('../miniprogram/services/runtime-context');
const petStore = require('../miniprogram/utils/pet-store');
const practice = require('../miniprogram/services/incubation-practice');
const touchLines = require('../miniprogram/services/egg-touch-lines');

assert.equal(runtime.getMode(), 'demo', '回归必须运行在隔离 demo 命名空间');
assert.deepEqual(practice.MODULE_POINTS, {
  nickname: 5,
  wish_pool: 4,
  touch: 1,
  doodle: 2,
  edu_class: 5,
  pre_hatch_talk: 1,
  heartbeat: 1,
  birth_gift: 5,
  personality_test: 3,
  review: 1
}, 'V3.5 修炼值必须与 PRD 一致');
assert.equal(practice.contentDayFor({ createdAt: '2026-07-20T10:00:00+08:00' }, '2026-07-22', ['2026-07-20', '2026-07-21', '2026-07-22']), 4, '连续登录 3 天必须在服务端口径解锁第 3、4 天');
assert.equal(practice.contentDayFor({ createdAt: '2026-07-20T10:00:00+08:00' }, '2026-07-24', ['2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24']), 7, '连续登录 5 天必须解锁第 7 天');
assert.equal(touchLines.COMMON.length + touchLines.PERIOD.day.length + touchLines.PERIOD.night.length + Object.values(touchLines.WEATHER).flat().length + touchLines.NEAR_HATCH.length, 84, '触蛋文案池应包含 84 条');

petStore.saveUser({ id: 'demo-user-v35', publicId: 'EB-DEMO-V35' });
const createdAt = `${practice.dateKey()}T00:00:00+08:00`;
const imported = petStore.importDemoPet({
  id: 'demo-egg-v35',
  ownerId: 'demo-user-v35',
  mode: 'demo',
  createdAt,
  hatchAt: new Date(Date.now() + 10 * 86400000).toISOString(),
  lifecycleStage: 'RESTING'
});
assert.equal(imported.ok, true, '应能建立隔离验收蛋');

(async () => {
  const first = await practice.submit('touch');
  const second = await practice.submit('touch');
  assert.equal(first.ok, true, '首次摸一摸应写入');
  assert.equal(first.pointsAdded, 1, '首次摸一摸应增加 1 点');
  assert.equal(second.alreadyDone, true, '同日重复摸一摸应返回 already_done');

  const nickname = await practice.submitOnce('nickname');
  const nicknameAgain = await practice.submitOnce('nickname');
  assert.equal(nickname.pointsAdded, 5, '首次命名应增加 5 点');
  assert.equal(nicknameAgain.alreadyDone, true, '再次命名不得二次增加');

  const manual = await practice.getManualState();
  assert.equal(manual.points.active, 6, '主动修炼值必须按记录求和');
  assert.equal(manual.points.passive, 0, '不足完整 24 小时不得增加被动修炼值');
  assert.equal(manual.unlockedModules.includes('wish_pool'), true, '第 1 天必须开放许愿池');
  assert.equal(manual.unlockedModules.includes('edu_class'), false, '第 1 天不得提前开放早教班');

  const home = read('miniprogram/pages/home/home.wxml');
  const wish = read('miniprogram/pages/wish/wish.wxml');
  const privacy = read('miniprogram/pages/privacy/privacy.wxml');
  const account = read('miniprogram/pages/account/account.wxml');
  const accountLogic = read('miniprogram/pages/account/account.js');
  const homeLogic = read('miniprogram/pages/home/home.js');
  const actionsSource = homeLogic.slice(homeLogic.indexOf('const COMPANION_ACTIONS'), homeLogic.indexOf('Page({'));
  assert.deepEqual(Array.from(actionsSource.matchAll(/key: '([^']+)'/g), match => match[1]), ['wish', 'learn', 'draw'], '首页数据源只允许许愿池、早教班与画画三个功能入口');
  assert.equal(homeLogic.includes("key: 'touch', title:"), false, '轻触不得作为独立功能卡片');
  assert.equal(home.includes('talkUnlocked') || home.includes('talk-input'), false, '孵化前首页不得展示说话输入框');
  assert.equal(/state-card|status-daily|post-hatch-entries|ta 带回来的东西|今日收藏卡/.test(home), false, '破壳后落地页不得保留状态卡、常驻心情或三个分散回忆入口');
  assert.equal(homeLogic.includes("title: '早教班'"), true, '首页第二入口必须命名为早教班');
  assert.equal(homeLogic.includes('DAILY_ACTION_MODULES') && homeLogic.includes('今天已经回答，点击查看'), true, '许愿池与早教班必须保留当天回答记录和重复查看语义');
  assert.equal(home.includes('completed-check') || home.includes('completed-mark'), false, '首页不得用勾选或完成章汇总当天动作');
  assert.equal(home.includes('companion-primary-dock') && !/<view\s+wx:if="\{\{item\.key/.test(home) && home.includes('draw-action-spark'), true, '许愿池、早教班与画画必须成组显示在同一枚三等分胶囊中');
  assert.equal(home.includes('companion-icon-wrap') && home.includes('draw-action-spark'), true, '画画必须在统一胶囊内保留紧凑绘图图标与星标');
  assert.equal(/再陪我一天|明天再来|明天来试试|别忘了|连续到访/.test(homeLogic), false, '未开放入口不得使用连续到访或催促文案');
  assert.equal(homeLogic.includes('蛋宝宝还没到早教的年龄。'), true, '未开放早教班必须使用既定的年龄语义反馈');
  assert.equal(home.includes('demo-toolbar'), false, '首页不得暴露开发验收工具栏');
  assert.equal(JSON.parse(read('miniprogram/app.json')).tabBar.custom, true, 'V3.5 必须使用自定义底部导航');
  assert.equal(/修炼值\s*[+＋]\s*\d|百分比|进度条/.test(home), false, '首页不得暴露修炼数值或进度条');
  assert.equal(homeLogic.includes('/pages/life-scene/life-scene?entry=post-hatch-landing') && homeLogic.includes("animationType: 'none'"), true, '破壳后首页必须直接无系统转场地进入全屏生活空间');
  assert.equal(/post-hatch-landing|看看回忆/.test(home), false, '破壳后首页不得回退到空落地层，也不得重复提供回忆入口');
  assert.equal(home.includes('<mood-badge') || home.includes('class="progress-ring"'), false, '破壳后首页不得常驻每日心情或百分比圆环');
  const lifeSceneLogic = read('miniprogram/pages/life-scene/life-scene.js');
  assert.equal(lifeSceneLogic.includes("wx.switchTab({ url: '/pages/home/home' })") && lifeSceneLogic.includes('exitTransitionStyle'), true, '从首页退出完整场景必须反向缩回并直接切回 Tab，避开系统侧滑');
  assert.equal(JSON.parse(read('miniprogram/pages/life-scene/life-scene.json')).disableSwipeBack, true, '完整场景必须禁用系统侧滑返回以保证转场一致');
  assert.equal(wish.includes('画像用途'), false, '许愿池不得要求画像用途同意');
  assert.equal(privacy.includes('不用于用户画像或蛋宝宝性格生成'), true, '隐私说明必须声明许愿答案不用于画像或人格');
  assert.equal(account.includes('清除本地数据') && account.includes('canClearLocalData'), true, '开发验收账号页必须提供本地数据重置入口');
  assert.equal(accountLogic.includes("runtime.getMode() === 'demo'"), true, '本地数据重置入口必须限制在隔离 demo 环境');
  assert.equal(accountLogic.includes('petStore.clearUser()') && accountLogic.includes("wx.reLaunch({ url: '/pages/welcome/welcome' })"), true, '重置后必须回到欢迎页重新体验');
  console.log('孵化修炼手册 V3.5 修炼值、解锁、幂等与首页约束校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
