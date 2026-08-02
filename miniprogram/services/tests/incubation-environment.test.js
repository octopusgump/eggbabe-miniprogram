const assert = require('assert');

const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const environment = require('../incubation-environment');
const createdAt = '2026-07-26T08:00:00+08:00';
const firstDayNoon = Date.parse('2026-07-26T12:00:00+08:00');
const firstDayMorning = Date.parse('2026-07-26T07:00:00+08:00');
const firstDayAfternoon = Date.parse('2026-07-26T15:00:00+08:00');
const firstDaySunset = Date.parse('2026-07-26T18:30:00+08:00');
const firstDayNight = Date.parse('2026-07-26T21:00:00+08:00');
const secondDayNoon = Date.parse('2026-07-27T12:00:00+08:00');
const fourthDayNoon = Date.parse('2026-07-29T12:00:00+08:00');

assert.equal(
  environment.sceneAssetPath('autumn', 'night'),
  '/assets/scenes/lifecycle/pre-hatch/10-background/incubation-room/season-weather-full-scenes/autumn_clear_night.webp'
);
assert.equal(
  environment.sceneAssetPath('unknown', 'unknown'),
  '/assets/scenes/lifecycle/pre-hatch/10-background/incubation-room/season-weather-full-scenes/spring_clear_day.webp',
  '非法季节或昼夜枚举必须降级到安全完整场景'
);
assert.equal(
  environment.resolve({ season: 'winter', weather: 'rain', period: 'night' }, { createdAt, timestamp: firstDayNoon }).backgroundImage,
  '/assets/scenes/lifecycle/pre-hatch/10-background/incubation-room/room_base_candidate_v2.webp',
  '房间底图必须固定为独立透明窗洞层'
);
assert.equal(
  environment.resolve({ weather: 'rain' }, { createdAt, timestamp: firstDayNoon }).fullSceneImage,
  '/assets/scenes/lifecycle/pre-hatch/10-background/incubation-room/season-weather-full-scenes/spring_rain_day.webp',
  '春雨必须使用整屋统一光影背景'
);
assert.equal(
  environment.resolve({ weather: 'rain' }, { createdAt, timestamp: firstDayNoon }).windowImage,
  '/assets/scenes/lifecycle/shared/10-background/window-weather/w_04_cloudy_day.webp',
  '雨天必须选择独立阴天窗景'
);
assert.equal(
  environment.resolve({ weather: 'rain' }, { createdAt, timestamp: firstDayNoon }).weatherOverlay,
  '',
  '雨必须由窗户 Canvas 绘制，不得再返回图片叠加层'
);
assert.equal(
  environment.resolve({ weather: 'snow' }, { createdAt, timestamp: firstDayNight }).windowImage,
  '/assets/scenes/lifecycle/shared/10-background/window-weather/w_07_snow_night.webp',
  '雪夜必须使用独立雪夜窗景'
);
assert.deepEqual([
  environment.windowAssetPath('sunny', 'day', false),
  environment.windowAssetPath('sunny', 'day', true),
  environment.windowAssetPath('sunny', 'night', false),
  environment.windowAssetPath('cloudy', 'day', false),
  environment.windowAssetPath('rain', 'night', false),
  environment.windowAssetPath('snow', 'day', false),
  environment.windowAssetPath('snow', 'night', false)
], [
  '/assets/scenes/lifecycle/shared/10-background/window-weather/w_01_clear_day.webp',
  '/assets/scenes/lifecycle/shared/10-background/window-weather/w_02_clear_sunset.webp',
  '/assets/scenes/lifecycle/shared/10-background/window-weather/w_03_clear_night.webp',
  '/assets/scenes/lifecycle/shared/10-background/window-weather/w_04_cloudy_day.webp',
  '/assets/scenes/lifecycle/shared/10-background/window-weather/w_05_cloudy_night.webp',
  '/assets/scenes/lifecycle/shared/10-background/window-weather/w_06_snow_day.webp',
  '/assets/scenes/lifecycle/shared/10-background/window-weather/w_07_snow_night.webp'
], '日常窗外详情必须按天气与时段覆盖 7 张 Window Weather');
assert.equal(environment.weatherOverlayPath('sunny'), '', '晴天不应叠加天气图片层');
assert.equal(environment.weatherOverlayPath('fog'), '', '雾气必须由窗户 Canvas 绘制');
assert.equal(
  environment.resolve({}, { createdAt, timestamp: firstDayNoon }).eggImage,
  '/assets/scenes/lifecycle/pre-hatch/30-character/egg/season-weather/spring_clear_day_egg_right45.webp',
  '实时环境蛋体必须使用对应场景的右 45°独立角色层'
);
assert.equal(
  environment.resolve({}, { createdAt, timestamp: firstDayNoon }).nestImage,
  '/assets/scenes/lifecycle/pre-hatch/20-room-objects/window-and-nest/season-weather/spring_clear_day_nest_pad.webp',
  '实时环境窝垫必须来自对应场景的独立物件层'
);
assert.equal(
  environment.resolve({}, { createdAt, timestamp: firstDayNoon }).season,
  'spring',
  '孵化第 1 天必须是春天'
);
assert.equal(environment.resolve({}, { createdAt, timestamp: secondDayNoon }).season, 'summer', '孵化第 2 天必须是夏天');
assert.equal(environment.resolve({}, { createdAt, timestamp: fourthDayNoon }).season, 'winter', '孵化第 4 天必须是冬天');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDayNight }).period, 'night', '上海日落后必须使用夜景');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDayNoon }).period, 'day', '上海日出后、日落前必须使用日景');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDayMorning }).lightPhase, 'morning', '早晨必须使用低角度日光阴影');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDayNoon }).lightPhase, 'midday', '正午必须使用紧密的垂直阴影');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDayAfternoon }).lightPhase, 'afternoon', '下午必须使用窗口反方向阴影');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDaySunset }).lightPhase, 'sunset', '日落前必须使用更长的低角度阴影');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDayNight }).lightPhase, 'night', '夜间必须切换到台灯光向');
const nextNoonPhase = environment.nextLightPhaseTimestamp(firstDayNoon);
const nextNoonParts = new Date(nextNoonPhase + 8 * 60 * 60 * 1000);
assert.equal(nextNoonParts.getUTCHours(), 14, '正午后的下一次光线阶段必须在上海时间 14:00 切换到午后');
assert.equal(environment.millisecondsUntilNextLightPhase(firstDayNoon), 2 * 60 * 60 * 1000, '时段刷新必须精确等待到下一阶段边界');
const nextNightPhase = environment.nextLightPhaseTimestamp(firstDayNight);
assert.equal(nextNightPhase > firstDayNight && nextNightPhase - firstDayNight < 12 * 60 * 60 * 1000, true, '夜间必须等待到次日上海日出后刷新');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDayNight }).roomLightingEnabled, false, '正式房间光影图未补全前不得用代码暗层替代');
assert.equal(environment.resolve({}, { createdAt, timestamp: firstDayNight }).roomLightingImages.off.endsWith('/room_night_lamp_off_overlay.webp'), true, '夜间关灯图必须使用集中管理的稳定路径');
assert.equal(environment.resolve({ weather: 'storm' }, { createdAt, timestamp: secondDayNoon }).weather, 'storm', '雷雨必须保留动态天气枚举');
assert.equal(
  environment.resolve({ weather: 'storm' }, { createdAt, timestamp: Date.parse('2026-07-27T21:00:00+08:00') }).fullSceneImage,
  '/assets/scenes/lifecycle/pre-hatch/10-background/incubation-room/season-weather-full-scenes/summer_storm_night.webp',
  '夏季雷雨夜必须使用完整雷雨夜房间图'
);
assert.equal(
  environment.resolve({ weather: 'postSnow' }, { createdAt, timestamp: fourthDayNoon }).fullSceneImage,
  '/assets/scenes/lifecycle/pre-hatch/10-background/incubation-room/season-weather-full-scenes/winter_post_snow_day.webp',
  '冬季雪后初晴必须使用雪后完整房间图'
);
assert.equal(environment.resolve({ weather: 'hail' }, { createdAt, timestamp: firstDayNoon }).weather, 'sunny', '未知天气仍必须安全降级为晴天');

const solarTimes = environment.shanghaiSolarTimes(firstDayNoon);
assert.equal(solarTimes.sunriseMinutes > 240 && solarTimes.sunriseMinutes < 420, true, '上海日出时间应落在合理范围');
assert.equal(solarTimes.sunsetMinutes > 1020 && solarTimes.sunsetMinutes < 1200, true, '上海日落时间应落在合理范围');

console.log('V3.5 上海日出日落、昼夜素材与孵化日四季循环校验通过。');
