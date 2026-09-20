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
  const moodTemplate = fs.readFileSync(path.join(root, 'components/pet-mood-tab/pet-mood-tab.wxml'), 'utf8');
  const moodStyles = fs.readFileSync(path.join(root, 'components/pet-mood-tab/pet-mood-tab.wxss'), 'utf8');
  const adapterLogic = fs.readFileSync(path.join(root, 'services/iaa-star-unlock-adapter.js'), 'utf8');

  assert.equal(app.pages.includes('pages/iaa-star-unlock/iaa-star-unlock'), false, '陪伴星星不得注册为独立页面');
  assert.equal(roomLogic.includes("require('../../services/iaa-star-unlock-adapter')") && roomLogic.includes('loadCompanionStar()'), true, '房间页必须从统一 adapter 读取星星');
  assert.equal(roomLogic.includes("query.entry === 'iaa-core-review'") && roomLogic.includes('coreReviewPreviewPet()'), true, '开发验收入口必须能用内存 fixture 直达房间，不写入绑定数据');
  assert.equal(roomTemplate.includes('star-balance="{{companionStarBalance}}"') && roomTemplate.includes('star-claimed="{{companionStarClaimed}}"'), true, '星星必须进入房间左上角今日心情组件');
  assert.equal(moodTemplate.includes('pet-mood-tab__star-summary') && moodTemplate.includes('今日已收下') && moodTemplate.includes('今日待收下'), true, '今日心情区域必须展示星星数量和今日状态');
  assert.equal(moodTemplate.includes('starProgressText') && moodStyles.includes('.pet-mood-tab__star-progress'), true, '展开今日心情后必须展示下一段纪念进度');
  assert.equal(/wx\.request|wx\.cloud|cloud\.callFunction|database\(|getStorage|setStorage/.test(adapterLogic), false, '星星 adapter 不得联网或写入本地存储');

  console.log('IAA 陪伴星星房间左上角展示、首次 +1、重复幂等与纪念进度校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
