const companionAdapter = require('../../services/iaa-star-unlock-adapter');
const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const shellArtService = require('../../services/egg-shell-art');
const runtime = require('../../services/runtime-context');
const canvas2d = require('../../utils/canvas-2d');
const practice = require('../../services/incubation-practice');
const preHatchAssets = require('../../config/pre-hatch-assets').PRE_HATCH;
const { createInlineNoticeController } = require('../../utils/inline-notice-controller');

const PAGE_TRANSITION_MS = 320;
const COLOR_HINT_STORAGE_KEY = 'eggbabe_doodle_color_hint_seen_v1';
const COLOR_HINT_DELAY_MS = 420;
const COLOR_HINT_DURATION_MS = 2400;
const COLOR_HINT_FADE_MS = 180;
const MIN_CANVAS_SCALE = 1;
const MAX_CANVAS_SCALE = 1.6;
const BRUSH_SIZE_OPTIONS = shellArtService.BRUSH_SIZES.map(item => Object.assign({}, item, {
  previewRpx: Math.max(6, item.pixels * 2)
}));
const ERASER_SIZE_OPTIONS = shellArtService.ERASER_SIZES.map(item => Object.assign({}, item, {
  previewRpx: item.pixels * 2
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

function hasSeenColorHint() {
  try {
    return Boolean(wx.getStorageSync(COLOR_HINT_STORAGE_KEY));
  } catch (error) {
    return false;
  }
}

function markColorHintSeen() {
  try {
    wx.setStorageSync(COLOR_HINT_STORAGE_KEY, true);
  } catch (error) {}
}

const doodleDefinition = {
  data: {
    statusBarHeight: 20,
    toolbarIcons: preHatchAssets.doodleToolbar,
    brushColors: shellArtService.BRUSH_COLORS,
    brushSizes: BRUSH_SIZE_OPTIONS,
    eraserSizes: ERASER_SIZE_OPTIONS,
    patterns: shellArtService.PATTERNS,
    selectedBrushColor: shellArtService.DEFAULT_BRUSH_COLOR,
    selectedBrushColorName: shellArtService.BRUSH_COLORS[0].name,
    selectedPattern: '',
    activeTool: 'brush',
    toolPanelOpen: false,
    colorPickerOpen: false,
    colorHintRendered: false,
    colorHintVisible: false,
    brushSizeIndex: 2,
    eraserSizeIndex: shellArtService.ERASER_SIZES.findIndex(item => item.pixels === shellArtService.ERASER_DEFAULT_PX) + 1,
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
    exitConfirmVisible: false,
    exitConfirmSaving: false,
    exitConfirmErrorText: '',
    canvasReady: false,
    canvasPreparationError: false,
    canvasScale: MIN_CANVAS_SCALE,
    canvasNoticeText: '',
    canvasNoticeTone: 'info',
    canvasNoticeVisible: false,
    companionStartAward: 0,
    companionStartAwardVisible: false,
    companionReducedMotion: false,
    pageTransitionPhase: 'waiting'
  },

  onLoad(query) {
    this.companionDrawing = Boolean(query && query.entry === 'companion');
    this.setData({ companionDrawing: this.companionDrawing });
    this.pageActive = true;
    this.colorHintSeen = hasSeenColorHint();
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const pet = petStore.getPet();
    this.resumingCompanionDraft = Boolean(this.companionDrawing && companionAdapter.getCompanionDraft());
    this.shellArt = shellArtService.normalizeShellArt(this.companionDrawing ? companionAdapter.getCompanionDraft() : pet && pet.shell);
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
    if (this.data.toolPanelOpen && this.data.activeTool === 'brush') this.scheduleColorHint();
  },

  pageTransitionDuration() {
    try {
      const system = wx.getSystemSetting
        ? wx.getSystemSetting()
        : (wx.getSystemInfoSync ? wx.getSystemInfoSync() : {});
      return system.reducedMotion || system.enableReduceMotion ? 20 : PAGE_TRANSITION_MS;
    } catch (error) {
      return PAGE_TRANSITION_MS;
    }
  },

  waitForPageExit() {
    clearTimeout(this.pageTransitionTimer);
    this.setData({ pageTransitionPhase: 'exiting' });
    return new Promise(resolve => {
      this.pageExitResolve = resolve;
      this.pageTransitionTimer = setTimeout(() => {
        this.pageTransitionTimer = null;
        this.pageExitResolve = null;
        resolve();
      }, this.pageTransitionDuration());
    });
  },

  revealEditor() {
    const reveal = () => {
      if (!this.pageActive) return;
      const transitionDuration = this.pageTransitionDuration();
      this.setData({ canvasReady: true, pageTransitionPhase: 'entering' }, () => {
        clearTimeout(this.pageTransitionTimer);
        this.pageTransitionTimer = setTimeout(() => {
          this.pageTransitionTimer = null;
          if (this.pageActive) this.setData({ pageTransitionPhase: 'visible' });
        }, transitionDuration + 40);
        if (this.triggerEvent) this.triggerEvent('ready');
        if (this.companionDrawing) this.beginCompanionDrawing();
      });
    };
    if (wx.nextTick) wx.nextTick(reveal);
    else setTimeout(reveal, 0);
  },

  beginCompanionDrawing() {
    if (this.companionStartRequested) return Promise.resolve();
    this.companionStartRequested = true;
    // 跨日继续旧草稿不自动领取新一天的开始奖励。
    if (this.resumingCompanionDraft && companionAdapter.getCompanionDraftStartDate() && companionAdapter.getCompanionDraftStartDate() !== require('../../services/companion-star-rules').shanghaiDate()) return Promise.resolve();
    companionAdapter.setCompanionDraft(this.shellArt);
    return companionAdapter.getRoomStarView().then(view => companionAdapter.recordDrawingStart(view.data)).then(result => {
      if (!result.ok) { this.companionStartRequested = false; if (this.pageActive) this.showCanvasNotice(result.error.message, 'warning'); return result; }
      companionAdapter.markCompanionDraftStarted();
      if (!this.pageActive || !result.awardedStars) return result;
      this.setData({ companionStartAward: result.awardedStars, companionStartAwardVisible: true, companionReducedMotion: this.pageTransitionDuration() <= 20 });
      clearTimeout(this.companionStartAwardTimer);
      this.companionStartAwardTimer = setTimeout(() => { if (this.pageActive) this.setData({ companionStartAwardVisible: false }); }, 1700);
      try {
        if (wx.createInnerAudioContext) {
          const audio = wx.createInnerAudioContext();
          audio.src = '/assets/scenes/lifecycle/post-hatch/40-interaction-fx/companion-star/companion-star-award.mp3';
          audio.volume = 0.32; audio.obeyMuteSwitch = true;
          this.companionStartAudio = audio;
          if (audio.onError) audio.onError(() => this.clearCompanionFeedback());
          this.companionStartSoundTimer = setTimeout(() => { if (this.pageActive && this.companionStartAudio) { try { this.companionStartAudio.play(); } catch (error) {} } }, 200);
        }
      } catch (error) {}
      if (this.pageTransitionDuration() > 20) this.companionStartHapticTimer = setTimeout(() => { if (this.pageActive && wx.vibrateShort) { try { wx.vibrateShort({ type: 'light' }); } catch (error) {} } }, 400);
      return result;
    });
  },
  clearCompanionFeedback() {
    clearTimeout(this.companionStartAwardTimer); clearTimeout(this.companionStartSoundTimer); clearTimeout(this.companionStartHapticTimer);
    if (this.companionStartAudio) { try { this.companionStartAudio.stop(); this.companionStartAudio.destroy(); } catch (error) {} this.companionStartAudio = null; }
  },

  failCanvasPreparation() {
    if (!this.pageActive || !this.companionDrawing) return;
    this.setData({ canvasPreparationError: true, canvasReady: false, pageTransitionPhase: 'visible' });
    this.showCanvasNotice('画纸没有准备好，请返回后重试', 'warning');
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
      if (!this.baseLayer || !this.artLayer) { this.failCanvasPreparation(); return; }
      return Promise.all([
        canvas2d.loadImage(this.baseLayer, shellArtService.BASE_ASSET),
        canvas2d.loadImage(this.artLayer, shellArtService.BASE_ASSET)
      ]).then(images => {
        if (setupToken !== this.canvasSetupToken) return;
        if (!images[0] || !images[1]) { this.failCanvasPreparation(); return; }
        this.baseImage = images[0];
        this.artMaskImage = images[1];
        this.renderAll();
        this.revealEditor();
      });
    }).catch(() => { if (setupToken === this.canvasSetupToken) this.failCanvasPreparation(); });
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
    const labels = { saved: '已保存', saving: '保存中…', unsaved: '保存', error: '重新保存' };
    this.setData({
      saving: status === 'saving',
      saveStatus: status,
      saveStatusText: labels[status] || labels.unsaved
    });
  },

  clearCanvasNoticeTimers() {
    if (this.canvasNoticeController) this.canvasNoticeController.clearTimers();
  },

  dismissCanvasNotice() {
    if (this.canvasNoticeController) this.canvasNoticeController.dismiss();
  },

  showCanvasNotice(text, tone) {
    if (!this.canvasNoticeController) {
      this.canvasNoticeController = createInlineNoticeController(this, {
        textKey: 'canvasNoticeText',
        toneKey: 'canvasNoticeTone',
        visibleKey: 'canvasNoticeVisible',
        timerKey: 'canvasNoticeTimer',
        cleanupTimerKey: 'canvasNoticeCleanupTimer',
        isActive: () => this.pageActive !== false
      });
    }
    return this.canvasNoticeController.show(text, tone);
  },

  pushHistory() {
    const operations = JSON.parse(JSON.stringify(this.shellArt.operations || []));
    this.undoStack = (this.undoStack || []).concat([operations]).slice(-120);
  },

  markDirty() {
    this.editRevision = (this.editRevision || 0) + 1;
    this.setSaveStatus('unsaved');
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
    this.dismissColorHint();
    this.setData({
      selectedPattern: pattern,
      activeTool: 'sticker',
      toolPanelOpen: true,
      colorPickerOpen: false
    });
  },

  onTool(event) {
    const tool = event.currentTarget.dataset.tool;
    if (tool !== 'brush' && tool !== 'eraser' && tool !== 'sticker') return;
    this.dismissColorHint();
    const extra = { activeTool: tool, toolPanelOpen: true, colorPickerOpen: false };
    if (tool === 'brush') {
      extra.toolSizeValue = this.data.brushSizeIndex;
      extra.toolSizeMin = 1;
      extra.toolSizeMax = shellArtService.BRUSH_SIZES.length;
      extra.toolSizeStep = 1;
      extra.toolSizeLabel = shellArtService.BRUSH_SIZES[this.data.brushSizeIndex - 1].label;
    }
    if (tool === 'eraser') {
      const selected = shellArtService.ERASER_SIZES[this.data.eraserSizeIndex - 1]
        || shellArtService.ERASER_SIZES[2];
      extra.eraserSizePx = selected.pixels;
      extra.toolSizeLabel = selected.label;
    }
    this.setData(extra, () => {
      if (tool !== 'brush') return;
      this.cacheBrushSizeTrack();
      this.scheduleColorHint();
    });
  },

  collapseToolPanel() {
    this.dismissColorHint();
    if (!this.data.toolPanelOpen) return;
    this.setData({ toolPanelOpen: false, colorPickerOpen: false });
  },

  onCanvasBackdropTap() {
    this.collapseToolPanel();
  },

  onToolPanelTap() {},

  clearColorHintTimers() {
    clearTimeout(this.colorHintDelayTimer);
    clearTimeout(this.colorHintRevealTimer);
    clearTimeout(this.colorHintHideTimer);
    clearTimeout(this.colorHintCleanupTimer);
    this.colorHintDelayTimer = null;
    this.colorHintRevealTimer = null;
    this.colorHintHideTimer = null;
    this.colorHintCleanupTimer = null;
    this.colorHintRequestToken = (this.colorHintRequestToken || 0) + 1;
  },

  dismissColorHint() {
    this.clearColorHintTimers();
    if (!this.data.colorHintRendered && !this.data.colorHintVisible) return;
    this.setData({ colorHintRendered: false, colorHintVisible: false });
  },

  scheduleColorHint() {
    this.clearColorHintTimers();
    if (this.colorHintSeen || hasSeenColorHint()) {
      this.colorHintSeen = true;
      return;
    }
    const requestToken = this.colorHintRequestToken;
    this.colorHintDelayTimer = setTimeout(() => {
      this.colorHintDelayTimer = null;
      if (
        !this.pageActive
        || requestToken !== this.colorHintRequestToken
        || !this.data.toolPanelOpen
        || this.data.activeTool !== 'brush'
      ) return;
      this.setData({ colorHintRendered: true, colorHintVisible: false }, () => {
        this.colorHintRevealTimer = setTimeout(() => {
          this.colorHintRevealTimer = null;
          if (!this.pageActive || requestToken !== this.colorHintRequestToken) return;
          this.colorHintSeen = true;
          markColorHintSeen();
          this.setData({ colorHintVisible: true });
          this.colorHintHideTimer = setTimeout(() => {
            this.colorHintHideTimer = null;
            if (!this.pageActive || requestToken !== this.colorHintRequestToken) return;
            this.setData({ colorHintVisible: false });
            this.colorHintCleanupTimer = setTimeout(() => {
              this.colorHintCleanupTimer = null;
              if (this.pageActive && requestToken === this.colorHintRequestToken) {
                this.setData({ colorHintRendered: false });
              }
            }, COLOR_HINT_FADE_MS);
          }, COLOR_HINT_DURATION_MS);
        }, 20);
      });
    }, COLOR_HINT_DELAY_MS);
  },

  onToggleBrushColorPicker() {
    if (this.data.activeTool !== 'brush') return;
    this.dismissColorHint();
    this.setData({ colorPickerOpen: !this.data.colorPickerOpen });
  },

  onColorPickerTap() {},

  onBrushColor(event) {
    const token = event.currentTarget.dataset.token;
    const color = shellArtService.BRUSH_COLORS.find(item => item.token === token);
    if (!color) return;
    this.dismissColorHint();
    this.setData({
      selectedBrushColor: color.value,
      selectedBrushColorName: color.name,
      activeTool: 'brush',
      colorPickerOpen: false
    });
  },

  selectBrushSize(index) {
    const safeIndex = Math.max(0, Math.min(shellArtService.BRUSH_SIZES.length - 1, Number(index) || 0));
    const option = shellArtService.BRUSH_SIZES[safeIndex];
    this.dismissColorHint();
    this.setData({
      brushSizeIndex: safeIndex + 1,
      toolSizeValue: safeIndex + 1,
      toolSizeLabel: option.label,
      colorPickerOpen: false
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

  selectEraserSize(index) {
    const safeIndex = Math.max(0, Math.min(shellArtService.ERASER_SIZES.length - 1, Number(index) || 0));
    const option = shellArtService.ERASER_SIZES[safeIndex];
    this.setData({
      eraserSizeIndex: safeIndex + 1,
      eraserSizePx: option.pixels,
      toolSizeLabel: option.label
    });
  },

  onEraserSize(event) {
    this.selectEraserSize(Number(event.currentTarget.dataset.index));
  },

  onUndo() {
    this.collapseToolPanel();
    if (!this.undoStack || !this.undoStack.length) return;
    this.dismissCanvasNotice();
    this.shellArt.operations = this.undoStack.pop();
    this.currentStroke = null;
    this.syncViewState();
    this.renderAll();
    this.markDirty();
  },

  onClear() {
    this.collapseToolPanel();
    if (!this.shellArt.operations.length) return;
    this.pushHistory();
    this.shellArt.operations = [];
    this.currentStroke = null;
    this.syncViewState({ selectedPattern: '' });
    this.renderArt();
    this.markDirty();
    this.showCanvasNotice('已清空，可以撤销', 'info');
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
    if (this.companionDrawing && (this.companionCompleting || this.savedForReturn)) return;
    this.collapseToolPanel();
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
        this.showCanvasNotice('先选择一种贴纸', 'warning');
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
    if (this.companionDrawing) { this.companionDraft = shellArtService.cloneShellArt(snapshot); companionAdapter.setCompanionDraft(this.companionDraft); return { ok: true }; }
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
      }
      return { ok: this.editRevision === this.savedRevision };
    }
    this.saveErrorMessage = result.message;
    this.setSaveStatus('error');
    if (!settings.silent && this.pageActive) {
      this.showCanvasNotice(result.message || '蛋壳没有保存成功，请重试', 'warning');
    }
    return result;
  },

  async onManualSave() {
    if (this.manualSaveTask || this.data.saveStatus === 'saving') return this.manualSaveTask;
    if (this.currentStroke) this.finishStroke();
    if (this.companionDrawing) {
      if (!this.data.canvasReady) { this.failCanvasPreparation(); return { ok: false }; }
      if (this.savedForReturn) { await this.leaveEditor({ saved: true }); return { ok: true }; }
      const task = this.completeCompanionDrawing();
      this.manualSaveTask = task;
      try { return await task; } finally { if (this.manualSaveTask === task) this.manualSaveTask = null; }
    }
    if (this.editRevision === this.savedRevision) {
      this.setSaveStatus('saved');
      return { ok: true };
    }
    this.dismissCanvasNotice();
    const task = this.persistCurrent({ silent: false });
    this.manualSaveTask = task;
    try {
      const result = await task;
      if (result && result.ok && this.editRevision === this.savedRevision) {
        this.savedForReturn = true;
      }
      return result;
    } finally {
      if (this.manualSaveTask === task) this.manualSaveTask = null;
    }
  },

  async completeCompanionDrawing() {
    if (this.companionCompleting || this.pageDisposed || this.pageActive === false) return { ok: false };
    if (!this.shellArt.operations.some(item => item.type === 'stroke' && item.tool !== 'eraser')) { this.showCanvasNotice('先画几笔吧', 'info'); return { ok: false }; }
    this.companionCompleting = true;
    let image;
    try { image = await canvas2d.exportImage(this.artLayer); } catch (error) { this.companionCompleting = false; this.showCanvasNotice('画没有保存成功，请重试', 'warning'); return { ok: false }; }
    if (this.pageDisposed || this.pageActive === false) { this.companionCompleting = false; return { ok: false }; }
    if (!image) { this.companionCompleting = false; this.showCanvasNotice('画没有保存成功，请重试', 'warning'); return { ok: false }; }
    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (!channel || !channel.emit) { this.companionCompleting = false; return { ok: false }; }
    channel.emit('companionDrawingCompleted', { id: `drawing-${Date.now()}`, image, title: '一起画的画', line: '这张是我们一起画的。', date: require('../../services/companion-star-rules').shanghaiDate() });
    companionAdapter.setCompanionDraft(null);
    this.savedRevision = this.editRevision;
    this.savedForReturn = true;
    await this.leaveEditor({ saved: true });
    return { ok: true };
  },

  onContinueEditing() {
    if (this.backInProgress || this.data.exitConfirmSaving) return;
    this.setData({ exitConfirmVisible: false, exitConfirmErrorText: '' });
  },

  onExitConfirmTap() {
    this.onContinueEditing();
  },

  onExitConfirmDialogTap() {},

  async leaveEditor(options) {
    if (this.backInProgress) return;
    const settings = options || {};
    const saved = Boolean(settings.saved || this.savedForReturn);
    this.backInProgress = true;
    this.setData({ exitConfirmVisible: false });
    await this.waitForPageExit();
    if (this.pageDisposed) return;
    if (this.properties && this.properties.embedded) {
      this.triggerEvent('close', { saved });
      return;
    }
    wx.navigateBack({
      animationType: 'none',
      animationDuration: 0,
      fail: () => {
        this.backInProgress = false;
        this.setData({ pageTransitionPhase: 'visible' });
      }
    });
  },

  async onDiscardAndExit() {
    if (!this.data.exitConfirmVisible || this.backInProgress || this.data.exitConfirmSaving) return;
    await this.leaveEditor();
  },

  async onSaveAndExit() {
    if (!this.data.exitConfirmVisible || this.backInProgress || this.data.exitConfirmSaving) return;
    this.setData({ exitConfirmSaving: true, exitConfirmErrorText: '' });
    const result = await this.onManualSave();
    if (result && result.ok && this.editRevision === this.savedRevision) {
      await this.leaveEditor({ saved: true });
      return;
    }
    this.setData({
      exitConfirmSaving: false,
      exitConfirmErrorText: (result && result.message) || '保存失败，请重试'
    });
  },

  async onBack() {
    if (this.backInProgress || this.data.exitConfirmVisible) return;
    if (this.currentStroke) this.finishStroke();
    if (this.manualSaveTask) {
      this.backInProgress = true;
      await this.manualSaveTask;
      this.backInProgress = false;
    }
    if (this.companionDrawing) {
      if (this.pageDisposed) return;
      if (this.savedForReturn) { await this.leaveEditor({ saved: true }); return; }
      companionAdapter.setCompanionDraft(this.shellArt);
      await this.leaveEditor(); return;
    }
    if (this.editRevision !== this.savedRevision) {
      this.collapseToolPanel();
      this.dismissCanvasNotice();
      this.setData({ exitConfirmVisible: true, exitConfirmErrorText: '' });
      return;
    }
    await this.leaveEditor();
  },

  onHide() {
    if (this.companionDrawing && !this.savedForReturn) { if (this.currentStroke) this.finishStroke(); companionAdapter.setCompanionDraft(this.shellArt); }
    this.clearCompanionFeedback();
    this.setData({ companionStartAwardVisible: false });
    this.pageActive = false;
    this.clearCanvasNoticeTimers();
    this.clearColorHintTimers();
    if (this.data.canvasNoticeText) {
      this.setData({ canvasNoticeText: '', canvasNoticeVisible: false });
    }
    if (this.data.colorHintRendered || this.data.colorHintVisible) {
      this.setData({ colorHintRendered: false, colorHintVisible: false });
    }
  },

  onUnload() {
    this.pageDisposed = true;
    if (this.pageExitResolve) { this.pageExitResolve(); this.pageExitResolve = null; }
    if (this.companionDrawing && !this.savedForReturn) companionAdapter.setCompanionDraft(this.shellArt);
    this.clearCompanionFeedback();
    this.pageActive = false;
    clearTimeout(this.pageTransitionTimer);
    this.pageTransitionTimer = null;
    this.clearCanvasNoticeTimers();
    this.clearColorHintTimers();
    this.baseLayer = null;
    this.artLayer = null;
    this.baseImage = null;
    this.artMaskImage = null;
    this.currentStroke = null;
    this.pendingStickerPoint = null;
    this.pinchGesture = null;
    this.suppressDrawingUntilRelease = false;
    this.manualSaveTask = null;
    this.canvasSetupToken = (this.canvasSetupToken || 0) + 1;
  }
};

module.exports = doodleDefinition;
