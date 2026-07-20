const config = require('../config/v2');
const runtime = require('./runtime-context');
const timeService = require('./time-service');

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const WEATHER = ['sunny', 'cloudy', 'rain', 'snow'];
const PERIODS = ['day', 'night'];
const SCENE_ASSET_ROOT = '/assets/scenes/incubation/webp';
const EGG_ASSET = `${SCENE_ASSET_ROOT}/egg_base_day.webp`;

function valid(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function seasonFromBeijingDate(timestamp) {
  const gate = timeService.requireAuthoritative();
  if (!gate.ok && gate.mode === 'live') return 'spring';
  const dateKey = timeService.beijingDateKey(timestamp);
  const monthDay = dateKey.slice(5);
  if (monthDay >= '11-07' || monthDay < '02-04') return 'winter';
  if (monthDay >= '08-07') return 'autumn';
  if (monthDay >= '05-05') return 'summer';
  return 'spring';
}

function periodFromBeijingTime(timestamp) {
  const gate = timeService.requireAuthoritative();
  if (!gate.ok && gate.mode === 'live') return 'day';
  const beijing = new Date(Number(timestamp === undefined ? timeService.now() : timestamp) + 8 * 60 * 60 * 1000);
  const hour = beijing.getUTCHours();
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

function sceneAssetPath(season, period) {
  const safeSeason = valid(season, SEASONS, 'spring');
  const safePeriod = valid(period, PERIODS, 'day');
  return `${SCENE_ASSET_ROOT}/incubation_${safeSeason}_${safePeriod}.webp`;
}

function resolve(serverPresentation) {
  const preview = config.incubationEnvironmentPreview || {};
  const source = serverPresentation || (runtime.getMode() === 'demo' ? preview : {});
  const season = valid(source.season, SEASONS, seasonFromBeijingDate());
  const weather = valid(source.weather, WEATHER, 'sunny');
  const period = valid(source.period, PERIODS, periodFromBeijingTime());
  const remoteBackgroundImage = String(source.backgroundImage || '').trim();
  const backgroundImage = /^(?:https:\/\/|\/)/.test(remoteBackgroundImage)
    ? remoteBackgroundImage
    : sceneAssetPath(season, period);
  return {
    season,
    weather,
    period,
    backgroundImage,
    eggImage: EGG_ASSET,
    locationLabel: '上海',
    className: `season-${season} weather-${weather} period-${period}`
  };
}

module.exports = {
  SEASONS,
  WEATHER,
  PERIODS,
  SCENE_ASSET_ROOT,
  EGG_ASSET,
  seasonFromBeijingDate,
  periodFromBeijingTime,
  sceneAssetPath,
  resolve
};
