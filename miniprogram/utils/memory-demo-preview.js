const lifeScenes = require('./life-scenes');

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

function keepsakeFixtures() {
  const seen = new Set();
  return (lifeScenes.HOME_STATES || []).concat(lifeScenes.AWAY_STATES || []).reduce((result, scene) => {
    const item = scene && scene.keepsake;
    if (!item || !item.id || !item.asset || seen.has(item.id)) return result;
    seen.add(item.id);
    result.push(Object.assign({}, item, { sourceScene: `${scene.majorLabel} · ${scene.label}` }));
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
    postcards: POSTCARD_FIXTURES.map(item => Object.assign({}, item)),
    cardRecommendation
  };
}

module.exports = { build, keepsakeFixtures };
