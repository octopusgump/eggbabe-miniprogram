const { createIaaMemoryAdapter } = require('../../services/iaa-memory-adapter');

const adapter = createIaaMemoryAdapter();

Page({
  data: {
    contractVersion: 'iaa-mvp-v1',
    source: 'local-fixture',
    loading: true,
    error: '',
    card: null,
    previewNotice: ''
  },

  onLoad(query) {
    this.memoryId = String(query && query.id || 'unfinished-painting');
    this.loadCard();
  },

  loadCard() {
    this.setData({ loading: true, error: '', card: null, previewNotice: '' });
    return adapter.getSaveCard(this.memoryId)
      .then(view => {
        this.setData({
          contractVersion: view.contractVersion,
          source: view.source,
          loading: false,
          card: view.card
        });
        return view;
      })
      .catch(() => {
        this.setData({ loading: false, error: '这段纪念暂时不能生成保存卡预览。' });
      });
  },

  onRetry() {
    this.loadCard();
  },

  onPreviewSave() {
    this.setData({ previewNotice: '这是静态预览：没有保存到相册，也没有发起分享。' });
  }
});
