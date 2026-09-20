const ALBUM_MODES = Object.freeze({
  READY: 'READY',
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  ERROR: 'ERROR'
});

const MEMORY_ITEMS = Object.freeze([
  Object.freeze({
    image: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_draw_day_v01.webp',
    title: '没画完的画',
    date: '2026 年 9 月 19 日',
    line: '它说还差一点，第二天真的把颜色补完了。'
  }),
  Object.freeze({
    image: '/assets/scenes/lifecycle/shared/10-background/window-weather/window_spring_rain_day_v01.webp',
    title: '雨天的叶子',
    date: '2026 年 9 月 18 日',
    line: '玉兔散步时带回来一片叶子，放在窗边晾干。'
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
