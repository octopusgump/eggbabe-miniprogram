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
const postHatchAssetsSource = fs.readFileSync(path.join(__dirname, '../../config/post-hatch-assets.js'), 'utf8');
assert.equal(homeTemplate.includes('wx:if="{{!doodleEditorVisible && isDemo && pet && stage !== \'hatched\'}}" class="stage-tester '), true, '测试阶段控件必须由开发版开关保护，不得出现在画画或破壳后跳转层');
assert.equal(homeSource.includes('isDemo: config.localDemoEnabled'), true, '测试阶段控件不得使用可被普通用户修改的本地开关');
assert.equal(postHatchAssetsSource.includes('_candidates'), false, '正式破壳后素材配置不得引用开发验收候选图');
assert.deepEqual(require('../../config/post-hatch-assets').POST_HATCH.postcards, {}, '候选东京明信片未终审前不得进入正式运行时配置');
// design.md §4.2：ta 外出时只显示空着的家与第一人称去向文字，不把目的地图片放进实时
// 生活空间。目的地「魔法窗」的全屏视图代码仍在包内，这里锁住开关，避免被误打开。
assert.equal(require('../../config/post-hatch-assets').POST_HATCH.magicWindow.enabled, false, '目的地魔法窗开启前必须重新走一次设计评审，正式包内不得默认打开');
assert.equal(
  Object.values(require('../../config/post-hatch-assets').POST_HATCH.magicWindow.destinations).every(value => !value),
  true,
  '正式运行时不得登记任何目的地窗景素材'
);

console.log('正式版后端门禁校验通过。');
