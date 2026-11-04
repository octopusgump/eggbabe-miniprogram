const propCatalog = require('./companion-prop-catalog');
const propAssets = require('./companion-prop-assets');
const propChallenge = require('./companion-prop-challenge');
const drawingGate = require('./companion-drawing-gate');
const companionAdapter = require('./iaa-star-unlock-adapter');

const TUTORIAL_FINAL_LABEL = '开始画';
const PROP_AWARD_SOUND = '/assets/scenes/lifecycle/post-hatch/40-interaction-fx/companion-star/companion-star-award.mp3';
const PROP_LOOK_GATE_HINT_MS = 1800;
const PROP_LOOK_GATE_HINT_FADE_MS = 180;
/** 未达标点「再看一眼」时的 pill 文案（与「画好了」v2 长句分开） */
const PROP_LOOK_GATE_HINT = '再画一会儿吧';

function schedulePropPeekPhase(editor, apply) {
  if (wx.nextTick) wx.nextTick(apply);
  else setTimeout(apply, 16);
}

function preloadLocalImage(src) {
  const path = String(src || '').trim();
  if (!path) return Promise.resolve(false);
  return new Promise(resolve => {
    if (typeof wx.getImageInfo !== 'function') {
      resolve(true);
      return;
    }
    wx.getImageInfo({
      src: path,
      success: () => resolve(true),
      fail: () => resolve(false)
    });
  });
}

function propPeekTransitionMs(editor, normalMs) {
  if (editor.data && editor.data.companionReducedMotion) return 0;
  return normalMs;
}

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
    const tutorialPatch = !propChallenge.hasSeenTutorial()
      ? {
        propTutorialVisible: true,
        propTutorialStep: 0,
        propGuideSketchVisible: true,
        propDrawingLocked: true
      }
      : {};
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
      propPeekAnimPhase: 'enter',
      propGuideSketchVisible: false,
      propDrawingLocked: true,
      propUnlockVisible: false,
      propTutorialVisible: false,
      propTutorialStep: 0,
      propTutorialSteps: propChallenge.TUTORIAL_STEPS,
      propFinishVisible: false,
      propLookGateHintText: '',
      propLookGateHintTone: 'info',
      propLookGateHintVisible: false,
      ...tutorialPatch
    });
  };

  definition.clearPropLookGateHint = function clearPropLookGateHint() {
    clearTimeout(this.propLookGateHintTimer);
    clearTimeout(this.propLookGateHintCleanupTimer);
    this.propLookGateHintTimer = null;
    this.propLookGateHintCleanupTimer = null;
  };

  definition.dismissPropLookGateHint = function dismissPropLookGateHint() {
    this.clearPropLookGateHint();
    if (!this.data.propLookGateHintText && !this.data.propLookGateHintVisible) return;
    this.setData({
      propLookGateHintText: '',
      propLookGateHintVisible: false,
      propLookGateHintTone: 'info'
    });
  };

  definition.preloadPropEntryAssets = function preloadPropEntryAssets() {
    if (!this.companionPropMode) return Promise.resolve(true);
    const sketch = this.data.propSketchSrc || this.data.propSketchPath;
    if (!sketch) return Promise.resolve(true);
    return preloadLocalImage(sketch).then(() => true, () => true);
  };

  definition.showPropLookGateHint = function showPropLookGateHint(text, tone) {
    if (!this.companionPropMode || this.pageActive === false) return false;
    const message = String(text || '').replace(/\s+/g, ' ').trim();
    if (!message) return false;
    this.clearPropLookGateHint();
    this.setData({
      propLookGateHintText: message,
      propLookGateHintTone: tone === 'warning' ? 'warning' : 'info',
      propLookGateHintVisible: true
    });
    this.propLookGateHintTimer = setTimeout(() => {
        this.propLookGateHintTimer = null;
        this.setData({ propLookGateHintVisible: false });
        this.propLookGateHintCleanupTimer = setTimeout(() => {
          this.propLookGateHintCleanupTimer = null;
          if (!this.data.propLookGateHintVisible) this.setData({ propLookGateHintText: '' });
      }, PROP_LOOK_GATE_HINT_FADE_MS);
    }, PROP_LOOK_GATE_HINT_MS);
    return true;
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

  definition.finishPropPeekDismiss = function finishPropPeekDismiss() {
    clearTimeout(this.propPeekPopInSettleTimer);
    if (this.propSession) this.propSession.drawingLocked = false;
    this.setData({
      propPeekVisible: false,
      propPeekAnimating: false,
      propPeekAnimPhase: 'enter',
      propDrawingLocked: false,
      propFinishVisible: true
    }, () => {
      if (typeof this.renderAll === 'function') this.renderAll();
    });
  };

  // 简笔出现/收起用 CSS transition；减少动态效果时跳过位移/缩放动画。
  definition.dismissPropPeek = function dismissPropPeek() {
    if (!this.data.propPeekVisible || this.data.propPeekAnimating) return;
    clearTimeout(this.propPeekTimer);
    clearTimeout(this.propPeekHideTimer);
    clearTimeout(this.propPeekPopInSettleTimer);
    const outMs = propPeekTransitionMs(this, propChallenge.PEEK_POP_OUT_MS);
    const generation = (this.propPeekGeneration || 0) + 1;
    this.propPeekGeneration = generation;
    if (outMs === 0) {
      this.finishPropPeekDismiss();
      return;
    }
    this.setData({
      propPeekAnimating: true,
      propPeekAnimPhase: 'leave'
    }, () => {
      if (generation !== this.propPeekGeneration) return;
      clearTimeout(this.propPeekHideTimer);
      this.propPeekHideTimer = setTimeout(() => {
        if (generation !== this.propPeekGeneration) return;
        this.finishPropPeekDismiss();
      }, outMs);
    });
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
    this.propPeekGeneration = (this.propPeekGeneration || 0) + 1;
    if (settings.countsAgainstManual) {
      this.propSession.lookRemaining -= 1;
      this.setData({
        propLookHint: propChallenge.lookHintText(this.propSession.lookRemaining),
        propSessionLookRemaining: this.propSession.lookRemaining
      });
    }
    this.propSession.drawingLocked = true;
    const generation = this.propPeekGeneration;
    clearTimeout(this.propPeekPopInSettleTimer);
    const reducedMotion = Boolean(this.data.companionReducedMotion);
    this.setData({
      propDrawingLocked: true,
      propPeekVisible: true,
      propPeekAnimating: false,
      propPeekAnimPhase: reducedMotion ? 'shown' : 'enter',
      propFinishVisible: false
    }, () => {
      if (generation !== this.propPeekGeneration) return;
      if (reducedMotion) return;
      schedulePropPeekPhase(this, () => {
        if (generation !== this.propPeekGeneration) return;
        this.setData({ propPeekAnimPhase: 'shown' });
      });
    });
    this.propPeekTimer = setTimeout(() => {
      this.dismissPropPeek();
    }, propChallenge.LOOK_DURATION_MS);
  };

  definition.onPropLookAgain = function onPropLookAgain() {
    if (this.data.propDrawingLocked || this.data.propUnlockVisible || this.data.propTutorialVisible) return;
    if (this.propSession.lookRemaining <= 0) return;
    if (this.currentStroke) this.finishStroke();
    const gateResult = drawingGate.evaluate(this.gateTracker);
    if (!gateResult.ok) {
      this.showPropLookGateHint(PROP_LOOK_GATE_HINT, 'info');
      return;
    }
    this.startPropPeek({ countsAgainstManual: true });
  };

  definition.onPropTutorialSkip = function onPropTutorialSkip() {
    propChallenge.markTutorialSeen();
    this.setData({ propTutorialVisible: false, propGuideSketchVisible: false });
    this.scheduleInitialPropPeek();
  };

  definition.onPropTutorialNext = function onPropTutorialNext() {
    const step = Number(this.data.propTutorialStep) || 0;
    if (step >= propChallenge.TUTORIAL_STEPS.length - 1) {
      propChallenge.markTutorialSeen();
      this.setData({ propTutorialVisible: false, propGuideSketchVisible: false });
      this.scheduleInitialPropPeek();
      return;
    }
    const nextStep = step + 1;
    this.setData({
      propTutorialStep: nextStep,
      propGuideSketchVisible: nextStep === 0
    });
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
      this.showPropLookGateHint(gate.hint, 'info');
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
    this.companionCompleting = false;
    return { ok: true };
  };

  definition.onHide = function onHide() {
    clearTimeout(this.propPeekTimer);
    clearTimeout(this.propPeekHideTimer);
    clearTimeout(this.propPeekPopInSettleTimer);
    clearTimeout(this.propEntrySketchFallbackTimer);
    this.clearPropLookGateHint();
    this.dismissPropLookGateHint();
    this.clearPropUnlockAward();
    if (originalOnHide) originalOnHide.call(this);
  };

  definition.onUnload = function onUnload() {
    clearTimeout(this.propPeekTimer);
    clearTimeout(this.propPeekHideTimer);
    clearTimeout(this.propPeekPopInSettleTimer);
    clearTimeout(this.propEntrySketchFallbackTimer);
    this.clearPropLookGateHint();
    this.dismissPropLookGateHint();
    this.clearPropUnlockAward();
    if (originalOnUnload) originalOnUnload.call(this);
  };
}

module.exports = { attach, TUTORIAL_FINAL_LABEL, PROP_LOOK_GATE_HINT_MS, PROP_LOOK_GATE_HINT };
