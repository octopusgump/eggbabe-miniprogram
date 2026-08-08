const preHatchAssets = require('./pre-hatch-assets').PRE_HATCH;

// 破壳后所有正式运行时图片路径集中在这里。
// 每套房间只使用一张连续的 2823 × 1672 全景图，避免窄长设备上三张独立
// aspectFill 切图产生裁切缺口与拼接线。
const PANORAMA_SCENE_ROOT = '/assets/scenes/lifecycle/post-hatch/10-background/panorama-three-screen/scene-sets';
// 日常动作是已经烘焙角色与道具的完整全景，不属于环境底图或透明角色层。
const ACTION_PANORAMA_CHARACTERS = Object.freeze({
  'jade-rabbit': Object.freeze({
    label: '玉兔',
    root: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom',
    supportsLampOffVariant: true
  }),
  'boon-koi': Object.freeze({
    label: '锦鲤',
    root: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/boon-koi/home-bedroom',
    supportsLampOffVariant: false
  })
});
const SCENE_ACTION_ROOT = '/assets/ui/3d-scene-actions/runtime';
const READY_PANORAMA_SCENE_KEYS = Object.freeze((preHatchAssets.sceneTesterOptions || []).map(scene => scene.key));
const readyPanoramaSceneKeys = new Set(READY_PANORAMA_SCENE_KEYS);
// 窗玻璃、窗框、窗台和可见窗帘的热区，以完整全景母图的原始像素坐标维护。
const PANORAMA_WINDOW_META = Object.freeze({
  width: 2823,
  height: 1672,
  windowRegions: Object.freeze([
    Object.freeze({ id: 'main-window', x: 1050, y: 0, width: 1570, height: 800 })
  ])
});
const PANORAMA_SCENE_SETS = Object.freeze((preHatchAssets.sceneTesterOptions || []).reduce((result, scene) => {
  const expectedPanorama = `${PANORAMA_SCENE_ROOT}/${scene.key}_post_hatch_panorama_v01.webp`;
  const ready = readyPanoramaSceneKeys.has(scene.key);
  result[scene.key] = Object.freeze({
    id: scene.key,
    label: scene.label,
    season: scene.season,
    weather: scene.weather,
    period: scene.period,
    lightPhase: scene.lightPhase,
    ready,
    panorama: ready ? expectedPanorama : '',
    windowMeta: ready ? PANORAMA_WINDOW_META : null,
    expected: Object.freeze({ panorama: expectedPanorama })
  });
  return result;
}, {}));

const ACTION_PANORAMA_FILES = Object.freeze({
  sleep: Object.freeze({
    day: 'home_bedroom_nap_day_v01.webp',
    sunset: 'home_bedroom_nap_sunset_v01.webp',
    night: 'home_bedroom_nap_night_v01.webp',
    nightAfterLampOff: 'home_bedroom_nap_lights_off_night_v01.webp'
  }),
  reading: Object.freeze({ day: 'home_bedroom_read_day_v01.webp', sunset: 'home_bedroom_read_sunset_v01.webp', night: 'home_bedroom_read_night_v01.webp' }),
  gaming: Object.freeze({ day: 'home_bedroom_game_day_v01.webp', sunset: 'home_bedroom_game_sunset_v01.webp', night: 'home_bedroom_game_night_v01.webp' }),
  window: Object.freeze({ day: 'home_bedroom_window_day_v01.webp', sunset: 'home_bedroom_window_sunset_v01.webp', night: 'home_bedroom_window_night_v01.webp' }),
  drawing: Object.freeze({ day: 'home_bedroom_draw_day_v01.webp', sunset: 'home_bedroom_draw_sunset_v01.webp', night: 'home_bedroom_draw_night_v01.webp' }),
  music: Object.freeze({ day: 'home_bedroom_music_day_v01.webp', sunset: 'home_bedroom_music_sunset_v01.webp', night: 'home_bedroom_music_night_v01.webp' })
});
// 已审核的季节天气动作图优先于通用晴朗动作图；没有登记的环境键继续使用环境全景。
const ACTION_PANORAMA_SCENE_KEY_FILES = Object.freeze({
  'jade-rabbit': Object.freeze({
    tea: Object.freeze({ spring_cloudy_day: 'home_bedroom_tea_spring_cloudy_day_v01.webp' }),
    reading: Object.freeze({ autumn_rain_sunset: 'home_bedroom_read_autumn_rain_sunset_v01.webp' })
  }),
  'boon-koi': Object.freeze({
    sleep: Object.freeze({ summer_storm_night: 'home_bedroom_nap_summer_storm_night_v01.webp' }),
    window: Object.freeze({ winter_snow_day: 'home_bedroom_window_winter_snow_day_v01.webp' })
  })
});

function actionPanoramaScenesFor(characterKey) {
  const character = ACTION_PANORAMA_CHARACTERS[characterKey];
  const sceneKeyActions = ACTION_PANORAMA_SCENE_KEY_FILES[characterKey] || {};
  const stateKeys = Array.from(new Set(Object.keys(ACTION_PANORAMA_FILES).concat(Object.keys(sceneKeyActions))));
  return Object.freeze(stateKeys.reduce((result, stateKey) => {
    const periods = ACTION_PANORAMA_FILES[stateKey] || {};
    const sceneKeyFiles = ACTION_PANORAMA_SCENE_KEY_FILES[characterKey] && ACTION_PANORAMA_SCENE_KEY_FILES[characterKey][stateKey] || {};
    result[stateKey] = Object.freeze({
      stateKey,
      label: `${character.label} · ${stateKey}`,
      // 仅晴朗天气具备已烘焙的日间、日落与夜间窗景；其他天气继续使用环境全景。
      weather: 'sunny',
      panoramaByPeriod: Object.freeze({
        day: periods.day ? `${character.root}/${periods.day}` : '',
        sunset: periods.sunset ? `${character.root}/${periods.sunset}` : '',
        night: periods.night ? `${character.root}/${periods.night}` : ''
      }),
      panoramaBySceneKey: Object.freeze(Object.keys(sceneKeyFiles).reduce((paths, sceneKey) => {
        paths[sceneKey] = `${character.root}/${sceneKeyFiles[sceneKey]}`;
        return paths;
      }, {})),
      panoramaAfterAction: character.supportsLampOffVariant && periods.nightAfterLampOff
        ? Object.freeze({ night: `${character.root}/${periods.nightAfterLampOff}` })
        : null,
      windowMeta: PANORAMA_WINDOW_META,
      bakedCharacter: true,
      bakedProps: true
    });
    return result;
  }, {}));
}

const ACTION_PANORAMA_SCENES_BY_CHARACTER = Object.freeze(Object.keys(ACTION_PANORAMA_CHARACTERS).reduce((result, characterKey) => {
  result[characterKey] = actionPanoramaScenesFor(characterKey);
  return result;
}, {}));
// 兼容现有只读取玉兔清单的调用方；新调用必须按角色使用 actionPanoramaScenesByCharacter。
const ACTION_PANORAMA_SCENES = Object.freeze(Object.keys(ACTION_PANORAMA_FILES).reduce((result, stateKey) => {
  result[stateKey] = ACTION_PANORAMA_SCENES_BY_CHARACTER['jade-rabbit'][stateKey];
  return result;
}, {}));

function resolveCdnPath(path, cdnBase) {
  const source = String(path || '');
  const base = String(cdnBase || '').replace(/\/$/, '');
  return base && source.startsWith('/assets/scenes/lifecycle/') ? `${base}${source}` : source;
}

function resolvePanoramaScene(sceneKey, cdnBase) {
  const sceneSet = PANORAMA_SCENE_SETS[String(sceneKey || '')];
  if (!sceneSet || !sceneSet.ready) return null;
  return Object.assign({}, sceneSet, { panorama: resolveCdnPath(sceneSet.panorama, cdnBase) });
}

function actionPanoramaCharacterKey(pet) {
  const prototype = String(pet && pet.prototype || '');
  if (prototype === '玉兔' || prototype === 'YT') return 'jade-rabbit';
  if (prototype === '锦鲤' || prototype === 'KOI') return 'boon-koi';
  return '';
}

function resolveActionPanorama(pet, currentState, environment, cdnBase) {
  const characterKey = actionPanoramaCharacterKey(pet);
  if (!characterKey || !currentState || !currentState.atHome) return null;
  const stateKey = String(currentState.key || '');
  const scene = ACTION_PANORAMA_SCENES_BY_CHARACTER[characterKey][stateKey];
  const weather = String(environment && environment.weather || '');
  const period = String(environment && environment.period || '');
  const sceneKey = String(environment && environment.sceneKey || '');
  const lampTurnedOff = stateKey === 'sleep' && currentState.actionDone && currentState.action && currentState.action.id === 'lamp_off';
  const source = scene && (scene.panoramaBySceneKey[sceneKey] || (scene.weather === weather
    ? (lampTurnedOff && scene.panoramaAfterAction && scene.panoramaAfterAction[period]) || scene.panoramaByPeriod[period]
    : ''));
  if (!source) return null;
  return Object.assign({}, scene, {
    id: `${characterKey}-home-bedroom-${stateKey}-${period}`,
    period,
    variant: lampTurnedOff && scene.panoramaAfterAction && scene.panoramaAfterAction[period] ? 'lights-off' : 'default',
    panorama: resolveCdnPath(source, cdnBase)
  });
}

module.exports = {
  expectedPaths: {
    panoramaSceneSets: `${PANORAMA_SCENE_ROOT}/{scene_key}_post_hatch_panorama_v01.webp`,
    actionPanoramas: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/{jade-rabbit|boon-koi}/home-bedroom/home_bedroom_{nap|read|game|window|draw|music}_{day|sunset|night}_v01.webp',
    jadeRabbit: '/assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/',
    boonKoi: '/assets/scenes/lifecycle/post-hatch/30-character/boon-koi/',
    magicWindow: '/assets/scenes/lifecycle/post-hatch/50-overlays/magic-window/',
    keepsakes: '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/',
    postcards: '/assets/scenes/lifecycle/post-hatch/50-overlays/postcards/',
    moodFaces: '/assets/scenes/lifecycle/post-hatch/50-overlays/mood-faces/'
  },
  POST_HATCH: {
    panoramaAssetsReady: READY_PANORAMA_SCENE_KEYS.length === Object.keys(PANORAMA_SCENE_SETS).length,
    readyPanoramaSceneKeys: READY_PANORAMA_SCENE_KEYS,
    panoramaSceneSets: PANORAMA_SCENE_SETS,
    // 仅供尚未加载环境状态的初始占位，不得作为错误天气的静默降级。
    panoramaFallback: '',
    panoramaFallbackMeta: PANORAMA_WINDOW_META,
    actionPanoramaScenes: ACTION_PANORAMA_SCENES,
    actionPanoramaScenesByCharacter: ACTION_PANORAMA_SCENES_BY_CHARACTER,
    sceneActions: {
      envelope: `${SCENE_ACTION_ROOT}/ui_3d_scene_message_envelope_96_v01.webp`,
      toolbox: `${SCENE_ACTION_ROOT}/ui_3d_scene_toolbox_closed_chest_96_v01.webp`,
      findHome: {
        egg: `${SCENE_ACTION_ROOT}/ui_3d_scene_find_home_egg_96_v01.webp`,
        jadeRabbit: `${SCENE_ACTION_ROOT}/ui_3d_scene_find_home_jade_rabbit_96_v01.webp`,
        boonKoi: `${SCENE_ACTION_ROOT}/ui_3d_scene_find_home_boon_koi_96_v01.webp`
      }
    },
    // 只有大理 / 北京 / 西双版纳三张正式景区素材全部完成后才开放入口。
    // 旅行大场景永远不读取这里的图片，只显示空着的家与第一人称文字。
    magicWindow: {
      enabled: false,
      destinations: { dali: '', beijing: '', xishuangbanna: '' }
    },
    keepsakes: {
      'soft-button': '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_old_wooden_button_card_square_3d_transparent_v01.webp',
      'tea-tag': '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_dried_tea_tag_card_square_3d_transparent_v01.webp',
      'short-pencil': '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_short_pencil_card_square_3d_transparent_v01.webp',
      'dali-cloud': '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_dali_cloud_stone_card_square_3d_transparent_v01.webp',
      'cafe-coaster': '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_cork_coaster_card_square_3d_transparent_v01.webp',
      'wood-rattle': '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_small_wood_rattle_card_square_3d_transparent_v01.webp',
      'ginkgo-leaf': '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_ginkgo_leaf_card_square_3d_transparent_v01.webp',
      'rain-seed': '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_rainforest_seed_pod_card_square_3d_transparent_v01.webp',
      'delivery-clip': '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_red_order_clip_card_square_3d_transparent_v01.webp',
      'rainbow-cloth': '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_rainbow_carwash_cloth_card_square_3d_transparent_v01.webp'
    },
    postcards: {},
    moodFaces: {}
  },
  resolvePanoramaScene,
  resolveActionPanorama
};
