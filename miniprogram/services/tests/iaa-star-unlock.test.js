const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fixture = require('../../fixtures/iaa-star-unlock');
const adapter = require('../iaa-star-unlock-adapter');

assert.deepEqual(fixture.STATE_OPTIONS.map(item => item.key), ['AVAILABLE', 'CLAIMED', 'UNLOCKED', 'ERROR'], '验收器必须覆盖四种星星状态');
fixture.STATE_OPTIONS.forEach(option => {
  const view = fixture.starUnlockViewFor(option.key);
  assert.equal(view.contractVersion, 'iaa-mvp-v1');
  assert.equal(view.source, 'local-fixture');
  assert.equal(view.star.dailyClaimStatus, option.key);
  assert.equal(view.nextMemory.image.startsWith('/assets/'), true, '纪念预览只能复用包内素材');
});

(async () => {
  const available = fixture.starUnlockViewFor('AVAILABLE');
  const first = await adapter.recordCompanion(available);
  assert.equal(first.ok, true);
  assert.equal(first.awardedStars, 1, '首次有效互动必须 +1 星');
  assert.equal(first.data.star.balance, 3);
  assert.equal(first.data.star.dailyClaimStatus, 'UNLOCKED', '达到门槛必须进入已解锁状态');
  assert.equal(first.data.newlyUnlockedMemory.id, 'memory-unfinished-drawing', '达到门槛必须返回新纪念');

  const repeated = await adapter.recordCompanion(first.data);
  assert.equal(repeated.ok, true);
  assert.equal(repeated.awardedStars, 0, '重复互动不得重复加星');
  assert.equal(repeated.duplicate, true);
  assert.equal(repeated.data.star.balance, 3, '重复互动后余额必须保持不变');

  const claimed = await adapter.recordCompanion(fixture.starUnlockViewFor('CLAIMED'));
  assert.equal(claimed.awardedStars, 0, '已领取状态不得再次加星');

  const failed = await adapter.recordCompanion(fixture.starUnlockViewFor('ERROR'));
  assert.equal(failed.ok, false, '失败状态必须诚实返回失败');
  assert.equal(failed.error.code, 'LOCAL_FIXTURE_RECORD_FAILED');

  const retried = await adapter.retryCompanion();
  assert.equal(retried.ok, true, '用户主动重试后可演示成功结果');
  assert.equal(retried.awardedStars, 1);

  const root = path.resolve(__dirname, '../..');
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  const template = fs.readFileSync(path.join(root, 'pages/iaa-star-unlock/iaa-star-unlock.wxml'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'pages/iaa-star-unlock/iaa-star-unlock.wxss'), 'utf8');
  const pageLogic = fs.readFileSync(path.join(root, 'pages/iaa-star-unlock/iaa-star-unlock.js'), 'utf8');
  const adapterLogic = fs.readFileSync(path.join(root, 'services/iaa-star-unlock-adapter.js'), 'utf8');
  const fixtureLogic = fs.readFileSync(path.join(root, 'fixtures/iaa-star-unlock.js'), 'utf8');

  assert.equal(app.pages.includes('pages/iaa-star-unlock/iaa-star-unlock'), true, '隐藏演示页必须注册后才能从开发者工具直达');
  assert.equal(template.includes('isDev && devPanelOpen') && template.includes('local fixture'), true, '状态切换器必须仅在开发态出现并明确 mock 来源');
  assert.equal(template.includes('前端静态演示') && template.includes('不代表星星已写入正式账户'), true, '页面必须明确静态演示边界');
  assert.equal(template.includes('unlockVisible') && template.includes('收好这一刻'), true, '解锁状态必须展示新纪念收下流程');
  assert.equal(template.includes('bindtap="onRetry"') && template.includes('刚才没有记下来'), true, '失败状态必须提供诚实错误和重试入口');
  assert.equal(styles.includes('min-height:96rpx') && styles.includes('overflow-wrap:anywhere'), true, '主要热区不得小于 96rpx，长文案必须可换行');
  assert.equal(/wx\.request|wx\.cloud|cloud\.callFunction|database\(|getStorage|setStorage|Date\(|Math\.random/.test(`${pageLogic}\n${adapterLogic}\n${fixtureLogic}`), false, '本工作包不得联网、存储、读取本机日期或随机生成业务状态');

  let pageDefinition;
  global.Page = definition => { pageDefinition = definition; };
  global.wx = {
    getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
    getWindowInfo() { return { statusBarHeight: 22 }; },
    navigateBack() {},
    switchTab() {}
  };
  global.getCurrentPages = () => [{}];
  require('../../pages/iaa-star-unlock/iaa-star-unlock');
  const page = Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(patch) { Object.assign(this.data, patch); }
  });

  pageDefinition.onLoad.call(page, { state: 'available' });
  await Promise.resolve();
  assert.equal(page.data.view.star.balance, 2);
  await pageDefinition.onCompanionTap.call(page);
  assert.equal(page.data.view.star.balance, 3);
  assert.equal(page.data.unlockVisible, true, '首次互动达到门槛后必须打开纪念');
  await pageDefinition.onCompanionTap.call(page);
  assert.equal(page.data.view.star.balance, 3, '页面重复点击不得重复增加');
  assert.equal(Boolean(page.data.duplicateFeedback), true, '重复点击必须给出温和反馈');

  await pageDefinition.onStateSelect.call(page, { currentTarget: { dataset: { key: 'ERROR' } } });
  await pageDefinition.onCompanionTap.call(page);
  assert.equal(Boolean(page.data.errorMessage), true, '失败态互动必须保留错误提示');
  await pageDefinition.onRetry.call(page);
  assert.equal(page.data.view.star.balance, 3, '重试成功后才可以展示 +1 结果');

  console.log('IAA 星星首次 +1、重复幂等、纪念解锁与失败重试校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
