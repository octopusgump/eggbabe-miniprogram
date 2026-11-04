const propCatalog = require('./companion-prop-catalog');
const propAssets = require('./companion-prop-assets');
const companionAdapter = require('./iaa-star-unlock-adapter');

let warmPromise = null;
let warmKey = '';

function preloadLocalImage(src) {
  const path = String(src || '').trim();
  if (!path) return Promise.resolve(false);
  return new Promise(resolve => {
    if (typeof wx.getImageInfo !== 'function') {
      resolve(true);
      return;
    }
    wx.getImageInfo({
      src: path,
      success: () => resolve(true),
      fail: () => resolve(false)
    });
  });
}

function preloadPage(url) {
  const pageUrl = String(url || '').trim();
  if (!pageUrl || typeof wx.preloadPage !== 'function') return Promise.resolve(false);
  return new Promise(resolve => {
    wx.preloadPage({
      url: pageUrl,
      success: () => resolve(true),
      fail: () => resolve(false)
    });
  });
}

function resolveDailyPropEntry(options) {
  const settings = options || {};
  const scope = companionAdapter.getRoomScope();
  const roll = typeof settings.roll === 'number' ? { roll: settings.roll } : undefined;
  const entry = propCatalog.pickRandom(scope, roll);
  if (!entry) return { scope, entry: null, sketch: '' };
  return {
    scope,
    entry,
    sketch: propAssets.resolveLinePath(entry)
  };
}

function warmPropDoodleEntry(options) {
  const settings = options || {};
  const resolved = resolveDailyPropEntry(settings);
  if (!resolved.entry) return Promise.resolve(false);
  const rollKey = typeof settings.roll === 'number' ? String(settings.roll) : 'live';
  const cacheKey = `${resolved.scope}:${resolved.entry.id}:${settings.pageUrl || ''}:${rollKey}`;
  if (warmPromise && warmKey === cacheKey) return warmPromise;
  warmKey = cacheKey;
  warmPromise = Promise.all([
    preloadLocalImage(resolved.sketch),
    preloadPage(settings.pageUrl)
  ]).then(() => true, () => true);
  return warmPromise;
}

function resetWarmPropDoodleEntryForTests() {
  warmPromise = null;
  warmKey = '';
}

module.exports = {
  warmPropDoodleEntry,
  resetWarmPropDoodleEntryForTests,
  resolveDailyPropEntry
};
