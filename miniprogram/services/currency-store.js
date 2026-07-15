const runtime = require('./runtime-context');
const time = require('./time-service');
const analytics = require('./analytics');
const storage = require('./storage-migration');
const catalog = require('../config/item-catalog');
const config = require('../config/v2');
const cloudApi = require('./cloud-api');

const BALANCE_KEY = 'dew_balance';
const LEDGER_KEY = 'dew_ledger';
const INVENTORY_KEY = 'item_inventory';
const DAILY_KEY = 'dew_daily_earn';

function key(name) { return runtime.scopedKey(name); }
function read(name, fallback) { return storage.read(key(name), fallback); }
function write(name, value) {
  try { storage.set(key(name), value); return { ok: true, value }; }
  catch (error) {
    analytics.track('data_write_fail', { where: `currency.${name}`, error_code: 'LOCAL_WRITE_FAILED' });
    return { ok: false, code: 'LOCAL_WRITE_FAILED', message: '露珠记录保存失败，请重试' };
  }
}

function ensureDemoAccount() {
  if (runtime.getMode() !== 'demo') return;
  if (read(BALANCE_KEY, null)) return;
  const gate = time.requireAuthoritative();
  const balance = { mode: runtime.getMode(), amount: 160, updatedAt: gate.now };
  const ledger = [{ id: `dew-demo-welcome-${gate.now}`, mode: runtime.getMode(), direction: 'earn', source: 'demo_welcome', amount: 160, balanceAfter: 160, serverTs: gate.now }];
  write(BALANCE_KEY, balance);
  write(LEDGER_KEY, ledger);
  write(INVENTORY_KEY, []);
}

function getAccount() {
  ensureDemoAccount();
  return {
    mode: runtime.getMode(),
    balance: Number((read(BALANCE_KEY, { amount: 0 }) || {}).amount || 0),
    ledger: read(LEDGER_KEY, []),
    inventory: read(INVENTORY_KEY, []),
    catalog: catalog.map(item => Object.assign({}, item, { mode: runtime.getMode() })),
    serverReady: time.requireAuthoritative().ok
  };
}

function cacheRemoteAccount(result) {
  const gate = time.requireAuthoritative();
  const normalizedCatalog = (result.catalog || []).map(item => ({
    id: item.id || item.item_id,
    category: item.category,
    categoryLabel: item.categoryLabel || item.category_label,
    name: item.name,
    description: item.description,
    price: Number(item.price || 0),
    icon: item.icon || '◇',
    slot: item.slot || '',
    decorativeOnly: item.decorativeOnly === undefined ? item.decorative_only !== false : item.decorativeOnly,
    limited: !!item.limited,
    mode: 'live'
  }));
  const normalizedInventory = (result.inventory || []).map(item => ({
    itemId: item.itemId || item.item_id,
    category: item.category,
    quantity: Number(item.quantity || 0),
    equipped: !!item.equipped,
    slot: item.slot || '',
    mode: 'live'
  })).filter(item => item.quantity > 0);
  write(BALANCE_KEY, { mode: 'live', amount: Number(result.balance || 0), updatedAt: result.serverTs || gate.now || 0 });
  write(INVENTORY_KEY, normalizedInventory);
  return { mode: 'live', balance: Number(result.balance || 0), ledger: read(LEDGER_KEY, []), inventory: normalizedInventory, catalog: normalizedCatalog.length ? normalizedCatalog : catalog, serverReady: true };
}

function loadAccount() {
  if (runtime.getMode() !== 'live' || !config.backendEnabled) return Promise.resolve(getAccount());
  return cloudApi.currencyAccount('get').then(result => result.ok ? cacheRemoteAccount(result) : Object.assign(getAccount(), { error: result }));
}

function earn(source, amount, dailyLimit) {
  const gate = time.requireAuthoritative();
  if (!gate.ok) return gate;
  if (runtime.getMode() !== 'demo') {
    if (!config.backendEnabled || !['daily_visit', 'pet_touch', 'daily_status_view'].includes(source)) return { ok: false, code: 'SERVER_LEDGER_REQUIRED', message: '正式露珠由服务器互动记录发放' };
    return cloudApi.recordEngagement(source).then(result => {
      if (!result.ok || !result.granted) return result;
      write(BALANCE_KEY, { mode: 'live', amount: Number(result.balance || 0), updatedAt: result.serverTs });
      analytics.track('currency_earned', { source, amount: result.granted });
      return { ok: true, granted: result.granted, account: getAccount() };
    });
  }
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (!value) return { ok: false, code: 'INVALID_AMOUNT', message: '露珠数量无效' };
  const date = time.beijingDateKey(gate.now);
  const counters = read(DAILY_KEY, { mode: runtime.getMode(), date, sources: {} });
  const state = counters.date === date ? counters : { mode: runtime.getMode(), date, sources: {} };
  const current = Number(state.sources[source] || 0);
  const granted = Math.min(value, Math.max(0, Number(dailyLimit || value) - current));
  if (!granted) return { ok: true, granted: 0, capped: true, account: getAccount() };
  const account = getAccount();
  const nextBalance = account.balance + granted;
  state.sources[source] = current + granted;
  const row = { id: `dew-${gate.now}-${source}`, mode: runtime.getMode(), direction: 'earn', source, amount: granted, balanceAfter: nextBalance, serverTs: gate.now };
  const saved = [
    write(BALANCE_KEY, { mode: runtime.getMode(), amount: nextBalance, updatedAt: gate.now }),
    write(LEDGER_KEY, account.ledger.concat(row).slice(-200)),
    write(DAILY_KEY, state)
  ];
  if (saved.some(result => !result.ok)) return saved.find(result => !result.ok);
  analytics.track('currency_earned', { source, amount: granted });
  return { ok: true, granted, account: getAccount() };
}

function purchase(itemId) {
  const gate = time.requireAuthoritative();
  if (!gate.ok) return gate;
  if (runtime.getMode() !== 'demo') {
    if (!config.backendEnabled) return { ok: false, code: 'SERVER_LEDGER_REQUIRED', message: '正式购买将在服务器完成记账' };
    return cloudApi.currencyAccount('purchase', itemId).then(result => {
      if (!result.ok) return result;
      const account = cacheRemoteAccount(result);
      const item = account.catalog.find(entry => entry.id === itemId) || {};
      analytics.track('currency_spent', { amount: item.price || 0, item_id: itemId });
      analytics.track('item_purchased', { item_id: itemId, category: item.category || '', price: item.price || 0 });
      return { ok: true, item, account };
    });
  }
  const item = catalog.find(entry => entry.id === itemId);
  if (!item) return { ok: false, code: 'ITEM_NOT_FOUND', message: '没有找到这个道具' };
  const account = getAccount();
  if (account.balance < item.price) return { ok: false, code: 'INSUFFICIENT_DEW', message: '露珠还不够，再和蛋宝宝互动一会儿吧' };
  const existing = account.inventory.find(entry => entry.itemId === item.id);
  const inventory = existing
    ? account.inventory.map(entry => entry.itemId === item.id ? Object.assign({}, entry, { quantity: entry.quantity + 1, updatedAt: gate.now }) : entry)
    : account.inventory.concat({ itemId: item.id, category: item.category, quantity: 1, equipped: false, slot: item.slot, acquiredAt: gate.now, updatedAt: gate.now, mode: runtime.getMode() });
  const nextBalance = account.balance - item.price;
  const row = { id: `dew-${gate.now}-purchase`, mode: runtime.getMode(), direction: 'spend', source: 'item_purchase', itemId: item.id, amount: item.price, balanceAfter: nextBalance, serverTs: gate.now };
  const saved = [
    write(BALANCE_KEY, { mode: runtime.getMode(), amount: nextBalance, updatedAt: gate.now }),
    write(LEDGER_KEY, account.ledger.concat(row).slice(-200)),
    write(INVENTORY_KEY, inventory)
  ];
  if (saved.some(result => !result.ok)) return saved.find(result => !result.ok);
  analytics.track('currency_spent', { amount: item.price, item_id: item.id });
  analytics.track('item_purchased', { item_id: item.id, category: item.category, price: item.price });
  return { ok: true, item, account: getAccount() };
}

function setEquipped(itemId, equipped) {
  const gate = time.requireAuthoritative();
  if (!gate.ok) return gate;
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return cloudApi.currencyAccount(equipped ? 'equip' : 'unequip', itemId).then(result => {
      if (!result.ok) return result;
      const account = cacheRemoteAccount(result);
      analytics.track(equipped ? 'item_equipped' : 'item_unequipped', { item_id: itemId });
      return { ok: true, account };
    });
  }
  const account = getAccount();
  const owned = account.inventory.find(entry => entry.itemId === itemId);
  const item = catalog.find(entry => entry.id === itemId);
  if (!owned || !item) return { ok: false, code: 'ITEM_NOT_OWNED', message: '背包里还没有这个道具' };
  if (item.category === 'snack') return { ok: false, code: 'SNACK_NOT_EQUIPPABLE', message: '零食可以投喂，但不能穿戴' };
  const inventory = account.inventory.map(entry => {
    if (equipped && item.slot && entry.slot === item.slot) return Object.assign({}, entry, { equipped: entry.itemId === itemId, updatedAt: gate.now });
    return entry.itemId === itemId ? Object.assign({}, entry, { equipped: !!equipped, updatedAt: gate.now }) : entry;
  });
  const saved = write(INVENTORY_KEY, inventory);
  if (!saved.ok) return saved;
  analytics.track(equipped ? 'item_equipped' : 'item_unequipped', { item_id: itemId });
  return { ok: true, account: getAccount() };
}

function useSnack(itemId) {
  const gate = time.requireAuthoritative();
  if (!gate.ok) return gate;
  if (runtime.getMode() === 'live' && config.backendEnabled) {
    return cloudApi.currencyAccount('use_snack', itemId).then(result => {
      if (!result.ok) return result;
      const account = cacheRemoteAccount(result);
      analytics.track('item_used', { item_id: itemId, category: 'snack' });
      return { ok: true, reaction: result.reaction, account };
    });
  }
  const account = getAccount();
  const item = catalog.find(entry => entry.id === itemId && entry.category === 'snack');
  const owned = account.inventory.find(entry => entry.itemId === itemId);
  if (!item || !owned || owned.quantity < 1) return { ok: false, code: 'SNACK_NOT_OWNED', message: '背包里没有这份零食' };
  const inventory = account.inventory
    .map(entry => entry.itemId === itemId ? Object.assign({}, entry, { quantity: entry.quantity - 1, updatedAt: gate.now }) : entry)
    .filter(entry => entry.quantity > 0);
  const saved = write(INVENTORY_KEY, inventory);
  if (!saved.ok) return saved;
  analytics.track('item_used', { item_id: itemId, category: 'snack' });
  return { ok: true, reaction: '它捧着小饼认真闻了闻，然后开心地晃了晃耳朵。', account: getAccount() };
}

module.exports = { getAccount, loadAccount, earn, purchase, setEquipped, useSnack };
