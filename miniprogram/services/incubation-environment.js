const assets = require('../config/pre-hatch-assets');
const state = require('./environment-state');

const PRE_HATCH_ASSETS = assets.PRE_HATCH;
const EGG_ASSET = PRE_HATCH_ASSETS.eggOnNest;
const SCENE_ASSET_ROOT = `${assets.ROOT}/pre-hatch`;

function validScene(sceneKey) {
  return (PRE_HATCH_ASSETS.sceneTesterOptions || []).find(item => item.key === sceneKey) || null;
}

function resolveAssetUrl(path, cdnBase) {
  const source = String(path || '');
  const base = String(cdnBase || '').replace(/\/$/, '');
  if (!base || !source.startsWith('/assets/scenes/lifecycle/')) return source;
  return `${base}${source}`;
}

// 全屏「日常窗外详情」优先使用 scene_key 精确匹配的窗景。
// 既有的 7 张共享图继续覆盖其余 20 个环境键；禁止跨天气、跨季节或用房间图回退。
function windowAssetPath(sceneKey, weather, period) {
  // 保持两参数旧调用兼容：windowAssetPath(weather, period)。
  if (period === undefined) {
    period = weather;
    weather = sceneKey;
    sceneKey = '';
  }
  const windowWeather = PRE_HATCH_ASSETS.windowWeather || {};
  const exactPath = (windowWeather.bySceneKey || {})[String(sceneKey || '')];
  if (exactPath) return exactPath;
  const byWeather = {
    sunny: { day: windowWeather.clearDay, sunset: windowWeather.clearSunset, night: windowWeather.clearNight },
    cloudy: { day: windowWeather.cloudyDay, night: windowWeather.cloudyNight },
    snow: { day: windowWeather.snowDay, night: windowWeather.snowNight }
  };
  return (byWeather[String(weather || '')] || {})[String(period || '')] || '';
}

function resolve(serverPresentation, context) {
  const options = context || {};
  // serverPresentation 是旧上海天气字段的兼容形参，环境状态不读取它。
  void serverPresentation;
  const environment = state.resolve({
    id: options.id,
    eggId: options.eggId || options.id,
    createdAt: options.createdAt,
    companionStartedAt: options.companionStartedAt,
    environmentSeed: options.environmentSeed,
    environmentVersion: options.environmentVersion,
    isHatched: options.isHatched,
    timestamp: options.timestamp
  });
  const scene = validScene(environment.sceneKey);
  if (!scene) {
    return Object.assign({}, environment, {
      valid: false,
      error: `MISSING_ENVIRONMENT_SCENE:${environment.sceneKey}`,
      fullSceneImage: '', backgroundImage: '', windowImage: '', weatherOverlay: '',
      nestImage: '', eggImage: '',
      className: `season-${environment.season} weather-${environment.weather} period-${environment.period} light-${environment.lightPhase}`
    });
  }
  const cdnBase = options.environmentCdnBase || '';
  return Object.assign({}, environment, {
    valid: true,
    fullSceneImage: resolveAssetUrl(scene.background, cdnBase),
    backgroundImage: '',
    windowImage: resolveAssetUrl(windowAssetPath(environment.sceneKey, environment.weather, environment.period), cdnBase),
    weatherOverlay: '',
    nestImage: resolveAssetUrl(scene.nest, cdnBase),
    eggImage: resolveAssetUrl(scene.egg, cdnBase),
    className: `season-${environment.season} weather-${environment.weather} period-${environment.period} light-${environment.lightPhase}`
  });
}

function layeredSceneAssets(season, weather, period) {
  return validScene(state.sceneKey(season, weather, period));
}

function fullSceneAssetPath(season, weather, period) {
  const scene = layeredSceneAssets(season, weather, period);
  return scene ? scene.background : '';
}

function weatherOverlayPath() { return ''; }
function sceneAssetPath(season, period) { return fullSceneAssetPath(season, 'sunny', period); }

module.exports = Object.assign({}, state, {
  WEATHER: Object.freeze(['sunny', 'cloudy', 'rain', 'snow', 'storm', 'postSnow']),
  EGG_ASSET,
  SCENE_ASSET_ROOT,
  resolveAssetUrl,
  windowAssetPath,
  fullSceneAssetPath,
  weatherOverlayPath,
  sceneAssetPath,
  layeredSceneAssets,
  resolve
});
