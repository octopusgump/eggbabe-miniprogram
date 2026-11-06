/**
 * 可玩列表 → 道具临摹的 Skyline 共享元素转场。
 * 只服务 entry=companion&mode=prop&source=activity。
 * TODO(v2): 信件（source=letter）和房间入口仍走默认 navigateTo，接入同一 routeType 前那些页也要先切 Skyline。
 */

const propDoodleEntry = require('./companion-prop-doodle-entry');

const ROUTE_TYPE = 'propPaper';
const SHARE_ELEMENT_KEY = 'propPaperCard';
const ACTIVITY_PROP_DOODLE_URL = propDoodleEntry.buildPropDoodleUrl({ source: 'activity' });
/** 与 prop-paper-stage 的 88vw / 120vw 一致，列表占位用同一宽高比。 */
const PROP_PAPER_WIDTH_OVER_HEIGHT = 88 / 120;
const PROP_PAPER_TRANSITION_MS = 320;
const PROP_PAPER_REVERSE_MS = 280;

const registeredTypes = Object.create(null);

function readQuery(url) {
  const raw = String(url || '');
  const queryIndex = raw.indexOf('?');
  const query = queryIndex >= 0 ? raw.slice(queryIndex + 1) : '';
  const params = Object.create(null);
  query.split('&').forEach(pair => {
    if (!pair) return;
    const eq = pair.indexOf('=');
    const key = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair);
    const value = decodeURIComponent(eq >= 0 ? pair.slice(eq + 1) : '');
    params[key] = value;
  });
  return params;
}

function isActivityPropDoodleUrl(url) {
  const path = String(url || '').split('?')[0];
  if (path !== '/pages/doodle/doodle' && path !== 'pages/doodle/doodle') return false;
  const query = readQuery(url);
  return query.entry === 'companion' && query.mode === 'prop' && query.source === 'activity';
}

function hasCustomRouteApi(router) {
  return Boolean(router && typeof router.addRouteBuilder === 'function');
}

function isPropPaperShareSupported(options) {
  const settings = options || {};
  return settings.renderer === 'skyline' && hasCustomRouteApi(settings.router);
}

function shouldMountActivityListShare(options) {
  return isPropPaperShareSupported(options);
}

function shouldMountDoodlePropPaperShare(options) {
  const settings = options || {};
  const query = settings.query || {};
  if (!isPropPaperShareSupported(settings)) return false;
  return query.entry === 'companion' && query.mode === 'prop' && query.source === 'activity';
}

function prefersReducedMotion() {
  if (typeof wx === 'undefined' || typeof wx.getSystemSetting !== 'function') return false;
  try {
    const system = wx.getSystemSetting() || {};
    return Boolean(system.reducedMotion || system.enableReduceMotion);
  } catch (error) {
    return false;
  }
}

function buildPropPaperRoute(routeContext) {
  const context = routeContext || {};
  const primaryAnimation = context.primaryAnimation || { value: 0 };
  const secondaryAnimation = context.secondaryAnimation || { value: 0 };
  const userGestureInProgress = context.userGestureInProgress || { value: 0 };
  const reducedMotion = prefersReducedMotion();

  const handlePrimaryAnimation = () => {
    'worklet'
    let t = primaryAnimation.value;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const gesturing = userGestureInProgress.value;
    if (!gesturing && t > 0 && t < 1) t = 1 - Math.pow(1 - t, 3);
    return {
      opacity: t
    };
  };

  const handlePreviousPageStay = () => {
    'worklet'
    let t = secondaryAnimation.value;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    return {
      opacity: 1 - (0.04 * t)
    };
  };

  return {
    opaque: false,
    maintainState: true,
    transitionDuration: reducedMotion ? 1 : PROP_PAPER_TRANSITION_MS,
    reverseTransitionDuration: reducedMotion ? 1 : PROP_PAPER_REVERSE_MS,
    barrierColor: 'rgba(250, 250, 248, 0)',
    barrierDismissible: false,
    canTransitionTo: true,
    canTransitionFrom: true,
    allowEnterRouteSnapshotting: false,
    allowExitRouteSnapshotting: false,
    fullscreenDrag: false,
    handlePrimaryAnimation,
    handleSecondaryAnimation: handlePreviousPageStay,
    handlePreviousPageAnimation: handlePreviousPageStay
  };
}

function ensurePropPaperRoute(wxApi) {
  const router = wxApi && wxApi.router;
  if (!hasCustomRouteApi(router)) return false;
  if (registeredTypes[ROUTE_TYPE]) return true;
  try {
    router.addRouteBuilder(ROUTE_TYPE, buildPropPaperRoute);
    registeredTypes[ROUTE_TYPE] = true;
    return true;
  } catch (error) {
    return false;
  }
}

function navigateToActivityPropDoodle(options) {
  const settings = options || {};
  const wxApi = settings.wx;
  const url = String(settings.url || '');
  const navigateOptions = {
    url,
    fail: () => {
      if (typeof settings.onFail === 'function') settings.onFail();
    }
  };
  if (isActivityPropDoodleUrl(url) && isPropPaperShareSupported({
    renderer: settings.renderer,
    router: wxApi && wxApi.router
  })) {
    if (ensurePropPaperRoute(wxApi)) navigateOptions.routeType = ROUTE_TYPE;
  }
  if (wxApi && typeof wxApi.navigateTo === 'function') wxApi.navigateTo(navigateOptions);
  return navigateOptions;
}

function resetPropPaperRouteForTests() {
  delete registeredTypes[ROUTE_TYPE];
}

module.exports = {
  ROUTE_TYPE,
  SHARE_ELEMENT_KEY,
  ACTIVITY_PROP_DOODLE_URL,
  PROP_PAPER_WIDTH_OVER_HEIGHT,
  PROP_PAPER_TRANSITION_MS,
  PROP_PAPER_REVERSE_MS,
  isActivityPropDoodleUrl,
  isPropPaperShareSupported,
  shouldMountActivityListShare,
  shouldMountDoodlePropPaperShare,
  buildPropPaperRoute,
  ensurePropPaperRoute,
  navigateToActivityPropDoodle,
  resetPropPaperRouteForTests
};
