const config = require('../../config/v2');
const adapter = require('../../services/keepsake-album-adapter');
const { ALBUM_MODES } = adapter;

const TAB_MEET = 'meet';
const TAB_POSTCARD = 'postcard';

Page({
  data: {
    tab: TAB_MEET,
    meets: [],
    postcards: [],
    isDemo: config.localDemoEnabled,
    albumMode: ALBUM_MODES.READY,
    modeOptions: [
      { value: ALBUM_MODES.READY, label: '满态' },
      { value: ALBUM_MODES.EMPTY, label: '空态' }
    ]
  },

  onLoad(options) {
    const tab = options && options.tab === TAB_POSTCARD ? TAB_POSTCARD : TAB_MEET;
    const mode = this.resolveMode(options && options.mode);
    this.setData({ tab, albumMode: mode });
    this.loadAlbum(mode);
  },

  resolveMode(mode) {
    if (mode === ALBUM_MODES.EMPTY || mode === ALBUM_MODES.READY) return mode;
    return ALBUM_MODES.READY;
  },

  loadAlbum(mode) {
    return adapter.getAlbum(mode).then(album => {
      this.setData({
        albumMode: album.mode,
        meets: album.meets || [],
        postcards: album.postcards || []
      });
    });
  },

  onSelectTab(event) {
    const tab = event.currentTarget.dataset.tab;
    if (!tab || tab === this.data.tab) return;
    this.setData({ tab });
  },

  onOpenMeet(event) {
    const id = event.currentTarget.dataset.id;
    const detailId = event.currentTarget.dataset.detailId || id;
    if (!detailId) return;
    wx.navigateTo({ url: `/pages/keepsake-album-meet-detail/keepsake-album-meet-detail?id=${encodeURIComponent(detailId)}` });
  },

  onOpenPostcard(event) {
    const id = event.currentTarget.dataset.id;
    const detailId = event.currentTarget.dataset.detailId || id;
    if (!detailId) return;
    wx.navigateTo({
      url: `/pages/keepsake-album-postcard-detail/keepsake-album-postcard-detail?id=${encodeURIComponent(detailId)}`
    });
  },

  onSelectAlbumMode(event) {
    if (!this.data.isDemo) return;
    const mode = event.currentTarget.dataset.mode;
    if (!mode || mode === this.data.albumMode) return;
    this.loadAlbum(mode);
  }
});
