const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dailyMood = require('../../config/daily-mood');

const expectedTypes = ['JOY', 'CALM', 'EXCITEMENT', 'CURIOSITY', 'CARE', 'ANXIETY', 'FRUSTRATION', 'FATIGUE'];
const expectedLabels = ['愉快', '平静', '兴奋', '好奇', '关怀', '焦虑', '沮丧', '疲惫'];
const forbiddenFields = ['value', 'score', 'level', 'progress', 'streak', 'reward', 'probability', 'weight'];
const forbiddenCopy = /金币|奖励|进度|连续天数|正在看书|正在打游戏|去了|地点/;

assert.deepEqual(dailyMood.MOOD_TYPES, expectedTypes, '每日心情必须且只能包含八种正式枚举');
assert.equal(dailyMood.DEFAULT_MOOD_TYPE, 'CURIOSITY', '默认 Mock 必须稳定且可复现');
assert.deepEqual(dailyMood.MOOD_PREVIEW_OPTIONS.map(item => item.key), expectedTypes, '开发态切换器必须覆盖八种心情');

expectedTypes.forEach((moodType, index) => {
  const preHatch = dailyMood.mockDailyMood('pre-hatch', moodType);
  const postHatch = dailyMood.mockDailyMood('post-hatch', moodType);
  assert.equal(preHatch.moodType, moodType);
  assert.equal(preHatch.moodLabel, expectedLabels[index]);
  assert.equal(postHatch.moodLabel, preHatch.moodLabel, `${moodType} 破壳前后必须共用正式名称`);
  assert.equal(postHatch.icon, preHatch.icon, `${moodType} 玉兔与锦鲤必须共用通用 Emoji`);
  assert.equal(Array.from(preHatch.text).length <= 30, true, `${moodType} 破壳前文案应不超过 30 字`);
  assert.equal(Array.from(postHatch.text).length <= 30, true, `${moodType} 破壳后文案应不超过 30 字`);
  assert.equal(forbiddenCopy.test(`${preHatch.text}${postHatch.text}`), false, `${moodType} 文案包含禁用信息`);
  forbiddenFields.forEach(field => {
    assert.equal(Object.prototype.hasOwnProperty.call(preHatch, field), false, `${moodType} 不得定义隐藏字段 ${field}`);
  });
  assert.deepEqual(dailyMood.mockDailyMood('pre-hatch', moodType), preHatch, `${moodType} 不得随机变化`);
});

const root = path.resolve(__dirname, '../..');
const componentTemplate = fs.readFileSync(path.join(root, 'components/pet-mood-tab/pet-mood-tab.wxml'), 'utf8');
const componentStyles = fs.readFileSync(path.join(root, 'components/pet-mood-tab/pet-mood-tab.wxss'), 'utf8');
const homeTemplate = fs.readFileSync(path.join(root, 'pages/home/home.wxml'), 'utf8');
const homeStyles = fs.readFileSync(path.join(root, 'pages/home/home.wxss'), 'utf8');
const lifeSceneTemplate = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.wxml'), 'utf8');
const lifeSceneStyles = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.wxss'), 'utf8');
const lifeSceneLogic = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.js'), 'utf8');
const appLogic = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const accountLogic = fs.readFileSync(path.join(root, 'pages/account/account.js'), 'utf8');

assert.equal(componentTemplate.includes('{{petName}}') && componentTemplate.includes('今日心情') && componentTemplate.includes('{{mood.moodLabel}}') && componentTemplate.includes('{{mood.icon}}') && componentTemplate.includes('{{mood.text}}'), true, '组合 Tab 展开态必须呈现名字、正式心情、通用图标和一句话');
assert.equal(componentTemplate.indexOf('pet-mood-tab__name') < componentTemplate.indexOf('pet-mood-tab__mood-summary') && componentTemplate.indexOf('pet-mood-tab__mood-summary') < componentTemplate.indexOf('pet-mood-tab__sentence'), true, '组合 Tab 必须按名字、今日心情、完整句子排列');
assert.equal(componentTemplate.includes('今日心情：') && componentTemplate.includes('{{mood.moodLabel}}'), true, '收起态也必须完整显示“今日心情：正式名称”');
assert.equal(componentStyles.includes('overflow-wrap:anywhere') && !componentStyles.includes('-webkit-line-clamp'), true, '展开后必须完整展示一句话，不得行数截断');
assert.equal(componentStyles.includes('display:inline-flex') && componentStyles.includes('.pet-mood-tab--compact{width:218rpx}') && componentStyles.includes('.pet-mood-tab--expanded{width:380rpx') && componentStyles.includes('padding:8rpx 14rpx 9rpx'), true, '组合 Tab 必须使用紧凑收起宽度与明确展开宽度，保证宽度可连续过渡');
assert.equal(!componentTemplate.includes('pet-mood-tab__divider') && !componentStyles.includes('pet-mood-tab__divider') && componentStyles.includes('margin-top:10rpx'), true, '名字与今日心情之间必须保留留白，但不得绘制分隔线');
assert.equal(componentStyles.includes('.pet-mood-tab__name{display:block;max-width:100%') && componentStyles.includes('.pet-mood-tab__sentence{width:0;max-height:0') && componentStyles.includes('.pet-mood-tab--expanded .pet-mood-tab__sentence{width:auto;max-width:100%}') && componentStyles.includes('.pet-mood-tab__sentence--visible{max-height:96rpx'), true, '收起态隐藏句子不得撑宽 Tab，展开态必须完整呈现句子和 AI 生成标识');
assert.equal(componentStyles.includes('transition:width 420ms cubic-bezier(.16,1,.3,1)') && componentStyles.includes('transform:translate3d(0,-5rpx,0)') && componentTemplate.includes('contentVisible'), true, '点击展开必须分阶段执行宽度缓动与文案淡入上移');
assert.equal(componentStyles.includes('.pet-mood-tab__eyebrow{flex:none;color:#748078;font-size:20rpx;font-weight:600') && componentStyles.includes('.pet-mood-tab__mood-label{overflow:hidden;color:#31463A;font-size:22rpx;font-weight:600'), true, '“今日心情”与正式心情名称必须使用相同字重');
assert.equal(homeTemplate.includes('<pet-mood-tab') && lifeSceneTemplate.includes('<pet-mood-tab'), true, '破壳前后都必须使用同一名字与心情组合组件');
assert.equal(homeTemplate.includes('class="home-status-stack') && homeTemplate.indexOf('<pet-mood-tab') < homeTemplate.indexOf('class="room-clock'), true, '首页 Tab 与时钟必须位于同一纵向状态容器并保持顺序');
assert.equal(lifeSceneTemplate.includes('class="life-status-stack') && lifeSceneTemplate.indexOf('<pet-mood-tab') < lifeSceneTemplate.indexOf('class="room-clock'), true, '破壳后 Tab 与时钟也必须位于同一纵向状态容器并保持顺序');
assert.match(homeStyles, /\.home-status-stack \{[^}]*left: 24rpx;[^}]*align-items: flex-start;[^}]*max-width: calc\(100vw - 48rpx\)/, '破壳前名字卡与时钟必须共用 24rpx 左对齐线');
assert.match(homeStyles, /\.home-status-tab \{[^}]*margin-left: 0;/, '破壳前名字卡不得再单独向右偏移');
assert.match(lifeSceneStyles, /\.life-status-stack\{[^}]*left:24rpx;[^}]*align-items:flex-start/, '破壳后名字卡与时钟必须继续共用 24rpx 左对齐线');
assert.equal(homeTemplate.includes("homeStagePhase === 'visible' && !fullSceneImageLoading && !fullSceneImageFailed") && lifeSceneTemplate.includes('sceneEntered && initialViewportReady && sceneBackgroundReady && !error'), true, '9 秒展示必须等场景真正就绪后开始');
assert.equal(homeTemplate.includes('isDemo && pet && stage !== \'hatched\'') && lifeSceneTemplate.includes('class="mood-tester"'), true, '八种心情切换器必须限制在开发态');
assert.equal(homeTemplate.includes('acceptanceToolsOpen') && homeTemplate.includes('onAcceptanceToolsToggle'), true, '首页开发态验收器必须默认收进单一入口');
assert.equal(lifeSceneTemplate.includes('isDemo && acceptanceToolsOpen && currentState') && lifeSceneTemplate.includes('onAcceptanceToolsToggle'), true, '破壳后开发态验收器也必须默认收进单一入口');
assert.equal(appLogic.includes('dailyMoodIntroShown: false') && accountLogic.includes('dailyMoodIntroShown = false'), true, '每次新登录会话必须重新获得一次 9 秒心情展示');
assert.equal(lifeSceneTemplate.includes('wx:if="{{currentState && currentState.atHome}}" class="scene-context-entry"') && !lifeSceneTemplate.includes('class="away-status-'), true, '外出时左下角必须留空，不显示状态按钮');
assert.equal(/currentState\.(?:majorLabel|label|line)/.test(lifeSceneTemplate), false, '外出界面不得泄露地点、活动或去向');
assert.equal(lifeSceneLogic.includes('const shouldShowStatusBubble = currentState.atHome'), true, '不在场角色不得显示动作或活动对白');
assert.equal(lifeSceneLogic.includes('if (!current.atHome)') && lifeSceneLogic.includes('蛋宝宝正在外出，稍后再来看看吧。'), true, '外出提示必须保持通用且不能触发对话');

let componentDefinition = null;
const originalComponent = global.Component;
const originalGetApp = global.getApp;
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const app = { globalData: { dailyMoodIntroShown: false } };
let scheduledTimer = null;
global.Component = definition => { componentDefinition = definition; };
global.getApp = () => app;
global.setTimeout = (callback, delay) => {
  scheduledTimer = { callback, delay };
  return 1;
};
global.clearTimeout = () => { scheduledTimer = null; };

delete require.cache[require.resolve('../../components/pet-mood-tab/pet-mood-tab')];
const petMoodTab = require('../../components/pet-mood-tab/pet-mood-tab');
assert.equal(petMoodTab.INTRO_DURATION_MS, 9000, '完整心情必须展示 9 秒');
assert.equal(petMoodTab.CONTENT_REVEAL_DELAY_MS, 90, '文案必须在卡片开始展开后再显示');
assert.equal(petMoodTab.COLLAPSE_WIDTH_DELAY_MS, 160, '收起时必须先隐藏文案，再缩窄卡片');

const context = {
  properties: {
    petName: '十一',
    mood: dailyMood.mockDailyMood('pre-hatch', 'CURIOSITY'),
    introReady: false,
    reducedMotion: false,
    nameInteractive: true
  },
  data: Object.assign({}, componentDefinition.data),
  setData(patch) { Object.assign(this.data, patch); },
  triggerEvent(name) { this.lastEvent = name; }
};
Object.assign(context, componentDefinition.methods);
componentDefinition.lifetimes.attached.call(context);
assert.equal(context.data.expanded, false, '场景未就绪时必须保持紧凑态');
context.properties.introReady = true;
componentDefinition.observers.introReady.call(context, true);
assert.equal(context.data.expanded, true, '场景就绪后必须展开完整心情');
assert.equal(app.globalData.dailyMoodIntroShown, true, '自动展示必须立即标记为本会话已展示');
assert.equal(scheduledTimer && scheduledTimer.delay, 9000, '自动收起计时必须固定为 9000ms');
scheduledTimer.callback();
assert.equal(context.data.contentVisible, false, '9 秒结束后必须先隐藏完整心情');
assert.equal(scheduledTimer && scheduledTimer.delay, 160, '自动收起必须等待文案退场后再缩窄卡片');
scheduledTimer.callback();
assert.equal(context.data.expanded, false, '文案退场后必须自动缩回紧凑态');
componentDefinition.methods.onToggle.call(context);
assert.equal(context.data.expanded, true, '点击紧凑态必须允许重新查看完整心情');
componentDefinition.pageLifetimes.hide.call(context);
assert.equal(context.data.expanded, false, '页面进入后台必须立即收起并清理计时器');
componentDefinition.methods.onNameTap.call(context);
assert.equal(context.lastEvent, 'nametap', '破壳前名字点击必须继续打开改名入口');
componentDefinition.lifetimes.detached.call(context);

const secondContext = {
  properties: Object.assign({}, context.properties, { introReady: true }),
  data: Object.assign({}, componentDefinition.data),
  setData(patch) { Object.assign(this.data, patch); },
  triggerEvent() {}
};
Object.assign(secondContext, componentDefinition.methods);
componentDefinition.lifetimes.attached.call(secondContext);
assert.equal(secondContext.data.expanded, false, '同一登录会话再次进入页面不得重复自动展开');
componentDefinition.lifetimes.detached.call(secondContext);

if (originalComponent === undefined) delete global.Component;
else global.Component = originalComponent;
if (originalGetApp === undefined) delete global.getApp;
else global.getApp = originalGetApp;
global.setTimeout = originalSetTimeout;
global.clearTimeout = originalClearTimeout;

console.log('每日心情八态、破壳前后组件与外出隐私口径校验通过。');
