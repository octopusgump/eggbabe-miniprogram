const TOKYO_POSTCARD =
  '/assets/scenes/lifecycle/post-hatch/50-overlays/postcards/_candidates/travel-activities-v01/japan/tokyo/';

const ALBUM_MODES = Object.freeze({
  READY: 'READY',
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  ERROR: 'ERROR'
});

const MEMORY_ITEMS = Object.freeze([
  Object.freeze({
    id: 'memory-demo-drawing',
    displayType: 'drawing',
    image:
      '/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_draw_day_v01.webp',
    title: '没画完的画',
    date: '9 月 19 日',
    line: '它说还差一点，第二天真的把颜色补完了。',
    metaPill: '9 月 19 日'
  }),
  Object.freeze({
    id: 'memory-demo-keepsake',
    displayType: 'keepsake',
    source: 'keepsake',
    sourceScene: '在家 · 小憩',
    image:
      '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/keepsake_ginkgo_leaf_card_square_3d_transparent_v01.webp',
    title: '雨天的叶子',
    date: '9 月 18 日',
    line: '玉兔散步时带回来一片叶子，放在窗边晾干。',
    metaPill: '来自 · 在家 · 小憩'
  }),
  Object.freeze({
    id: 'memory-demo-polaroid',
    displayType: 'polaroid',
    source: 'paper',
    image:
      '/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/jade-rabbit_outing_v01.webp',
    title: '出门前的小留影',
    date: '9 月 17 日',
    line: '出门前拍的，给你留一张。',
    metaPill: '9 月 17 日'
  }),
  Object.freeze({
    id: 'memory-demo-postcard',
    displayType: 'postcard',
    source: 'postcard',
    place: '东京',
    image: `${TOKYO_POSTCARD}postcard_travel_tokyo_alley_morning_stretch_jade_rabbit_v02.webp`,
    title: '东京之旅',
    date: '9 月 20 日',
    line: '咖啡巷里，它停下来伸了个懒腰。',
    metaPill: '9 月 20 日 · 东京'
  }),
  Object.freeze({
    id: 'memory-demo-postcard-locked',
    displayType: 'postcard',
    source: 'postcard',
    locked: true,
    place: '东京',
    image: `${TOKYO_POSTCARD}postcard_travel_tokyo_alley_peace_tower_jade_rabbit_v02.webp`,
    title: '东京之旅',
    date: '9 月 21 日',
    line: '还没展开的一段路。',
    metaPill: '9 月 21 日 · 东京'
  })
]);

function cloneMemory(memory) {
  return Object.assign({}, memory);
}

function createAlbumFixture(mode) {
  const normalizedMode = Object.values(ALBUM_MODES).includes(mode) ? mode : ALBUM_MODES.READY;
  return {
    contractVersion: 'iaa-mvp-v1',
    source: 'local-fixture',
    mode: normalizedMode,
    title: '我们的纪念',
    subtitle: '一起经历过的小事，会留在这里。',
    memories: normalizedMode === ALBUM_MODES.READY ? MEMORY_ITEMS.map(cloneMemory) : []
  };
}

module.exports = {
  ALBUM_MODES,
  MEMORY_ITEMS,
  createAlbumFixture
};
