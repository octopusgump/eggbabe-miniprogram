const lifeScenes = require('./life-scenes');

const TOKYO_POSTCARD_ROOT = '/assets/scenes/lifecycle/post-hatch/50-overlays/postcards/_candidates/travel-activities-v01/japan/tokyo/';

const POSTCARD_FIXTURES = Object.freeze([
  Object.freeze({
    id: 'memory-preview-postcard-dali',
    sceneLabel: '旅行 · 大理',
    line: '风从苍山那边吹过来，我把帽子按住，也替你看了一会儿云。',
    deliveredAt: '2026-07-19T09:30:00+08:00',
    asset: ''
  }),
  Object.freeze({
    id: 'memory-preview-postcard-cafe',
    sceneLabel: '打工 · 咖啡店',
    line: '今天把最后一只杯子擦得很亮，窗外的光正好落在杯沿上。',
    deliveredAt: '2026-07-23T16:10:00+08:00',
    asset: ''
  }),
  Object.freeze({
    id: 'memory-preview-postcard-beijing',
    sceneLabel: '旅行 · 北京',
    line: '银杏叶落在红墙边，我挑了一片边缘最完整的夹在信纸里。',
    deliveredAt: '2026-07-28T11:20:00+08:00',
    asset: ''
  }),
  Object.freeze({
    id: 'memory-preview-postcard-school',
    sceneLabel: '上学 · 气象课',
    line: '老师说雨来以前，云的边缘会先暗一点。我想下次和你一起认。',
    deliveredAt: '2026-08-02T15:40:00+08:00',
    asset: ''
  })
]);

const TOKYO_POSTCARD_FIXTURES = Object.freeze([
  Object.freeze({
    id: 'tokyo-alley-morning-stretch',
    sceneId: 'alley',
    sceneLabel: '东京 · 咖啡巷',
    actionId: 'morning_stretch',
    actionLabel: '晨光里的伸展',
    line: '巷子刚亮起来，我先在石板路上伸了个懒腰，远处的塔也像刚刚醒来。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_alley_morning_stretch_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-alley-leaf-hop',
    sceneId: 'alley',
    sceneLabel: '东京 · 咖啡巷',
    actionId: 'leaf_hop',
    actionLabel: '跳过一片落叶',
    line: '有片叶子正好落在路中间，我轻轻跳了过去，落地时它又被风吹远了一点。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_alley_leaf_hop_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-alley-bench-selfie',
    sceneId: 'alley',
    sceneLabel: '东京 · 咖啡巷',
    actionId: 'bench_selfie',
    actionLabel: '木凳上的自拍',
    line: '木凳比看起来更暖，我坐下来拍了一张，照片里还装进了巷子尽头的一点红色。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_alley_bench_selfie_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-alley-camera-playback',
    sceneId: 'alley',
    sceneLabel: '东京 · 咖啡巷',
    actionId: 'camera_playback',
    actionLabel: '看看刚才的照片',
    line: '我低头看了看刚拍的照片，最清楚的不是塔，是被晨光照亮的一小块木门。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_alley_camera_playback_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-alley-bench-hot-drink',
    sceneId: 'alley',
    sceneLabel: '东京 · 咖啡巷',
    actionId: 'bench_hot_drink',
    actionLabel: '捧一杯热饮',
    line: '杯子暖得刚刚好，我捧着它坐了一会儿，巷子里的声音也慢慢变多了。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_alley_bench_hot_drink_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-alley-peace-tower',
    sceneId: 'alley',
    sceneLabel: '东京 · 咖啡巷',
    actionId: 'peace_tower',
    actionLabel: '和东京塔合影',
    line: '我对着远处的塔比了一个小小的手势，快门响的时候，风正好把耳朵吹到一边。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_alley_peace_tower_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-alley-wish',
    sceneId: 'alley',
    sceneLabel: '东京 · 咖啡巷',
    actionId: 'wish',
    actionLabel: '在塔下许愿',
    line: '我朝远处合起爪子，没有把愿望说出来，只记得那一刻巷子特别安静。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_alley_wish_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-alley-back-tower',
    sceneId: 'alley',
    sceneLabel: '东京 · 咖啡巷',
    actionId: 'back_tower',
    actionLabel: '再看一会儿东京塔',
    line: '走到巷子中央时我又回头看了一会儿，塔没有变小，只是天变得更亮了。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_alley_back_tower_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-terrace-morning-hot-drink',
    sceneId: 'terrace',
    sceneLabel: '东京 · 城市露台',
    actionId: 'morning_hot_drink_view',
    actionLabel: '晨光里看富士山',
    line: '清晨的城市还没有完全醒，我捧着杯子坐在露台上，远处的山先被太阳照亮了。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_morning_terrace_hot_drink_view_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-terrace-morning-stretch',
    sceneId: 'terrace',
    sceneLabel: '东京 · 城市露台',
    actionId: 'morning_stretch',
    actionLabel: '露台上的伸展',
    line: '风从城市上面吹过来，我伸开爪子站稳了一会儿，耳朵里都是很轻的声音。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_morning_terrace_morning_stretch_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-terrace-night-selfie',
    sceneId: 'terrace',
    sceneLabel: '东京 · 城市露台',
    actionId: 'night_selfie',
    actionLabel: '城市亮灯后的自拍',
    line: '天色变成桃蓝色以后，城市的灯一盏一盏亮起来，我把塔和远山都装进了照片里。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_night_terrace_selfie_jade_rabbit_v02.webp`
  }),
  Object.freeze({
    id: 'tokyo-terrace-night-wish',
    sceneId: 'terrace',
    sceneLabel: '东京 · 城市露台',
    actionId: 'night_wish',
    actionLabel: '暮色里的愿望',
    line: '最后一束光落到山后面时，我安静地合起爪子，这次也没有把愿望说出来。',
    asset: `${TOKYO_POSTCARD_ROOT}postcard_travel_tokyo_night_terrace_wish_jade_rabbit_v02.webp`
  })
]);

const TOKYO_JOURNEY_FIXTURE = Object.freeze({
  id: 'memory-preview-journey-tokyo',
  type: 'travel_memory',
  journeyId: 'tokyo-preview-2026-08-07',
  destinationId: 'tokyo',
  sceneLabel: '东京之旅',
  line: '从安静的咖啡巷走到能看见富士山的露台，这些是我在东京留下的画面。',
  deliveredAt: '2026-08-07T19:20:00+08:00',
  asset: TOKYO_POSTCARD_FIXTURES[0].asset,
  postcards: TOKYO_POSTCARD_FIXTURES
});

function tokyoJourneyFixture() {
  return Object.assign({}, TOKYO_JOURNEY_FIXTURE, {
    postcards: TOKYO_POSTCARD_FIXTURES.map(item => Object.assign({}, item))
  });
}

function keepsakeFixtures() {
  const seen = new Set();
  return (lifeScenes.HOME_STATES || []).concat(lifeScenes.AWAY_STATES || []).reduce((result, scene) => {
    const item = scene && scene.keepsake;
    if (!item || !item.id || !item.asset || seen.has(item.id)) return result;
    seen.add(item.id);
    const majorLabel = scene.major === 'home' ? '在家' : scene.majorLabel;
    result.push(Object.assign({}, item, { sourceScene: `${majorLabel} · ${scene.label}` }));
    return result;
  }, []);
}

function recommendationFor(pet, source) {
  const existing = source && source.cardRecommendation;
  if (existing && existing.card) return Object.assign({}, existing, { card: Object.assign({}, existing.card) });
  if (!pet || !pet.collectionCard) return null;
  return {
    card: Object.assign({}, pet.collectionCard),
    line: '今天再看一眼出生那天，光还是落在同一个地方。',
    source: 'demo-preview'
  };
}

function build(index, pet, source) {
  const normalizedIndex = Math.max(0, Math.min(2, Number(index) || 0));
  const keepsakes = keepsakeFixtures();
  const cardRecommendation = recommendationFor(pet, source || {});

  if (normalizedIndex === 0) return { keepsakes: [], postcards: [], cardRecommendation: null };
  if (normalizedIndex === 1) {
    return {
      keepsakes: keepsakes.slice(0, 3),
      postcards: POSTCARD_FIXTURES.slice(0, 2).map(item => Object.assign({}, item)),
      cardRecommendation
    };
  }
  return {
    keepsakes: keepsakes.map(item => Object.assign({}, item)),
    postcards: [tokyoJourneyFixture()],
    cardRecommendation
  };
}

module.exports = { build, keepsakeFixtures, tokyoJourneyFixture };
