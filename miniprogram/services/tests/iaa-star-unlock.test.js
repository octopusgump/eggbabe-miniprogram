const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fixture = require('../../fixtures/iaa-star-unlock');
const adapter = require('../iaa-star-unlock-adapter');

assert.deepEqual(fixture.STATE_OPTIONS.map(item => item.key), ['AVAILABLE', 'CLAIMED', 'UNLOCKED', 'ERROR'], 'fixture 必须覆盖四种星星状态');
fixture.STATE_OPTIONS.forEach(option => {
  const view = fixture.starUnlockViewFor(option.key);
  assert.equal(view.contractVersion, 'iaa-mvp-v1');
  assert.equal(view.source, 'local-fixture');
  assert.equal(view.star.dailyClaimStatus, option.key);
});

(async () => {
  adapter.resetRoomStarView('AVAILABLE');
  const roomBefore = await adapter.getRoomStarView();
  assert.equal(roomBefore.data.star.balance, 2, '房间左上角初始显示两颗星');

  const first = await adapter.recordCompanion(roomBefore.data);
  assert.equal(first.ok, true);
  assert.equal(first.awardedStars, 1, '首次有效互动必须 +1 星');
  assert.equal(first.data.star.balance, 3);
  assert.equal(first.data.star.dailyClaimStatus, 'UNLOCKED', '达到门槛必须进入已解锁状态');

  const roomAfter = await adapter.getRoomStarView();
  assert.equal(roomAfter.data.star.balance, 3, '互动结果必须回到房间常驻星星状态');
  assert.equal(roomAfter.data.progress.remaining, 0);

  const repeated = await adapter.recordCompanion(roomAfter.data);
  assert.equal(repeated.awardedStars, 0, '重复互动不得重复加星');
  assert.equal((await adapter.getRoomStarView()).data.star.balance, 3);

  const failed = await adapter.recordCompanion(fixture.starUnlockViewFor('ERROR'));
  assert.equal(failed.ok, false, '失败状态必须诚实返回失败');

  const root = path.resolve(__dirname, '../..');
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  const roomTemplate = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.wxml'), 'utf8');
  const roomLogic = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.js'), 'utf8');
  const roomStyles = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.wxss'), 'utf8');
  const moodTemplate = fs.readFileSync(path.join(root, 'components/pet-mood-tab/pet-mood-tab.wxml'), 'utf8');
  const moodLogic = fs.readFileSync(path.join(root, 'components/pet-mood-tab/pet-mood-tab.js'), 'utf8');
  const moodStyles = fs.readFileSync(path.join(root, 'components/pet-mood-tab/pet-mood-tab.wxss'), 'utf8');
  const adapterLogic = fs.readFileSync(path.join(root, 'services/iaa-star-unlock-adapter.js'), 'utf8');

  assert.equal(app.pages.includes('pages/iaa-star-unlock/iaa-star-unlock'), false, '陪伴星星不得注册为独立页面');
  assert.equal(roomLogic.includes("require('../../services/iaa-star-unlock-adapter')") && roomLogic.includes('loadCompanionStar()'), true, '房间页必须从统一 adapter 读取星星');
  assert.equal(roomLogic.includes("query.entry === 'iaa-core-review'") && roomLogic.includes('coreReviewPreviewPet()'), true, '开发验收入口必须能用内存 fixture 直达房间，不写入绑定数据');
  assert.equal(roomTemplate.includes('star-balance="{{companionStarBalance}}"') && roomTemplate.includes('star-claimed="{{companionStarClaimed}}"'), true, '星星必须进入房间左上角今日心情组件');
  assert.equal(roomTemplate.includes('today-companion-entry="{{todayCompanionEnabled}}"') && roomTemplate.includes('bindtodaycompaniontap="onOpenTodayCompanion"'), true, '房间左上角今日心情卡必须成为今日陪伴的正式入口，且不由开发调试开关控制');
  assert.equal(roomLogic.includes("require('../../services/iaa-today-companion-adapter')") && roomLogic.includes("element_id: 'today_companion_entry'"), true, '房间入口必须在原场景读取今日陪伴内容并记录入口点击');
  assert.equal(roomLogic.includes('todayCompanionVisible: true') && roomLogic.includes('starAdapter.recordCompanion(starView)'), true, '房间 overlay 必须承接陪伴操作与同一份星星状态');
  assert.equal(roomLogic.includes('companionStarAwardPending') && roomLogic.includes('deferAward: awardedStars > 0'), true, '信纸内获得星星后必须把房间左上角 +1 保留到 overlay 关闭时再展示');
  assert.equal(roomLogic.includes('showRoomAward') && roomLogic.includes('companionStarAwardVisible = true'), true, '关闭信纸回到房间时必须立即展示左上角 +1');
  assert.equal(roomLogic.includes("wx.navigateTo({ url: '/pages/iaa-today-companion"), false, '今日陪伴不得再跳转到带第二张场景图的独立页面');
  const overlayStart = roomTemplate.indexOf('class="today-companion-overlay"');
  const overlayEnd = roomTemplate.indexOf('<daily-window-detail', overlayStart);
  const overlayTemplate = roomTemplate.slice(overlayStart, overlayEnd);
  assert.equal(overlayStart >= 0 && overlayTemplate.includes('today-companion-letter__title') && overlayTemplate.includes('明天呢？'), true, '当前房间上方必须渲染极简信纸内容');
  assert.equal(overlayTemplate.includes('<image'), false, '信纸 overlay 内不得重复渲染第二张场景图');
  assert.equal(/窗边的小纸条|这一会儿，收好了。|房间左上角，多了一颗星星。|♡|✓/.test(overlayTemplate), false, '信纸 overlay 不得增加未经确认的小标题、完成文案、说明或装饰图标');
  assert.equal(roomStyles.includes('.today-companion-overlay{position:fixed;z-index:400') && roomStyles.includes('.today-companion-letter__title') && roomStyles.includes('font-size:42rpx'), true, 'overlay 必须覆盖原房间并保持标题与正文两级层次');
  assert.equal(moodLogic.includes("this.triggerEvent('todaycompaniontap')") && moodTemplate.includes('点击查看今日陪伴'), true, '今日心情组件必须通过明确事件开放今日陪伴，并提供无障碍点击语义');
  assert.equal(moodTemplate.includes('pet-mood-tab__star-summary') && moodTemplate.includes('今日已收下') && moodTemplate.includes('今日待收下'), true, '今日心情区域必须展示星星数量和今日状态');
  assert.equal(moodTemplate.includes('starProgressText') && moodStyles.includes('.pet-mood-tab__star-progress'), true, '今日心情组件保留进度文字位，供纪念册恢复或服务端累计接入时使用');
  assert.equal(roomLogic.includes("companionStarProgressText: ''") && !roomLogic.includes('已经留下'), true, '纪念册暂停期间，房间只显示星星累计，不宣称纪念进度或纪念已可进入');
  assert.equal(/wx\.request|wx\.cloud|cloud\.callFunction|database\(|getStorage|setStorage/.test(adapterLogic), false, '星星 adapter 不得联网或写入本地存储');

  console.log('IAA 陪伴星星房间左上角展示、首次 +1、重复幂等与纪念册暂停口径校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
