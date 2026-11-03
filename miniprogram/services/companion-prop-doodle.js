const propCatalog = require('./companion-prop-catalog');
const propAssets = require('./companion-prop-assets');
const propChallenge = require('./companion-prop-challenge');
const drawingGate = require('./companion-drawing-gate');
const companionAdapter = require('./iaa-star-unlock-adapter');
const shellArtService = require('./egg-shell-art');

const TUTORIAL_FINAL_LABEL = '开始画';
const PROP_AWARD_SOUND = '/assets/scenes/lifecycle/post-hatch/40-interaction-fx/companion-star/companion-star-award.mp3';

function attach(definition) {
  const originalOnLoad = definition.onLoad;
  const originalOnHide = definition.onHide;
  const originalOnUnload = definition.onUnload;
  const originalReveal = definition.revealEditor;
  const originalTouchStart = definition.onCanvasTouchStart;
  const originalTouchMove = definition.onCanvasTouchMove;
  const originalTouchEnd = definition.onCanvasTouchEnd;
  const originalTouchCancel = definition.onCanvasTouchCancel;
  const originalUndo = definition.onUndo;
  const originalClear = definition.onClear;
  const originalFinishStroke = definition.finishStroke;
  const originalComplete = definition.completeCompanionDrawing;

  definition.onLoad = function onLoad(query) {
    if (originalOnLoad) originalOnLoad.call(this, query);
    this.companionPropMode = Boolean(this.companionDrawing);
    if (!this.companionPropMode) return;
    this.propEntrySource = (query && query.source) || 'activity';
    this.propEntry = propCatalog.getById(query && query.propId)
      || propCatalog.pickDaily(require('./companion-star-rules').shanghaiDate(), companionAdapter.getRoomScope());
    this.gateTracker = drawingGate.createTracker();
    this.gateStrokeId = null;
    this.propGateOptions = { paper: true };
    this.propSession = propChallenge.createSession();
    this.propEntryFlowStarted = false;
    const sketchPath = this.propEntry ? propAssets.resolveLinePath(this.propEntry) : '';
    const coloredPath = this.propEntry ? propAssets.resolveColoredPath(this.propEntry) : '';
    const legacyColored = this.propEntry && this.propEntry.colorFile
      ? `${propAssets.LEGACY_COLOR_ROOT}${this.propEntry.colorFile}`
      : '';
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const windowWidth = info.windowWidth || 375;
    let navSlotWidthPx = Math.round(windowWidth * 86 / 390);
    try {
      const menu = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect();
      if (menu && Number.isFinite(Number(menu.left))) {
        navSlotWidthPx = Math.round(Number(menu.left));
      }
    } catch (error) {}
    this.setData({
      companionPropMode: this.companionPropMode,
      navSlotWidthPx,
      propSketchPath: sketchPath,
      propColoredPath: coloredPath,
      propFallbackColoredPath: legacyColored || coloredPath,
      propDisplayName: this.propEntry ? this.propEntry.name : '',
      propLookHint: propChallenge.lookHintText(propChallenge.MANUAL_LOOKS),
      propSessionLookRemaining: propChallenge.MANUAL_LOOKS,
      propSketchSrc: sketchPath,
      propColoredSrc: coloredPath,
      propPeekVisible: false,
      propPeekAnimating: false,
      propGuideSketchVisible: false,
      propDrawingLocked: true,
      propUnlockVisible: false,
      propTutorialVisible: false,
      propTutorialStep: 0,
      propTutorialSteps: propChallenge.TUTORIAL_STEPS,
      propTutorialFinalLabel: TUTORIAL_FINAL_LABEL,
      propFinishVisible: false
    });
  };

  definition.playPropUnlockAward = function playPropUnlockAward() {
    if (!this.data.propAwardVisible || !this.data.propAwardStars) return;
    try {
      if (wx.createInnerAudioContext) {
        this.propAwardAudio = wx.createInnerAudioContext({ useWebAudioImplement: true });
        this.propAwardAudio.src = PROP_AWARD_SOUND;
        this.propAwardAudio.volume = 0.2;
        this.propAwardAudio.obeyMuteSwitch = true;
        if (this.propAwardAudio.onError) {
          this.propAwardAudio.onError(() => {
            if (this.propAwardAudio) {
              try { this.propAwardAudio.destroy(); } catch (error) {}
              this.propAwardAudio = null;
            }
          });
        }
        clearTimeout(this.propAwardSoundTimer);
        this.propAwardSoundTimer = setTimeout(() => {
          if (this.pageActive && this.propAwardAudio) {
            try { this.propAwardAudio.play(); } catch (error) {}
          }
        }, 520);
      }
    } catch (error) {}
    if (this.data.companionReducedMotion) return;
    clearTimeout(this.propAwardHapticTimer);
    this.propAwardHapticTimer = setTimeout(() => {
      if (this.pageActive && wx.vibrateShort) {
        try { wx.vibrateShort({ type: 'light' }); } catch (error) {}
      }
    }, 840);
  };

  definition.clearPropUnlockAward = function clearPropUnlockAward() {
    clearTimeout(this.propAwardSoundTimer);
    clearTimeout(this.propAwardHapticTimer);
    if (this.propAwardAudio) {
      try { this.propAwardAudio.stop(); this.propAwardAudio.destroy(); } catch (error) {}
      this.propAwardAudio = null;
    }
  };

  definition.beginPropEntryFlow = function beginPropEntryFlow() {
    if (!this.companionPropMode || this.propEntryFlowStarted) return;
    this.propEntryFlowStarted = true;
    if (!propChallenge.hasSeenTutorial()) {
      this.setData({
        propTutorialVisible: true,
        propTutorialStep: 0,
        propDrawingLocked: true,
        propGuideSketchVisible: true
      });
      this.setPropLineOverlayVisible(true);
      return;
    }
    this.scheduleInitialPropPeek();
  };

  definition.revealEditor = function revealEditor() {
    const run = () => {
      if (!this.pageActive) return;
      if (originalReveal) originalReveal.call(this);
    };
    if (wx.nextTick) wx.nextTick(run);
    else setTimeout(run, 0);
  };

  definition.scheduleInitialPropPeek = function scheduleInitialPropPeek() {
    this.startPropPeek({ countsAgainstManual: false });
  };

  definition.dismissPropPeek = function dismissPropPeek() {
    if (!this.data.propPeekVisible || this.data.propPeekAnimating) return;
    clearTimeout(this.propPeekTimer);
    clearTimeout(this.propPeekHideTimer);
    const flipMs = this.data.companionReducedMotion ? 80 : propChallenge.PEEK_FLIP_MS;
    this.setData({ propPeekAnimating: true });
    this.propPeekHideTimer = setTimeout(() => {
      this.propSession.drawingLocked = false;
      this.setData({
        propPeekVisible: false,
        propPeekAnimating: false,
        propDrawingLocked: false,
        propFinishVisible: true
      });
      this.setPropLineOverlayVisible(true);
    }, flipMs);
  };

  definition.onPropPeekCardTap = function onPropPeekCardTap() {
    if (!this.data.propPeekVisible || this.data.propPeekAnimating) return;
    if (this.data.propTutorialVisible) return;
    this.dismissPropPeek();
  };

  definition.startPropPeek = function startPropPeek(options) {
    const settings = options || {};
    clearTimeout(this.propPeekTimer);
    clearTimeout(this.propPeekHideTimer);
    if (settings.countsAgainstManual && this.propSession.lookRemaining <= 0) return;
    if (settings.countsAgainstManual) {
      this.propSession.lookRemaining -= 1;
      this.setData({
        propLookHint: propChallenge.lookHintText(this.propSession.lookRemaining),
        propSessionLookRemaining: this.propSession.lookRemaining
      });
    }
    this.propSession.drawingLocked = true;
    this.setPropLineOverlayVisible(false);
    this.setData({
      propDrawingLocked: true,
      propPeekVisible: true,
      propPeekAnimating: false,
      propFinishVisible: false
    });
    this.propPeekTimer = setTimeout(() => {
      this.dismissPropPeek();
    }, propChallenge.LOOK_DURATION_MS);
  };

  definition.onPropLookAgain = function onPropLookAgain() {
    if (this.data.propDrawingLocked || this.data.propUnlockVisible || this.data.propTutorialVisible) return;
    if (this.propSession.lookRemaining <= 0) return;
    if (this.currentStroke) this.finishStroke();
    this.startPropPeek({ countsAgainstManual: true });
  };

  definition.onPropTutorialSkip = function onPropTutorialSkip() {
    propChallenge.markTutorialSeen();
    this.setData({ propTutorialVisible: false, propGuideSketchVisible: false });
    this.setPropLineOverlayVisible(false);
    this.scheduleInitialPropPeek();
  };

  definition.onPropTutorialNext = function onPropTutorialNext() {
    const step = Number(this.data.propTutorialStep) || 0;
    if (step >= propChallenge.TUTORIAL_STEPS.length - 1) {
      propChallenge.markTutorialSeen();
      this.setData({ propTutorialVisible: false, propGuideSketchVisible: false });
      this.setPropLineOverlayVisible(false);
      this.scheduleInitialPropPeek();
      return;
    }
    const nextStep = step + 1;
    this.setData({
      propTutorialStep: nextStep,
      propGuideSketchVisible: nextStep === 0
    });
    this.setPropLineOverlayVisible(nextStep === 0);
  };

  definition.onPropUnlockOk = async function onPropUnlockOk() {
    if (!this.data.propUnlockVisible || this.propCompletingExit) return;
    this.propCompletingExit = true;
    this.clearPropUnlockAward();
    const payload = this.pendingPropCompletion;
    if (payload) {
      try {
        const viewResult = await companionAdapter.getRoomStarView();
        if (viewResult.ok) {
          const settlement = await companionAdapter.recordPropDrawingComplete(viewResult.data, payload.id);
          if (settlement.ok) payload.awardedStars = Number(settlement.awardedStars) || 0;
        }
      } catch (error) {
        payload.awardedStars = 0;
      }
    }
    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (channel && channel.emit && payload) channel.emit('companionDrawingCompleted', payload);
    companionAdapter.setCompanionDraft(null);
    this.savedForReturn = true;
    this.leaveEditor({ saved: true });
  };

  definition.onCanvasTouchStart = function onCanvasTouchStart(event) {
    if (this.companionPropMode && (this.data.propDrawingLocked || this.data.propUnlockVisible || this.data.propTutorialVisible)) return;
    if (originalTouchStart) originalTouchStart.call(this, event);
    if (!this.companionPropMode || !this.gateTracker) return;
    const tool = this.data.activeTool;
    this.gateStrokeId = drawingGate.beginStroke(this.gateTracker, tool);
    if (tool === 'brush') drawingGate.trackActiveElapsed(this.gateTracker, Date.now());
    if (this.currentStroke && this.gateStrokeId && tool === 'brush') {
      this.currentStroke.gateStrokeId = this.gateStrokeId;
    }
  };

  definition.onCanvasTouchMove = function onCanvasTouchMove(event) {
    if (this.companionPropMode && this.data.propDrawingLocked) return;
    if (originalTouchMove) originalTouchMove.call(this, event);
    if (!this.companionPropMode || !this.gateTracker || !this.currentStroke) return;
    const point = this.canvasPoint(event);
    drawingGate.trackPoint(this.gateTracker, this.data.activeTool, point, this.propGateOptions);
    if (this.data.activeTool === 'brush') drawingGate.trackActiveElapsed(this.gateTracker, Date.now());
  };

  definition.onCanvasTouchEnd = function onCanvasTouchEnd(event) {
    if (originalTouchEnd) originalTouchEnd.call(this, event);
    if (!this.companionPropMode || !this.gateTracker) return;
    drawingGate.endStroke(this.gateTracker, this.gateStrokeId, this.data.activeTool, false);
    this.gateStrokeId = null;
  };

  definition.onCanvasTouchCancel = function onCanvasTouchCancel(event) {
    if (originalTouchCancel) originalTouchCancel.call(this, event);
    if (!this.companionPropMode || !this.gateTracker) return;
    drawingGate.endStroke(this.gateTracker, this.gateStrokeId, this.data.activeTool, true);
    this.gateStrokeId = null;
  };

  definition.onUndo = function onUndo() {
    if (!this.undoStack || !this.undoStack.length) return;
    if (originalUndo) originalUndo.call(this);
    if (this.companionPropMode) {
      const prevMs = this.gateTracker ? this.gateTracker.activeMs : 0;
      this.gateTracker = drawingGate.rebuildFromOperations(this.shellArt.operations, this.propGateOptions);
      this.gateTracker.activeMs = prevMs;
    }
  };

  definition.onClear = function onClear() {
    const prevMs = this.gateTracker ? this.gateTracker.activeMs : 0;
    if (originalClear) originalClear.call(this);
    if (this.companionPropMode) {
      this.gateTracker = drawingGate.rebuildFromOperations(this.shellArt.operations, this.propGateOptions);
      this.gateTracker.activeMs = prevMs;
    }
  };

  const originalRenderAll = definition.renderAll;

  definition.renderPropLineOverlay = function renderPropLineOverlay() {
    if (!this.companionPropMode || !this.data.propLineOverlayVisible) return;
    if (!this.propLineLayer || !this.propLineImage) return;
    shellArtService.drawPropLineOverlay(
      this.propLineLayer.context,
      this.propLineImage,
      this.propLineLayer.width,
      this.propLineLayer.height
    );
  };

  definition.clearPropLineOverlay = function clearPropLineOverlay() {
    if (!this.propLineLayer) return;
    const layer = this.propLineLayer;
    layer.context.clearRect(0, 0, layer.width, layer.height);
  };

  definition.setPropLineOverlayVisible = function setPropLineOverlayVisible(visible) {
    const next = Boolean(visible);
    if (next === Boolean(this.data.propLineOverlayVisible)) {
      if (next) this.renderPropLineOverlay();
      return;
    }
    this.setData({ propLineOverlayVisible: next }, () => {
      if (next) this.renderPropLineOverlay();
      else this.clearPropLineOverlay();
    });
  };

  definition.renderAll = function renderAll() {
    if (originalRenderAll) originalRenderAll.call(this);
    this.renderPropLineOverlay();
  };

  definition.onPropSketchError = function onPropSketchError() {
    const fallback = this.data.propColoredPath || this.data.propFallbackColoredPath;
    if (fallback && this.data.propSketchSrc !== fallback) {
      this.setData({ propSketchSrc: fallback });
    }
  };

  definition.onPropColoredError = function onPropColoredError() {
    const entry = this.propEntry;
    if (!entry) return;
    const paths = propAssets.coloredPaths(entry);
    const current = this.data.propColoredSrc || this.data.propColoredPath;
    const index = paths.indexOf(current);
    const next = index >= 0 ? paths[index + 1] : paths[1];
    if (next && next !== current) {
      this.setData({ propColoredSrc: next });
    }
  };

  definition.finishStroke = function finishStroke() {
    if (originalFinishStroke) originalFinishStroke.call(this);
  };

  definition.completeCompanionDrawing = async function completeCompanionDrawing() {
    if (!this.companionPropMode) {
      return originalComplete ? originalComplete.call(this) : { ok: false };
    }
    if (this.companionCompleting || this.pageDisposed || this.pageActive === false) return { ok: false };
    if (this.data.propDrawingLocked || this.data.propTutorialVisible) return { ok: false };
    const gate = drawingGate.evaluate(this.gateTracker);
    if (!gate.ok) {
      this.showCanvasNotice(gate.hint, 'info');
      return { ok: false };
    }
    this.companionCompleting = true;
    let image;
    try {
      image = await require('../utils/canvas-2d').exportImage(this.artLayer);
    } catch (error) {
      this.companionCompleting = false;
      this.showCanvasNotice('画没有保存成功，请重试', 'warning');
      return { ok: false };
    }
    if (!image) {
      this.companionCompleting = false;
      this.showCanvasNotice('画没有保存成功，请重试', 'warning');
      return { ok: false };
    }
    const completionId = `prop-${Date.now()}`;
    this.pendingPropCompletion = {
      id: completionId,
      kind: 'prop',
      propId: this.propEntry && this.propEntry.id,
      propName: this.propEntry && this.propEntry.name,
      image,
      line: '这个小道具，送给你。',
      date: require('./companion-star-rules').shanghaiDate()
    };
    const rewardStars = companionAdapter.PROP_DRAWING_REWARD;
    this.setData({
      propUnlockVisible: true,
      propUnlockActive: true,
      propFinishVisible: false,
      toolPanelOpen: false,
      propAwardStars: rewardStars,
      propAwardVisible: rewardStars > 0
    }, () => {
      if (rewardStars > 0) this.playPropUnlockAward();
    });
    this.setPropLineOverlayVisible(false);
    this.companionCompleting = false;
    return { ok: true };
  };

  definition.onHide = function onHide() {
    clearTimeout(this.propPeekTimer);
    clearTimeout(this.propPeekHideTimer);
    this.clearPropUnlockAward();
    if (originalOnHide) originalOnHide.call(this);
  };

  definition.onUnload = function onUnload() {
    clearTimeout(this.propPeekTimer);
    clearTimeout(this.propPeekHideTimer);
    this.clearPropUnlockAward();
    if (originalOnUnload) originalOnUnload.call(this);
  };
}

module.exports = { attach, TUTORIAL_FINAL_LABEL };
