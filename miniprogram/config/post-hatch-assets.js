// 破壳后所有正式运行时图片路径集中在这里。
// 每套房间只使用一张连续的 2823 × 1672 全景图，避免窄长设备上三张独立
// aspectFill 切图产生裁切缺口与拼接线。
const PANORAMA_SCENE_ROOT = '/assets/scenes/lifecycle/post-hatch/10-background/panorama-three-screen/scene-sets';
// 日常动作是已经烘焙角色与道具的完整全景，不属于环境底图或透明角色层。
const ACTION_PANORAMA_CHARACTERS = Object.freeze({
  'jade-rabbit': Object.freeze({
    label: '玉兔',
    root: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom'
  }),
  'boon-koi': Object.freeze({
    label: '锦鲤',
    root: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/boon-koi/home-bedroom'
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
// 当前破壳后版本只发布白天、落日、黑夜三个时段，不读取季节或天气键。
// 三张空房全景沿用已经审核通过的春季晴朗文件，不改变既有文件名与 CDN 路径。
const POST_HATCH_PERIOD_OPTIONS = Object.freeze([
  Object.freeze({ key: 'day', label: '白天', period: 'day', lightPhase: 'midday', panoramaSource: 'spring_clear_day' }),
  Object.freeze({ key: 'sunset', label: '落日', period: 'sunset', lightPhase: 'sunset', panoramaSource: 'spring_clear_sunset' }),
  Object.freeze({ key: 'night', label: '黑夜', period: 'night', lightPhase: 'night', panoramaSource: 'spring_clear_night' })
]);
const PANORAMA_SCENE_SETS = Object.freeze(POST_HATCH_PERIOD_OPTIONS.reduce((result, option) => {
  const panorama = `${PANORAMA_SCENE_ROOT}/${option.panoramaSource}_post_hatch_panorama_v01.webp`;
  result[option.key] = Object.freeze({
    id: option.key,
    label: option.label,
    period: option.period,
    lightPhase: option.lightPhase,
    panorama,
    windowMeta: PANORAMA_WINDOW_META,
    expected: Object.freeze({ panorama })
  });
  return result;
}, {}));

// 产品口径中 `sleep` 是“睡觉”；其正式文件沿用早期 `nap` 文件名以保持 CDN 路径兼容。
// 产品口径中的“小憩”使用独立状态 `lazy` 和独立 `home_bedroom_lazy_*` 文件，不得复用本组图片。
const ACTION_PANORAMA_FILES = Object.freeze({
  sleep: Object.freeze({
    day: 'home_bedroom_nap_day_v01.webp',
    sunset: 'home_bedroom_nap_sunset_v01.webp',
    night: 'home_bedroom_nap_night_v01.webp'
  }),
  lazy: Object.freeze({ day: 'home_bedroom_lazy_day_v01.webp', sunset: 'home_bedroom_lazy_sunset_v01.webp', night: 'home_bedroom_lazy_night_v01.webp' }),
  stare: Object.freeze({ day: 'home_bedroom_stare_day_v01.webp', sunset: 'home_bedroom_stare_sunset_v01.webp', night: 'home_bedroom_stare_night_v01.webp' }),
  reading: Object.freeze({ day: 'home_bedroom_read_day_v01.webp', sunset: 'home_bedroom_read_sunset_v01.webp', night: 'home_bedroom_read_night_v01.webp' }),
  gaming: Object.freeze({ day: 'home_bedroom_game_day_v01.webp', sunset: 'home_bedroom_game_sunset_v01.webp', night: 'home_bedroom_game_night_v01.webp' }),
  window: Object.freeze({ day: 'home_bedroom_window_day_v01.webp', sunset: 'home_bedroom_window_sunset_v01.webp', night: 'home_bedroom_window_night_v01.webp' }),
  drawing: Object.freeze({ day: 'home_bedroom_draw_day_v01.webp', sunset: 'home_bedroom_draw_sunset_v01.webp', night: 'home_bedroom_draw_night_v01.webp' }),
  music: Object.freeze({ day: 'home_bedroom_music_day_v01.webp', sunset: 'home_bedroom_music_sunset_v01.webp', night: 'home_bedroom_music_night_v01.webp' })
});
function actionSceneDescriptor(character, stateKey, panoramaByPeriod) {
  return Object.freeze({
    stateKey,
    label: `${character.label} · ${stateKey}`,
    panoramaByPeriod: Object.freeze(panoramaByPeriod),
    windowMeta: PANORAMA_WINDOW_META,
    bakedCharacter: true,
    bakedProps: true
  });
}

// 正式动作资源固定为每个角色 8 个动作 × day/sunset/night = 24 张。
// 破壳后的动作解析只读取 period，不读取季节、天气或复合 scene key。
function actionPanoramaScenesFor(characterKey) {
  const character = ACTION_PANORAMA_CHARACTERS[characterKey];
  return Object.freeze(Object.keys(ACTION_PANORAMA_FILES).reduce((result, stateKey) => {
    const panoramaByPeriod = Object.keys(ACTION_PANORAMA_FILES[stateKey] || {}).reduce((paths, period) => {
      paths[period] = `${character.root}/${ACTION_PANORAMA_FILES[stateKey][period]}`;
      return paths;
    }, {});
    result[stateKey] = actionSceneDescriptor(character, stateKey, panoramaByPeriod);
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

function resolvePanoramaScene(period, cdnBase) {
  const sceneSet = PANORAMA_SCENE_SETS[String(period || '')];
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

// 角色、居家状态与时段必须全部精确匹配才返回动作全景；任何一项对不上都返回
// null，由调用方回落到同一时段的空房全景，禁止跨时段代用。
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
  const source = scene.panoramaByPeriod[period] || '';
  if (!source) return null;
  return Object.assign({}, scene, {
    id: `${characterKey}-home-bedroom-${stateKey}-${period}`,
    period,
    variant: 'default',
    panorama: resolveCdnPath(source, cdnBase)
  });
}

module.exports = {
  expectedPaths: {
    panoramaSceneSets: `${PANORAMA_SCENE_ROOT}/spring_clear_{day|sunset|night}_post_hatch_panorama_v01.webp`,
    actionPanoramas: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/{jade-rabbit|boon-koi}/home-bedroom/home_bedroom_{nap|lazy|stare|read|game|window|draw|music}_{day|sunset|night}_v01.webp',
    jadeRabbit: '/assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/',
    boonKoi: '/assets/scenes/lifecycle/post-hatch/30-character/boon-koi/',
    magicWindow: '/assets/scenes/lifecycle/post-hatch/50-overlays/magic-window/',
    keepsakes: '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/',
    postcards: '/assets/scenes/lifecycle/post-hatch/50-overlays/postcards/',
    moodFaces: '/assets/scenes/lifecycle/post-hatch/50-overlays/mood-faces/'
  },
  POST_HATCH: {
    periodSceneOptions: POST_HATCH_PERIOD_OPTIONS,
    panoramaSceneSets: PANORAMA_SCENE_SETS,
    // 仅供尚未加载时段状态的初始占位，不得作为错误时段的静默降级。
    panoramaFallback: '',
    panoramaFallbackMeta: PANORAMA_WINDOW_META,
    actionPanoramaScenes: ACTION_PANORAMA_SCENES,
    actionPanoramaScenesByCharacter: ACTION_PANORAMA_SCENES_BY_CHARACTER,
    sceneAnchorsProvisional: SCENE_ANCHORS_PROVISIONAL,
    defaultStateAnchors: DEFAULT_STATE_ANCHORS,
    characterStateAnchors: CHARACTER_STATE_ANCHORS,
    sceneActions: {
      toolbox: `${SCENE_ACTION_ROOT}/ui_3d_scene_toolbox_closed_chest_96_v01_p8_v01.png`,
      // 百宝箱四个入口的图标；页面不再自行写死路径。
      toolboxItems: {
        my: '/assets/ui/3d-actions/runtime/ui_3d_tabbar_interaction_gear_flat_96_v04_p8_v01.png',
        card: `${TOOLBOX_ICON_ROOT}/ui_3d_toolbox_collection_card_front_96_v03_p8_v01.png`,
        postcards: `${TOOLBOX_ICON_ROOT}/ui_3d_toolbox_postcard_vintage_front_96_v03_p8_v01.png`,
        keepsakes: `${TOOLBOX_ICON_ROOT}/ui_3d_toolbox_keepsake_box_96_v01_p8_v01.png`
      },
      findHome: {
        egg: `${SCENE_ACTION_ROOT}/ui_3d_scene_find_home_egg_96_v01_p8_v01.png`,
        jadeRabbit: `${SCENE_ACTION_ROOT}/ui_3d_scene_chat_jade_rabbit_96_v02.png`,
        boonKoi: `${SCENE_ACTION_ROOT}/ui_3d_scene_chat_boon_koi_96_v02.png`
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
