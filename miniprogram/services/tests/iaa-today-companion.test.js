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
assert.equal(template.includes('isDev && devPanelOpen') && template.includes('开发验收'), true, '状态切换器必须仅在开发态渲染');
assert.equal(template.includes("screenState === 'loading'") && template.includes("screenState === 'empty'") && template.includes("screenState === 'error'"), true, '页面必须提供加载、空态和失败的独立画面');
assert.equal(template.includes("screenState === 'unavailable'") && template.includes('今天的陪伴还在准备'), true, '正式服务未接入时必须向用户诚实阻断');
assert.equal(template.includes('bindtap="onRetry"') && pageLogic.includes("selectedViewState: 'ready'"), true, '空态和失败态必须可以重试到内容态');
assert.equal(styles.includes('.companion-action{min-height:72rpx') && styles.includes('.tomorrow-question{min-height:72rpx') && styles.includes('overflow-wrap:anywhere'), true, '信纸交互行必须使用紧凑一致的纵向节奏，长文案必须允许换行');
assert.equal(template.includes("tomorrowHintVisible ? 'tomorrow-question--open' : ''") && styles.includes('.tomorrow-question--open{min-height:54rpx'), true, '明日正文展开后，问题与答案必须收紧为同一内容组');
assert.equal(pageLogic.includes("require('../../services/iaa-star-unlock-adapter')"), true, '今日陪伴必须复用星星幂等 adapter，不得另写一套计数');
assert.equal(template.includes('star-return-feedback__gain'), true, '今日陪伴页只保留轻量 +1 反馈，不得承载常驻星星面板');
assert.equal(template.includes('class="star-loop ') || template.includes('star-progress__track'), false, '常驻星星数量和纪念进度必须移出今日陪伴页');
assert.equal(template.includes('class="tomorrow-section"') && !template.includes('wx:if="{{interactionDone}}" class="tomorrow-section"'), true, '明日入口必须在页面初次展示时即可发现');
assert.equal(template.includes('明天呢？') && template.includes('wx:if="{{tomorrowHintVisible}}"') && template.includes('view.today.tomorrowHint'), true, '明日正文必须由带期待感的入口点击展开');
assert.equal(pageLogic.includes("interaction_type: 'tomorrow_hint'") && pageLogic.includes("result: 'prompt_shown'") && pageLogic.includes("result: 'revealed'"), true, '明日入口必须记录曝光和展开，且不得上报正文');
assert.equal(template.includes('用户正式可见') && template.includes('正式接口') && template.includes('本地 fixture'), true, '开发验收抽屉必须说明可见范围、接口和数据来源');
assert.equal(template.includes('否（仅开发版）'), true, '本地 fixture 不得标记为正式用户可见');
assert.equal(template.includes('wx:if="{{interactionError}}"') && pageLogic.includes("interactionError: result.error.message"), true, '陪伴记录失败必须在当前页显示原因');
assert.equal(styles.includes('.dev-sheet-backdrop') && styles.includes('bottom:0'), true, '开发验收信息必须进入底部抽屉，不占用用户页面布局');
assert.equal(template.includes('class="letter-paper"') && template.includes('view.today.title') && template.includes('明天呢？'), true, '用户内容必须呈现在简洁信纸中，不得继续使用底部弹窗样式');
assert.equal(/letter-date|presence-dot|letter-name|letter-signoff/.test(template), false, '信纸不得重复日期、状态、名字和落款信息');
assert.equal(/窗边的小纸条|这一会儿，收好了。|房间左上角，多了一颗星星。|✓/.test(template), false, '信纸不得增加无必要的小标题、完成文案、去向说明或勾选符号');
assert.equal(template.includes('♡') || styles.includes('companion-action__icon'), false, '陪伴操作不得增加未经定义的心形或装饰图标');
assert.equal(/\.companion-action\{[^}]*border-(top|bottom)/.test(styles), false, '陪伴操作上下不得增加分隔横线');
assert.equal(template.includes('wx:if="{{!interactionDone}}" class="companion-action'), true, '陪伴完成后操作入口必须直接消失，不得生成第三个完成态层级');
assert.equal(template.includes('story-sheet__handle'), false, '用户信件不应保留抽屉把手');
assert.equal(!styles.includes('repeating-linear-gradient') && styles.includes('.letter-paper::after'), true, '信纸保留折角，但不得用装饰横线干扰正文行距');
assert.equal(styles.includes('font-size:42rpx') && (styles.match(/font-size:27rpx/g) || []).length >= 7, true, '用户内容只能使用标题与正文两级字号');
assert.equal((styles.match(/line-height:1\.55/g) || []).length >= 7 && !styles.includes('tomorrow-arrive'), true, '正文必须统一行高，低动效页面不得增加无必要的展开动画');
assert.equal(/奖励揭晓|reward-reveal/.test(`${template}\n${pageLogic}`), false, '今日陪伴主循环不得引入奖励揭晓');
assert.equal(styles.includes('.star-return-feedback') && !styles.includes('.star-loop{'), true, '今日陪伴只保留轻量 +1 去向反馈');
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
const analytics = require('../analytics');
const trackedEvents = [];
analytics.track = (eventName, properties) => {
  trackedEvents.push({ eventName, properties });
  return { ok: true };
};
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
  assert.equal(page.data.interactionDone, false, '用户操作前不得提前进入陪伴完成状态');
  assert.deepEqual(trackedEvents.filter(item => item.properties.interaction_type === 'tomorrow_hint').map(item => item.properties.result), ['prompt_shown'], '页面初次展示时必须记录一次明日入口曝光');

  pageDefinition.onRevealTomorrow.call(page);
  assert.equal(page.data.tomorrowHintVisible, true, '用户无需先完成陪伴，也能从初始页面展开明日正文');

  await pageDefinition.onScenarioSelect.call(page, { currentTarget: { dataset: { key: 'away' } } });
  assert.equal(page.data.view.today.scenarioKey, 'away', '切换外出态后必须读取对应 fixture');
  pageDefinition.onRevealTomorrow.call(page);
  assert.equal(page.data.tomorrowHintVisible, true, '每个场景都必须允许独立展开明日正文');
  const firstInteraction = pageDefinition.onInteract.call(page);
  const rapidRepeat = pageDefinition.onInteract.call(page);
  const firstResult = await firstInteraction;
  await rapidRepeat;
  assert.equal(firstResult.awardedStars, 1, '首次有效陪伴必须在同页获得 +1');
  assert.equal(page.data.interactionDone, true, '轻互动必须在当前页面给出完成反馈');
  assert.equal(page.data.tomorrowHintVisible, true, '完成陪伴不得把用户已经展开的明日正文重新折叠');
  assert.equal(page.data.starAwardVisible, true, '首次有效陪伴必须显示 +1 反馈');
  assert.equal(page.data.awardedStars, 1);
  assert.equal(page.data.starView.star.balance, 3, '完成陪伴后累计星星必须立即更新');
  assert.equal(page.data.starView.progress.remaining, 0, '达到门槛后距离下一段纪念必须归零');
  assert.equal(page.data.starView.star.dailyClaimStatus, 'UNLOCKED', '达到纪念门槛时仍须标记今日已经领取');
  assert.deepEqual(trackedEvents.filter(item => item.properties.interaction_type === 'tomorrow_hint').map(item => item.properties.result), ['prompt_shown', 'revealed', 'prompt_shown', 'revealed'], '切换场景后入口重新露出，但完成陪伴不得重复记录曝光或展开');

  pageDefinition.onRevealTomorrow.call(page);
  assert.equal(page.data.tomorrowHintVisible, true, '点击“明天呢？”后必须展开明日正文');
  pageDefinition.onRevealTomorrow.call(page);
  assert.deepEqual(trackedEvents.filter(item => item.properties.interaction_type === 'tomorrow_hint').map(item => item.properties.result), ['prompt_shown', 'revealed', 'prompt_shown', 'revealed'], '同一场景内重复点击不得重复记录展开');

  const claimedBalance = page.data.starView.star.balance;
  await pageDefinition.onInteract.call(page);
  assert.equal(page.data.starView.star.balance, claimedBalance, '今日已领取后重复点击不得重复加星');

  const reopenedPage = contextFor();
  await pageDefinition.onLoad.call(reopenedPage, { entry: 'room-mood', scenario: 'normal', state: 'ready' });
  assert.equal(reopenedPage.data.starView.star.balance, 3, '从房间再次进入今日陪伴必须读取同一份星星状态');
  assert.equal(reopenedPage.data.interactionDone, true, '同日再次进入不得重新出现可领取的陪伴操作');

  await pageDefinition.onViewStateSelect.call(page, { currentTarget: { dataset: { key: 'error' } } });
  assert.equal(page.data.screenState, 'error', '失败 fixture 不得伪装为成功内容');
  await pageDefinition.onRetry.call(page);
  assert.equal(page.data.screenState, 'ready', '重试必须回到同一场景的内容态');

  await pageDefinition.onViewStateSelect.call(page, { currentTarget: { dataset: { key: 'empty' } } });
  assert.equal(page.data.screenState, 'empty', '空 fixture 必须显示独立空态');

  await pageDefinition.onViewStateSelect.call(page, { currentTarget: { dataset: { key: 'loading' } } });
  assert.equal(page.data.screenState, 'loading', '加载演示必须稳定停留在加载画面');

  page.setData({
    screenState: 'ready',
    view: fixture.todayViewFor('normal'),
    starView: (await require('../iaa-star-unlock-adapter').getStarUnlockView({ state: 'ERROR' })).data,
    interactionDone: false,
    interactionError: ''
  });
  const failedInteraction = await pageDefinition.onInteract.call(page);
  assert.equal(failedInteraction.ok, false, '记录失败不得伪装为成功');
  assert.equal(page.data.interactionDone, false, '记录失败不得解锁明日提示');
  assert.equal(page.data.interactionError, '刚才没有记下来，请再试一次。', '记录失败必须给出可见反馈');

  const configPath = require.resolve('../../config/v2');
  const environmentPath = require.resolve('../../config/build-environment');
  const pagePath = require.resolve('../../pages/iaa-today-companion/iaa-today-companion');
  delete require.cache[configPath];
  delete require.cache[environmentPath];
  delete require.cache[pagePath];
  let releaseDefinition;
  global.Page = definition => { releaseDefinition = definition; };
  global.wx = {
    getAccountInfoSync() { return { miniProgram: { envVersion: 'release' } }; },
    getWindowInfo() { return { statusBarHeight: 22 }; },
    navigateBack() {},
    switchTab() {}
  };
  require('../../pages/iaa-today-companion/iaa-today-companion');
  const releasePage = Object.assign({}, releaseDefinition, {
    data: Object.assign({}, releaseDefinition.data),
    setData(patch) { Object.assign(this.data, patch); }
  });
  const releaseLoad = await releaseDefinition.onLoad.call(releasePage, {});
  assert.equal(releasePage.data.isDev, false, '正式版不得开放本地验收入口');
  assert.equal(releasePage.data.screenState, 'unavailable', '正式服务未接入时不得读取 fixture');
  assert.equal(releasePage.data.view, null);
  assert.equal(releasePage.data.starView, null);
  assert.equal(releaseLoad.code, 'OFFICIAL_SERVICE_NOT_CONNECTED');
  const releaseInteraction = await releaseDefinition.onInteract.call(releasePage);
  assert.equal(releaseInteraction.code, 'OFFICIAL_SERVICE_NOT_CONNECTED', '正式版不得产生本地加星结果');

  console.log('IAA 今日陪伴四场景、失败反馈、正式版阻断、明日提示与本地隔离校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
