const assert = require('assert');

const storage = new Map();
const routes = [];
const toasts = [];
const originalSetTimeout = global.setTimeout;
global.setTimeout = callback => {
  callback();
  return 1;
};
global.wx = {
  getAccountInfoSync() {
    return { miniProgram: { envVersion: 'develop' } };
  },
  getStorageSync(key) {
    return storage.get(key);
  },
  setStorageSync(key, value) {
    storage.set(key, value);
  },
  removeStorageSync(key) {
    storage.delete(key);
  },
  showToast(options) {
    toasts.push(options.title);
  },
  switchTab(options) {
    routes.push(options.url);
  },
  redirectTo(options) {
    routes.push(options.url);
  },
  navigateTo(options) {
    routes.push(options.url);
  },
  navigateBack() {
    routes.push('BACK');
  },
  getWindowInfo() {
    return { statusBarHeight: 20 };
  }
};

const developConfig = require('../../config/v2');
developConfig.backendEnabled = true;
developConfig.apiBase = 'https://api.example.com';

function loadPage(relativePath) {
  let definition;
  global.Page = page => {
    definition = page;
  };
  delete require.cache[require.resolve(relativePath)];
  require(relativePath);
  return definition;
}

function contextFor(page, data) {
  return Object.assign({}, page, {
    data: Object.assign({}, page.data || {}, data || {}),
    setData(patch) {
      Object.assign(this.data, patch);
    }
  });
}

const welcome = loadPage('../../pages/welcome/welcome');
const welcomeContext = contextFor(welcome, { agreed: true });
welcome.onAuthorize.call(welcomeContext);
assert.equal(routes.pop(), '/pages/home/home', '开发版授权后必须进入首页');

const addDevice = loadPage('../../pages/add-device/add-device');
const addContext = contextFor(addDevice, { code: 'DEMO-YT-001', canSubmit: true });
addDevice.onValidate.call(addContext);
assert.equal(addContext.data.success.prototype, '玉兔', '开发版绑定页必须显示固定 demo 原型');
assert.equal(routes.pop(), '/pages/home/home', '开发版绑定成功后必须返回首页');

const home = loadPage('../../pages/home/home');
const homeContext = contextFor(home, { pet: require('../../utils/pet-store').getPet(), stage: 'waiting', tapParticles: [] });
homeContext.spawnTapParticles = () => Promise.resolve({ x: 0, y: 0 });
homeContext.runSceneEffect = (sceneEffect, eggMotion) => homeContext.setData({ sceneEffect, eggMotion });
homeContext.showFeedback = feedback => homeContext.setData({ feedback });
home.onEggTap.call(homeContext, { detail: {} });
assert.equal(homeContext.data.eggMotion, 'egg--wobble', '开发版孵化期轻触必须触发原有蛋体反馈');
assert.equal(Boolean(homeContext.data.feedback), true, '开发版孵化期轻触必须显示情绪回应');
let homeRefreshCount = 0;
homeContext.onShow = () => {
  homeRefreshCount += 1;
};
home.onDemoAdvance.call(homeContext);
assert.equal(homeRefreshCount, 1, '首页开发验收控制必须刷新到待破壳状态');
assert.equal(require('../../utils/pet-store').getStage(require('../../utils/pet-store').getPet()), 'ready', '首页开发验收控制必须进入真实破壳阶段');

const hatch = loadPage('../../pages/hatch/hatch');
const hatchContext = contextFor(hatch);
hatch.onLoad.call(hatchContext);
hatch.onReveal.call(hatchContext);
assert.equal(routes.pop(), '/pages/collection-card/collection-card?new=1', '开发版破壳后必须进入收藏卡');

const collectionCard = loadPage('../../pages/collection-card/collection-card');
const cardContext = contextFor(collectionCard);
collectionCard.onLoad.call(cardContext, { native: '1', new: '1' });
assert.equal(cardContext.data.cardView.mode, 'demo', '开发版收藏卡页面必须渲染隔离 demo 数据');
assert.equal(cardContext.data.cardView.illustration_url.startsWith('/assets/'), true, '开发版收藏卡页面必须使用包内素材');

const lifeScene = loadPage('../../pages/life-scene/life-scene');
const lifeContext = contextFor(lifeScene);
lifeScene.onLoad.call(lifeContext, { scene: 'grass', entry: 'demo-test' });
assert.equal(lifeContext.data.hotspots.length, 3, '开发版破壳后必须加载真实生活场景互动点');
let sceneReaction = '';
lifeContext.showReaction = line => {
  sceneReaction = line;
};
lifeContext.showFlowerSway = () => {};
lifeContext.showButterflyFlight = () => {};
lifeContext.showSceneEffect = () => {};
lifeScene.onTapHotspot.call(lifeContext, { currentTarget: { dataset: { index: 0 } } });
assert.equal(Boolean(sceneReaction), true, '开发版生活场景互动点必须产生内容反馈');

const chat = loadPage('../../pages/chat/chat');
const chatContext = contextFor(chat);
chat.onLoad.call(chatContext);
chatContext.setData({ draft: '今天陪我待一会儿' });
chat.onSend.call(chatContext);
const lastMessage = chatContext.data.messages[chatContext.data.messages.length - 1];
assert.equal(lastMessage.from, 'egg', '开发版对话必须返回蛋宝宝回应');
assert.equal(lastMessage.mode, 'demo', '开发版对话不得伪装成 live');
assert.equal(toasts.includes('账号服务尚未接入，请稍后再试'), false, '开发版流程不得显示正式服务器未接入提示');

global.setTimeout = originalSetTimeout;
console.log('开发版授权、绑定与破壳页面链路校验通过。');
