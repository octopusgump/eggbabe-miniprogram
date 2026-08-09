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
const TOOLBOX_ICON_ROOT = '/assets/ui/3d-toolbox/runtime';
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
  result[scene.key] = Object.freeze({
    id: scene.key,
    label: scene.label,
    season: scene.season,
    weather: scene.weather,
    period: scene.period,
    lightPhase: scene.lightPhase,
    panorama: expectedPanorama,
    windowMeta: PANORAMA_WINDOW_META,
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
// 通用晴朗动作图只烘焙了春季晴天的窗景（浅绿嫩叶 + 薄白天空）。夏、秋、冬晴天的
// 空房全景窗外分别是浓绿、金黄与雪景，按时段套用会显示错误季节，因此这里把每张
// 通用图精确登记到它实际烘焙的环境键上。补齐其他季节的动作图后，在本表追加对应
// 环境键即可；未登记的环境键一律回落到同环境空房全景。
const GENERIC_ACTION_SCENE_KEYS = Object.freeze({
  day: 'spring_clear_day',
  sunset: 'spring_clear_sunset',
  night: 'spring_clear_night'
});
// 已审核的季节天气动作图优先于通用晴朗动作图；没有登记的环境键继续使用环境全景。
const ACTION_PANORAMA_SCENE_KEY_FILES = Object.freeze({
  'jade-rabbit': Object.freeze({
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
    const sceneKeyFiles = sceneKeyActions[stateKey] || {};
    // 通用晴朗动作图按其实际烘焙的环境键登记，已审核的特殊天气图覆盖同名环境键。
    const bySceneKey = Object.keys(GENERIC_ACTION_SCENE_KEYS).reduce((paths, period) => {
      if (periods[period]) paths[GENERIC_ACTION_SCENE_KEYS[period]] = `${character.root}/${periods[period]}`;
      return paths;
    }, {});
    Object.keys(sceneKeyFiles).forEach(sceneKey => {
      bySceneKey[sceneKey] = `${character.root}/${sceneKeyFiles[sceneKey]}`;
    });
    const lampOffSceneKey = GENERIC_ACTION_SCENE_KEYS.night;
    result[stateKey] = Object.freeze({
      stateKey,
      label: `${character.label} · ${stateKey}`,
      panoramaBySceneKey: Object.freeze(bySceneKey),
      panoramaAfterActionBySceneKey: character.supportsLampOffVariant && periods.nightAfterLampOff && lampOffSceneKey
        ? Object.freeze({ [lampOffSceneKey]: `${character.root}/${periods.nightAfterLampOff}` })
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
  if (!sceneSet) return null;
  return Object.assign({}, sceneSet, { panorama: resolveCdnPath(sceneSet.panorama, cdnBase) });
}

// ---------------------------------------------------------------------------
// 场景锚点：ta 的位置、动作道具的位置、说话触点的位置。
//
// 坐标单位是 2823 × 1672 母图的像素，(x, y) 为锚点中心；元素自身尺寸仍由 wxss
// 用 rpx 控制，运行时靠 translate(-50%,-50%) 居中到这个点上。这样提示永远跟着
// 图里的物件走，不会因为机型比例不同被 aspectFill 裁到别处去。
//
// ⚠️ 当前数值是从旧的屏幕百分比在 4.7 寸（比例最接近母图）上反推出来的占位值，
// 精度只到"大概那一块"。正式动作图出齐后，请照母图逐个量取中心点替换：每个
// 状态需要三个点 —— character（ta 的身体中心）、action（该状态唯一动作所对应
// 的道具中心）、talk（说话触点，一般在 ta 头侧）。校准完把 provisional 改成
// false，verify 门禁会同时检查锚点所在屏与 life-scenes.js 声明的 screen 一致。
// ---------------------------------------------------------------------------
const SCENE_ANCHORS_PROVISIONAL = true;
const DEFAULT_STATE_ANCHORS = Object.freeze({
  sleep: Object.freeze({ character: { x: 349, y: 1095 }, action: { x: 708, y: 1046 }, talk: { x: 560, y: 799 } }),
  lazy: Object.freeze({ character: { x: 349, y: 1095 }, action: { x: 388, y: 1096 }, talk: { x: 560, y: 799 } }),
  stare: Object.freeze({ character: { x: 1459, y: 1129 }, action: { x: 1413, y: 1046 }, talk: { x: 1519, y: 866 } }),
  drawing: Object.freeze({ character: { x: 1459, y: 1129 }, action: { x: 1507, y: 1297 }, talk: { x: 1519, y: 866 } }),
  reading: Object.freeze({ character: { x: 1459, y: 1129 }, action: { x: 1469, y: 1129 }, talk: { x: 1519, y: 866 } }),
  gaming: Object.freeze({ character: { x: 1459, y: 1129 }, action: { x: 1262, y: 1146 }, talk: { x: 1519, y: 866 } }),
  music: Object.freeze({ character: { x: 1459, y: 1129 }, action: { x: 1488, y: 1163 }, talk: { x: 1519, y: 866 } }),
  window: Object.freeze({ character: { x: 2474, y: 543 }, action: { x: 2595, y: 459 }, talk: { x: 2545, y: 605 } })
});
// 玉兔与锦鲤的坐姿、体型和道具摆位不同时，在这里按状态覆盖对应的点；
// 留空表示两个角色共用 DEFAULT_STATE_ANCHORS。
const CHARACTER_STATE_ANCHORS = Object.freeze({
  'jade-rabbit': Object.freeze({}),
  'boon-koi': Object.freeze({})
});
// 外出时家里没有人，只保留中屏的留言触点，不渲染角色与动作提示。
const AWAY_ANCHORS = Object.freeze({ character: null, action: null, talk: null });

function actionPanoramaCharacterKey(pet) {
  const prototype = String(pet && pet.prototype || '');
  if (prototype === '玉兔' || prototype === 'YT') return 'jade-rabbit';
  if (prototype === '锦鲤' || prototype === 'KOI') return 'boon-koi';
  return '';
}

// 角色、居家状态与环境键必须全部精确匹配才返回动作全景；任何一项对不上都返回
// null，由调用方回落到同环境的空房全景，禁止跨季节、跨天气或跨时段代用。
function resolveStateAnchors(pet, currentState) {
  if (!currentState || !currentState.atHome) return AWAY_ANCHORS;
  const stateKey = String(currentState.key || '');
  const base = DEFAULT_STATE_ANCHORS[stateKey];
  if (!base) return AWAY_ANCHORS;
  const override = (CHARACTER_STATE_ANCHORS[actionPanoramaCharacterKey(pet)] || {})[stateKey] || {};
  return Object.freeze({
    character: override.character || base.character,
    action: override.action || base.action,
    talk: override.talk || base.talk
  });
}

function resolveActionPanorama(pet, currentState, environment, cdnBase) {
  const characterKey = actionPanoramaCharacterKey(pet);
  if (!characterKey || !currentState || !currentState.atHome) return null;
  const stateKey = String(currentState.key || '');
  const scene = ACTION_PANORAMA_SCENES_BY_CHARACTER[characterKey][stateKey];
  if (!scene) return null;
  const period = String(environment && environment.period || '');
  const sceneKey = String(environment && environment.sceneKey || '');
  const lampTurnedOff = stateKey === 'sleep' && currentState.actionDone && currentState.action && currentState.action.id === 'lamp_off';
  const afterAction = lampTurnedOff && scene.panoramaAfterActionBySceneKey
    ? scene.panoramaAfterActionBySceneKey[sceneKey] || ''
    : '';
  const source = afterAction || scene.panoramaBySceneKey[sceneKey] || '';
  if (!source) return null;
  return Object.assign({}, scene, {
    id: `${characterKey}-home-bedroom-${stateKey}-${sceneKey}`,
    period,
    variant: afterAction ? 'lights-off' : 'default',
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
    panoramaSceneSets: PANORAMA_SCENE_SETS,
    // 仅供尚未加载环境状态的初始占位，不得作为错误天气的静默降级。
    panoramaFallback: '',
    panoramaFallbackMeta: PANORAMA_WINDOW_META,
    actionPanoramaScenes: ACTION_PANORAMA_SCENES,
    actionPanoramaScenesByCharacter: ACTION_PANORAMA_SCENES_BY_CHARACTER,
    sceneAnchorsProvisional: SCENE_ANCHORS_PROVISIONAL,
    defaultStateAnchors: DEFAULT_STATE_ANCHORS,
    characterStateAnchors: CHARACTER_STATE_ANCHORS,
    sceneActions: {
      toolbox: `${SCENE_ACTION_ROOT}/ui_3d_scene_toolbox_closed_chest_96_v01.webp`,
      // 百宝箱四个入口的图标；页面不再自行写死路径。
      toolboxItems: {
        my: '/assets/ui/3d-actions/runtime/ui_3d_tabbar_interaction_gear_flat_96_v04.png',
        card: `${TOOLBOX_ICON_ROOT}/ui_3d_toolbox_collection_card_front_96_v03.webp`,
        postcards: `${TOOLBOX_ICON_ROOT}/ui_3d_toolbox_postcard_vintage_front_96_v03.webp`,
        keepsakes: `${TOOLBOX_ICON_ROOT}/ui_3d_toolbox_keepsake_box_96_v01.png`
      },
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
  resolveActionPanorama,
  resolveStateAnchors
};
