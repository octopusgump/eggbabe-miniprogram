const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const shellArtService = require('../../services/egg-shell-art');
const runtime = require('../../services/runtime-context');
const canvas2d = require('../../utils/canvas-2d');
const practice = require('../../services/incubation-practice');

const AUTO_SAVE_DELAY = 700;
const MIN_CANVAS_SCALE = 1;
const MAX_CANVAS_SCALE = 1.6;
const BRUSH_SIZE_OPTIONS = shellArtService.BRUSH_SIZES.map(item => Object.assign({}, item, {
  previewRpx: Math.max(6, item.pixels * 2)
}));

function touchDistance(touches) {
  if (!touches || touches.length < 2) return 0;
  const first = touches[0];
  const second = touches[1];
  const firstX = Number.isFinite(Number(first.clientX)) ? Number(first.clientX) : Number(first.x);
  const firstY = Number.isFinite(Number(first.clientY)) ? Number(first.clientY) : Number(first.y);
  const secondX = Number.isFinite(Number(second.clientX)) ? Number(second.clientX) : Number(second.x);
  const secondY = Number.isFinite(Number(second.clientY)) ? Number(second.clientY) : Number(second.y);
  if (![firstX, firstY, secondX, secondY].every(Number.isFinite)) return 0;
  return Math.hypot(
    secondX - firstX,
    secondY - firstY
  );
}

Page({
  data: {
    statusBarHeight: 20,
    brushColors: shellArtService.BRUSH_COLORS,
    brushSizes: BRUSH_SIZE_OPTIONS,
    patterns: shellArtService.PATTERNS,
    selectedBrushColor: shellArtService.DEFAULT_BRUSH_COLOR,
    selectedBrushColorName: shellArtService.BRUSH_COLORS[0].name,
    selectedPattern: '',
    activeTool: 'brush',
    brushSizeIndex: 2,
    eraserSizePx: shellArtService.ERASER_DEFAULT_PX,
    toolSizeValue: 2,
    toolSizeMin: 1,
    toolSizeMax: shellArtService.BRUSH_SIZES.length,
    toolSizeStep: 1,
    toolSizeLabel: shellArtService.BRUSH_SIZES[1].label,
    toolPreviewSize: shellArtService.ERASER_DEFAULT_PX,
    canUndo: false,
    canClear: false,
    saving: false,
    saveStatus: 'saved',
    saveStatusText: '已保存',
    canvasReady: false,
    canvasScale: MIN_CANVAS_SCALE
  },

  onLoad() {
    this.pageActive = true;
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const pet = petStore.getPet();
    this.shellArt = shellArtService.normalizeShellArt(pet && pet.shell);
    const latestBrush = this.shellArt.operations.slice().reverse().find(item => (
      item.type === 'stroke'
      && item.tool === 'brush'
      && shellArtService.BRUSH_COLORS.some(color => color.value.toLowerCase() === String(item.color || '').toLowerCase())
    ));
    const initialBrush = shellArtService.BRUSH_COLORS.find(color => (
      latestBrush && color.value.toLowerCase() === String(latestBrush.color).toLowerCase()
    )) || shellArtService.BRUSH_COLORS[0];
    this.undoStack = [];
    this.operationSequence = this.shellArt.operations.length;
    this.editRevision = 0;
    this.savedRevision = 0;
    this.setData({
      statusBarHeight: info.statusBarHeight || 20,
      selectedBrushColor: initialBrush.value,
      selectedBrushColorName: initialBrush.name
    });
    this.syncViewState();
  },

  onReady() {
    this.setupCanvases();
    this.cacheBrushSizeTrack();
  },

  onShow() {
    this.pageActive = true;
    if (this.editRevision > this.savedRevision) this.scheduleAutoSave();
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
      canUndo: !!(this.undoStack && this.undoStack.length),
      canClear: shell.operations.length > 0
    }, extra || {}));
  },

  setSaveStatus(status) {
    const labels = { saved: '已保存', saving: '保存中…', unsaved: '未保存' };
    this.setData({
      saving: status === 'saving',
      saveStatus: status,
      saveStatusText: labels[status] || labels.unsaved
    });
  },

  pushHistory() {
    const operations = JSON.parse(JSON.stringify(this.shellArt.operations || []));
    this.undoStack = (this.undoStack || []).concat([operations]).slice(-120);
  },

  markDirty() {
    this.editRevision = (this.editRevision || 0) + 1;
    this.setSaveStatus('unsaved');
    this.scheduleAutoSave();
  },

  scheduleAutoSave() {
    clearTimeout(this.autoSaveTimer);
    if (!this.pageActive || this.editRevision === this.savedRevision) return;
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = null;
      this.persistCurrent({ silent: true });
    }, AUTO_SAVE_DELAY);
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
      extra.toolSizeMax = shellArtService.BRUSH_SIZES.length;
      extra.toolSizeStep = 1;
      extra.toolSizeLabel = shellArtService.BRUSH_SIZES[this.data.brushSizeIndex - 1].label;
    }
    if (tool === 'eraser') {
      extra.toolSizeValue = this.data.eraserSizePx;
      extra.toolSizeMin = shellArtService.ERASER_MIN_PX;
      extra.toolSizeMax = shellArtService.ERASER_MAX_PX;
      extra.toolSizeStep = 1;
      extra.toolSizeLabel = `${this.data.eraserSizePx} px`;
      extra.toolPreviewSize = Math.max(6, Math.min(28, this.data.eraserSizePx));
    }
    this.setData(extra, () => {
      if (tool === 'brush') this.cacheBrushSizeTrack();
    });
  },

  onBrushColor(event) {
    const token = event.currentTarget.dataset.token;
    const color = shellArtService.BRUSH_COLORS.find(item => item.token === token);
    if (!color) return;
    this.setData({
      selectedBrushColor: color.value,
      selectedBrushColorName: color.name,
      activeTool: 'brush'
    });
  },

  selectBrushSize(index) {
    const safeIndex = Math.max(0, Math.min(shellArtService.BRUSH_SIZES.length - 1, Number(index) || 0));
    const option = shellArtService.BRUSH_SIZES[safeIndex];
    this.setData({
      brushSizeIndex: safeIndex + 1,
      toolSizeValue: safeIndex + 1,
      toolSizeLabel: option.label
    });
  },

  onBrushSize(event) {
    this.selectBrushSize(Number(event.currentTarget.dataset.index));
  },

  cacheBrushSizeTrack() {
    if (!wx.createSelectorQuery) return;
    wx.nextTick(() => {
      wx.createSelectorQuery().in(this).select('#brushSizeTrack').boundingClientRect(rect => {
        this.brushSizeTrackRect = rect || null;
      }).exec();
    });
  },

  onBrushSizeScrub(event) {
    const touch = (event.touches || event.changedTouches || [])[0];
    const rect = this.brushSizeTrackRect;
    if (!touch || !rect || !rect.width) return;
    const clientX = Number(touch.clientX);
    if (!Number.isFinite(clientX)) return;
    const ratio = Math.max(0, Math.min(0.9999, (clientX - rect.left) / rect.width));
    this.selectBrushSize(Math.floor(ratio * shellArtService.BRUSH_SIZES.length));
  },

  onToolSizeChange(event) {
    if (this.data.activeTool !== 'eraser') return;
    const pixels = Math.max(shellArtService.ERASER_MIN_PX, Math.min(shellArtService.ERASER_MAX_PX, Math.round(Number(event.detail.value) || shellArtService.ERASER_DEFAULT_PX)));
    this.setData({
      eraserSizePx: pixels,
      toolSizeValue: pixels,
      toolSizeLabel: `${pixels} px`,
      toolPreviewSize: Math.max(6, Math.min(28, pixels))
    });
  },

  onUndo() {
    if (!this.undoStack || !this.undoStack.length) return;
    this.shellArt.operations = this.undoStack.pop();
    this.currentStroke = null;
    this.syncViewState();
    this.renderAll();
    this.markDirty();
  },

  onClear() {
    if (!this.shellArt.operations.length) return;
    this.pushHistory();
    this.shellArt.operations = [];
    this.currentStroke = null;
    this.syncViewState({ selectedPattern: '' });
    this.renderArt();
    this.markDirty();
    wx.showToast({ title: '已清空，可以撤销', icon: 'none' });
  },

  canvasPoint(event) {
    const touch = (event.touches || event.changedTouches || [])[0];
    const layer = this.artLayer;
    if (!touch || !layer) return null;
    const scale = Math.max(MIN_CANVAS_SCALE, Number(this.data.canvasScale) || MIN_CANVAS_SCALE);
    const clientX = Number(touch.clientX);
    const clientY = Number(touch.clientY);
    const hasClientPoint = Number.isFinite(clientX) && Number.isFinite(clientY);
    const scaledWidth = layer.width * scale;
    const scaledHeight = layer.height * scale;
    const scaledLeft = layer.left - (scaledWidth - layer.width) / 2;
    const scaledTop = layer.top - (scaledHeight - layer.height) / 2;
    const localX = hasClientPoint ? (clientX - scaledLeft) / scale : Number(touch.x) / scale;
    const localY = hasClientPoint ? (clientY - scaledTop) / scale : Number(touch.y) / scale;
    if (!Number.isFinite(localX) || !Number.isFinite(localY)) return null;
    return {
      x: Math.max(0, Math.min(1, localX / layer.width)),
      y: Math.max(0, Math.min(1, localY / layer.height))
    };
  },

  cancelPendingDrawing() {
    if (this.currentStroke) {
      this.currentStroke = null;
      if (this.undoStack && this.undoStack.length) this.undoStack.pop();
      this.syncViewState();
      this.renderArt();
    }
    this.pendingStickerPoint = null;
  },

  beginPinch(touches) {
    const distance = touchDistance(touches);
    if (!distance) return;
    this.cancelPendingDrawing();
    this.pinchGesture = {
      startDistance: distance,
      startScale: Math.max(MIN_CANVAS_SCALE, Number(this.data.canvasScale) || MIN_CANVAS_SCALE)
    };
    this.suppressDrawingUntilRelease = true;
  },

  updatePinch(touches) {
    if (!this.pinchGesture) this.beginPinch(touches);
    if (!this.pinchGesture) return;
    const distance = touchDistance(touches);
    if (!distance) return;
    const nextScale = Math.max(
      MIN_CANVAS_SCALE,
      Math.min(MAX_CANVAS_SCALE, this.pinchGesture.startScale * distance / this.pinchGesture.startDistance)
    );
    this.setData({ canvasScale: Number(nextScale.toFixed(3)) });
  },

  finishPinchIfReleased(event) {
    if (!this.pinchGesture && !this.suppressDrawingUntilRelease) return false;
    const remainingTouches = (event.touches || []).length;
    if (remainingTouches < 2) this.pinchGesture = null;
    if (remainingTouches === 0) this.suppressDrawingUntilRelease = false;
    return true;
  },

  placePendingSticker() {
    const point = this.pendingStickerPoint;
    this.pendingStickerPoint = null;
    if (!point || !this.data.selectedPattern) return;
    this.pushHistory();
    const sticker = shellArtService.createSticker(this.data.selectedPattern, this.operationSequence, point);
    this.operationSequence += 1;
    this.shellArt.operations = this.shellArt.operations.concat(sticker).slice(-shellArtService.MAX_OPERATIONS);
    this.syncViewState();
    this.renderArt();
    this.markDirty();
  },

  onCanvasTouchStart(event) {
    if (!this.artLayer) return;
    const touches = event.touches || [];
    if (touches.length >= 2) {
      this.beginPinch(touches);
      return;
    }
    if (this.suppressDrawingUntilRelease) return;
    const point = this.canvasPoint(event);
    if (!point) return;
    if (this.data.activeTool === 'sticker') {
      if (!this.data.selectedPattern) {
        wx.showToast({ title: '先选择一种贴纸', icon: 'none' });
        return;
      }
      this.pendingStickerPoint = point;
      return;
    }
    this.pushHistory();
    const strokeWidth = this.data.activeTool === 'eraser'
      ? shellArtService.eraserWidthForPixels(
        this.data.eraserSizePx,
        this.artLayer ? Math.min(this.artLayer.width, this.artLayer.height) : undefined
      )
      : shellArtService.brushWidthForPixels(
        shellArtService.BRUSH_SIZES[this.data.brushSizeIndex - 1].pixels,
        this.artLayer ? Math.min(this.artLayer.width, this.artLayer.height) : undefined
      );
    this.currentStroke = shellArtService.createStroke(
      this.data.activeTool,
      [point],
      this.operationSequence += 1,
      strokeWidth,
      this.data.selectedBrushColor
    );
    this.renderArt(this.currentStroke);
  },

  onCanvasTouchMove(event) {
    const touches = event.touches || [];
    if (touches.length >= 2) {
      this.updatePinch(touches);
      return;
    }
    if (this.suppressDrawingUntilRelease) return;
    if (this.pendingStickerPoint) {
      const point = this.canvasPoint(event);
      if (point) this.pendingStickerPoint = point;
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
    if (!this.currentStroke) return;
    this.shellArt.operations = this.shellArt.operations.concat(this.currentStroke).slice(-shellArtService.MAX_OPERATIONS);
    this.currentStroke = null;
    this.syncViewState();
    this.renderArt();
    this.markDirty();
  },

  onCanvasTouchEnd(event) {
    if (this.finishPinchIfReleased(event)) return;
    if (this.pendingStickerPoint) {
      this.placePendingSticker();
      return;
    }
    this.finishStroke();
  },

  onCanvasTouchCancel(event) {
    if (this.finishPinchIfReleased(event)) return;
    this.pendingStickerPoint = null;
    this.finishStroke();
  },

  async performPersistence(snapshot) {
    if (runtime.getMode() === 'demo') {
      const result = petStore.applyConfirmedDoodle(snapshot);
      if (!result.ok) return { ok: false, message: result.message || '蛋壳没有保存成功，请重试' };
      if (!this.practiceSubmitted) {
        await practice.submit('doodle');
        this.practiceSubmitted = true;
      }
      return { ok: true };
    }
    if (!config.backendEnabled) {
      return { ok: false, message: '蛋壳创作服务尚未接入，请稍后再试' };
    }
    const pet = petStore.getPet();
    const response = await cloudApi.saveEggCreation(pet && pet.id, snapshot);
    if (!response.ok || response.mode !== 'live') {
      return { ok: false, message: response.message || '蛋壳没有保存成功，请重试' };
    }
    const result = petStore.applyConfirmedDoodle(response.creation || snapshot);
    if (!result.ok) return { ok: false, message: result.message || '蛋壳没有保存成功，请重试' };
    if (response.hatch_at) petStore.applyConfirmedHatchAt(response.hatch_at);
    return { ok: true };
  },

  async persistCurrent(options) {
    const settings = options || {};
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = null;
    if (this.savePromise) {
      await this.savePromise;
      if (this.editRevision === this.savedRevision) return { ok: true };
    }
    const targetRevision = this.editRevision;
    const snapshot = shellArtService.cloneShellArt(this.shellArt);
    this.setSaveStatus('saving');
    this.savePromise = this.performPersistence(snapshot).catch(error => ({
      ok: false,
      message: (error && error.message) || '蛋壳没有保存成功，请重试'
    }));
    const result = await this.savePromise;
    this.savePromise = null;
    if (result.ok) {
      this.savedRevision = Math.max(this.savedRevision, targetRevision);
      if (!this.saveTracked) {
        analytics.track('egg_creation_saved', shellArtService.operationSummary(snapshot));
        this.saveTracked = true;
      }
      if (this.editRevision === targetRevision) {
        this.setSaveStatus('saved');
      } else {
        this.setSaveStatus('unsaved');
        this.scheduleAutoSave();
      }
      return { ok: this.editRevision === this.savedRevision };
    }
    this.saveErrorMessage = result.message;
    this.setSaveStatus('unsaved');
    if (!settings.silent && this.pageActive) {
      wx.showToast({ title: result.message || '蛋壳没有保存成功，请重试', icon: 'none' });
    }
    return result;
  },

  async onRetrySave() {
    if (this.data.saveStatus !== 'unsaved') return;
    await this.persistCurrent({ silent: false });
  },

  async onBack() {
    if (this.backInProgress) return;
    this.backInProgress = true;
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = null;
    if (this.currentStroke) this.finishStroke();
    let result = { ok: true };
    if (this.editRevision !== this.savedRevision || this.savePromise) {
      result = await this.persistCurrent({ silent: true });
    }
    if (result.ok && this.editRevision === this.savedRevision) {
      wx.navigateBack({
        fail: () => { this.backInProgress = false; }
      });
      return;
    }
    this.backInProgress = false;
    wx.showToast({ title: this.saveErrorMessage || '还没有保存成功，请点“未保存”重试', icon: 'none' });
  },

  onHide() {
    this.pageActive = false;
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = null;
  },

  onUnload() {
    this.pageActive = false;
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = null;
    this.baseLayer = null;
    this.artLayer = null;
    this.baseImage = null;
    this.artMaskImage = null;
    this.currentStroke = null;
    this.pendingStickerPoint = null;
    this.pinchGesture = null;
    this.suppressDrawingUntilRelease = false;
    this.canvasSetupToken = (this.canvasSetupToken || 0) + 1;
  }
});
