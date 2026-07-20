const assert = require('assert');

const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const runtime = require('../runtime-context');
const currency = require('../currency-store');
const cloudApi = require('../cloud-api');
const config = require('../../config/v2');

async function main() {
  runtime.setMode('demo');
  assert.equal(currency.getAccount().balance, 160, 'demo 经济必须从 demo 命名空间初始化');
  assert.equal(currency.DEMO_CLICK_THRESHOLDS.reduce((sum, value) => sum + value, 0), 26, 'demo 验收序列应以约 26 次点击收齐 10 个露珠');
  const originalSetStorage = wx.setStorageSync;
  const demoEconomyKey = runtime.scopedKey('dew_demo_economy');
  wx.setStorageSync = (key, value) => {
    if (key === demoEconomyKey) throw new Error('STORAGE_FULL');
    originalSetStorage(key, value);
  };
  const failedWrite = await currency.tapEgg('failed-demo-write');
  assert.equal(failedWrite.ok, false, 'demo 单快照写入失败时不得返回到账成功');
  wx.setStorageSync = originalSetStorage;
  assert.equal(currency.getAccount().balance, 160, 'demo 写入失败不得部分增加余额');
  assert.equal(currency.getAccount().dailyClickEarned, 0, 'demo 写入失败不得部分推进点击状态');

  const awardedAt = [];
  for (let index = 1; index <= 26; index += 1) {
    const result = await currency.tapEgg(`tap-${index}`);
    assert.equal(result.ok, true);
    if (result.awarded) awardedAt.push(index);
  }
  assert.deepEqual(awardedAt, [1, 3, 4, 6, 9, 11, 14, 17, 21, 26], 'demo 必须复现 v2.25 分段阈值体验');
  assert.equal(currency.getAccount().dailyClickEarned, 10);
  assert.equal(currency.getAccount().balance, 170);

  const duplicate = await currency.tapEgg('tap-26');
  assert.equal(duplicate.awarded, false, '重复请求 ID 不得重复到账');
  assert.equal(currency.getAccount().balance, 170);
  const capped = await currency.tapEgg('tap-after-cap');
  assert.equal(capped.stage, 'capped');
  assert.equal(capped.awarded, false);

  const purchase = await currency.purchase('acc_moon_scarf_01');
  assert.equal(purchase.ok, true, '服务确认后 demo 购买才可成功');
  assert.equal(purchase.account.balance, 110);
  assert.equal((await currency.purchase('acc_moon_scarf_01')).code, 'ITEM_ALREADY_OWNED', '非消耗道具不得重复购买');
  const equipped = await currency.setEquipped('acc_moon_scarf_01', true);
  assert.equal(equipped.account.inventory.find(item => item.itemId === 'acc_moon_scarf_01').equipped, true);
  const unequipped = await currency.setEquipped('acc_moon_scarf_01', false);
  assert.equal(unequipped.account.inventory.find(item => item.itemId === 'acc_moon_scarf_01').equipped, false);

  runtime.setMode('live');
  assert.equal((await currency.tapEgg('live-without-server')).code, 'BACKEND_NOT_CONNECTED', 'live 不得在前端本地发币');
  assert.equal(currency.purchase('acc_moon_scarf_01').code, 'SERVER_LEDGER_REQUIRED', 'live 不得在前端本地扣款');
  config.backendEnabled = true;
  cloudApi.tapEggCurrency = () => Promise.resolve({
    ok: true,
    mode: 'demo',
    awarded: true,
    amount: 1,
    daily_click_earned: 1,
    daily_click_cap: 10,
    balance: 999,
    stage: 'early',
    server_time: Date.parse('2026-07-20T08:00:00+08:00')
  });
  assert.equal((await currency.tapEgg('wrong-response-mode')).code, 'LIVE_MODE_REQUIRED', 'live 必须拒绝 demo 或缺失 mode 的响应');
  cloudApi.tapEggCurrency = () => Promise.resolve({ ok: true, mode: 'live' });
  assert.equal((await currency.tapEgg('missing-tap-fields')).code, 'INVALID_CURRENCY_RESPONSE', 'live 不得把缺字段的露珠响应当成到账');
  cloudApi.currencyAccount = () => Promise.resolve({ ok: true, mode: 'live', balance: 1 });
  assert.equal((await currency.purchase('acc_moon_scarf_01')).code, 'INVALID_CURRENCY_RESPONSE', 'live 购买必须等余额、目录和库存完整返回后才能成功');
  cloudApi.tapEggCurrency = () => Promise.resolve({
    ok: true,
    mode: 'live',
    awarded: true,
    amount: 1,
    daily_click_earned: 1,
    daily_click_cap: 10,
    balance: 1,
    stage: 'early',
    server_time: Date.parse('2026-07-20T08:00:00+08:00')
  });
  assert.equal((await currency.tapEgg('live-server-confirmed')).ok, true);
  assert.equal(wx.getStorageSync(runtime.scopedKey('dew_click_state')).businessDateBj, '2026-07-20', 'live 日期必须由服务端北京时间推导');
  cloudApi.currencyAccount = () => Promise.resolve({ ok: true, mode: 'live', balance: 1, catalog: [], inventory: [] });
  assert.equal((await currency.loadAccount()).catalog.length, 0, 'CTO 明确返回空 live 目录时不得回退到 demo 商品');
  config.backendEnabled = false;

  console.log('v2.25 露珠、demo 隔离、购买与装配服务校验通过。');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
