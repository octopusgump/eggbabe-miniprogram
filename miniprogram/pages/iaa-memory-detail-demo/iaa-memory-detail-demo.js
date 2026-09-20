const { createIaaMemoryAdapter } = require('../../services/iaa-memory-adapter');

const adapter = createIaaMemoryAdapter();

Page({
  data: {
    contractVersion: 'iaa-mvp-v1',
    source: 'local-fixture',
    loading: true,
    error: '',
    memory: null
  },

  onLoad(query) {
    this.memoryId = String(query && query.id || 'unfinished-painting');
    this.loadMemory();
  },

  loadMemory() {
    this.setData({ loading: true, error: '', memory: null });
    return adapter.getMemory(this.memoryId)
      .then(view => {
        this.setData({
          contractVersion: view.contractVersion,
          source: view.source,
          loading: false,
          memory: view.memory
        });
        return view;
      })
      .catch(() => {
        this.setData({ loading: false, error: '这段纪念暂时没有找到。' });
      });
  },

  onRetry() {
    this.loadMemory();
  },

  onOpenSaveCard() {
    const memory = this.data.memory;
    if (!memory || !memory.canSave || memory.state === 'LOCKED') return;
    wx.navigateTo({ url: `/pages/iaa-memory-save-demo/iaa-memory-save-demo?id=${memory.id}` });
  }
});
