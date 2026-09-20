const MEMORY_STATES = Object.freeze({
  LOCKED: 'LOCKED',
  UNLOCKED: 'UNLOCKED',
  NEW: 'NEW'
});

const ALBUM_MODES = Object.freeze({
  READY: 'READY',
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  ERROR: 'ERROR'
});

const MEMORY_ITEMS = Object.freeze([
  Object.freeze({
    id: 'rain-leaf',
    threshold: 1,
    title: '雨天的叶子',
    state: MEMORY_STATES.LOCKED,
    stateClass: 'locked',
    rarity: 'DAILY',
    rarityLabel: '日常',
    date: '还没有遇见',
    location: '窗边',
    character: '玉兔',
    line: '玉兔散步时带回来的一片叶子。',
    sceneImage: '/assets/scenes/lifecycle/shared/10-background/window-weather/window_spring_rain_day_v01.webp',
    objectImage: '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_ginkgo_leaf_card_square_3d_transparent_v01.webp',
    artTone: 'rain',
    canSave: false
  }),
  Object.freeze({
    id: 'unfinished-painting',
    threshold: 3,
    title: '没画完的画',
    state: MEMORY_STATES.NEW,
    stateClass: 'new',
    rarity: 'RARE',
    rarityLabel: '稀有',
    date: '2026 年 9 月 19 日',
    location: '玉兔的小房间',
    character: '玉兔',
    line: '它说还差一点，第二天真的把颜色补完了。',
    quote: '“你看，昨天留白的地方，今天有颜色了。”',
    sceneImage: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_draw_day_v01.webp',
    objectImage: '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_k-k07_dried_paint_palette_four_view_3d.webp',
    artTone: 'paint',
    canSave: true
  }),
  Object.freeze({
    id: 'first-snow',
    threshold: 7,
    title: '第一次看雪',
    state: MEMORY_STATES.UNLOCKED,
    stateClass: 'unlocked',
    rarity: 'MEMORY',
    rarityLabel: '完整纪念',
    date: '2026 年 12 月 7 日',
    location: '客厅窗边',
    character: '玉兔',
    line: '原来雪落下来的时候，房间会变得这么安静。',
    quote: '“先别说话，我们一起听雪落下来。”',
    sceneImage: '/assets/scenes/lifecycle/shared/10-background/window-weather/w_06_snow_day.webp',
    objectImage: '',
    artTone: 'snow',
    canSave: true
  })
]);

function cloneMemory(memory) {
  return memory ? Object.assign({}, memory) : null;
}

function createAlbumFixture(mode) {
  const normalizedMode = Object.values(ALBUM_MODES).includes(mode) ? mode : ALBUM_MODES.READY;
  return {
    contractVersion: 'iaa-mvp-v1',
    source: 'local-fixture',
    mode: normalizedMode,
    title: '和玉兔一起记住的事',
    subtitle: '三张卡分别用于三态验收，不代表同一账户的真实进度。',
    memories: normalizedMode === ALBUM_MODES.READY ? MEMORY_ITEMS.map(cloneMemory) : []
  };
}

function findMemoryFixture(id) {
  return cloneMemory(MEMORY_ITEMS.find(item => item.id === id));
}

module.exports = {
  MEMORY_STATES,
  ALBUM_MODES,
  MEMORY_ITEMS,
  createAlbumFixture,
  findMemoryFixture
};
