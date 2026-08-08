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

function windowAssetPath(weather, period) {
  const windowWeather = PRE_HATCH_ASSETS.windowWeather || {};
  if (weather === 'snow' || weather === 'postSnow') return period === 'night' ? windowWeather.snowNight : windowWeather.snowDay;
  if (weather === 'cloudy' || weather === 'rain' || weather === 'storm') return period === 'night' ? windowWeather.cloudyNight : windowWeather.cloudyDay;
  if (period === 'night') return windowWeather.clearNight;
  return period === 'sunset' ? windowWeather.clearSunset : windowWeather.clearDay;
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
    // 非晴朗日落尚无独立 Window Weather 裁图时，直接使用语义一致的完整场景，
    // 禁止以晴天日落图冒充多云、雨或雷雨。
    windowImage: resolveAssetUrl(
      environment.period === 'sunset' && environment.weather !== 'sunny'
        ? scene.background
        : windowAssetPath(environment.weather, environment.period),
      cdnBase
    ),
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
