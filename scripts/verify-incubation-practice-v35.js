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
  assert.equal(home.includes("wx:if=\"{{stage === 'hatched'}}\" class=\"state-card\""), true, '孵化状态卡只能在破壳后展示');
  assert.equal(homeLogic.includes("title: '早教班'"), true, '首页第二入口必须命名为早教班');
  assert.equal(homeLogic.includes('DAILY_ACTION_MODULES') && home.includes('completed-check'), true, '许愿池与早教班回答后必须按当天记录折叠为可回看的勾选入口');
  assert.equal(home.includes('draw-icon-button'), true, '画画必须始终使用紧凑绘图图标');
  assert.equal(home.includes('demo-toolbar'), false, '首页不得暴露开发验收工具栏');
  assert.equal(JSON.parse(read('miniprogram/app.json')).tabBar.custom, true, 'V3.5 必须使用自定义底部导航');
  assert.equal(/修炼值\s*[+＋]\s*\d|百分比|进度条/.test(home), false, '首页不得暴露修炼数值或进度条');
  assert.equal(home.includes('egg-zone--hatched') && home.includes('scene-expand-overlay'), true, '破壳后首页必须使用独立正方形场景图及放大全屏过渡');
  assert.equal(homeLogic.includes("animationType: 'none'") && homeLogic.includes('sceneTransitionStyle'), true, '进入完整场景时不得使用系统右滑转场');
  assert.equal(read('miniprogram/pages/home/home.wxss').includes('width: 430rpx; height: 450rpx'), true, '首页场景缩略图必须恢复原版近方形尺寸');
  assert.equal(home.includes('class="eyebrow"') && home.includes('class="progress-ring"'), true, '破壳后首页必须恢复角色状态、名称与圆环信息布局');
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
