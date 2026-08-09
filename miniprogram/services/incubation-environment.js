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

// 全屏「日常窗外详情」只使用与当前天气、时段精确匹配的窗景。
// 已登记 7 张：晴朗日间／日落／夜晚、多云日间／夜晚、降雪日间／夜晚。
// 其余组合（雨、雷雨、雪后，以及多云与降雪的日落）尚无对应素材，返回空串，
// 由 daily-window-detail 显示空态与重试；禁止用其他天气或整张房间图代替。
function windowAssetPath(weather, period) {
  const windowWeather = PRE_HATCH_ASSETS.windowWeather || {};
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
    // 缺少精确匹配的窗景时留空，让窗外详情进入空态；不用其他天气的窗景，
    // 也不用整张房间中央场景冒充窗外。
    windowImage: resolveAssetUrl(windowAssetPath(environment.weather, environment.period), cdnBase),
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
