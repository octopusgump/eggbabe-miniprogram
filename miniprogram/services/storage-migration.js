const LEGACY_BRAND = ['egg', 'baby'].join('');

function legacyKey(key) {
  return String(key).replace(/eggbabe/g, LEGACY_BRAND);
}

function read(key, fallback) {
  let legacy;
  try {
    const current = wx.getStorageSync(key);
    if (current !== undefined && current !== null && current !== '') return current;
    const oldKey = legacyKey(key);
    if (oldKey === key) return fallback;
    legacy = wx.getStorageSync(oldKey);
    if (legacy === undefined || legacy === null || legacy === '') return fallback;
  } catch (error) {
    return fallback;
  }
  try {
    wx.setStorageSync(key, legacy);
  } catch (error) {}
  return legacy;
}

function set(key, value) {
  wx.setStorageSync(key, value);
  const oldKey = legacyKey(key);
  if (oldKey !== key) {
    try {
      const oldValue = wx.getStorageSync(oldKey);
      if (oldValue !== undefined && oldValue !== null && oldValue !== '') wx.setStorageSync(oldKey, value);
    } catch (error) {}
  }
  return value;
}

function remove(key) {
  wx.removeStorageSync(key);
  const oldKey = legacyKey(key);
  if (oldKey !== key) {
    try { wx.removeStorageSync(oldKey); } catch (error) {}
  }
}

module.exports = { read, set, remove, legacyKey };
