const preHatchAssets = require('./pre-hatch-assets').PRE_HATCH;

// 破壳后所有正式运行时图片路径集中在这里。
// 每套房间只使用一张连续的 2823 × 1672 全景图，避免窄长设备上三张独立
// aspectFill 切图产生裁切缺口与拼接线。
const PANORAMA_SCENE_ROOT = '/assets/scenes/lifecycle/post-hatch/10-background/panorama-three-screen/scene-sets';
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

module.exports = {
  expectedPaths: {
    panoramaSceneSets: `${PANORAMA_SCENE_ROOT}/{scene_key}_post_hatch_panorama_v01.webp`,
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
    characterPoses: {
      sleep: '/assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/sleep.webp',
      lazy: '', stare: '', tea: '', drawing: '', gaming: '', window: ''
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
  resolvePanoramaScene
};
