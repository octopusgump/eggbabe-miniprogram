const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const app = JSON.parse(read('miniprogram/app.json'));

const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const config = require('../miniprogram/config/v2');
const runtime = require('../miniprogram/services/runtime-context');
const petStore = require('../miniprogram/utils/pet-store');
const analytics = require('../miniprogram/services/analytics');
const h5Bridge = require('../miniprogram/services/birth-card-h5');

assert.equal(config.version, '3.5.0-ordinary', '前端版本必须对齐 V3.5 普通版');
assert.equal(config.buildTarget, 'ordinary-live', '生产构建必须明确为普通版 live');
assert.equal(runtime.getMode(), 'live', '普通版运行时只能使用 live');
assert.equal(runtime.setMode('demo').ok, false, '普通版不得切换到 demo');

assert.equal(app.pages.includes('pages/shop/shop'), false, '普通版不得注册商店');
assert.equal(app.pages.includes('pages/bag/bag'), false, '普通版不得注册背包');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/pages/shop/shop.js')), false, '普通版源码不得保留商店页面');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/pages/bag/bag.js')), false, '普通版源码不得保留背包页面');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/services/currency-store.js')), false, '普通版源码不得保留货币服务');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/services/scene-card-store.js')), false, '普通版源码不得保留场景产卡服务');

const homeTemplate = read('miniprogram/pages/home/home.wxml');
const homeLogic = read('miniprogram/pages/home/home.js');
const homeStyles = read('miniprogram/pages/home/home.wxss');
assert.equal(/露珠|余额|孵化进度|conic-gradient|商店|背包/.test(homeTemplate), false, '首页不得显示虚拟资源、百分比或停用入口');
assert.equal(homeTemplate.includes('id="windowFogCanvas"') && homeLogic.includes('onWindowTouchStart') && homeLogic.includes('onWindowTouchMove'), true, '窗户必须保留直接擦拭互动');
assert.equal(homeTemplate.includes('room-lamp-hotspot') && homeLogic.includes('onLampTap'), true, '台灯必须融入房间画面并可直接开关');
assert.equal(homeTemplate.includes('room-clock') && homeLogic.includes('onClockTap'), true, '孵化房间左上角必须保留可交互设备时钟');
assert.equal(homeLogic.includes("require('../../services/device-clock')") && homeLogic.includes('millisecondsUntilNextSecond'), true, '设备时钟必须按手机本地时间整秒校准');
assert.equal(/longpress|longtap|12\/24|十二小时|二十四小时/.test(`${homeTemplate}\n${homeLogic}`), false, '设备时钟不得加入长按或 12/24 小时设置');
assert.equal(homeLogic.includes("key: 'draw'") && homeLogic.includes("route: '/pages/doodle/doodle'"), true, '画画必须与许愿池、早教班同列');
assert.equal(homeLogic.includes("analytics.track('room_element_interaction'"), true, '房间小物必须只发送白名单可用性事件');
assert.equal(/coffee|scarf|room-element-layer|roomSound/.test(`${homeTemplate}\n${homeLogic}\n${homeStyles}`), false, '咖啡机、围巾及旧物件按钮层必须完全移除');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/services/room-sound.js')), false, '咖啡机声音服务必须移除');
const incubationEnvironment = read('miniprogram/services/incubation-environment.js');
assert.equal(incubationEnvironment.includes('shanghaiSolarTimes') && incubationEnvironment.includes('seasonFromIncubationDay'), true, '昼夜与四季必须按上海太阳时间和孵化天数计算');
assert.equal(/tapEggCurrency|currencyAccount|requestDewForTap/.test(homeLogic), false, '轻触蛋体不得请求虚拟资源');
assert.equal(homeTemplate.includes('egg_base_day.webp') || homeLogic.includes('shellArtService.drawEggBase'), true, '必须保留真实蛋体渲染');

const lifeScene = read('miniprogram/pages/life-scene/life-scene.js');
const lifeSceneTemplate = read('miniprogram/pages/life-scene/life-scene.wxml');
assert.equal(/scene-card|attemptDrop|cardDrop|collectorLabel|drop-mask/.test(`${lifeScene}\n${lifeSceneTemplate}`), false, '生活场景只能返回内容反馈');

const album = read('miniprogram/pages/album/album.wxml');
assert.equal(album.includes('title="我的收藏卡"'), true, '收藏页标题必须为“我的收藏卡”');
assert.equal(/收集系列|空卡位|尚未遇见|\/ 10|集齐/.test(album), false, '单蛋收藏页不得显示系列进度或空卡位');
assert.equal(album.includes('一蛋一份'), true, '收藏页必须表达一蛋一份');

const cloudApi = read('miniprogram/services/cloud-api.js');
assert.equal(/currency|inventory|shop|sceneCardDrop|updateSceneCard/i.test(cloudApi), false, 'live 服务适配层不得暴露停用接口');
assert.equal(cloudApi.includes('recordCompanionInteraction'), true, '服务层必须预留自由互动接口');
assert.equal(cloudApi.includes('recordRoomElementInteraction'), true, '服务层必须预留房间小物接口');
assert.equal(cloudApi.includes('chatReply'), true, '服务层必须预留正式对话回复接口');
assert.equal(cloudApi.includes('saveEggCreation'), true, '服务层必须预留蛋壳创作写入接口');
assert.equal(cloudApi.includes("mode: 'live'") && cloudApi.includes('request_id'), true, '正式请求必须带 live 与唯一请求 ID');
assert.equal(read('miniprogram/services/chat-service.js').includes("result.mode !== 'live'"), true, '对话适配层必须拒绝非 live 回复');

const forbiddenEvents = Array.from(analytics.EVENT_ALLOWLIST).filter(name => /(?:^|_)(?:currency|reward|drop|inventory|shop|quest|streak|growth|relationship)(?:_|$)/i.test(name));
assert.deepEqual(forbiddenEvents, [], '埋点白名单不得包含游戏经济或成长事件');
assert.equal(analytics.EVENT_ALLOWLIST.has('room_element_interaction'), true, '房间互动事件必须在白名单');
assert.equal(analytics.EVENT_ALLOWLIST.has('companion_interaction'), true, '自由互动事件必须在白名单');

petStore.saveUser({ id: 'user-live-1', publicId: 'EB-LIVE-1', nickname: '微信用户' });
const imported = petStore.importCloudPet({
  egg_id: 'egg-live-1',
  user_id: 'user-live-1',
  mode: 'live',
  prototype: '玉兔',
  lifecycle_stage: 'RESTING',
  shell: {}
}, 'live');
assert.equal(imported.ok, true, '必须可以导入服务端 live 实体蛋');
assert.equal(petStore.importCloudPet({ egg_id: 'legacy-egg' }, 'live').ok, false, '不得把缺少 mode 的旧记录包装成 live');
assert.equal(petStore.getStage(imported.pet), 'waiting', 'RESTING 必须映射为等待破壳');
petStore.saveUser({ id: 'user-live-2', publicId: 'EB-LIVE-2' });
assert.equal(petStore.getPet(), null, '切换账号时不得读取上一账号的实体蛋缓存');
petStore.saveUser({ id: 'user-live-1', publicId: 'EB-LIVE-1' });
assert.equal(petStore.completeWish('希望今天慢一点').added, 0, '自由互动不得产生累计值');
const storedPet = petStore.getPet();
assert.equal('progress' in storedPet, false, 'live 实体蛋不得保存孵化百分比');
assert.equal('tasks' in storedPet, false, 'live 实体蛋不得保存任务记录');
assert.equal('preferences' in storedPet, false, 'live 实体蛋不得保存互动偏好画像');

const card = {
  card_id: 'card-live-1',
  egg_id: 'egg-live-1',
  mode: 'live',
  prototype: 'YT',
  style: '月白桂花款',
  display_name: '我的蛋宝宝',
  hatched_at: '2026-07-24T02:00:00.000Z',
  identity_code: 'EGG-YT-20260724-000001',
  source_batch: 'BATCH-01',
  illustration_key: 'YT__moon_white',
  illustration_url: 'https://cdn.eggbabe.com/cards/yt-moon-white.webp'
};
assert.equal(petStore.applyCloudHatchCard(card).ok, true, '收藏卡必须消费服务端已确定结果');
assert.equal(petStore.applyCloudHatchCard(Object.assign({}, card, { mode: undefined })).ok, false, '不得把缺少 mode 的卡包装成 live');
const h5Data = h5Bridge.toH5Card(petStore.getPet());
assert.equal(h5Data.identity_code, card.identity_code, 'H5 桥接必须传递身份编号');
assert.equal(h5Data.display_name, '我的蛋宝宝', '未命名回退必须固定');
assert.equal(h5Bridge.buildH5Url('https://eggbabe.com/card', h5Data, 'https://api.eggbabe.com').includes('card_data='), false, 'live H5 不得注入客户端业务结果');
petStore.clearUser();
assert.equal(petStore.getPet(), null, '退出登录必须清除本机实体蛋缓存');

[
  'build-environment.test.js',
  'demo-experience.test.js',
  'demo-network-isolation.test.js',
  'demo-pages.test.js',
  'device-clock.test.js',
  'incubation-environment.test.js',
  'release-gate.test.js'
].forEach(test => {
  execFileSync(process.execPath, [path.join(root, 'miniprogram/services/tests', test)], { stdio: 'pipe' });
});

console.log('V3.5 普通小程序核心合规回归通过。');
