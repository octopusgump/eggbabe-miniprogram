/**
 * 破壳前/后「一起画」（道具临摹）统一入口。
 * 旧自由涂鸦（entry=companion 且无 mode=prop）入口已下线，页面逻辑仍保留在 doodle-definition。
 */
const LEGACY_COMPANION_FREE_DOODLE_ENTRY_ENABLED = false;

const SOURCES = Object.freeze(['letter', 'activity', 'room', 'home']);

function buildPropDoodleUrl(options) {
  const settings = options || {};
  const source = SOURCES.includes(settings.source) ? settings.source : 'activity';
  let url = `/pages/doodle/doodle?entry=companion&mode=prop&source=${source}`;
  if (settings.propId) url += `&propId=${encodeURIComponent(String(settings.propId))}`;
  return url;
}

function normalizeCompanionEntryQuery(raw) {
  const query = Object.assign({}, raw || {});
  if (query.entry !== 'companion') {
    return Object.freeze({
      query,
      upgradedFromLegacyFreeDoodle: false,
      legacyFreeDoodleBlocked: false
    });
  }
  if (query.mode === 'prop') {
    return Object.freeze({
      query,
      upgradedFromLegacyFreeDoodle: false,
      legacyFreeDoodleBlocked: false
    });
  }
  if (LEGACY_COMPANION_FREE_DOODLE_ENTRY_ENABLED) {
    return Object.freeze({
      query,
      upgradedFromLegacyFreeDoodle: false,
      legacyFreeDoodleBlocked: false
    });
  }
  query.mode = 'prop';
  if (!query.source || !SOURCES.includes(query.source)) query.source = 'letter';
  return Object.freeze({
    query,
    upgradedFromLegacyFreeDoodle: true,
    legacyFreeDoodleBlocked: true
  });
}

function openPropDoodleNavigation(options) {
  const settings = options || {};
  const wxApi = settings.wx || wx;
  const url = String(settings.url || buildPropDoodleUrl({ source: settings.source || 'activity' }));
  const stars = settings.stars;
  const prefetch = settings.prefetch;
  const propPaperRoute = settings.propPaperRoute;
  const onFail = typeof settings.onFail === 'function' ? settings.onFail : () => {};

  if (prefetch && typeof prefetch.warmPropDoodleEntry === 'function') {
    prefetch.warmPropDoodleEntry({ pageUrl: url });
  }

  const navigate = () => {
    if (
      settings.source === 'activity'
      && propPaperRoute
      && typeof propPaperRoute.navigateToActivityPropDoodle === 'function'
    ) {
      propPaperRoute.navigateToActivityPropDoodle({
        wx: wxApi,
        url,
        renderer: settings.renderer,
        onFail
      });
      return;
    }
    wxApi.navigateTo(Object.assign({
      url,
      fail: onFail
    }, settings.navigateOptions || {}));
  };

  if (!stars || typeof stars.beginCompanionPropDrawing !== 'function') {
    navigate();
    return Promise.resolve({ ok: true, cost: 0 });
  }
  return stars.beginCompanionPropDrawing().then(result => {
    if (!result || !result.ok) return result;
    navigate();
    return result;
  });
}

module.exports = {
  LEGACY_COMPANION_FREE_DOODLE_ENTRY_ENABLED,
  SOURCES,
  buildPropDoodleUrl,
  normalizeCompanionEntryQuery,
  openPropDoodleNavigation
};
