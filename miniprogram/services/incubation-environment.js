const timeService = require('./time-service');

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const WEATHER = ['sunny', 'cloudy', 'rain', 'snow'];
const PERIODS = ['day', 'night'];
const SCENE_ASSET_ROOT = '/assets/scenes/incubation/webp';
const EGG_ASSET = `${SCENE_ASSET_ROOT}/egg_base_day.webp`;
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

function sceneAssetPath(season, period) {
  const safeSeason = valid(season, SEASONS, 'spring');
  const safePeriod = valid(period, PERIODS, 'day');
  return `${SCENE_ASSET_ROOT}/incubation_${safeSeason}_${safePeriod}.webp`;
}

function resolve(serverPresentation, context) {
  const source = serverPresentation || {};
  const options = context || {};
  const timestamp = visualTimestamp(options.timestamp);
  const day = incubationDay(options.createdAt, timestamp);
  const season = seasonFromIncubationDay(options.createdAt, timestamp);
  const weather = valid(source.weather, WEATHER, 'sunny');
  const period = periodFromShanghaiSun(timestamp);
  const solarTimes = shanghaiSolarTimes(timestamp);
  return {
    season,
    weather,
    period,
    backgroundImage: sceneAssetPath(season, period),
    eggImage: EGG_ASSET,
    locationLabel: '上海',
    className: `season-${season} weather-${weather} period-${period}`,
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
  sceneAssetPath,
  resolve
};
