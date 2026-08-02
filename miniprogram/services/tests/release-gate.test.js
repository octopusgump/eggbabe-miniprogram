const assert = require('assert');
const fs = require('fs');
const path = require('path');

const storage = new Map();
let toast = '';
let route = '';
global.wx = {
  getAccountInfoSync() {
    return { miniProgram: { envVersion: 'release' } };
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
    toast = options.title;
  },
  switchTab(options) {
    route = options.url;
  }
};
global.Page = page => {
  global.page = page;
};

require('../../pages/welcome/welcome');
const context = {
  data: { agreed: true, authorizing: false },
  setData(patch) {
    Object.assign(this.data, patch);
  }
};
global.page.onAuthorize.call(context);

assert.equal(require('../../config/v2').localDemoEnabled, false, '正式版不得启用本地 demo');
assert.equal(require('../runtime-context').getMode(), 'live', '正式版必须保持 live');
assert.equal(toast, '账号服务尚未接入，请稍后再试', '正式后端未配置时必须继续阻断假成功');
assert.equal(route, '', '正式后端未配置时不得进入首页');
assert.equal(Array.from(storage.keys()).some(key => key.includes('eggbabe_demo_')), false, '正式版不得写入 demo 命名空间');

const homeTemplate = fs.readFileSync(path.join(__dirname, '../../pages/home/home.wxml'), 'utf8');
const homeSource = fs.readFileSync(path.join(__dirname, '../../pages/home/home.js'), 'utf8');
assert.equal(homeTemplate.includes('wx:if="{{isDemo && pet}}" class="stage-tester"'), true, '测试阶段控件必须由开发版开关保护');
assert.equal(homeSource.includes('isDemo: config.localDemoEnabled'), true, '测试阶段控件不得使用可被普通用户修改的本地开关');

console.log('正式版后端门禁校验通过。');
