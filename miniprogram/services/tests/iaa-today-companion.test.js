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

assert.equal(app.pages.includes('pages/iaa-today-companion/iaa-today-companion'), true, '演示页必须在 app.json 注册，才能从开发者工具直接打开');
assert.equal(template.includes('isDev && devPanelOpen') && template.includes('本地静态预览'), true, '状态切换器必须仅在开发态渲染');
assert.equal(template.includes("screenState === 'loading'") && template.includes("screenState === 'empty'") && template.includes("screenState === 'error'"), true, '页面必须提供加载、空态和失败的独立画面');
assert.equal(template.includes('bindtap="onRetry"') && pageLogic.includes("selectedViewState: 'ready'"), true, '空态和失败态必须可以重试到内容态');
assert.equal(styles.includes('min-height:96rpx') && styles.includes('overflow-wrap:anywhere'), true, '主交互热区不得小于 96rpx，长文案必须允许换行');
assert.equal(/wx\.request|wx\.cloud|cloud\.callFunction|database\(|Math\.random|Date\.now/.test(`${pageLogic}\n${adapterLogic}`), false, '今日陪伴静态页不得接网络、云函数、数据库或随机调度');

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
  pageDefinition.onLoad.call(page, { scenario: 'normal', state: 'ready' });
  await Promise.resolve();
  assert.equal(page.data.isDev, true, 'develop 构建必须开放验收切换器');
  assert.equal(page.data.screenState, 'ready');
  assert.equal(page.data.view.source, 'local-fixture');

  await pageDefinition.onScenarioSelect.call(page, { currentTarget: { dataset: { key: 'away' } } });
  assert.equal(page.data.view.today.scenarioKey, 'away', '切换外出态后必须读取对应 fixture');
  pageDefinition.onInteract.call(page);
  assert.equal(page.data.interactionDone, true, '轻互动必须在当前页面给出完成反馈');

  await pageDefinition.onViewStateSelect.call(page, { currentTarget: { dataset: { key: 'error' } } });
  assert.equal(page.data.screenState, 'error', '失败 fixture 不得伪装为成功内容');
  await pageDefinition.onRetry.call(page);
  assert.equal(page.data.screenState, 'ready', '重试必须回到同一场景的内容态');

  await pageDefinition.onViewStateSelect.call(page, { currentTarget: { dataset: { key: 'empty' } } });
  assert.equal(page.data.screenState, 'empty', '空 fixture 必须显示独立空态');

  await pageDefinition.onViewStateSelect.call(page, { currentTarget: { dataset: { key: 'loading' } } });
  assert.equal(page.data.screenState, 'loading', '加载演示必须稳定停留在加载画面');

  console.log('IAA 今日陪伴四场景、四页面状态与本地隔离校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
