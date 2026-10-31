// 只记录小游戏信件的阅读进度，不参与活动完成与星星结算。
const { shanghaiDate } = require('./companion-star-rules');
const memory = new Map();
function keyFor(scope, kind) { return `${scope}_letter_activity_${encodeURIComponent(kind)}_v1`; }
function read(scope, kind, date = shanghaiDate()) {
  const empty = { date, kind, entered: false, tomorrow: false };
  if (!scope || !kind) return empty;
  const key = keyFor(scope, kind);
  let value = memory.get(key);
  if (!value) { try { value = typeof wx !== 'undefined' && wx.getStorageSync ? wx.getStorageSync(key) : null; } catch (error) {} }
  if (!value || value.date !== date || value.kind !== kind) return empty;
  return { date, kind, entered: value.entered === true, tomorrow: value.entered === true && value.tomorrow === true };
}
function save(scope, kind, value) {
  if (!scope || !kind) return { ok: false };
  const key = keyFor(scope, kind);
  memory.set(key, Object.assign({}, value));
  try {
    if (typeof wx !== 'undefined' && wx.setStorageSync) wx.setStorageSync(key, value);
    return { ok: true, data: Object.assign({}, value) };
  } catch (error) { return { ok: false, data: Object.assign({}, value) }; }
}
function markEntered(scope, kind, date = shanghaiDate()) {
  return save(scope, kind, Object.assign(read(scope, kind, date), { entered: true }));
}
function markExpanded(scope, kind, completed = false, date = shanghaiDate()) {
  const state = read(scope, kind, date);
  if (!state.entered && !completed) return { ok: false };
  return save(scope, kind, Object.assign(state, { entered: true, tomorrow: true }));
}
module.exports = { read, markEntered, markExpanded };
