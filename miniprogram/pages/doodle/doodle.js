const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const shellArtService = require('../../services/egg-shell-art');
const runtime = require('../../services/runtime-context');
const canvas2d = require('../../utils/canvas-2d');
const practice = require('../../services/incubation-practice');
const BRUSH_PREVIEW_SIZES = [4, 8, 14, 22];

Page({
  data: {
    colors: shellArtService.COLORS,
    patterns: shellArtService.PATTERNS,
    selectedColor: shellArtService.COLORS[0].value,
    selectedColorName: shellArtService.COLORS[0].name,
    selectedPattern: '',
    activeTool: 'brush',
    brushSizeIndex: 2,
    eraserSizePx: shellArtService.ERASER_DEFAULT_PX,
    toolSizeValue: 2,
    toolSizeMin: 1,
    toolSizeMax: 4,
    toolSizeStep: 1,
    toolSizeLabel: shellArtService.BRUSH_SIZES[1].label,
    toolPreviewSize: BRUSH_PREVIEW_SIZES[1],
    canUndo: false,
    canClear: false,
    saving: false,
    canvasReady: false,
    expandedCanvas: false
  },

  onLoad() {
    const pet = petStore.getPet();
    this.shellArt = shellArtService.normalizeShellArt(pet && pet.shell);
    this.undoStack = [];
    this.operationSequence = this.shellArt.operations.length;
    this.syncViewState();
  },

  onReady() {
    this.setupCanvases();
  },

  setupCanvases() {
    const setupToken = (this.canvasSetupToken || 0) + 1;
    this.canvasSetupToken = setupToken;
    Promise.all([
      canvas2d.createLayer(this, '#eggBaseCanvas'),
      canvas2d.createLayer(this, '#eggArtCanvas')
    ]).then(layers => {
      if (setupToken !== this.canvasSetupToken) return;
      this.baseLayer = layers[0];
      this.artLayer = layers[1];
      if (!this.baseLayer || !this.artLayer) return;
      return Promise.all([
        canvas2d.loadImage(this.baseLayer, shellArtService.BASE_ASSET),
        canvas2d.loadImage(this.artLayer, shellArtService.BASE_ASSET)
      ]).then(images => {
        if (setupToken !== this.canvasSetupToken) return;
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
      canUndo: !!(this.undoStack && this.undoStack.length),
      canClear: shell.operations.length > 0
    }, extra || {}));
  },

  pushHistory() {
    const operations = JSON.parse(JSON.stringify(this.shellArt.operations || []));
    this.undoStack = (this.undoStack || []).concat([operations]).slice(-120);
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
    this.setData({
      selectedPattern: pattern,
      activeTool: 'sticker'
    });
  },

  onTool(event) {
    const tool = event.currentTarget.dataset.tool;
    if (tool !== 'brush' && tool !== 'eraser' && tool !== 'sticker') return;
    const extra = { activeTool: tool };
    if (tool === 'brush') {
      extra.toolSizeValue = this.data.brushSizeIndex;
      extra.toolSizeMin = 1;
      extra.toolSizeMax = 4;
      extra.toolSizeStep = 1;
      extra.toolSizeLabel = shellArtService.BRUSH_SIZES[this.data.brushSizeIndex - 1].label;
      extra.toolPreviewSize = BRUSH_PREVIEW_SIZES[this.data.brushSizeIndex - 1];
    }
    if (tool === 'eraser') {
      extra.toolSizeValue = this.data.eraserSizePx;
      extra.toolSizeMin = shellArtService.ERASER_MIN_PX;
      extra.toolSizeMax = shellArtService.ERASER_MAX_PX;
      extra.toolSizeStep = 1;
      extra.toolSizeLabel = `${this.data.eraserSizePx} px`;
      extra.toolPreviewSize = Math.max(6, Math.min(28, this.data.eraserSizePx));
    }
    this.setData(extra);
  },

  onToolSizeChange(event) {
    if (this.data.activeTool !== 'brush' && this.data.activeTool !== 'eraser') return;
    const value = Math.max(1, Math.min(4, Math.round(Number(event.detail.value) || 1)));
    if (this.data.activeTool === 'brush') {
      this.setData({
        brushSizeIndex: value,
        toolSizeValue: value,
        toolSizeLabel: shellArtService.BRUSH_SIZES[value - 1].label,
        toolPreviewSize: BRUSH_PREVIEW_SIZES[value - 1]
      });
      return;
    }
    const pixels = Math.max(shellArtService.ERASER_MIN_PX, Math.min(shellArtService.ERASER_MAX_PX, Math.round(Number(event.detail.value) || shellArtService.ERASER_DEFAULT_PX)));
    this.setData({
      eraserSizePx: pixels,
      toolSizeValue: pixels,
      toolSizeLabel: `${pixels} px`,
      toolPreviewSize: Math.max(6, Math.min(28, pixels))
    });
  },

  onToggleCanvasSize() {
    const expandedCanvas = !this.data.expandedCanvas;
    this.setData({ expandedCanvas, canvasReady: false }, () => {
      wx.nextTick(() => this.setupCanvases());
    });
  },

  onUndo() {
    if (!this.undoStack || !this.undoStack.length) return;
    this.shellArt.operations = this.undoStack.pop();
    this.currentStroke = null;
    this.syncViewState();
    this.renderAll();
  },

  onClear() {
    if (!this.shellArt.operations.length) return;
    this.pushHistory();
    this.shellArt.operations = [];
    this.currentStroke = null;
    this.syncViewState({ selectedPattern: '' });
    this.renderArt();
  },

  canvasPoint(event) {
    const touch = (event.touches || event.changedTouches || [])[0];
    const layer = this.artLayer;
    if (!touch || !layer) return null;
    const clientX = Number(touch.clientX);
    const clientY = Number(touch.clientY);
    const hasClientPoint = Number.isFinite(clientX) && Number.isFinite(clientY);
    const localX = hasClientPoint ? clientX - layer.left : Number(touch.x);
    const localY = hasClientPoint ? clientY - layer.top : Number(touch.y);
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
      if (!this.data.selectedPattern) {
        wx.showToast({ title: '先选择一种贴纸', icon: 'none' });
        return;
      }
      this.pushHistory();
      const sticker = shellArtService.createSticker(this.data.selectedPattern, this.operationSequence, point);
      this.operationSequence += 1;
      this.shellArt.operations = this.shellArt.operations.concat(sticker).slice(-shellArtService.MAX_OPERATIONS);
      this.syncViewState();
      this.renderArt();
      return;
    }
    this.pushHistory();
    const strokeWidth = this.data.activeTool === 'eraser'
      ? shellArtService.eraserWidthForPixels(
        this.data.eraserSizePx,
        this.artLayer ? Math.min(this.artLayer.width, this.artLayer.height) : undefined
      )
      : shellArtService.BRUSH_SIZES[this.data.brushSizeIndex - 1].width;
    this.currentStroke = shellArtService.createStroke(
      this.data.activeTool,
      [point],
      this.operationSequence += 1,
      strokeWidth
    );
    this.renderArt(this.currentStroke);
  },

  onCanvasTouchMove(event) {
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
    if (!this.currentStroke) return;
    this.shellArt.operations = this.shellArt.operations.concat(this.currentStroke).slice(-shellArtService.MAX_OPERATIONS);
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
    if (runtime.getMode() === 'demo') {
      const result = petStore.applyConfirmedDoodle(shellArtService.normalizeShellArt(this.shellArt));
      const progress = result.ok ? await practice.submit('doodle') : null;
      this.setData({ saving: false });
      if (!result.ok) {
        wx.showToast({ title: result.message || '蛋壳没有保存成功，请重试', icon: 'none' });
        return;
      }
      analytics.track('egg_creation_saved', shellArtService.operationSummary(this.shellArt));
      wx.showToast({ title: progress && !progress.alreadyDone ? '蛋壳换好啦，也离你近了一点点' : '我的蛋壳换好啦', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 700);
      return;
    }
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
    if (response.hatch_at) petStore.applyConfirmedHatchAt(response.hatch_at);
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
    this.canvasSetupToken = (this.canvasSetupToken || 0) + 1;
  }
});
