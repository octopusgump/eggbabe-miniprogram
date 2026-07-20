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
const CLICK_STATE_KEY = 'dew_click_state';
const DEMO_ECONOMY_KEY = 'dew_demo_economy';
const DAILY_CLICK_CAP = 10;

// 仅用于 demo 验收，固定总计 26 次点击，不参与 live 随机、余额或统计。
const DEMO_CLICK_THRESHOLDS = [1, 2, 1, 2, 3, 2, 3, 3, 4, 5];

function key(name) { return runtime.scopedKey(name); }
function read(name, fallback) { return storage.read(key(name), fallback); }
function write(name, value) {
  try { storage.set(key(name), value); return { ok: true, value }; }
  catch (error) {
    analytics.track('data_write_fail', { where: `currency.${name}`, error_code: 'LOCAL_WRITE_FAILED' });
    return { ok: false, code: 'LOCAL_WRITE_FAILED', message: '露珠记录保存失败，请重试' };
  }
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }

function stageFor(earned) {
  if (earned >= DAILY_CLICK_CAP) return 'capped';
  if (earned >= 9) return 'final';
  if (earned >= 7) return 'late';
  if (earned >= 3) return 'middle';
  return 'early';
}

function emptyClickState(date) {
  return {
    mode: runtime.getMode(),
    businessDateBj: date,
    dailyClickEarned: 0,
    clicksSinceLastDrop: 0,
    currentRewardIndex: 0,
    currentTargetClicks: runtime.getMode() === 'demo' ? DEMO_CLICK_THRESHOLDS[0] : null,
    processedRequestIds: []
  };
}

function getClickState() {
  if (runtime.getMode() === 'demo') return ensureDemoAccount().clickState;
  const gate = time.requireAuthoritative();
  if (!gate.ok) return Object.assign(emptyClickState(''), { serverTimePending: true });
  const date = time.beijingDateKey(gate.now);
  const stored = read(CLICK_STATE_KEY, null);
  if (!stored || stored.businessDateBj !== date || stored.mode !== runtime.getMode()) return emptyClickState(date);
  return stored;
}

function ensureDemoAccount() {
  if (runtime.getMode() !== 'demo') return null;
  const gate = time.requireAuthoritative();
  const date = time.beijingDateKey(gate.now);
  const stored = read(DEMO_ECONOMY_KEY, null);
  if (stored) {
    if (!stored.clickState || stored.clickState.businessDateBj !== date) {
      const reset = Object.assign({}, stored, { clickState: emptyClickState(date) });
      write(DEMO_ECONOMY_KEY, reset);
      return reset;
    }
    return stored;
  }
  const legacyBalance = read(BALANCE_KEY, null);
  const startingBalance = legacyBalance ? Number(legacyBalance.amount || 0) : 160;
  const snapshot = {
    mode: 'demo',
    balance: startingBalance,
    ledger: read(LEDGER_KEY, [{
      id: `dew-demo-welcome-${gate.now}`,
      mode: 'demo',
      direction: 'earn',
      source: 'demo_welcome',
      amount: 160,
      balanceAfter: 160,
      serverTs: gate.now
    }]),
    inventory: read(INVENTORY_KEY, []),
    clickState: read(CLICK_STATE_KEY, emptyClickState(date)),
    updatedAt: gate.now
  };
  write(DEMO_ECONOMY_KEY, snapshot);
  return snapshot;
}

function getAccount() {
  if (runtime.getMode() === 'demo') {
    const snapshot = ensureDemoAccount();
    return {
      mode: 'demo',
      balance: Number(snapshot.balance || 0),
      ledger: snapshot.ledger || [],
      inventory: snapshot.inventory || [],
      catalog: catalog.map(item => Object.assign({}, item, { mode: 'demo' })),
      dailyClickEarned: Number(snapshot.clickState.dailyClickEarned || 0),
      dailyClickCap: DAILY_CLICK_CAP,
      stage: stageFor(Number(snapshot.clickState.dailyClickEarned || 0)),
      serverReady: true
    };
  }
  const clickState = getClickState();
  return {
    mode: runtime.getMode(),
    balance: Number((read(BALANCE_KEY, { amount: 0 }) || {}).amount || 0),
    ledger: read(LEDGER_KEY, []),
    inventory: read(INVENTORY_KEY, []),
    catalog: catalog.map(item => Object.assign({}, item, { mode: runtime.getMode() })),
    dailyClickEarned: Number(clickState.dailyClickEarned || 0),
    dailyClickCap: DAILY_CLICK_CAP,
    stage: stageFor(Number(clickState.dailyClickEarned || 0)),
    serverReady: time.requireAuthoritative().ok
  };
}

function resultBusinessDate(result, serverTime) {
  return result.businessDateBj || result.business_date_bj || (serverTime ? time.beijingDateKey(serverTime) : '');
}

function requireLiveResponse(result) {
  if (!result || !result.ok) return result || { ok: false, code: 'EMPTY_RESPONSE', message: '正式数据服务未返回结果' };
  if (result.mode !== 'live') return { ok: false, code: 'LIVE_MODE_REQUIRED', message: '正式数据模式校验失败，请稍后重试' };
  if (['catalog', 'inventory'].some(field => Array.isArray(result[field]) && result[field].some(row => row.mode !== 'live'))) {
    return { ok: false, code: 'LIVE_MODE_REQUIRED', message: '正式目录或库存模式校验失败，请稍后重试' };
  }
  return result;
}

function invalidLiveContract(message) {
  return { ok: false, code: 'INVALID_CURRENCY_RESPONSE', message: message || '正式数据返回不完整，请稍后重试' };
}

function readResponseField(result, camelName, snakeName) {
  if (Object.prototype.hasOwnProperty.call(result, camelName)) return result[camelName];
  return result[snakeName];
}

function requireAccountResponse(rawResult) {
  const result = requireLiveResponse(rawResult);
  if (!result.ok) return result;
  if (!Number.isFinite(Number(result.balance)) || !Array.isArray(result.catalog) || !Array.isArray(result.inventory)) {
    return invalidLiveContract('正式余额、商品目录或库存返回不完整，请稍后重试');
  }
  return result;
}

function requireTapResponse(rawResult) {
  const result = requireLiveResponse(rawResult);
  if (!result.ok) return result;
  const dailyClickEarned = readResponseField(result, 'dailyClickEarned', 'daily_click_earned');
  const dailyClickCap = readResponseField(result, 'dailyClickCap', 'daily_click_cap');
  const serverTime = result.serverTime || result.server_time || result.serverTs;
  const validStage = ['early', 'middle', 'late', 'final', 'capped'].includes(result.stage);
  if (
    typeof result.awarded !== 'boolean'
    || !Number.isFinite(Number(result.amount))
    || !Number.isFinite(Number(dailyClickEarned))
    || !Number.isFinite(Number(dailyClickCap))
    || !Number.isFinite(Number(result.balance))
    || !validStage
    || !Number.isFinite(Number(serverTime))
    || Number(serverTime) <= 0
  ) {
    return invalidLiveContract('正式露珠判定返回不完整，请稍后重试');
  }
  return result;
}

function normalizeCatalog(items) {
  return (items || []).map(item => ({
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
    stackable: !!item.stackable,
    presentation: item.presentation || '',
    mode: 'live'
  }));
}

function normalizeInventory(items) {
  return (items || []).map(item => ({
    itemId: item.itemId || item.item_id,
    category: item.category,
    quantity: Number(item.quantity || 0),
    equipped: !!item.equipped,
    slot: item.slot || '',
    mode: 'live'
  })).filter(item => item.quantity > 0);
}

function cacheRemoteAccount(result) {
  const gate = time.requireAuthoritative();
  const normalizedCatalog = normalizeCatalog(result.catalog);
  const normalizedInventory = normalizeInventory(result.inventory);
  const dailyClickEarned = Number(result.dailyClickEarned === undefined ? result.daily_click_earned : result.dailyClickEarned) || 0;
  const serverTime = result.serverTs || result.server_time || gate.now || 0;
  write(BALANCE_KEY, { mode: 'live', amount: Number(result.balance || 0), updatedAt: serverTime });
  write(INVENTORY_KEY, normalizedInventory);
  if (result.dailyClickEarned !== undefined || result.daily_click_earned !== undefined) {
    write(CLICK_STATE_KEY, {
      mode: 'live',
      businessDateBj: resultBusinessDate(result, serverTime),
      dailyClickEarned,
      clicksSinceLastDrop: null,
      currentRewardIndex: dailyClickEarned,
      currentTargetClicks: null,
      processedRequestIds: []
    });
  }
  return {
    mode: 'live',
    balance: Number(result.balance || 0),
    ledger: read(LEDGER_KEY, []),
    inventory: normalizedInventory,
    catalog: normalizedCatalog,
    dailyClickEarned,
    dailyClickCap: Number(result.dailyClickCap || result.daily_click_cap || DAILY_CLICK_CAP),
    stage: result.stage || stageFor(dailyClickEarned),
    serverReady: true
  };
}

function loadAccount() {
  if (runtime.getMode() !== 'live' || !config.backendEnabled) return Promise.resolve(getAccount());
  return cloudApi.currencyAccount('get').then(rawResult => {
    const result = requireAccountResponse(rawResult);
    return result.ok ? cacheRemoteAccount(result) : Object.assign(getAccount(), { serverReady: false, error: result });
  });
}

function normalizeTapResult(result, requestId) {
  const dailyClickEarned = Number(result.dailyClickEarned === undefined ? result.daily_click_earned : result.dailyClickEarned) || 0;
  const dailyClickCap = Number(result.dailyClickCap === undefined ? result.daily_click_cap : result.dailyClickCap) || DAILY_CLICK_CAP;
  const serverTime = result.serverTime || result.server_time || result.serverTs || 0;
  return {
    ok: result.ok !== false,
    awarded: !!result.awarded,
    amount: Number(result.amount || 0),
    dailyClickEarned,
    dailyClickCap,
    balance: Number(result.balance || 0),
    stage: result.stage || stageFor(dailyClickEarned),
    serverTime,
    requestId
  };
}

function trackTapResult(result) {
  analytics.track('egg_tap_currency_result', {
    awarded: result.awarded,
    amount: result.amount,
    daily_click_earned: result.dailyClickEarned,
    daily_click_cap: result.dailyClickCap,
    stage: result.stage,
    request_id: result.requestId
  });
  if (!result.awarded) return;
  analytics.track('currency_earned', {
    source: 'egg_tap',
    amount: result.amount,
    balance: result.balance,
    daily_click_earned: result.dailyClickEarned,
    stage: result.stage
  });
  if (result.dailyClickEarned >= result.dailyClickCap) {
    analytics.track('currency_daily_cap_reached', {
      daily_click_earned: result.dailyClickEarned,
      daily_click_cap: result.dailyClickCap
    });
  }
}

function buildDemoTapResult(state, snapshot, gate, requestId, changes) {
  return Object.assign({
    ok: true,
    awarded: false,
    amount: 0,
    dailyClickEarned: state.dailyClickEarned,
    dailyClickCap: DAILY_CLICK_CAP,
    balance: snapshot.balance,
    stage: stageFor(state.dailyClickEarned),
    serverTime: gate.now,
    requestId
  }, changes || {});
}

function tapEgg(requestId) {
  if (!requestId) return Promise.resolve({ ok: false, code: 'REQUEST_ID_REQUIRED', message: '点击请求缺少唯一编号' });
  if (runtime.getMode() === 'live') {
    if (!config.backendEnabled) return Promise.resolve({ ok: false, code: 'BACKEND_NOT_CONNECTED', message: '露珠服务尚未连接' });
    return cloudApi.tapEggCurrency(requestId).then(rawResult => {
      const result = requireTapResponse(rawResult);
      if (!result.ok) return result;
      const normalized = normalizeTapResult(result, requestId);
      write(BALANCE_KEY, { mode: 'live', amount: normalized.balance, updatedAt: normalized.serverTime });
      write(CLICK_STATE_KEY, {
        mode: 'live',
        businessDateBj: resultBusinessDate(result, normalized.serverTime),
        dailyClickEarned: normalized.dailyClickEarned,
        clicksSinceLastDrop: null,
        currentRewardIndex: normalized.dailyClickEarned,
        currentTargetClicks: null,
        processedRequestIds: []
      });
      trackTapResult(normalized);
      return normalized;
    });
  }

  const gate = time.requireAuthoritative();
  if (!gate.ok) return Promise.resolve(gate);
  const snapshot = clone(ensureDemoAccount());
  const state = snapshot.clickState;
  if (state.processedRequestIds.includes(requestId)) {
    return Promise.resolve(buildDemoTapResult(state, snapshot, gate, requestId, { duplicate: true }));
  }

  state.processedRequestIds = state.processedRequestIds.concat(requestId).slice(-80);
  if (state.dailyClickEarned >= DAILY_CLICK_CAP) {
    snapshot.clickState = state;
    snapshot.updatedAt = gate.now;
    const saved = write(DEMO_ECONOMY_KEY, snapshot);
    if (!saved.ok) return Promise.resolve(saved);
    const capped = buildDemoTapResult(state, snapshot, gate, requestId, { dailyClickEarned: DAILY_CLICK_CAP, stage: 'capped' });
    trackTapResult(capped);
    return Promise.resolve(capped);
  }

  state.clicksSinceLastDrop += 1;
  const target = DEMO_CLICK_THRESHOLDS[state.currentRewardIndex];
  const awarded = state.clicksSinceLastDrop >= target;
  if (!awarded) {
    snapshot.clickState = state;
    snapshot.updatedAt = gate.now;
    const saved = write(DEMO_ECONOMY_KEY, snapshot);
    if (!saved.ok) return Promise.resolve(saved);
    const pending = buildDemoTapResult(state, snapshot, gate, requestId);
    trackTapResult(pending);
    return Promise.resolve(pending);
  }

  state.dailyClickEarned += 1;
  state.currentRewardIndex = state.dailyClickEarned;
  state.clicksSinceLastDrop = 0;
  state.currentTargetClicks = DEMO_CLICK_THRESHOLDS[state.currentRewardIndex] || null;
  const nextBalance = snapshot.balance + 1;
  const row = {
    id: `dew-demo-tap-${requestId}`,
    mode: 'demo',
    direction: 'earn',
    source: 'egg_tap',
    amount: 1,
    balanceAfter: nextBalance,
    requestId,
    serverTs: gate.now
  };
  snapshot.balance = nextBalance;
  snapshot.ledger = snapshot.ledger.concat(row).slice(-200);
  snapshot.clickState = state;
  snapshot.updatedAt = gate.now;
  const saved = write(DEMO_ECONOMY_KEY, snapshot);
  if (!saved.ok) return Promise.resolve(saved);
  const result = buildDemoTapResult(state, snapshot, gate, requestId, { awarded: true, amount: 1 });
  trackTapResult(result);
  return Promise.resolve(result);
}

function purchase(itemId) {
  if (runtime.getMode() !== 'demo') {
    if (!config.backendEnabled) return { ok: false, code: 'SERVER_LEDGER_REQUIRED', message: '正式购买将在服务器完成记账' };
    return cloudApi.currencyAccount('purchase', itemId).then(rawResult => {
      const result = requireAccountResponse(rawResult);
      if (!result.ok) return result;
      const account = cacheRemoteAccount(result);
      const item = account.catalog.find(entry => entry.id === itemId) || {};
      analytics.track('currency_spent', { amount: item.price || 0, item_id: itemId });
      analytics.track('item_purchased', { item_id: itemId, category: item.category || '', price: item.price || 0 });
      return { ok: true, item, account };
    });
  }
  const gate = time.requireAuthoritative();
  if (!gate.ok) return gate;
  const item = catalog.find(entry => entry.id === itemId);
  if (!item) return { ok: false, code: 'ITEM_NOT_FOUND', message: '没有找到这个道具' };
  const snapshot = clone(ensureDemoAccount());
  const existing = snapshot.inventory.find(entry => entry.itemId === item.id);
  if (existing && !item.stackable) return { ok: false, code: 'ITEM_ALREADY_OWNED', message: '这个道具已经在背包里啦' };
  if (snapshot.balance < item.price) return { ok: false, code: 'INSUFFICIENT_DEW', message: '露珠还不够，先把喜欢的道具留在这里吧' };
  const inventory = existing
    ? snapshot.inventory.map(entry => entry.itemId === item.id ? Object.assign({}, entry, { quantity: entry.quantity + 1, updatedAt: gate.now }) : entry)
    : snapshot.inventory.concat({
      itemId: item.id,
      category: item.category,
      quantity: 1,
      equipped: false,
      slot: item.slot,
      acquiredAt: gate.now,
      updatedAt: gate.now,
      mode: 'demo'
    });
  const nextBalance = snapshot.balance - item.price;
  const row = {
    id: `dew-demo-${gate.now}-purchase-${item.id}`,
    mode: 'demo',
    direction: 'spend',
    source: 'item_purchase',
    itemId: item.id,
    amount: item.price,
    balanceAfter: nextBalance,
    serverTs: gate.now
  };
  snapshot.balance = nextBalance;
  snapshot.ledger = snapshot.ledger.concat(row).slice(-200);
  snapshot.inventory = inventory;
  snapshot.updatedAt = gate.now;
  const saved = write(DEMO_ECONOMY_KEY, snapshot);
  if (!saved.ok) return saved;
  analytics.track('currency_spent', { amount: item.price, item_id: item.id });
  analytics.track('item_purchased', { item_id: item.id, category: item.category, price: item.price });
  return { ok: true, item, account: getAccount() };
}

function setEquipped(itemId, equipped) {
  if (runtime.getMode() === 'live') {
    if (!config.backendEnabled) return { ok: false, code: 'SERVER_INVENTORY_REQUIRED', message: '正式背包将在服务器连接后可用' };
    return cloudApi.currencyAccount(equipped ? 'equip' : 'unequip', itemId).then(rawResult => {
      const result = requireAccountResponse(rawResult);
      if (!result.ok) return result;
      const account = cacheRemoteAccount(result);
      analytics.track(equipped ? 'item_equipped' : 'item_unequipped', { item_id: itemId });
      return { ok: true, account };
    });
  }
  const gate = time.requireAuthoritative();
  if (!gate.ok) return gate;
  const snapshot = clone(ensureDemoAccount());
  const owned = snapshot.inventory.find(entry => entry.itemId === itemId);
  const item = catalog.find(entry => entry.id === itemId);
  if (!owned || !item) return { ok: false, code: 'ITEM_NOT_OWNED', message: '背包里还没有这个道具' };
  if (item.category === 'snack') return { ok: false, code: 'SNACK_NOT_EQUIPPABLE', message: '零食可以投喂，但不能穿戴' };
  const inventory = snapshot.inventory.map(entry => {
    if (equipped && item.slot && entry.slot === item.slot) return Object.assign({}, entry, { equipped: entry.itemId === itemId, updatedAt: gate.now });
    return entry.itemId === itemId ? Object.assign({}, entry, { equipped: !!equipped, updatedAt: gate.now }) : entry;
  });
  snapshot.inventory = inventory;
  snapshot.updatedAt = gate.now;
  const saved = write(DEMO_ECONOMY_KEY, snapshot);
  if (!saved.ok) return saved;
  analytics.track(equipped ? 'item_equipped' : 'item_unequipped', { item_id: itemId });
  return { ok: true, account: getAccount() };
}

function useSnack(itemId) {
  if (runtime.getMode() === 'live') {
    if (!config.backendEnabled) return { ok: false, code: 'SERVER_INVENTORY_REQUIRED', message: '正式背包将在服务器连接后可用' };
    return cloudApi.currencyAccount('use_snack', itemId).then(rawResult => {
      const result = requireAccountResponse(rawResult);
      if (!result.ok) return result;
      const account = cacheRemoteAccount(result);
      return { ok: true, reaction: result.reaction, account };
    });
  }
  const gate = time.requireAuthoritative();
  if (!gate.ok) return gate;
  const snapshot = clone(ensureDemoAccount());
  const item = catalog.find(entry => entry.id === itemId && entry.category === 'snack');
  const owned = snapshot.inventory.find(entry => entry.itemId === itemId);
  if (!item || !owned || owned.quantity < 1) return { ok: false, code: 'SNACK_NOT_OWNED', message: '背包里没有这份零食' };
  const inventory = snapshot.inventory
    .map(entry => entry.itemId === itemId ? Object.assign({}, entry, { quantity: entry.quantity - 1, updatedAt: gate.now }) : entry)
    .filter(entry => entry.quantity > 0);
  snapshot.inventory = inventory;
  snapshot.updatedAt = gate.now;
  const saved = write(DEMO_ECONOMY_KEY, snapshot);
  if (!saved.ok) return saved;
  return { ok: true, reaction: '我捧着小饼认真闻了闻，然后开心地晃了晃。', account: getAccount() };
}

module.exports = {
  DAILY_CLICK_CAP,
  DEMO_CLICK_THRESHOLDS,
  getAccount,
  loadAccount,
  tapEgg,
  purchase,
  setEquipped,
  useSnack
};
