const assert = require('assert');

let requestCount = 0;
let subscriptionCount = 0;
const storage = new Map();
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
  request(options) {
    requestCount += 1;
    options.success({ data: { ok: true, mode: 'live', serverTs: Date.now() } });
  },
  requestSubscribeMessage(options) {
    subscriptionCount += 1;
    options.success(Object.fromEntries(options.tmplIds.map(id => [id, 'accept'])));
  }
};

const config = require('../../config/v2');
config.backendEnabled = true;
config.apiBase = 'https://api.example.com';
config.subscriptionTemplateIds = { hatchDay: 'demo-must-not-request-1', hatchSoon: 'demo-must-not-request-2' };

const runtime = require('../runtime-context');
const cloudApi = require('../cloud-api');
const timeService = require('../time-service');
const subscriptions = require('../subscription-messages');

(async () => {
  assert.equal(runtime.getMode(), 'demo', '测试前提必须处于 develop/demo');
  const bootstrap = await cloudApi.bootstrap('wx-login-code');
  const time = await timeService.sync();
  const subscription = await subscriptions.requestHatchReminders();

  assert.equal(bootstrap.code, 'LIVE_MODE_REQUIRED', 'demo 不得调用 live 登录接口');
  assert.equal(time.code, 'LIVE_MODE_REQUIRED', 'demo 不得调用 live 时间接口');
  assert.equal(subscription.code, 'LIVE_MODE_REQUIRED', 'demo 不得请求正式订阅消息');
  assert.equal(requestCount, 0, 'demo 不得发出任何 live wx.request');
  assert.equal(subscriptionCount, 0, 'demo 不得弹出正式订阅授权');
  console.log('开发版正式网络与订阅隔离校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
