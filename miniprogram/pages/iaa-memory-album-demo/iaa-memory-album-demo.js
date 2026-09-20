const { ALBUM_MODES } = require('../../fixtures/iaa-memories');
const { createIaaMemoryAdapter } = require('../../services/iaa-memory-adapter');

const adapter = createIaaMemoryAdapter();
const MODE_OPTIONS = Object.freeze([
  Object.freeze({ value: ALBUM_MODES.READY, label: '纪念列表' }),
  Object.freeze({ value: ALBUM_MODES.LOADING, label: '加载中' }),
  Object.freeze({ value: ALBUM_MODES.EMPTY, label: '空状态' }),
  Object.freeze({ value: ALBUM_MODES.ERROR, label: '加载失败' })
]);

Page({
  data: {
    contractVersion: 'iaa-mvp-v1',
    mode: ALBUM_MODES.READY,
    modes: ALBUM_MODES,
    modeOptions: MODE_OPTIONS,
    title: '',
    subtitle: '',
    memories: []
  },

  onLoad(query) {
    this.loadAlbum(query && String(query.mode || '').toUpperCase());
  },

  loadAlbum(mode) {
    return adapter.getAlbum(mode).then(view => {
      this.setData({
        contractVersion: view.contractVersion,
        mode: view.mode,
        title: view.title,
        subtitle: view.subtitle,
        memories: view.memories
      });
      return view;
    });
  },

  onSelectMode(event) {
    this.loadAlbum(event.currentTarget.dataset.mode);
  },

  onRetry() {
    return this.loadAlbum(ALBUM_MODES.READY);
  }
});

module.exports = { MODE_OPTIONS };
