// 破壳前正式素材集中配置。
// 季节/天气使用完整房间背景；窝垫、蛋体、互动效果与 UI 仍保持独立图层。
const ROOT = '/assets/scenes/lifecycle';
const PRE_HATCH_ROOT = `${ROOT}/pre-hatch`;
const SHARED_ROOT = `${ROOT}/shared`;
const FULL_SCENE_ROOT = `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes`;
const EGG_SCENE_ROOT = `${PRE_HATCH_ROOT}/30-character/egg/season-weather`;
const NEST_SCENE_ROOT = `${PRE_HATCH_ROOT}/20-room-objects/window-and-nest/season-weather`;
const UI_3D_ACTIONS_ROOT = '/assets/ui/3d-actions/runtime';

const SCENE_TESTER_OPTIONS = [
  ['spring_clear_day', '春季', '晴朗·日间', 'spring', 'sunny', 'day', 'midday'],
  ['spring_clear_sunset', '春季', '晴朗·日落', 'spring', 'sunny', 'day', 'sunset'],
  ['spring_clear_night', '春季', '晴朗·夜晚', 'spring', 'sunny', 'night', 'night'],
  ['spring_cloudy_day', '春季', '阴天·日间', 'spring', 'cloudy', 'day', 'midday'],
  ['spring_rain_day', '春季', '雨天·日间', 'spring', 'rain', 'day', 'midday'],
  ['summer_clear_day', '夏季', '晴朗·日间', 'summer', 'sunny', 'day', 'midday'],
  ['summer_clear_sunset', '夏季', '晴朗·日落', 'summer', 'sunny', 'day', 'sunset'],
  ['summer_clear_night', '夏季', '晴朗·夜晚', 'summer', 'sunny', 'night', 'night'],
  ['summer_cloudy_day', '夏季', '阴天·日间', 'summer', 'cloudy', 'day', 'midday'],
  ['summer_storm_night', '夏季', '雷雨·夜晚', 'summer', 'storm', 'night', 'night'],
  ['autumn_clear_day', '秋季', '晴朗·日间', 'autumn', 'sunny', 'day', 'midday'],
  ['autumn_clear_sunset', '秋季', '晴朗·日落', 'autumn', 'sunny', 'day', 'sunset'],
  ['autumn_clear_night', '秋季', '晴朗·夜晚', 'autumn', 'sunny', 'night', 'night'],
  ['autumn_rain_day', '秋季', '雨天·日间', 'autumn', 'rain', 'day', 'midday'],
  ['winter_clear_day', '冬季', '晴朗·日间', 'winter', 'sunny', 'day', 'midday'],
  ['winter_clear_night', '冬季', '晴朗·夜晚', 'winter', 'sunny', 'night', 'night'],
  ['winter_cloudy_day', '冬季', '阴天·日间', 'winter', 'cloudy', 'day', 'midday'],
  ['winter_snow_day', '冬季', '降雪·日间', 'winter', 'snow', 'day', 'midday'],
  ['winter_snow_night', '冬季', '降雪·夜晚', 'winter', 'snow', 'night', 'night'],
  ['winter_post_snow_day', '冬季', '雪后·日间', 'winter', 'postSnow', 'day', 'midday']
].map(([key, seasonLabel, stateLabel, season, weather, period, lightPhase]) => ({
  key,
  seasonLabel,
  stateLabel,
  label: `${seasonLabel} · ${stateLabel}`,
  season,
  weather,
  period,
  lightPhase,
  className: `season-${season} weather-${weather} period-${period} light-${lightPhase}${lightPhase === 'sunset' ? ' window-sunset' : ''}`,
  background: `${FULL_SCENE_ROOT}/${key === 'spring_clear_night' ? 'spring_clear_night_moonlight' : key}.webp`,
  // 当前占位层经哈希确认仅有日间、夜间各一份内容。统一引用可避免把相同字节重复打进包；
  // 正式差异化素材交付后再恢复按 scene key 的原子映射。
  egg: `${EGG_SCENE_ROOT}/spring_clear_${period === 'night' ? 'night' : 'day'}_egg_right45.webp`,
  nest: `${NEST_SCENE_ROOT}/spring_clear_${period === 'night' ? 'night' : 'day'}_nest_pad.webp`,
  placeholder: true
}));

module.exports = {
  ROOT,
  PRE_HATCH: {
    roomBase: `${PRE_HATCH_ROOT}/10-background/incubation-room/room_base_candidate_v2.webp`,
    sceneTesterOptions: SCENE_TESTER_OPTIONS,
    fullScenes: {
      spring: {
        clearDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/spring_clear_day.webp`,
        clearSunset: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/spring_clear_sunset.webp`,
        clearNight: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/spring_clear_night.webp`,
        clearNightV2: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/spring_clear_night_v2.webp`,
        clearNightMoonlight: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/spring_clear_night_moonlight.webp`,
        cloudyDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/spring_cloudy_day.webp`,
        rainDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/spring_rain_day.webp`
      },
      summer: {
        clearDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/summer_clear_day.webp`,
        clearSunset: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/summer_clear_sunset.webp`,
        clearNight: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/summer_clear_night.webp`,
        cloudyDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/summer_cloudy_day.webp`,
        stormNight: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/summer_storm_night.webp`
      },
      autumn: {
        clearDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/autumn_clear_day.webp`,
        clearSunset: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/autumn_clear_sunset.webp`,
        clearNight: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/autumn_clear_night.webp`,
        rainDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/autumn_rain_day.webp`
      },
      winter: {
        clearDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/winter_clear_day.webp`,
        clearNight: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/winter_clear_night.webp`,
        cloudyDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/winter_cloudy_day.webp`,
        snowDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/winter_snow_day.webp`,
        snowNight: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/winter_snow_night.webp`,
        postSnowDay: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/winter_post_snow_day.webp`
      }
    },
    nestPad: `${PRE_HATCH_ROOT}/20-room-objects/window-and-nest/nest_pad.webp`,
    eggOnNest: `${PRE_HATCH_ROOT}/30-character/egg/egg_on_nest.webp`,
    eggWindowBack: `${PRE_HATCH_ROOT}/30-character/egg/egg_window_back.webp`,
    rotationSample: {
      warmDay: {
        nestPad: `${PRE_HATCH_ROOT}/20-room-objects/window-and-nest/rotation-sample/warm-day/nest_pad.webp`,
        egg: {
          left45: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/warm-day/egg_left_45.webp`,
          front: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/warm-day/egg_front.webp`,
          right45: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/warm-day/egg_right_45.webp`,
          sprite: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/warm-day/egg_rotation_sprite.webp`
        }
      },
      warmDayV2: {
        nestPad: `${PRE_HATCH_ROOT}/20-room-objects/window-and-nest/rotation-sample/warm-day-v2/nest_pad.webp`,
        egg: {
          left45: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/warm-day-v2/egg_left_45.webp`,
          front: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/warm-day-v2/egg_front.webp`,
          right45: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/warm-day-v2/egg_right_45.webp`,
          sprite: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/warm-day-v2/egg_rotation_sprite.webp`
        }
      },
      clearNightV1: {
        background: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/spring_clear_night.webp`,
        // 夜晚垫子尚未定稿；测试页先复用分层日间垫子，方便后续无代码替换。
        nestPad: `${PRE_HATCH_ROOT}/20-room-objects/window-and-nest/rotation-sample/warm-day-v2/nest_pad.webp`,
        egg: {
          right45: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/clear-night-v1/egg_right_45.webp`
        }
      },
      clearNightV2: {
        // 已确认：保留底图现有的地板月光阴影，不叠加垫子落地阴影；蛋底接触阴影保持独立可替换。
        background: `${PRE_HATCH_ROOT}/10-background/incubation-room/season-weather-full-scenes/spring_clear_night_moonlight.webp`,
        nestPad: `${PRE_HATCH_ROOT}/20-room-objects/window-and-nest/rotation-sample/clear-night-v2/nest_pad.webp`,
        egg: {
          right45: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/clear-night-v2/egg_right_45.webp`,
          contactShadow: `${PRE_HATCH_ROOT}/30-character/egg/rotation-sample/clear-night-v2/egg_contact_shadow.webp`
        }
      }
    },
    windowWeather: {
      clearDay: `${SHARED_ROOT}/10-background/window-weather/w_01_clear_day.webp`,
      clearSunset: `${SHARED_ROOT}/10-background/window-weather/w_02_clear_sunset.webp`,
      clearNight: `${SHARED_ROOT}/10-background/window-weather/w_03_clear_night.webp`,
      cloudyDay: `${SHARED_ROOT}/10-background/window-weather/w_04_cloudy_day.webp`,
      cloudyNight: `${SHARED_ROOT}/10-background/window-weather/w_05_cloudy_night.webp`,
      snowDay: `${SHARED_ROOT}/10-background/window-weather/w_06_snow_day.webp`,
      snowNight: `${SHARED_ROOT}/10-background/window-weather/w_07_snow_night.webp`
    },
    // 房间明暗只允许使用正式图片层，禁止 CSS 渐变或 brightness 模拟。
    // 两张图完成并放入目录后，将 enabled 改为 true 即可启用。
    roomLighting: {
      enabled: false,
      nightLampOn: `${PRE_HATCH_ROOT}/40-interaction-fx/room-lighting/room_night_lamp_on_overlay.webp`,
      nightLampOff: `${PRE_HATCH_ROOT}/40-interaction-fx/room-lighting/room_night_lamp_off_overlay.webp`
    },
    interactionIcons: {
      secret: `${PRE_HATCH_ROOT}/50-overlays/interaction-icons/interaction_secret.svg`,
      quiet: `${PRE_HATCH_ROOT}/50-overlays/interaction-icons/interaction_quiet.svg`,
      window: `${PRE_HATCH_ROOT}/50-overlays/interaction-icons/interaction_window.svg`,
      touch: `${PRE_HATCH_ROOT}/50-overlays/interaction-icons/interaction_touch.svg`,
      draw: `${UI_3D_ACTIONS_ROOT}/ui_3d_drawing_palette_256_v02.webp`,
      wish: `${UI_3D_ACTIONS_ROOT}/ui_3d_wishing_fountain_two_tier_simple_256_v04.webp`,
      learn: `${UI_3D_ACTIONS_ROOT}/ui_3d_early_learning_picture_book_simple_256_v03.webp`,
      schedule: `${UI_3D_ACTIONS_ROOT}/ui_3d_schedule_flip_calendar_256_v02.webp`,
      talk: `${PRE_HATCH_ROOT}/50-overlays/interaction-icons/interaction_talk.svg`
    }
  }
};
