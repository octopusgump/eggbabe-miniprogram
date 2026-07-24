const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const shellArtService = require('../../services/egg-shell-art');
const canvas2d = require('../../utils/canvas-2d');

Page({
  data: {
    colors: shellArtService.COLORS,
    patterns: shellArtService.PATTERNS,
    selectedColor: shellArtService.COLORS[0].value,
    selectedColorName: shellArtService.COLORS[0].name,
    selectedPattern: '',
    patternPlacement: 'single',
    activeTool: 'brush',
    operationCount: 0,
    canUndo: false,
    canClear: false,
    canDeleteSticker: false,
    saving: false,
    canvasReady: false
  },

  onLoad() {
    const pet = petStore.getPet();
    this.shellArt = shellArtService.normalizeShellArt(pet && pet.shell);
    this.undoStack = [];
    this.operationSequence = this.shellArt.operations.length;
    this.selectedStickerId = '';
    this.syncViewState();
  },

  onReady() {
    this.setupCanvases();
  },

  setupCanvases() {
    Promise.all([
      canvas2d.createLayer(this, '#eggBaseCanvas'),
      canvas2d.createLayer(this, '#eggArtCanvas')
    ]).then(layers => {
      this.baseLayer = layers[0];
      this.artLayer = layers[1];
      if (!this.baseLayer || !this.artLayer) return;
      return Promise.all([
        canvas2d.loadImage(this.baseLayer, shellArtService.BASE_ASSET),
        canvas2d.loadImage(this.artLayer, shellArtService.BASE_ASSET)
      ]).then(images => {
        this.baseImage = images[0];
        this.artMaskImage = images[1];
        this.setData({ canvasReady: true });
        this.renderAll();
      });
    });
  },

  syncViewState(extra) {
    const shell = shellArtService.normalizeShellArt(this.shellArt);
    this.shellArt = shell;
    this.setData(Object.assign({
      selectedColor: shell.color,
      selectedColorName: shell.colorName,
      operationCount: shell.operations.length,
      canUndo: !!(this.undoStack && this.undoStack.length),
      canClear: shell.operations.length > 0,
      canDeleteSticker: !!this.selectedStickerId && shell.operations.some(item => item.id === this.selectedStickerId && item.type === 'sticker')
    }, extra || {}));
  },

  pushHistory() {
    const operations = JSON.parse(JSON.stringify(this.shellArt.operations || []));
    this.undoStack = (this.undoStack || []).concat([operations]).slice(-30);
  },

  renderBase() {
    if (!this.baseLayer) return;
    shellArtService.drawEggBase(
      this.baseLayer.context,
      this.baseImage,
      this.baseLayer.width,
      this.baseLayer.height,
      this.shellArt
    );
  },

  renderArt(activeOperation) {
    if (!this.artLayer) return;
    shellArtService.drawEggArt(
      this.artLayer.context,
      this.artMaskImage,
      this.artLayer.width,
      this.artLayer.height,
      this.shellArt,
      activeOperation
    );
  },

  renderAll() {
    this.renderBase();
    this.renderArt();
  },

  onColor(event) {
    const token = event.currentTarget.dataset.token;
    const color = shellArtService.COLORS.find(item => item.token === token);
    if (!color || color.token === this.shellArt.colorToken) return;
    this.shellArt = shellArtService.normalizeShellArt(Object.assign({}, this.shellArt, {
      colorToken: color.token,
      color: color.value,
      colorName: color.name
    }));
    this.syncViewState();
    this.renderBase();
  },

  onPattern(event) {
    const pattern = event.currentTarget.dataset.pattern;
    if (!shellArtService.PATTERNS.some(item => item.type === pattern)) return;
    this.pushHistory();
    const count = this.data.patternPlacement === 'repeat' ? 5 : 1;
    const stickers = Array.from({ length: count }, () => {
      const sticker = shellArtService.createSticker(pattern, this.operationSequence);
      this.operationSequence += 1;
      return sticker;
    });
    this.selectedStickerId = stickers[stickers.length - 1].id;
    this.shellArt.operations = this.shellArt.operations.concat(stickers).slice(-120);
    this.syncViewState({ selectedPattern: pattern, activeTool: 'sticker' });
    this.renderArt();
  },

  onPatternPlacement(event) {
    const placement = event.currentTarget.dataset.placement;
    if (placement !== 'single' && placement !== 'repeat') return;
    this.setData({ patternPlacement: placement });
  },

  onTool(event) {
    const tool = event.currentTarget.dataset.tool;
    if (tool !== 'brush' && tool !== 'eraser' && tool !== 'sticker') return;
    this.setData({ activeTool: tool });
  },

  onUndo() {
    if (!this.undoStack || !this.undoStack.length) return;
    this.shellArt.operations = this.undoStack.pop();
    if (!this.shellArt.operations.some(item => item.id === this.selectedStickerId)) this.selectedStickerId = '';
    this.currentStroke = null;
    this.draggingStickerId = '';
    this.syncViewState();
    this.renderAll();
  },

  onClear() {
    if (!this.shellArt.operations.length) return;
    this.pushHistory();
    this.shellArt.operations = [];
    this.selectedStickerId = '';
    this.currentStroke = null;
    this.draggingStickerId = '';
    this.syncViewState({ selectedPattern: '' });
    this.renderArt();
  },

  onDeleteSticker() {
    if (!this.selectedStickerId) return;
    const exists = this.shellArt.operations.some(item => item.id === this.selectedStickerId && item.type === 'sticker');
    if (!exists) return;
    this.pushHistory();
    this.shellArt.operations = this.shellArt.operations.filter(item => item.id !== this.selectedStickerId);
    this.selectedStickerId = '';
    this.syncViewState();
    this.renderArt();
  },

  stickerAt(point) {
    const operations = this.shellArt.operations || [];
    for (let index = operations.length - 1; index >= 0; index -= 1) {
      const operation = operations[index];
      if (operation.type !== 'sticker') continue;
      const radius = 0.12 * Number(operation.scale || 1);
      const distance = Math.hypot(operation.x - point.x, operation.y - point.y);
      if (distance <= radius) return operation;
    }
    return null;
  },

  canvasPoint(event) {
    const touch = (event.touches || event.changedTouches || [])[0];
    const layer = this.artLayer;
    if (!touch || !layer) return null;
    const hasLocalPoint = Number.isFinite(Number(touch.x)) && Number.isFinite(Number(touch.y));
    const localX = hasLocalPoint ? Number(touch.x) : Number(touch.clientX) - layer.left;
    const localY = hasLocalPoint ? Number(touch.y) : Number(touch.clientY) - layer.top;
    if (!Number.isFinite(localX) || !Number.isFinite(localY)) return null;
    return {
      x: Math.max(0, Math.min(1, localX / layer.width)),
      y: Math.max(0, Math.min(1, localY / layer.height))
    };
  },

  onCanvasTouchStart(event) {
    if (!this.artLayer) return;
    const point = this.canvasPoint(event);
    if (!point) return;
    if (this.data.activeTool === 'sticker') {
      const sticker = this.stickerAt(point);
      this.selectedStickerId = sticker ? sticker.id : '';
      if (!sticker) {
        this.syncViewState();
        return;
      }
      this.pushHistory();
      this.draggingStickerId = sticker.id;
      this.syncViewState();
      return;
    }
    this.pushHistory();
    this.currentStroke = shellArtService.createStroke(this.data.activeTool, [point], this.operationSequence += 1);
    this.renderArt(this.currentStroke);
  },

  onCanvasTouchMove(event) {
    if (this.draggingStickerId) {
      const point = this.canvasPoint(event);
      if (!point) return;
      this.shellArt.operations = this.shellArt.operations.map(operation => (
        operation.id === this.draggingStickerId
          ? Object.assign({}, operation, {
            x: Math.max(0.12, Math.min(0.88, point.x)),
            y: Math.max(0.12, Math.min(0.9, point.y))
          })
          : operation
      ));
      this.renderArt();
      return;
    }
    if (!this.currentStroke) return;
    const point = this.canvasPoint(event);
    if (!point) return;
    const points = this.currentStroke.points;
    const previous = points[points.length - 1];
    const distance = Math.abs(previous.x - point.x) + Math.abs(previous.y - point.y);
    if (distance < 0.006) return;
    this.currentStroke.points = points.concat(point).slice(-300);
    this.renderArt(this.currentStroke);
  },

  finishStroke() {
    if (this.draggingStickerId) {
      this.draggingStickerId = '';
      this.syncViewState();
      this.renderArt();
      return;
    }
    if (!this.currentStroke) return;
    this.shellArt.operations = this.shellArt.operations.concat(this.currentStroke).slice(-120);
    this.currentStroke = null;
    this.syncViewState();
    this.renderArt();
  },

  onCanvasTouchEnd() {
    this.finishStroke();
  },

  onCanvasTouchCancel() {
    this.finishStroke();
  },

  async onSave() {
    if (this.data.saving) return;
    this.setData({ saving: true });
    if (!config.backendEnabled) {
      this.setData({ saving: false });
      wx.showToast({ title: '蛋壳创作服务尚未接入，请稍后再试', icon: 'none' });
      return;
    }
    const pet = petStore.getPet();
    const response = await cloudApi.saveEggCreation(pet && pet.id, shellArtService.normalizeShellArt(this.shellArt));
    if (!response.ok || response.mode !== 'live') {
      this.setData({ saving: false });
      wx.showToast({ title: response.message || '蛋壳没有保存成功，请重试', icon: 'none' });
      return;
    }
    const result = petStore.applyConfirmedDoodle(response.creation || this.shellArt);
    if (!result.ok) {
      this.setData({ saving: false });
      wx.showToast({ title: result.message || '蛋壳没有保存成功，请重试', icon: 'none' });
      return;
    }
    analytics.track('egg_creation_saved', shellArtService.operationSummary(this.shellArt));
    wx.showToast({ title: result.added ? '我记住这个样子啦' : '我的蛋壳换好啦', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 700);
  },

  onUnload() {
    this.baseLayer = null;
    this.artLayer = null;
    this.baseImage = null;
    this.artMaskImage = null;
    this.currentStroke = null;
    this.draggingStickerId = '';
    this.selectedStickerId = '';
  }
});
