const adapter = require('../../services/keepsake-album-adapter');

Page({
  data: {
    screenState: 'loading',
    detail: null,
    paragraphs: []
  },

  onLoad(options) {
    const id = options && options.id ? decodeURIComponent(options.id) : '';
    adapter
      .getPostcardDetail(id)
      .then(detail => {
        if (!detail) {
          this.setData({ screenState: 'empty', detail: null, paragraphs: [] });
          return;
        }
        const paragraphs = (detail.paragraphs || []).map(block =>
          String(block)
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
        );
        this.setData({ screenState: 'ready', detail, paragraphs });
      })
      .catch(() => {
        this.setData({ screenState: 'empty', detail: null, paragraphs: [] });
      });
  }
});
