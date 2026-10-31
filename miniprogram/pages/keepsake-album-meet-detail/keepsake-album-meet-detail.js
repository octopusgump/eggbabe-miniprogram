const adapter = require('../../services/keepsake-album-adapter');

Page({
  data: {
    screenState: 'loading',
    detail: null,
    bodyLines: []
  },

  onLoad(options) {
    const id = options && options.id ? decodeURIComponent(options.id) : '';
    adapter
      .getMeetDetail(id)
      .then(detail => {
        if (!detail) {
          this.setData({ screenState: 'empty', detail: null, bodyLines: [] });
          return;
        }
        const bodyLines = String(detail.body || '')
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean);
        this.setData({ screenState: 'ready', detail, bodyLines });
      })
      .catch(() => {
        this.setData({ screenState: 'empty', detail: null, bodyLines: [] });
      });
  }
});
