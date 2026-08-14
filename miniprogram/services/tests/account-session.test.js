const assert = require('assert');

const storage = new Map();
let reLaunchUrl = '';
let modalCount = 0;
const toasts = [];

global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); },
  showModal(options) {
    modalCount += 1;
    options.success({ confirm: true });
    if (options.complete) options.complete();
  },
  showToast(options) { toasts.push(options.title); },
  reLaunch(options) { reLaunchUrl = options.url; }
};

const runtime = require('../runtime-context');
const petStore = require('../../utils/pet-store');
const storageMigration = require('../storage-migration');
const accountSession = require('../account-session');

runtime.setMode('demo');
const previousSessionId = 'session-old-account';
accountSession.ACCOUNT_SCOPED_KEYS.forEach(key => {
  storageMigration.set(runtime.scopedKey(key), { accountData: true });
});
runtime.setSessionId(previousSessionId);
petStore.saveUser({ id: 'user-old', publicId: 'OLD-USER', nickname: '旧用户' });
petStore.savePet({ id: 'egg-old', ownerId: 'user-old', mode: 'demo', messages: [{ text: '旧账号对话' }] });
storageMigration.set('eggbabe_deregister_request_v1_user-old', { mode: 'live', endAt: Date.now() });

// 设备级体验偏好不属于账号数据，退出时必须保留。
storageMigration.set('eggbabe_profile_icon_hint_seen_v1', true);
storageMigration.set('eggbabe_doodle_color_hint_seen_v1', true);
storageMigration.set('eggbabe_scene_preview', 'summer-clear-day');

let accountPage;
global.Page = definition => { accountPage = definition; };
require('../../pages/account/account');
const context = Object.assign({}, accountPage, {
  data: Object.assign({}, accountPage.data),
  setData(patch) { Object.assign(this.data, patch); }
});

accountPage.onLogout.call(context);

assert.equal(modalCount, 1, '退出登录只能显示一个确认弹窗');
assert.equal(reLaunchUrl, '/pages/welcome/welcome', '清理成功后必须回到欢迎页');
assert.equal(context.data.clearingLocalState, true, '跳转成功前必须保持退出处理中，阻止重复操作');
assert.equal(petStore.getUser(), null, '退出后不得读取旧用户');
assert.equal(petStore.getPet(), null, '退出后不得读取旧蛋宝宝及其对话');
accountSession.ACCOUNT_SCOPED_KEYS.forEach(key => {
  assert.equal(storage.has(runtime.scopedKey(key)), false, `退出后必须删除账号级数据：${key}`);
});
assert.equal(storage.has('eggbabe_deregister_request_v1_user-old'), false, '退出后必须删除当前账号的注销申请缓存');
assert.equal(storage.get('eggbabe_profile_icon_hint_seen_v1'), true, '退出不得清除设备级“我的”提示');
assert.equal(storage.get('eggbabe_doodle_color_hint_seen_v1'), true, '退出不得清除设备级画画提示');
assert.equal(storage.get('eggbabe_scene_preview'), 'summer-clear-day', '退出不得清除开发预览选择');
assert.notEqual(runtime.getSessionId(), previousSessionId, '退出后必须生成新的会话 ID');
assert.equal(toasts.length, 0, '成功退出不得显示错误提示');

accountPage.onLogout.call(context);
assert.equal(modalCount, 1, '退出处理中不得重复弹出确认框');

console.log('退出登录账号数据隔离与新会话校验通过。');
