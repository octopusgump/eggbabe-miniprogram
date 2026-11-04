const propCatalog = require('./companion-prop-catalog');
const propAssets = require('./companion-prop-assets');
const starRules = require('./companion-star-rules');
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

function resolveDailyPropEntry() {
  const scope = companionAdapter.getRoomScope();
  const date = starRules.shanghaiDate();
  const entry = propCatalog.pickDaily(date, scope);
  if (!entry) return { scope, date, entry: null, sketch: '' };
  return {
    scope,
    date,
    entry,
    sketch: propAssets.resolveLinePath(entry)
  };
}

function warmPropDoodleEntry(options) {
  const settings = options || {};
  const resolved = resolveDailyPropEntry();
  if (!resolved.entry) return Promise.resolve(false);
  const cacheKey = `${resolved.scope}:${resolved.date}:${resolved.entry.id}:${settings.pageUrl || ''}`;
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
