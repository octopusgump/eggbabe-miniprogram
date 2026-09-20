const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fixture = require('../../fixtures/iaa-today-companion');
const adapter = require('../iaa-today-companion-adapter');

const expectedScenarios = ['normal', 'surprise', 'away', 'return'];
assert.deepEqual(fixture.SCENARIO_OPTIONS.map(item => item.key), expectedScenarios, '开发态必须覆盖普通、惊喜、外出、归来四态');
assert.deepEqual(fixture.VIEW_STATE_OPTIONS.map(item => item.key), ['ready', 'loading', 'empty', 'error'], '开发态必须覆盖内容、加载、空态、失败');

expectedScenarios.forEach(key => {
  const view = fixture.todayViewFor(key);
  assert.equal(view.contractVersion, 'iaa-mvp-v1');
  assert.equal(view.source, 'local-fixture', `${key} 必须明确来自本地 fixture`);
  assert.equal(view.today.scenarioKey, key);
  assert.equal(view.pet.id, 'demo-jade-rabbit');
  assert.equal(view.today.sceneImage.startsWith('/assets/'), true, `${key} 只能使用包内素材`);
  assert.equal(Boolean(view.today.line && view.today.tomorrowHint && view.today.interactionLabel), true, `${key} 缺少今日叙事字段`);
});

assert.equal(fixture.todayViewFor('away').today.atHome, false, '外出态不得把玉兔标记为在家');
assert.equal(fixture.todayViewFor('return').today.atHome, true, '归来态必须恢复在家状态');
const firstCopy = fixture.todayViewFor('normal');
firstCopy.today.title = '被测试修改';
assert.notEqual(fixture.todayViewFor('normal').today.title, '被测试修改', 'fixture 每次必须返回隔离副本');

const root = path.resolve(__dirname, '../..');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'pages/iaa-today-companion/iaa-today-companion.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'pages/iaa-today-companion/iaa-today-companion.wxss'), 'utf8');
const pageLogic = fs.readFileSync(path.join(root, 'pages/iaa-today-companion/iaa-today-companion.js'), 'utf8');
const adapterLogic = fs.readFileSync(path.join(root, 'services/iaa-today-companion-adapter.js'), 'utf8');
const starAdapterLogic = fs.readFileSync(path.join(root, 'services/iaa-star-unlock-adapter.js'), 'utf8');

assert.equal(app.pages.includes('pages/iaa-today-companion/iaa-today-companion'), true, '演示页必须在 app.json 注册，才能从开发者工具直接打开');
assert.equal(template.includes('isDev && devPanelOpen') && template.includes('本地静态预览'), true, '状态切换器必须仅在开发态渲染');
assert.equal(template.includes("screenState === 'loading'") && template.includes("screenState === 'empty'") && template.includes("screenState === 'error'"), true, '页面必须提供加载、空态和失败的独立画面');
assert.equal(template.includes('bindtap="onRetry"') && pageLogic.includes("selectedViewState: 'ready'"), true, '空态和失败态必须可以重试到内容态');
assert.equal(styles.includes('min-height:96rpx') && styles.includes('overflow-wrap:anywhere'), true, '主交互热区不得小于 96rpx，长文案必须允许换行');
assert.equal(pageLogic.includes("require('../../services/iaa-star-unlock-adapter')"), true, '今日陪伴必须复用星星幂等 adapter，不得另写一套计数');
assert.equal(template.includes('陪伴星星') && template.includes('今日已领取') && template.includes('累计') && template.includes('star-loop__award'), true, '今日陪伴页必须展示星星名称、当日领取状态、累计数量与 +1 反馈');
assert.equal(template.includes('下一段纪念') && template.includes('starView.progress.remaining') && template.includes('starView.star.balance'), true, '星星区必须同时展示累计数量和距离下一段纪念的进度');
assert.equal(template.includes('留给明天') && template.includes('view.today.tomorrowHint'), true, '星星之后仍须保留明日提示');
assert.equal(template.indexOf('class="star-loop ') < template.indexOf('class="tomorrow-card"'), true, '主流程顺序必须是陪伴、星星、明日提示');
assert.equal(/奖励揭晓|reward-reveal/.test(`${template}\n${pageLogic}`), false, '今日陪伴主循环不得引入奖励揭晓');
assert.equal(styles.includes('.star-progress__track') && styles.includes('.star-loop__award') && styles.includes('@keyframes star-award-rise'), true, '星星区必须提供可读进度与轻量 +1 反馈');
assert.equal(/wx\.request|wx\.cloud|cloud\.callFunction|database\(|Math\.random|Date\.now/.test(`${pageLogic}\n${adapterLogic}\n${starAdapterLogic}`), false, '今日陪伴静态页不得接网络、云函数、数据库或随机调度');

let pageDefinition;
global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getWindowInfo() { return { statusBarHeight: 22 }; },
  navigateBack() {},
  switchTab() {}
};
global.getCurrentPages = () => [{}];
require('../../pages/iaa-today-companion/iaa-today-companion');

function contextFor() {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(patch) { Object.assign(this.data, patch); }
  });
}

(async () => {
  const page = contextFor();
  await pageDefinition.onLoad.call(page, { scenario: 'normal', state: 'ready' });
  assert.equal(page.data.isDev, true, 'develop 构建必须开放验收切换器');
  assert.equal(page.data.screenState, 'ready');
  assert.equal(page.data.view.source, 'local-fixture');
  assert.equal(page.data.starView.star.balance, 2, '互动前必须展示累计星星');
  assert.equal(page.data.starView.progress.remaining, 1, '互动前必须展示距离下一段纪念还差一颗');

  await pageDefinition.onScenarioSelect.call(page, { currentTarget: { dataset: { key: 'away' } } });
  assert.equal(page.data.view.today.scenarioKey, 'away', '切换外出态后必须读取对应 fixture');
  const firstInteraction = pageDefinition.onInteract.call(page);
  const rapidRepeat = pageDefinition.onInteract.call(page);
  const firstResult = await firstInteraction;
  await rapidRepeat;
  assert.equal(firstResult.awardedStars, 1, '首次有效陪伴必须在同页获得 +1');
  assert.equal(page.data.interactionDone, true, '轻互动必须在当前页面给出完成反馈');
  assert.equal(page.data.starAwardVisible, true, '首次有效陪伴必须显示 +1 反馈');
  assert.equal(page.data.awardedStars, 1);
  assert.equal(page.data.starView.star.balance, 3, '完成陪伴后累计星星必须立即更新');
  assert.equal(page.data.starView.progress.remaining, 0, '达到门槛后距离下一段纪念必须归零');
  assert.equal(page.data.starView.star.dailyClaimStatus, 'UNLOCKED', '达到纪念门槛时仍须标记今日已经领取');

  const claimedBalance = page.data.starView.star.balance;
  await pageDefinition.onInteract.call(page);
  assert.equal(page.data.starView.star.balance, claimedBalance, '今日已领取后重复点击不得重复加星');

  await pageDefinition.onViewStateSelect.call(page, { currentTarget: { dataset: { key: 'error' } } });
  assert.equal(page.data.screenState, 'error', '失败 fixture 不得伪装为成功内容');
  await pageDefinition.onRetry.call(page);
  assert.equal(page.data.screenState, 'ready', '重试必须回到同一场景的内容态');

  await pageDefinition.onViewStateSelect.call(page, { currentTarget: { dataset: { key: 'empty' } } });
  assert.equal(page.data.screenState, 'empty', '空 fixture 必须显示独立空态');

  await pageDefinition.onViewStateSelect.call(page, { currentTarget: { dataset: { key: 'loading' } } });
  assert.equal(page.data.screenState, 'loading', '加载演示必须稳定停留在加载画面');

  console.log('IAA 今日陪伴四场景、陪伴星星 +1 幂等、纪念进度、明日提示与本地隔离校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
