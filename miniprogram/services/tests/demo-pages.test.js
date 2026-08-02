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
assert.equal(typeof home.onDemoAdvance, 'undefined', '首页不得暴露直接进入破壳的验收控制');

const demoExperience = require('../../services/demo-experience');
assert.equal(demoExperience.advanceToHatchable().ok, true, '测试夹具应能准备隔离破壳状态');
assert.equal(demoExperience.generateHatchCard().ok, true, '测试夹具应能生成隔离收藏卡');
const collectionCard = loadPage('../../pages/collection-card/collection-card');
const cardContext = contextFor(collectionCard);
collectionCard.onLoad.call(cardContext, { native: '1', new: '1' });
assert.equal(cardContext.data.cardView.mode, 'demo', '开发版收藏卡页面必须渲染隔离 demo 数据');
assert.equal(cardContext.data.cardView.illustration_url.startsWith('/assets/'), true, '开发版收藏卡页面必须使用包内素材');

(async () => {
  const petStore = require('../../utils/pet-store');
  const postHatch = require('../../services/post-hatch-companion');
  const lifeScenes = require('../../utils/life-scenes');
  const pet = petStore.getPet();
  const snapshot = await postHatch.getSnapshot(pet);
  assert.equal(snapshot.ok, true, '开发版破壳后必须加载隔离的 5 小时状态快照');
  assert.equal(['home', 'travel', 'work', 'school'].includes(snapshot.currentState.major), true, '当前状态必须属于四个 PRD 大场景之一');
  assert.equal(snapshot.currentState.atHome ? Boolean(snapshot.currentState.action) : snapshot.currentState.action.kind === 'letter', true, '每个小状态只能暴露一个原生动作或写信入口');
  assert.equal(lifeScenes.HOME_STATES.length, 7, '开发版必须包含七个居家小状态');

  const talk = await postHatch.sendSceneMessage(pet, {
    mood: snapshot.mood,
    currentState: Object.assign({}, lifeScenes.HOME_STATES.find(item => item.canTalk), { atHome: true, canTalk: true })
  }, '今天陪我待一会儿');
  assert.equal(talk.ok, true, '允许说话的小状态必须在场景内返回审核过的回应');
  assert.equal(talk.safety, 'approved-fallback', '开发版场景内对话不得伪装成 live');
  assert.equal(JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../app.json'), 'utf8')).pages.includes('pages/chat/chat'), false, '开发版不得注册独立聊天页');
  assert.equal(toasts.includes('账号服务尚未接入，请稍后再试'), false, '开发版流程不得显示正式服务器未接入提示');

  global.setTimeout = originalSetTimeout;
  console.log('开发版授权、绑定与破壳后陪伴链路校验通过。');
})().catch(error => {
  global.setTimeout = originalSetTimeout;
  console.error(error);
  process.exit(1);
});
