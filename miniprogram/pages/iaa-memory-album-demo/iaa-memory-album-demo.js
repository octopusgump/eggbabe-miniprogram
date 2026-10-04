const { ALBUM_MODES } = require('../../fixtures/iaa-memories');
const { createIaaMemoryAdapter } = require('../../services/iaa-memory-adapter');

const adapter = createIaaMemoryAdapter();
let teaSequence = 0;
const stars = require('../../services/iaa-star-unlock-adapter');
const config = require('../../config/v2');
const { savePolaroid } = require('../../services/companion-polaroid');
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
    memories: [],
    pendingPhotos: [],
    exchange: null,
    exchangeLoading: false,
    exchangeFailed: false,
    selectedPhotoReady: false,
    selectedPhotoFailed: false,
    isDemo: config.localDemoEnabled,
    section: 'memories',
    selectedMemory: null,
    activities: [{ key: 'tea', title: '窗边茶会', cost: 20 }, { key: 'travel', title: '旅行', cost: 40 }],
    selectedActivity: null,
    tea: null,
    teaPhotoReady: false,
    teaPhotoFailed: false,
    teaOptions: [{ key: 'plain', label: '清茶', reply: '那就慢慢喝一杯清茶，看看窗外。' }, { key: 'flower', label: '花茶', reply: '花香轻轻的，我们坐在窗边喝吧。' }],
    teaReply: ''
  },

  onLoad(query) {
    this.roomEntry = Boolean(query && query.entry === 'room');
    this.setData({ roomEntry: this.roomEntry });
    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (channel && channel.on) channel.on('roomActivityContext', context => { this.activityContext = context; });
    this.refreshTea();
    this.refreshExchange();
    this.loadAlbum(query && String(query.mode || '').toUpperCase());
  },

  onShow() { this.albumVisible = true; if (this.roomEntry) { this.loadAlbum(ALBUM_MODES.READY); this.refreshExchange(); } },
  onHide() { this.albumVisible = false; this.cancelExchangePreparation(); },
  onUnload() { this.albumVisible = false; this.cancelExchangePreparation(); },
  cancelExchangePreparation() { this.exchangeAttempt = (this.exchangeAttempt || 0) + 1; this.setData({ exchangeLoading: false }); },
  loadAlbum(mode) {
    return adapter.getAlbum(mode).then(view => {
      this.setData({
        contractVersion: view.contractVersion,
        title: view.title,
        subtitle: view.subtitle,
        pendingPhotos: this.roomEntry ? stars.getPendingPhotos() : [],
        memories: (this.roomEntry ? stars.getMemories() : view.memories).map((item, index) => Object.assign({}, item, { listKey: item.id || `${item.date}-${index}` })),
        mode: this.roomEntry && !stars.getMemories().length && !stars.getPendingPhotos().length ? ALBUM_MODES.EMPTY : view.mode
      });
      return view;
    });
  },

  refreshExchange() {
    return stars.getRoomStarView().then(result => {
      const exchange = this.roomEntry ? stars.getExchangePhoto() : null;
      const activities = this.data.activities.filter(item => item.key !== 'exchange');
      if (exchange) activities.push({ key: 'exchange', title: '兑换照片', cost: 10 });
      this.setData({ exchange, activities, exchangeInsufficient: Boolean(exchange && result.data.star.balance < 10) });
    });
  },
  onExchangePhoto() {
    const photo = this.data.exchange;
    if (!photo || this.data.exchangeLoading) return;
    if (photo.owned) { this.setData({ selectedActivity: null, selectedMemory: photo, selectedPhotoReady: false, selectedPhotoFailed: false }); return; }
    if (this.data.exchangeInsufficient) return;
    const identity = stars.getRoomIdentity();
    const attempt = this.exchangeAttempt = (this.exchangeAttempt || 0) + 1;
    const current = () => attempt === this.exchangeAttempt && identity === stars.getRoomIdentity() && this.albumVisible !== false;
    this.setData({ exchangeLoading: true, exchangeFailed: false });
    wx.getImageInfo({ src: photo.image,
      success: () => {
        if (!current()) return;
        const result = stars.exchangePhoto(photo.id, true);
        if (result.ok) {
          this.setData({ selectedActivity: null, selectedMemory: result.memory, selectedPhotoReady: false, selectedPhotoFailed: false, section: 'memories' });
          this.loadAlbum(ALBUM_MODES.READY);
        } else this.setData({ exchangeFailed: result.error.code !== 'INSUFFICIENT_STARS' });
        this.refreshExchange();
      },
      fail: () => { if (current()) this.setData({ exchangeFailed: true }); },
      complete: () => { if (current()) this.setData({ exchangeLoading: false }); }
    });
  },
  onOpenPendingPhoto(event) {
    const photo = this.data.pendingPhotos.find(item => item.id === event.currentTarget.dataset.id);
    if (photo) this.setData({ selectedMemory: photo, selectedPhotoReady: false, selectedPhotoFailed: false });
  },
  onSelectedPhotoLoad() { this.setData({ selectedPhotoReady: true, selectedPhotoFailed: false }); },
  onSelectedPhotoError() { this.setData({ selectedPhotoReady: false, selectedPhotoFailed: true }); },
  onRetrySelectedPhoto() { this.setData({ selectedPhotoFailed: false, selectedPhotoReady: false }); },
  onCollectPendingPhoto() {
    const photo = this.data.selectedMemory;
    if (!photo || !this.data.selectedPhotoReady || !stars.collectPhoto(photo.id).ok) return;
    this.setData({ selectedMemory: null });
    this.loadAlbum(ALBUM_MODES.READY);
  },
  refreshTea() {
    const state = stars.getActivityState();
    const choice = state.current && this.data.teaOptions.find(item => item.key === state.current.choice);
    this.setData({ tea: state.current, firstActivityFree: !state.firstResultSeen, teaReply: choice ? choice.reply : '' });
  },
  onStartTea() {
    if (this.data.selectedActivity && this.data.selectedActivity.key !== 'tea') return;
    const state = stars.getActivityState();
    if (!state.current) {
      const context = this.activityContext || {};
      if (!context.atHome) { wx.showToast({ title: '等它回家，再一起喝茶吧', icon: 'none' }); return; }
      if (!context.teaImage) { wx.showToast({ title: '茶会还没准备好，请稍后再试', icon: 'none' }); return; }
      const result = stars.beginTeaActivity({ id: `tea-${Date.now()}-${++teaSequence}`, photo: { image: context.teaImage, title: '窗边茶会', line: '一起在窗边喝了一杯茶。' } });
      if (!result.ok) { wx.showToast({ title: '星星还不够，先陪它一会儿吧', icon: 'none' }); return; }
    }
    this.setData({ teaVisible: true, selectedActivity: null, teaPhotoReady: false, teaPhotoFailed: false });
    this.refreshTea();
  },
  onChooseTea(event) {
    const key = event.currentTarget.dataset.key;
    if (!this.data.teaOptions.some(item => item.key === key)) return;
    stars.chooseTea(key);
    this.refreshTea();
  },
  onTeaPhotoLoad() { this.setData({ teaPhotoReady: true, teaPhotoFailed: false }); },
  onTeaPhotoError() { this.setData({ teaPhotoReady: false, teaPhotoFailed: true }); },
  onRetryTeaPhoto() { this.setData({ teaPhotoFailed: false }); },
  onConfirmTea() {
    if (!this.data.teaPhotoReady || this.data.teaPhotoFailed) return;
    const result = stars.confirmTeaActivity();
    if (!result.ok) { wx.showToast({ title: '星星还不够，先陪它一会儿吧', icon: 'none' }); return; }
    this.refreshTea();
  },
  onCloseTea() { this.setData({ teaVisible: false }); },
  onCollectTea() {
    if (!this.data.teaPhotoReady || this.data.teaPhotoFailed || !stars.collectTeaActivity().ok) return;
    this.setData({ teaVisible: false, section: 'memories' });
    this.refreshTea();
    this.loadAlbum(ALBUM_MODES.READY);
  },
  onSelectSection(event) { this.setData({ section: event.currentTarget.dataset.section, selectedMemory: null, selectedActivity: null }); },
  onOpenMemory(event) { this.setData({ selectedMemory: this.data.memories[Number(event.currentTarget.dataset.index)] || null, selectedPhotoReady: false, selectedPhotoFailed: false }); },
  noop() {},
  onCloseDetail() { this.cancelExchangePreparation(); this.setData({ selectedMemory: null, selectedActivity: null }); },
  onPreviewMemory() { const item = this.data.selectedMemory; if (item) wx.previewImage({ urls: [item.image], current: item.image }); },
  onSaveMemory() { const item = this.data.selectedMemory; if (!item) return; if (['paper', 'exchange'].includes(item.source)) { if (this.data.selectedPhotoReady) savePolaroid(this, item).catch(() => wx.showToast({ title: '图片没有保存，请检查相册权限', icon: 'none' })); } else wx.saveImageToPhotosAlbum({filePath:item.image,fail:()=>wx.showToast({title:'图片没有保存，请检查相册权限',icon:'none'})}); },
  onOpenActivity(event) { this.setData({ selectedActivity: this.data.activities.find(item => item.key === event.currentTarget.dataset.key) || null }); },
  onSelectMode(event) {
    this.loadAlbum(event.currentTarget.dataset.mode);
  },

  onRetry() {
    return this.loadAlbum(ALBUM_MODES.READY);
  }
});

module.exports = { MODE_OPTIONS };
