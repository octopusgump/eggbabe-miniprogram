const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pendingTimers = [];
const routes = [];
let emittedJourney = null;
let journeyListener = null;
let pageDefinition = null;

const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
global.setTimeout = callback => {
  pendingTimers.push(callback);
  return pendingTimers.length;
};
global.clearTimeout = timer => {
  if (timer > 0 && timer <= pendingTimers.length) pendingTimers[timer - 1] = null;
};
global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getWindowInfo() { return { statusBarHeight: 24, windowWidth: 390, windowHeight: 844 }; },
  getSystemSetting() { return { reducedMotion: true }; },
  navigateBack() { routes.push('BACK'); },
  navigateTo(options) {
    routes.push(options.url);
    options.success({
      eventChannel: {
        emit(name, payload) {
          assert.equal(name, 'journey');
          emittedJourney = payload;
        }
      }
    });
  }
};
global.Page = definition => {
  pageDefinition = definition;
};

function contextFor(definition, data) {
  return Object.assign({}, definition, {
    data: Object.assign({}, definition.data, data || {}),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    },
    getOpenerEventChannel() {
      return {
        on(name, listener) {
          assert.equal(name, 'journey');
          journeyListener = listener;
        }
      };
    }
  });
}

function slide(id, overrides) {
  return Object.assign({
    id,
    sceneLabel: '东京 · 咖啡巷',
    actionLabel: '晨光里的伸展',
    line: '我在晨光里伸了个懒腰。',
    asset: `/assets/${id}.webp`
  }, overrides || {});
}

delete require.cache[require.resolve('../../pages/journey-scene/journey-scene')];
const journeyModule = require('../../pages/journey-scene/journey-scene');
const journeyPage = pageDefinition;
const journeyRoot = path.resolve(__dirname, '../../pages/journey-scene');
const journeyTemplate = fs.readFileSync(`${journeyRoot}/journey-scene.wxml`, 'utf8');
const journeyStyles = fs.readFileSync(`${journeyRoot}/journey-scene.wxss`, 'utf8');

assert.equal(journeyTemplate.includes('class="journey-scene__image"') && journeyTemplate.includes('mode="aspectFit"'), true, '横竖屏都必须以完整等比模式显示旅途横图');
assert.equal(journeyTemplate.includes('duration="{{reducedMotion ? 0 : 300}}"'), true, '减少动态效果时必须取消 swiper 过渡时长');
assert.equal(journeyStyles.includes('env(safe-area-inset-left)') && journeyStyles.includes('env(safe-area-inset-right)'), true, '横屏回放必须避开左右安全区');
assert.equal(journeyStyles.includes('width:100vw;height:100vh'), true, '回放画布必须随横竖屏视口变化');

assert.equal(journeyModule.requestedSlideIndex('3'), 3, '路由整数索引必须保留');
assert.equal(journeyModule.requestedSlideIndex('1.5'), 0, '非整数路由索引必须安全回退到首张');
assert.equal(journeyModule.requestedSlideIndex('-1'), 0, '负数路由索引必须安全回退到首张');
assert.equal(journeyModule.decodedQueryValue('tokyo%2F2026%2008'), 'tokyo/2026 08', '编码 journey_id 必须可安全还原');
assert.equal(journeyModule.decodedQueryValue('%E0%A4%A'), '%E0%A4%A', '损坏的百分号编码不得令页面抛错');

const normalized = journeyModule.normalizeJourney({ slides: [slide('one')] });
assert.equal(normalized.invalidSlides, false, '完整旅程画面必须通过数据归一化');
assert.notEqual(normalized.slides[0], journeyModule.normalizeJourney({ slides: [slide('one')] }).slides[0], '归一化不得复用输入画面对象');
assert.equal(journeyModule.normalizeJourney({ slides: [slide('one'), slide('broken', { asset: '' })] }).invalidSlides, true, '缺图画面不得被静默过滤并造成索引错位');
assert.equal(journeyModule.normalizeJourney({ slides: [slide('same'), slide('same')] }).invalidSlides, true, '重复画面 ID 必须视为错误数据');

const waitingContext = contextFor(journeyPage);
journeyPage.onLoad.call(waitingContext, { journey_id: 'tokyo%2Ftrip', index: '1' });
assert.equal(waitingContext.data.loading, true, '等待事件数据时必须保持加载状态');
assert.equal(waitingContext.data.reducedMotion, true, '系统减少动态效果设置必须传入页面');
assert.equal(typeof journeyListener, 'function', '回放页必须监听 opener eventChannel');
pendingTimers[0]();
assert.equal(waitingContext.data.error, '没有收到可回放的旅程内容', '事件数据超时必须进入明确错误状态');

const readyContext = contextFor(journeyPage);
journeyPage.onLoad.call(readyContext, { journey_id: 'tokyo%2Ftrip', index: '1' });
journeyListener({ journeyId: 'tokyo/trip', title: '东京之旅', slides: [slide('first'), slide('second')] });
assert.equal(readyContext.data.ready, true, '匹配的旅程数据必须进入回放状态');
assert.equal(readyContext.data.current, 1, '回放必须从用户点击的明信片索引开始');
const stateBeforeSlide = JSON.stringify({ slides: readyContext.data.slides, title: readyContext.data.title });
journeyPage.onSlideChange.call(readyContext, { detail: { current: 0 } });
assert.equal(readyContext.data.current, 0, '横向滑动必须只更新当前本地索引');
assert.equal(JSON.stringify({ slides: readyContext.data.slides, title: readyContext.data.title }), stateBeforeSlide, '横向滑动不得改写旅程内容或其他状态');

const mismatchContext = contextFor(journeyPage);
mismatchContext.requestedJourneyId = 'expected';
mismatchContext.decodedRequestedJourneyId = 'expected';
mismatchContext.requestedIndex = 0;
mismatchContext.failedSlideIndexes = new Set();
journeyPage.applyJourney.call(mismatchContext, { journeyId: 'other', slides: [slide('one')] });
assert.equal(mismatchContext.data.error, '这次旅程的数据没有对上', 'journey_id 不匹配必须进入安全状态');

const invalidContext = contextFor(journeyPage);
invalidContext.requestedJourneyId = 'expected';
invalidContext.decodedRequestedJourneyId = 'expected';
invalidContext.requestedIndex = 1;
invalidContext.failedSlideIndexes = new Set();
journeyPage.applyJourney.call(invalidContext, { journeyId: 'expected', slides: [slide('one'), slide('broken', { line: '' })] });
assert.equal(invalidContext.data.error, '这次旅程的数据不完整', '部分错误画面不得静默改变用户点击索引');

readyContext.failedSlideIndexes = new Set();
journeyPage.onImageError.call(readyContext, { currentTarget: { dataset: { index: 0 } } });
assert.equal(readyContext.data.error, '这张旅途画面没有加载好', '当前图片失败必须显示可返回错误状态');
journeyPage.onBack.call(readyContext);
assert.equal(routes.pop(), 'BACK', '错误状态与正常状态都必须可返回明信片');

let lifeScenesPage = null;
global.Page = definition => {
  lifeScenesPage = definition;
};
delete require.cache[require.resolve('../../pages/life-scenes/life-scenes')];
require('../../pages/life-scenes/life-scenes');
const entrySlides = [slide('first'), slide('second')];
const entryContext = contextFor(lifeScenesPage, {
  selectedPostcard: { id: 'journey-entry', journeyId: 'tokyo/trip', destinationId: 'tokyo', sceneLabel: '东京之旅' },
  selectedPostcardSlides: entrySlides,
  selectedPostcardIndex: 1
});
const entrySnapshot = JSON.stringify(entryContext.data);
lifeScenesPage.onOpenJourneyScene.call(entryContext, { currentTarget: { dataset: { index: 1 } } });
assert.equal(routes.pop(), '/pages/journey-scene/journey-scene?journey_id=tokyo%2Ftrip&index=1', '入口必须传递编码 journey_id 与刚点击的当前索引');
assert.equal(entryContext.returnPostcardIndex, 1, '进入回放前必须记录明信片返回位置');
assert.equal(emittedJourney.slides, entrySlides, '入口必须通过事件通道传递同次旅程画面');
assert.equal(JSON.stringify(entryContext.data), entrySnapshot, '打开历史回放不得改写明信片页业务数据');

const restoreContext = contextFor(lifeScenesPage, {
  isDemo: false,
  pet: { name: '小月' },
  selectedPostcardIndex: 0
});
restoreContext.loadedMemories = {
  keepsakes: [],
  postcards: [{
    id: 'journey-entry',
    journeyId: 'tokyo/trip',
    sceneLabel: '东京之旅',
    postcards: entrySlides
  }],
  cardRecommendation: null
};
restoreContext.postcardIdToRead = 'journey-entry';
restoreContext.returnPostcardIndex = 1;
restoreContext.markTargetPostcardRead = () => {};
lifeScenesPage.applyMemories.call(restoreContext);
assert.equal(restoreContext.data.selectedPostcardIndex, 1, '从回放返回后必须恢复进入前的明信片位置');

global.setTimeout = originalSetTimeout;
global.clearTimeout = originalClearTimeout;
console.log('旅途回放入口、索引、只读状态、事件等待与错误恢复校验通过。');
