const preHatchAssets = require('./pre-hatch-assets').PRE_HATCH;

// 破壳后所有正式运行时图片路径集中在这里。
// 空字符串代表正式素材尚未交付；页面只展示结构兜底，不把参考图或草稿当成品。
// 完整素材目录与替换规格见 assets/scenes/lifecycle/README.md。
const PANEL_SCENE_ROOT = '/assets/scenes/lifecycle/post-hatch/10-background';

// 只有左右两屏都通过验收后，才把对应状态 key 加入此数组。
// 中屏直接复用同状态的破壳前正式场景，禁止单独重画造成机位漂移。
const READY_PANEL_SCENE_KEYS = Object.freeze([]);
const readyPanelSceneKeys = new Set(READY_PANEL_SCENE_KEYS);
const PANEL_SCENE_SETS = Object.freeze((preHatchAssets.sceneTesterOptions || []).reduce((result, scene) => {
  const ready = readyPanelSceneKeys.has(scene.key);
  const expectedLeft = `${PANEL_SCENE_ROOT}/left-living/scene-sets/${scene.key}_left_living.webp`;
  const expectedRight = `${PANEL_SCENE_ROOT}/right-decor/scene-sets/${scene.key}_right_decor.webp`;
  result[scene.key] = Object.freeze({
    id: scene.key,
    label: scene.label,
    season: scene.season,
    weather: scene.weather,
    period: scene.period,
    lightPhase: scene.lightPhase,
    ready,
    leftLiving: ready ? expectedLeft : '',
    centerDesk: ready ? scene.background : '',
    rightDecor: ready ? expectedRight : '',
    expected: Object.freeze({ leftLiving: expectedLeft, centerDesk: scene.background, rightDecor: expectedRight })
  });
  return result;
}, {}));

function resolvePanelSceneSet(sceneKey) {
  const sceneSet = PANEL_SCENE_SETS[String(sceneKey || '')];
  return sceneSet && sceneSet.ready ? sceneSet : null;
}

module.exports = {
  expectedPaths: {
    panelSceneSets: `${PANEL_SCENE_ROOT}/{left-living|right-decor}/scene-sets/{scene_key}_{panel}.webp`,
    jadeRabbit: '/assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/',
    boonKoi: '/assets/scenes/lifecycle/post-hatch/30-character/boon-koi/',
    magicWindow: '/assets/scenes/lifecycle/post-hatch/50-overlays/magic-window/',
    keepsakes: '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/',
    postcards: '/assets/scenes/lifecycle/post-hatch/50-overlays/postcards/',
    moodFaces: '/assets/scenes/lifecycle/post-hatch/50-overlays/mood-faces/'
  },
  POST_HATCH: {
    panelAssetsReady: READY_PANEL_SCENE_KEYS.length === Object.keys(PANEL_SCENE_SETS).length,
    readyPanelSceneKeys: READY_PANEL_SCENE_KEYS,
    panelSceneSets: PANEL_SCENE_SETS,
    panoramaFallback: '/assets/scenes/lifecycle/post-hatch/10-background/panorama-three-screen/post_hatch_room_panorama_empty_day_placeholder.webp',
    leftLivingBackground: '',
    centerDeskBackground: '',
    rightDecorBackground: '',
    characterPoses: {
      sleep: '', lazy: '', stare: '', tea: '', drawing: '', gaming: '', window: ''
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
  resolvePanelSceneSet
};
