const propCatalog = require('./companion-prop-catalog');
const propAssets = require('./companion-prop-assets');
const propChallenge = require('./companion-prop-challenge');
const drawingGate = require('./companion-drawing-gate');
const companionAdapter = require('./iaa-star-unlock-adapter');

const TUTORIAL_FINAL_LABEL = '开始画';

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
    this.companionPropMode = Boolean(this.companionDrawing);
    this.propEntrySource = (query && query.source) || 'activity';
    this.propEntry = propCatalog.getById(query && query.propId)
      || propCatalog.pickDaily(require('./companion-star-rules').shanghaiDate(), companionAdapter.getRoomScope());
    this.gateTracker = drawingGate.createTracker();
    this.gateStrokeId = null;
    this.propSession = propChallenge.createSession();
    const sketchPath = this.propEntry ? propAssets.resolveLinePath(this.propEntry) : '';
    const coloredPath = this.propEntry ? propAssets.resolveColoredPath(this.propEntry) : '';
    this.setData({
      companionPropMode: this.companionPropMode,
      propSketchPath: sketchPath,
      propColoredPath: coloredPath,
      propFallbackColoredPath: this.propEntry && this.propEntry.colorFile
        ? `${propAssets.LEGACY_COLOR_ROOT}${this.propEntry.colorFile}`
        : coloredPath,
      propDisplayName: this.propEntry ? this.propEntry.name : '',
      propLookHint: propChallenge.lookHintText(propChallenge.MANUAL_LOOKS),
      propSessionLookRemaining: propChallenge.MANUAL_LOOKS,
      propSketchSrc: sketchPath,
      propColoredSrc: coloredPath,
      propPeekVisible: false,
      propPeekAnimating: false,
      propDrawingLocked: true,
      propUnlockVisible: false,
      propTutorialVisible: false,
      propTutorialStep: 0,
      propTutorialSteps: propChallenge.TUTORIAL_STEPS,
      propTutorialFinalLabel: TUTORIAL_FINAL_LABEL,
      propFinishVisible: false
    });
    if (originalOnLoad) originalOnLoad.call(this, query);
  };

  definition.revealEditor = function revealEditor() {
    const run = () => {
      if (!this.pageActive) return;
      if (this.companionPropMode && !propChallenge.hasSeenTutorial()) {
        this.setData({ propTutorialVisible: true, propTutorialStep: 0, propDrawingLocked: true });
      } else if (this.companionPropMode) {
        this.scheduleInitialPropPeek();
      }
      if (originalReveal) originalReveal.call(this);
    };
    if (wx.nextTick) wx.nextTick(run);
    else setTimeout(run, 0);
  };

  definition.scheduleInitialPropPeek = function scheduleInitialPropPeek() {
    this.startPropPeek({ countsAgainstManual: false });
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
    this.setData({
      propDrawingLocked: true,
      propPeekVisible: true,
      propPeekAnimating: false,
      propFinishVisible: false
    });
    this.propPeekTimer = setTimeout(() => {
      this.setData({ propPeekAnimating: true });
      this.propPeekHideTimer = setTimeout(() => {
        this.propSession.drawingLocked = false;
        this.setData({
          propPeekVisible: false,
          propPeekAnimating: false,
          propDrawingLocked: false,
          propFinishVisible: true
        });
      }, 320);
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
    this.setData({ propTutorialVisible: false });
    this.scheduleInitialPropPeek();
  };

  definition.onPropTutorialNext = function onPropTutorialNext() {
    const step = Number(this.data.propTutorialStep) || 0;
    if (step >= propChallenge.TUTORIAL_STEPS.length - 1) {
      propChallenge.markTutorialSeen();
      this.setData({ propTutorialVisible: false });
      this.scheduleInitialPropPeek();
      return;
    }
    this.setData({ propTutorialStep: step + 1 });
  };

  definition.onPropUnlockOk = function onPropUnlockOk() {
    if (!this.data.propUnlockVisible || this.propCompletingExit) return;
    this.propCompletingExit = true;
    const payload = this.pendingPropCompletion;
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
    drawingGate.trackPoint(this.gateTracker, this.data.activeTool, point);
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
      this.gateTracker = drawingGate.rebuildFromOperations(this.shellArt.operations);
      this.gateTracker.activeMs = prevMs;
    }
  };

  definition.onClear = function onClear() {
    const prevMs = this.gateTracker ? this.gateTracker.activeMs : 0;
    if (originalClear) originalClear.call(this);
    if (this.companionPropMode) {
      this.gateTracker = drawingGate.rebuildFromOperations(this.shellArt.operations);
      this.gateTracker.activeMs = prevMs;
    }
  };

  definition.onPropSketchError = function onPropSketchError() {
    const fallback = this.data.propFallbackColoredPath || this.data.propColoredPath;
    if (fallback && this.data.propSketchSrc !== fallback) {
      this.setData({ propSketchSrc: fallback });
    }
  };

  definition.onPropColoredError = function onPropColoredError() {
    const fallback = this.data.propFallbackColoredPath;
    if (fallback && this.data.propColoredSrc !== fallback) {
      this.setData({ propColoredSrc: fallback });
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
    this.setData({
      propUnlockVisible: true,
      propFinishVisible: false,
      toolPanelOpen: false
    });
    this.companionCompleting = false;
    return { ok: true };
  };

  definition.onHide = function onHide() {
    clearTimeout(this.propPeekTimer);
    clearTimeout(this.propPeekHideTimer);
    if (originalOnHide) originalOnHide.call(this);
  };

  definition.onUnload = function onUnload() {
    clearTimeout(this.propPeekTimer);
    clearTimeout(this.propPeekHideTimer);
    if (originalOnUnload) originalOnUnload.call(this);
  };
}

module.exports = { attach, TUTORIAL_FINAL_LABEL };
