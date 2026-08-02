const petStore = require('../../utils/pet-store');
const postHatch = require('../../services/post-hatch-companion');

Page({
  data: { pet: null, loading: true, error: '', remaining: 3, decorations: [], hasInk: false, generating: false, result: null },
  onLoad() {
    this.pageActive = true;
    const pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      wx.showToast({ title: '破壳后才能在这里画画', icon: 'none' });
      this.backTimer = setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    this.setData({ pet });
    this.loadDecorationState();
  },
  loadDecorationState() {
    if (!this.data.pet) return;
    const token = this.loadToken = (this.loadToken || 0) + 1;
    this.setData({ loading: true, error: '' });
    postHatch.getDecorationState(this.data.pet).then(state => {
      if (!this.pageActive || token !== this.loadToken) return;
      this.setData({
        loading: false,
        error: state.ok ? '' : state.message || '装扮状态没有加载好，请重试',
        remaining: Number(state.remaining || 0),
        decorations: state.decorations || []
      });
    }).catch(() => {
      if (this.pageActive && token === this.loadToken) this.setData({ loading: false, error: '装扮状态没有加载好，请重试' });
    });
  },
  onReady() {
    this.context = wx.createCanvasContext('decorCanvas', this);
    this.context.setStrokeStyle('#3F5A47');
    this.context.setLineWidth(8);
    this.context.setLineCap('round');
    this.context.setLineJoin('round');
  },
  point(event) {
    const touch = (event.touches || event.changedTouches || [])[0];
    return touch ? { x: touch.x, y: touch.y } : null;
  },
  onDrawStart(event) { this.lastPoint = this.point(event); },
  onDrawMove(event) {
    const point = this.point(event);
    if (!point || !this.lastPoint || !this.context) return;
    this.context.beginPath();
    this.context.moveTo(this.lastPoint.x, this.lastPoint.y);
    this.context.lineTo(point.x, point.y);
    this.context.stroke();
    this.context.draw(true);
    this.lastPoint = point;
    if (!this.data.hasInk) this.setData({ hasInk: true, error: '' });
  },
  onDrawEnd() { this.lastPoint = null; },
  onClear() {
    if (this.data.generating || !this.context) return;
    this.context.clearRect(0, 0, 1000, 1000);
    this.context.draw();
    this.setData({ hasInk: false, result: null, error: '' });
  },
  onGenerate() {
    if (this.data.generating) return;
    if (!this.data.hasInk) return this.setData({ error: '先画一点什么吧' });
    if (this.data.remaining <= 0) return this.setData({ error: '今天的许愿次数用完了' });
    const token = this.operationToken = (this.operationToken || 0) + 1;
    this.setData({ generating: true, error: '', result: null });
    this.magicTimer = setTimeout(() => {
      postHatch.createDecoration(this.data.pet, 'user-canvas-stroke').then(result => {
        if (!this.pageActive || token !== this.operationToken) return;
        if (!result.ok) {
          this.setData({ generating: false, error: result.message || '这次没有画好，请重试' });
          return;
        }
        const decorations = this.data.decorations.concat(result.decoration);
        this.setData({ generating: false, result: result.decoration, remaining: result.remaining, decorations });
      }).catch(() => this.pageActive && token === this.operationToken && this.setData({ generating: false, error: '这次没有画好，请重试' }));
    }, 900);
  },
  onRetryLoad() { if (!this.data.loading) this.loadDecorationState(); },
  onShow() {
    this.pageActive = true;
    if (this.returningToPage && this.data.pet) this.loadDecorationState();
    this.returningToPage = false;
  },
  onHide() {
    this.pageActive = false;
    this.returningToPage = true;
    this.operationToken = (this.operationToken || 0) + 1;
    clearTimeout(this.magicTimer);
    if (this.data.generating) this.setData({ generating: false });
  },
  onUnload() {
    this.pageActive = false;
    this.loadToken = (this.loadToken || 0) + 1;
    this.operationToken = (this.operationToken || 0) + 1;
    clearTimeout(this.backTimer);
    clearTimeout(this.magicTimer);
    this.context = null;
  }
});
