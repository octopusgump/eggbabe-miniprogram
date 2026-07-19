const config = require('../config/v2');
const runtime = require('./runtime-context');
const timeService = require('./time-service');

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const WEATHER = ['sunny', 'cloudy', 'rain', 'snow'];
const PERIODS = ['day', 'night'];

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

function resolve(serverPresentation) {
  const preview = config.incubationEnvironmentPreview || {};
  const source = serverPresentation || (runtime.getMode() === 'demo' ? preview : {});
  const season = valid(source.season, SEASONS, seasonFromBeijingDate());
  const weather = valid(source.weather, WEATHER, 'sunny');
  const period = valid(source.period, PERIODS, periodFromBeijingTime());
  const backgroundImage = String(source.backgroundImage || '').trim();
  return {
    season,
    weather,
    period,
    backgroundImage: /^(?:https:\/\/|\/)/.test(backgroundImage) ? backgroundImage : '',
    locationLabel: '上海',
    className: `season-${season} weather-${weather} period-${period}`
  };
}

module.exports = { SEASONS, WEATHER, PERIODS, seasonFromBeijingDate, periodFromBeijingTime, resolve };
