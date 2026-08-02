const timeService = require('./time-service');
const assets = require('../config/pre-hatch-assets');

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const WEATHER = ['sunny', 'cloudy', 'rain', 'snow', 'fog', 'storm', 'wind', 'afterRain', 'postSnow'];
const PERIODS = ['day', 'night'];
const PRE_HATCH_ASSETS = assets.PRE_HATCH;
const SCENE_ASSET_ROOT = `${assets.ROOT}/pre-hatch`;
const EGG_ASSET = PRE_HATCH_ASSETS.eggOnNest;
const DAY_MS = 24 * 60 * 60 * 1000;
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
const SHANGHAI = {
  latitude: 31.2304,
  longitude: 121.4737,
  timezoneMinutes: 8 * 60
};

function valid(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function visualTimestamp(timestamp) {
  const explicit = Number(timestamp);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const authoritative = Number(timeService.now());
  if (Number.isFinite(authoritative) && authoritative > 0) return authoritative;
  return Date.now();
}

function beijingParts(timestamp) {
  const date = new Date(visualTimestamp(timestamp) + BEIJING_OFFSET_MS);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes()
  };
}

function beijingDateKey(timestamp) {
  const parts = beijingParts(timestamp);
  return [
    parts.year,
    String(parts.month + 1).padStart(2, '0'),
    String(parts.day).padStart(2, '0')
  ].join('-');
}

function beijingDaySerial(timestamp) {
  const parts = beijingParts(timestamp);
  return Math.floor(Date.UTC(parts.year, parts.month, parts.day) / DAY_MS);
}

function incubationDay(createdAt, timestamp) {
  const created = Date.parse(createdAt || '');
  if (!Number.isFinite(created)) return 1;
  return Math.max(1, beijingDaySerial(timestamp) - beijingDaySerial(created) + 1);
}

function seasonFromIncubationDay(createdAt, timestamp) {
  return SEASONS[(incubationDay(createdAt, timestamp) - 1) % SEASONS.length];
}

function dayOfYear(parts) {
  const start = Date.UTC(parts.year, 0, 1);
  const current = Date.UTC(parts.year, parts.month, parts.day);
  return Math.floor((current - start) / DAY_MS) + 1;
}

function normalizeMinutes(value) {
  return ((value % 1440) + 1440) % 1440;
}

function shanghaiSolarTimes(timestamp) {
  const parts = beijingParts(timestamp);
  const daysInYear = (parts.year % 4 === 0 && (parts.year % 100 !== 0 || parts.year % 400 === 0)) ? 366 : 365;
  const fractionalYear = (2 * Math.PI / daysInYear) * (dayOfYear(parts) - 1);
  const equationOfTime = 229.18 * (
    0.000075
    + 0.001868 * Math.cos(fractionalYear)
    - 0.032077 * Math.sin(fractionalYear)
    - 0.014615 * Math.cos(2 * fractionalYear)
    - 0.040849 * Math.sin(2 * fractionalYear)
  );
  const declination = (
    0.006918
    - 0.399912 * Math.cos(fractionalYear)
    + 0.070257 * Math.sin(fractionalYear)
    - 0.006758 * Math.cos(2 * fractionalYear)
    + 0.000907 * Math.sin(2 * fractionalYear)
    - 0.002697 * Math.cos(3 * fractionalYear)
    + 0.00148 * Math.sin(3 * fractionalYear)
  );
  const latitude = SHANGHAI.latitude * Math.PI / 180;
  const zenith = 90.833 * Math.PI / 180;
  const hourAngleInput = (
    Math.cos(zenith) / (Math.cos(latitude) * Math.cos(declination))
    - Math.tan(latitude) * Math.tan(declination)
  );
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, hourAngleInput))) * 180 / Math.PI;
  const sunriseUtc = 720 - 4 * (SHANGHAI.longitude + hourAngle) - equationOfTime;
  const sunsetUtc = 720 - 4 * (SHANGHAI.longitude - hourAngle) - equationOfTime;
  return {
    sunriseMinutes: Math.round(normalizeMinutes(sunriseUtc + SHANGHAI.timezoneMinutes)),
    sunsetMinutes: Math.round(normalizeMinutes(sunsetUtc + SHANGHAI.timezoneMinutes))
  };
}

function formatMinutes(minutes) {
  const safe = normalizeMinutes(minutes);
  const hour = Math.floor(safe / 60);
  const minute = Math.round(safe % 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function periodFromShanghaiSun(timestamp) {
  const parts = beijingParts(timestamp);
  const currentMinutes = parts.hour * 60 + parts.minute;
  const solarTimes = shanghaiSolarTimes(timestamp);
  return currentMinutes >= solarTimes.sunriseMinutes && currentMinutes < solarTimes.sunsetMinutes
    ? 'day'
    : 'night';
}

function lightPhaseFromShanghaiSun(timestamp) {
  const parts = beijingParts(timestamp);
  const currentMinutes = parts.hour * 60 + parts.minute;
  const solarTimes = shanghaiSolarTimes(timestamp);
  if (currentMinutes < solarTimes.sunriseMinutes || currentMinutes >= solarTimes.sunsetMinutes) return 'night';
  if (currentMinutes < solarTimes.sunriseMinutes + 180) return 'morning';
  if (currentMinutes >= solarTimes.sunsetMinutes - 60) return 'sunset';
  if (currentMinutes >= 14 * 60) return 'afternoon';
  return 'midday';
}

function beijingDayStart(timestamp) {
  const parts = beijingParts(timestamp);
  return Date.UTC(parts.year, parts.month, parts.day) - BEIJING_OFFSET_MS;
}

function nextLightPhaseTimestamp(timestamp) {
  const now = visualTimestamp(timestamp);
  const dayStart = beijingDayStart(now);
  const solarTimes = shanghaiSolarTimes(now);
  const boundaries = [
    solarTimes.sunriseMinutes,
    solarTimes.sunriseMinutes + 180,
    14 * 60,
    solarTimes.sunsetMinutes - 60,
    solarTimes.sunsetMinutes
  ]
    .map(minutes => dayStart + minutes * 60 * 1000)
    .filter(candidate => candidate > now + 1000)
    .sort((left, right) => left - right);
  if (boundaries.length) return boundaries[0];
  const nextDayStart = dayStart + DAY_MS;
  const nextDaySolarTimes = shanghaiSolarTimes(nextDayStart + 12 * 60 * 60 * 1000);
  return nextDayStart + nextDaySolarTimes.sunriseMinutes * 60 * 1000;
}

function millisecondsUntilNextLightPhase(timestamp) {
  const now = visualTimestamp(timestamp);
  return Math.max(1000, nextLightPhaseTimestamp(now) - now);
}

function windowAssetPath(weather, period, isSunset) {
  const safeWeather = valid(weather, WEATHER, 'sunny');
  const safePeriod = valid(period, PERIODS, 'day');
  const windowWeather = PRE_HATCH_ASSETS.windowWeather;
  if (safeWeather === 'snow' || safeWeather === 'postSnow') return safePeriod === 'night' ? windowWeather.snowNight : windowWeather.snowDay;
  if (safeWeather === 'cloudy' || safeWeather === 'rain' || safeWeather === 'fog' || safeWeather === 'storm') {
    return safePeriod === 'night' ? windowWeather.cloudyNight : windowWeather.cloudyDay;
  }
  if (safePeriod === 'night') return windowWeather.clearNight;
  return isSunset ? windowWeather.clearSunset : windowWeather.clearDay;
}

function fullSceneAssetPath(season, weather, period, isSunset) {
  const safeSeason = valid(season, SEASONS, 'spring');
  const safeWeather = valid(weather, WEATHER, 'sunny');
  const safePeriod = valid(period, PERIODS, 'day');
  const scenes = PRE_HATCH_ASSETS.fullScenes;
  const selected = scenes[safeSeason];

  if (safeWeather === 'snow') {
    return safePeriod === 'night' ? scenes.winter.snowNight : scenes.winter.snowDay;
  }
  if (safeWeather === 'postSnow') {
    return safePeriod === 'night' ? scenes.winter.snowNight : scenes.winter.postSnowDay;
  }
  if (safeSeason === 'spring') {
    if (safePeriod === 'night') return selected.clearNight;
    if (safeWeather === 'rain' || safeWeather === 'fog' || safeWeather === 'afterRain') return selected.rainDay;
    if (safeWeather === 'cloudy' || safeWeather === 'storm') return selected.cloudyDay;
    return isSunset ? selected.clearSunset : selected.clearDay;
  }
  if (safeSeason === 'summer') {
    if (safePeriod === 'night' && (safeWeather === 'storm' || safeWeather === 'rain')) return selected.stormNight;
    if (safePeriod === 'night') return selected.clearNight;
    if (safeWeather === 'cloudy' || safeWeather === 'rain' || safeWeather === 'fog' || safeWeather === 'afterRain' || safeWeather === 'storm') return selected.cloudyDay;
    return isSunset ? selected.clearSunset : selected.clearDay;
  }
  if (safeSeason === 'autumn') {
    if (safePeriod === 'night') return selected.clearNight;
    if (safeWeather === 'cloudy' || safeWeather === 'rain' || safeWeather === 'fog' || safeWeather === 'afterRain' || safeWeather === 'storm') return selected.rainDay;
    return isSunset ? selected.clearSunset : selected.clearDay;
  }
  if (safePeriod === 'night') return selected.clearNight;
  if (safeWeather === 'cloudy' || safeWeather === 'rain' || safeWeather === 'fog' || safeWeather === 'storm') return selected.cloudyDay;
  return selected.clearDay;
}

function weatherOverlayPath(weather) {
  valid(weather, WEATHER, 'sunny');
  return '';
}

// 保留旧公开函数名，现返回对应季节的完整房间背景。
function sceneAssetPath(season, period) {
  return fullSceneAssetPath(season, 'sunny', period, false);
}

function layeredSceneAssets(season, weather, period, isSunset) {
  const fullScene = fullSceneAssetPath(season, weather, period, isSunset);
  const filename = String(fullScene || '').split('/').pop() || '';
  const sceneKey = filename.replace(/\.webp$/i, '');
  const scene = (PRE_HATCH_ASSETS.sceneTesterOptions || []).find(item => item.key === sceneKey);
  return scene || null;
}

function resolve(serverPresentation, context) {
  const source = serverPresentation || {};
  const options = context || {};
  const timestamp = visualTimestamp(options.timestamp);
  const day = incubationDay(options.createdAt, timestamp);
  const season = seasonFromIncubationDay(options.createdAt, timestamp);
  const weather = valid(source.weather, WEATHER, 'sunny');
  const period = periodFromShanghaiSun(timestamp);
  const lightPhase = lightPhaseFromShanghaiSun(timestamp);
  const solarTimes = shanghaiSolarTimes(timestamp);
  const parts = beijingParts(timestamp);
  const currentMinutes = parts.hour * 60 + parts.minute;
  const isSunset = period === 'day' && currentMinutes >= solarTimes.sunsetMinutes - 60;
  const roomLighting = PRE_HATCH_ASSETS.roomLighting || {};
  const layeredScene = layeredSceneAssets(season, weather, period, isSunset);
  return {
    season,
    weather,
    period,
    lightPhase,
    fullSceneImage: fullSceneAssetPath(season, weather, period, isSunset),
    backgroundImage: PRE_HATCH_ASSETS.roomBase,
    windowImage: windowAssetPath(weather, period, isSunset),
    weatherOverlay: weatherOverlayPath(weather),
    roomLightingEnabled: Boolean(roomLighting.enabled && period === 'night'),
    roomLightingImages: {
      on: roomLighting.nightLampOn || '',
      off: roomLighting.nightLampOff || ''
    },
    // 实时环境和场景验收器使用同一套分层资产，避免旧正面 Canvas
    // 把已经确认的右 45°蛋体覆盖掉。
    nestImage: layeredScene ? layeredScene.nest : PRE_HATCH_ASSETS.nestPad,
    eggImage: layeredScene ? layeredScene.egg : EGG_ASSET,
    sceneKey: layeredScene ? layeredScene.key : '',
    locationLabel: '上海',
    className: `season-${season} weather-${weather} period-${period} light-${lightPhase}${isSunset ? ' window-sunset' : ''}`,
    incubationDay: day,
    dateKey: beijingDateKey(timestamp),
    sunriseLabel: formatMinutes(solarTimes.sunriseMinutes),
    sunsetLabel: formatMinutes(solarTimes.sunsetMinutes)
  };
}

module.exports = {
  SEASONS,
  WEATHER,
  PERIODS,
  SCENE_ASSET_ROOT,
  EGG_ASSET,
  SHANGHAI,
  incubationDay,
  seasonFromIncubationDay,
  shanghaiSolarTimes,
  periodFromShanghaiSun,
  lightPhaseFromShanghaiSun,
  nextLightPhaseTimestamp,
  millisecondsUntilNextLightPhase,
  fullSceneAssetPath,
  windowAssetPath,
  weatherOverlayPath,
  sceneAssetPath,
  layeredSceneAssets,
  resolve
};
