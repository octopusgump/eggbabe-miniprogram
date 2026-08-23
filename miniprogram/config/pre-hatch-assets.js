// 破壳前正式素材集中配置。
// 季节/天气使用完整房间背景；窝垫、蛋体、互动效果与 UI 仍保持独立图层。
const ROOT = '/assets/scenes/lifecycle';
const PRE_HATCH_ROOT = `${ROOT}/pre-hatch`;
const SHARED_ROOT = `${ROOT}/shared`;
const FULL_SCENE_ROOT = `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes`;
const EGG_SCENE_ROOT = `${PRE_HATCH_ROOT}/30-character/egg/season-weather`;
const NEST_SCENE_ROOT = `${PRE_HATCH_ROOT}/20-room-objects/window-and-nest/season-weather`;
const UI_3D_ACTIONS_ROOT = '/assets/ui/3d-actions/runtime';
const UI_TOOLBAR_ROOT = '/assets/ui/3d-toolbar/runtime';

const SCENE_TESTER_OPTIONS = [
  ['spring_clear_day', '春季', '晴朗·日间', 'spring', 'sunny', 'day', 'midday'],
  ['spring_clear_sunset', '春季', '晴朗·日落', 'spring', 'sunny', 'sunset', 'sunset'],
  ['spring_clear_night', '春季', '晴朗·夜晚', 'spring', 'sunny', 'night', 'night'],
  ['spring_cloudy_day', '春季', '多云·日间', 'spring', 'cloudy', 'day', 'midday'],
  ['spring_cloudy_sunset', '春季', '多云·日落', 'spring', 'cloudy', 'sunset', 'sunset'],
  ['spring_cloudy_night', '春季', '多云·夜晚', 'spring', 'cloudy', 'night', 'night'],
  ['spring_rain_day', '春季', '下雨·日间', 'spring', 'rain', 'day', 'midday'],
  ['spring_rain_sunset', '春季', '下雨·日落', 'spring', 'rain', 'sunset', 'sunset'],
  ['spring_rain_night', '春季', '下雨·夜晚', 'spring', 'rain', 'night', 'night'],
  ['summer_clear_day', '夏季', '晴朗·日间', 'summer', 'sunny', 'day', 'midday'],
  ['summer_clear_sunset', '夏季', '晴朗·日落', 'summer', 'sunny', 'sunset', 'sunset'],
  ['summer_clear_night', '夏季', '晴朗·夜晚', 'summer', 'sunny', 'night', 'night'],
  ['summer_cloudy_day', '夏季', '多云·日间', 'summer', 'cloudy', 'day', 'midday'],
  ['summer_cloudy_sunset', '夏季', '多云·日落', 'summer', 'cloudy', 'sunset', 'sunset'],
  ['summer_cloudy_night', '夏季', '多云·夜晚', 'summer', 'cloudy', 'night', 'night'],
  ['summer_storm_day', '夏季', '雷雨·日间', 'summer', 'storm', 'day', 'midday'],
  ['summer_storm_sunset', '夏季', '雷雨·日落', 'summer', 'storm', 'sunset', 'sunset'],
  ['summer_storm_night', '夏季', '雷雨·夜晚', 'summer', 'storm', 'night', 'night'],
  ['autumn_clear_day', '秋季', '晴朗·日间', 'autumn', 'sunny', 'day', 'midday'],
  ['autumn_clear_sunset', '秋季', '晴朗·日落', 'autumn', 'sunny', 'sunset', 'sunset'],
  ['autumn_clear_night', '秋季', '晴朗·夜晚', 'autumn', 'sunny', 'night', 'night'],
  ['autumn_rain_day', '秋季', '下雨·日间', 'autumn', 'rain', 'day', 'midday'],
  ['autumn_rain_sunset', '秋季', '下雨·日落', 'autumn', 'rain', 'sunset', 'sunset'],
  ['autumn_rain_night', '秋季', '下雨·夜晚', 'autumn', 'rain', 'night', 'night'],
  ['winter_clear_day', '冬季', '晴朗·日间', 'winter', 'sunny', 'day', 'midday'],
  ['winter_clear_sunset', '冬季', '晴朗·日落', 'winter', 'sunny', 'sunset', 'sunset'],
  ['winter_clear_night', '冬季', '晴朗·夜晚', 'winter', 'sunny', 'night', 'night'],
  ['winter_cloudy_day', '冬季', '多云·日间', 'winter', 'cloudy', 'day', 'midday'],
  ['winter_cloudy_sunset', '冬季', '多云·日落', 'winter', 'cloudy', 'sunset', 'sunset'],
  ['winter_cloudy_night', '冬季', '多云·夜晚', 'winter', 'cloudy', 'night', 'night'],
  ['winter_snow_day', '冬季', '降雪·日间', 'winter', 'snow', 'day', 'midday'],
  ['winter_snow_sunset', '冬季', '降雪·日落', 'winter', 'snow', 'sunset', 'sunset'],
  ['winter_snow_night', '冬季', '降雪·夜晚', 'winter', 'snow', 'night', 'night'],
  ['winter_post_snow_day', '冬季', '雪后·日间', 'winter', 'postSnow', 'day', 'midday'],
  ['winter_post_snow_sunset', '冬季', '雪后·日落', 'winter', 'postSnow', 'sunset', 'sunset'],
  ['winter_post_snow_night', '冬季', '雪后·夜晚', 'winter', 'postSnow', 'night', 'night']
].map(([key, seasonLabel, stateLabel, season, weather, period, lightPhase]) => ({
  key,
  seasonLabel,
  stateLabel,
  label: `${seasonLabel} · ${stateLabel}`,
  season,
  weather,
  period,
  lightPhase,
  className: `season-${season} weather-${weather} period-${period} light-${lightPhase}`,
  background: `${FULL_SCENE_ROOT}/${key}.webp`,
  egg: `${EGG_SCENE_ROOT}/${key}_egg_right45.webp`,
  nest: `${NEST_SCENE_ROOT}/${key}_nest_pad.webp`
}));

module.exports = {
  ROOT,
  PRE_HATCH: {
    sceneTesterOptions: SCENE_TESTER_OPTIONS,
    eggOnNest: `${PRE_HATCH_ROOT}/30-character/egg/egg_on_nest.webp`,
    // 蛋体的景深与高光叠加层：首页直接读这里，不在页面里写死路径。
    eggShellOverlays: {
      depth: `${PRE_HATCH_ROOT}/30-character/egg/egg_shell_depth_overlay_512_v01.webp`,
      specular: `${PRE_HATCH_ROOT}/30-character/egg/egg_shell_specular_overlay_512_v01.webp`
    },
    // 画蛋壳工具条与右侧撤销／清空图标，禁用态使用专用置灰图。
    doodleToolbar: {
      brush: `${UI_TOOLBAR_ROOT}/ui_3d_toolbar_brush_96_v02_p8_v01.png`,
      eraser: `${UI_TOOLBAR_ROOT}/ui_3d_toolbar_eraser_96_v02_p8_v01.png`,
      sticker: `${UI_TOOLBAR_ROOT}/ui_3d_toolbar_sticker_96_v02_p8_v01.png`,
      undo: `${UI_TOOLBAR_ROOT}/ui_3d_toolbar_undo_96_v02_p8_v01.png`,
      undoDisabled: `${UI_TOOLBAR_ROOT}/ui_3d_toolbar_undo_disabled_96_v01_p8_v01.png`,
      clear: `${UI_TOOLBAR_ROOT}/ui_3d_toolbar_clear_96_v01_p8_v01.png`,
      clearDisabled: `${UI_TOOLBAR_ROOT}/ui_3d_toolbar_clear_disabled_96_v01_p8_v01.png`
    },
    windowWeather: {
      clearDay: `${SHARED_ROOT}/10-background/window-weather/w_01_clear_day.webp`,
      clearSunset: `${SHARED_ROOT}/10-background/window-weather/w_02_clear_sunset.webp`,
      clearNight: `${SHARED_ROOT}/10-background/window-weather/w_03_clear_night.webp`,
      cloudyDay: `${SHARED_ROOT}/10-background/window-weather/w_04_cloudy_day.webp`,
      cloudyNight: `${SHARED_ROOT}/10-background/window-weather/w_05_cloudy_night.webp`,
      snowDay: `${SHARED_ROOT}/10-background/window-weather/w_06_snow_day.webp`,
      snowNight: `${SHARED_ROOT}/10-background/window-weather/w_07_snow_night.webp`,
      // 其余 16 个环境键不再跨季节/天气复用；全屏窗外详情优先按 scene_key 精确取图。
      bySceneKey: Object.freeze({
        spring_cloudy_sunset: `${SHARED_ROOT}/10-background/window-weather/window_spring_cloudy_sunset_v01.webp`,
        spring_rain_day: `${SHARED_ROOT}/10-background/window-weather/window_spring_rain_day_v01.webp`,
        spring_rain_sunset: `${SHARED_ROOT}/10-background/window-weather/window_spring_rain_sunset_v01.webp`,
        spring_rain_night: `${SHARED_ROOT}/10-background/window-weather/window_spring_rain_night_v01.webp`,
        summer_cloudy_sunset: `${SHARED_ROOT}/10-background/window-weather/window_summer_cloudy_sunset_v01.webp`,
        summer_storm_day: `${SHARED_ROOT}/10-background/window-weather/window_summer_storm_day_v01.webp`,
        summer_storm_sunset: `${SHARED_ROOT}/10-background/window-weather/window_summer_storm_sunset_v01.webp`,
        summer_storm_night: `${SHARED_ROOT}/10-background/window-weather/window_summer_storm_night_v01.webp`,
        autumn_rain_day: `${SHARED_ROOT}/10-background/window-weather/window_autumn_rain_day_v01.webp`,
        autumn_rain_sunset: `${SHARED_ROOT}/10-background/window-weather/window_autumn_rain_sunset_v01.webp`,
        autumn_rain_night: `${SHARED_ROOT}/10-background/window-weather/window_autumn_rain_night_v01.webp`,
        winter_cloudy_sunset: `${SHARED_ROOT}/10-background/window-weather/window_winter_cloudy_sunset_v01.webp`,
        winter_snow_sunset: `${SHARED_ROOT}/10-background/window-weather/window_winter_snow_sunset_v01.webp`,
        winter_post_snow_day: `${SHARED_ROOT}/10-background/window-weather/window_winter_post_snow_day_v01.webp`,
        winter_post_snow_sunset: `${SHARED_ROOT}/10-background/window-weather/window_winter_post_snow_sunset_v01.webp`,
        winter_post_snow_night: `${SHARED_ROOT}/10-background/window-weather/window_winter_post_snow_night_v01.webp`
      })
    },
    interactionIcons: {
      secret: `${PRE_HATCH_ROOT}/50-overlays/interaction-icons/interaction_secret_p8_v01.png`,
      quiet: `${PRE_HATCH_ROOT}/50-overlays/interaction-icons/interaction_quiet_p8_v01.png`,
      window: `${PRE_HATCH_ROOT}/50-overlays/interaction-icons/interaction_window_p8_v01.png`,
      touch: `${PRE_HATCH_ROOT}/50-overlays/interaction-icons/interaction_touch_p8_v01.png`,
      draw: `${UI_3D_ACTIONS_ROOT}/ui_3d_drawing_palette_128_p8_v01.png`,
      wish: `${UI_3D_ACTIONS_ROOT}/ui_3d_wishing_fountain_two_tier_simple_128_p8_v01.png`,
      learn: `${UI_3D_ACTIONS_ROOT}/ui_3d_early_learning_picture_book_simple_128_p8_v01.png`,
      schedule: `${UI_3D_ACTIONS_ROOT}/ui_3d_schedule_flip_calendar_128_p8_v01.png`,
      talk: `${PRE_HATCH_ROOT}/50-overlays/interaction-icons/interaction_talk_p8_v01.png`
    }
  }
};
