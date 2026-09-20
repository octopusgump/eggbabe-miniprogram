const { ALBUM_MODES, MEMORY_STATES } = require('../../fixtures/iaa-memories');
const { createIaaMemoryAdapter } = require('../../services/iaa-memory-adapter');

const adapter = createIaaMemoryAdapter();
const MODE_OPTIONS = Object.freeze([
  Object.freeze({ value: ALBUM_MODES.READY, label: '三态列表' }),
  Object.freeze({ value: ALBUM_MODES.LOADING, label: '加载中' }),
  Object.freeze({ value: ALBUM_MODES.EMPTY, label: '空纪念册' }),
  Object.freeze({ value: ALBUM_MODES.ERROR, label: '加载失败' })
]);

Page({
  data: {
    contractVersion: 'iaa-mvp-v1',
    source: 'local-fixture',
    mode: ALBUM_MODES.READY,
    modes: ALBUM_MODES,
    memoryStates: MEMORY_STATES,
    modeOptions: MODE_OPTIONS,
    title: '',
    subtitle: '',
    memories: [],
    lockedNotice: ''
  },

  onLoad(query) {
    this.loadAlbum(query && String(query.mode || '').toUpperCase());
  },

  loadAlbum(mode) {
    return adapter.getAlbum(mode).then(view => {
      this.setData({
        contractVersion: view.contractVersion,
        source: view.source,
        mode: view.mode,
        title: view.title,
        subtitle: view.subtitle,
        memories: view.memories,
        lockedNotice: ''
      });
      return view;
    });
  },

  onSelectMode(event) {
    this.loadAlbum(event.currentTarget.dataset.mode);
  },

  onRetry() {
    this.loadAlbum(ALBUM_MODES.READY);
  },

  onOpenMemory(event) {
    const id = event.currentTarget.dataset.id;
    const memory = this.data.memories.find(item => item.id === id);
    if (!memory) return;
    if (memory.state === MEMORY_STATES.LOCKED) {
      this.setData({ lockedNotice: '这段纪念还没有发生，先留一个安静的轮廓。' });
      return;
    }
    wx.navigateTo({ url: `/pages/iaa-memory-detail-demo/iaa-memory-detail-demo?id=${id}` });
  }
});

module.exports = { MODE_OPTIONS };
