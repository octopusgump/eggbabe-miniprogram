// 应用内环境状态：不读取定位、不调用天气 API。
// 环境以蛋宝宝身份、陪伴日和本机时段为种子，可复现也便于验收。
const DAY_MS = 24 * 60 * 60 * 1000;
const ENVIRONMENT_VERSION = 'environment-v1';
const SEASONS = Object.freeze(['spring', 'summer', 'autumn', 'winter']);
const PERIODS = Object.freeze(['day', 'sunset', 'night']);
const WEATHER_POOLS = Object.freeze({
  spring: Object.freeze(['sunny', 'cloudy', 'rain']),
  summer: Object.freeze(['sunny', 'cloudy', 'storm']),
  autumn: Object.freeze(['sunny', 'rain']),
  winter: Object.freeze(['sunny', 'cloudy', 'snow', 'postSnow'])
});

function timestampOf(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now();
}

function localParts(value) {
  const date = new Date(timestampOf(value));
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes()
  };
}

function localDateKey(value) {
  const parts = localParts(value);
  return [parts.year, String(parts.month).padStart(2, '0'), String(parts.day).padStart(2, '0')].join('-');
}

function localDaySerial(value) {
  const parts = localParts(value);
  return Math.floor(new Date(parts.year, parts.month - 1, parts.day).getTime() / DAY_MS);
}

function companionDay(companionStartedAt, value) {
  const started = Date.parse(companionStartedAt || '');
  if (!Number.isFinite(started)) return 1;
  return Math.max(1, localDaySerial(value) - localDaySerial(started) + 1);
}

function seasonBeforeHatch(companionStartedAt, value) {
  return SEASONS[(companionDay(companionStartedAt, value) - 1) % SEASONS.length];
}

// 破壳后使用固定中国（UTC+8）月份规则；这不是定位，也不读取天气。
function chinaMonth(value) {
  const date = new Date(timestampOf(value) + 8 * 60 * 60 * 1000);
  return date.getUTCMonth() + 1;
}

function seasonAfterHatch(value) {
  const month = chinaMonth(value);
  if (month >= 3 && month <= 6) return 'spring';
  if (month >= 7 && month <= 9) return 'summer';
  if (month >= 10 && month <= 11) return 'autumn';
  return 'winter';
}

function periodFromLocalTime(value) {
  const parts = localParts(value);
  const minuteOfDay = parts.hour * 60 + parts.minute;
  if (minuteOfDay >= 17 * 60 && minuteOfDay < 19 * 60) return 'sunset';
  if (minuteOfDay >= 6 * 60 && minuteOfDay < 17 * 60) return 'day';
  return 'night';
}

function lightPhaseFromPeriod(period) {
  if (period === 'sunset') return 'sunset';
  if (period === 'night') return 'night';
  return 'midday';
}

function hash32(text) {
  let hash = 2166136261;
  const source = String(text || '');
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function weatherForSlot(options) {
  const source = options || {};
  const pool = WEATHER_POOLS[source.season] || WEATHER_POOLS.spring;
  const seed = [
    source.environmentVersion || ENVIRONMENT_VERSION,
    source.environmentSeed || source.eggId || 'legacy-egg',
    source.eggId || 'legacy-egg',
    source.dateKey || localDateKey(source.timestamp),
    source.period || periodFromLocalTime(source.timestamp)
  ].join('|');
  return pool[hash32(seed) % pool.length];
}

function weatherAssetName(weather) {
  if (weather === 'sunny') return 'clear';
  if (weather === 'postSnow') return 'post_snow';
  return weather;
}

function sceneKey(season, weather, period) {
  return `${season}_${weatherAssetName(weather)}_${period}`;
}

function nextEnvironmentBoundary(value) {
  const timestamp = timestampOf(value);
  const date = new Date(timestamp);
  const candidates = [0, 6, 17, 19].map(hour => new Date(
    date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0, 0
  ).getTime()).filter(candidate => candidate > timestamp);
  if (candidates.length) return Math.min.apply(null, candidates);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).getTime();
}

function millisecondsUntilNextEnvironmentBoundary(value) {
  const timestamp = timestampOf(value);
  return Math.max(1, nextEnvironmentBoundary(timestamp) - timestamp);
}

function resolve(options) {
  const source = options || {};
  const timestamp = timestampOf(source.timestamp);
  const isHatched = Boolean(source.isHatched);
  const period = periodFromLocalTime(timestamp);
  const dateKey = localDateKey(timestamp);
  const incubationDay = companionDay(source.companionStartedAt || source.createdAt, timestamp);
  const season = isHatched ? seasonAfterHatch(timestamp) : seasonBeforeHatch(source.companionStartedAt || source.createdAt, timestamp);
  const weather = weatherForSlot({
    eggId: source.eggId || source.id,
    environmentSeed: source.environmentSeed,
    environmentVersion: source.environmentVersion,
    season,
    period,
    dateKey,
    timestamp
  });
  return {
    environmentVersion: source.environmentVersion || ENVIRONMENT_VERSION,
    season,
    weather,
    period,
    lightPhase: lightPhaseFromPeriod(period),
    dateKey,
    incubationDay,
    sceneKey: sceneKey(season, weather, period)
  };
}

module.exports = {
  DAY_MS,
  ENVIRONMENT_VERSION,
  SEASONS,
  PERIODS,
  WEATHER_POOLS,
  localDateKey,
  companionDay,
  seasonBeforeHatch,
  seasonAfterHatch,
  periodFromLocalTime,
  lightPhaseFromPeriod,
  weatherForSlot,
  sceneKey,
  nextEnvironmentBoundary,
  millisecondsUntilNextEnvironmentBoundary,
  resolve
};
