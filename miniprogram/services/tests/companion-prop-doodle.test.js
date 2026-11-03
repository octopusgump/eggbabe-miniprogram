const assert = require('assert');
const fs = require('fs');
const gate = require('../companion-drawing-gate');
const propChallenge = require('../companion-prop-challenge');
const editorDefinition = require('../../pages/doodle/doodle-definition');

function buildPassingTracker() {
  const tracker = gate.createTracker();
  let now = 0;
  for (let index = 0; index < 5; index += 1) {
    const strokeId = gate.beginStroke(tracker, 'brush');
    for (let step = 0; step < 4; step += 1) {
      gate.trackActiveElapsed(tracker, now);
      gate.trackPoint(tracker, 'brush', {
        x: 0.35 + index * 0.05 + step * 0.02,
        y: 0.35 + index * 0.04 + step * 0.015
      });
      now += 1000;
    }
    gate.endStroke(tracker, strokeId, 'brush', false);
  }
  return tracker;
}

function createEditor() {
  const editor = Object.assign({}, editorDefinition, {
    pageActive: true,
    data: {},
    shellArt: { operations: [] },
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (typeof callback === 'function') callback();
    },
    showCanvasNotice() {},
    pageTransitionDuration: () => 20,
    leaveEditor: async () => {}
  });
  editor.onLoad({ entry: 'companion', mode: 'prop', source: 'letter', propId: 'dried_tea_tag' });
  propChallenge.markTutorialSeen();
  editor.setData({
    propDrawingLocked: false,
    propTutorialVisible: false,
    propPeekVisible: false
  });
  return editor;
}

const canvas = require('../../utils/canvas-2d');

const tutorialStorage = {};
global.wx = global.wx || {
  getWindowInfo: () => ({ windowWidth: 375, statusBarHeight: 20 }),
  getSystemInfoSync: () => ({ windowWidth: 375, statusBarHeight: 20 }),
  getStorageSync: (key) => tutorialStorage[key],
  setStorageSync: (key, value) => {
    tutorialStorage[key] = value;
  },
  getMenuButtonBoundingClientRect: () => ({ left: 281 }),
  createAnimation: (options) => {
    const duration = options && options.duration ? options.duration : 300;
    return {
      scale() { return this; },
      scaleX() { return this; },
      opacity() { return this; },
      step() {
        this.export = () => ({ duration, actions: [] });
        return this;
      },
      export: () => ({ duration, actions: [] })
    };
  }
};

(async () => {
  const oldExport = canvas.exportImage;
  try {
    const editor = createEditor();
    assert.equal(editor.companionPropMode, true);
    editor.gateTracker = gate.createTracker();
    assert.equal((await editor.completeCompanionDrawing()).ok, false, '未达标不得完成');

    editor.gateTracker = buildPassingTracker();
    editor.artLayer = {};
    editor.companionCompleting = false;
    let emitted;
    editor.getOpenerEventChannel = () => ({
      emit(name, payload) {
        assert.equal(name, 'companionDrawingCompleted');
        emitted = payload;
      }
    });
    canvas.exportImage = async () => '/tmp/prop-drawing.png';
    assert.equal((await editor.completeCompanionDrawing()).ok, true);
    assert.equal(editor.data.propUnlockVisible, true);
    assert.equal(editor.data.propAwardStars, 10);
    assert.equal(editor.data.propAwardVisible, true);
    assert.equal(emitted, undefined);
    await editor.onPropUnlockOk();
    assert.equal(emitted.kind, 'prop');
    assert.equal(emitted.propId, 'dried_tea_tag');
    assert.equal(emitted.image, '/tmp/prop-drawing.png');

    const peekEditor = createEditor();
    peekEditor.propSession = propChallenge.createSession();
    peekEditor.propEntryFlowStarted = false;
    peekEditor.revealEditor();
    assert.equal(peekEditor.data.propPeekVisible, false, '页未完全显现前不得开始看一看计时');
    peekEditor.setData({ pageTransitionPhase: 'visible' }, () => {
      peekEditor.beginPropEntryFlow();
    });
    assert.equal(peekEditor.data.propPeekVisible, true, '页可见后应自动开始看一看');
    const sketchSrc = peekEditor.data.propSketchSrc;
    peekEditor.onPropPeekCardTap();
    assert.equal(peekEditor.data.propPeekAnimating, true);
    assert.ok(peekEditor.data.propPeekSketchAnim, '收起简笔须驱动 wx.createAnimation');
    peekEditor.onPropPeekCardTap();
    assert.equal(peekEditor.data.propPeekAnimating, true, '收起过程中重复点击不得打断动效');
    await new Promise(resolve => setTimeout(resolve, propChallenge.PEEK_POP_OUT_MS + 40));
    assert.equal(peekEditor.data.propPeekVisible, false);
    assert.equal(peekEditor.data.propPeekAnimating, false);
    assert.equal(peekEditor.data.propFinishVisible, true);
    assert.notEqual(peekEditor.data.propLineOverlayVisible, true, '画纸不得再叠简笔 line overlay canvas');
    assert.equal(peekEditor.data.propSketchSrc, sketchSrc, '收起不得更换简笔地址导致重新解码');
    clearTimeout(peekEditor.propPeekTimer);

    peekEditor.data.propDrawingLocked = false;
    peekEditor.data.propTutorialVisible = false;
    peekEditor.data.propUnlockVisible = false;
    peekEditor.onPropLookAgain();
    assert.equal(peekEditor.data.propPeekVisible, true, '再看一眼须再次打开同一张简笔');
    peekEditor.onPropPeekCardTap();
    await new Promise(resolve => setTimeout(resolve, propChallenge.PEEK_POP_OUT_MS + 40));
    assert.equal(peekEditor.data.propPeekVisible, false, '再看一眼收起后卡片必须消失');
    assert.notEqual(peekEditor.data.propLineOverlayVisible, true, '收起后画纸仍须保持空白，不铺简笔 canvas');
    clearTimeout(peekEditor.propPeekTimer);

    delete tutorialStorage[propChallenge.TUTORIAL_STORAGE_KEY];
    const tutorialEditor = createEditor();
    delete tutorialStorage[propChallenge.TUTORIAL_STORAGE_KEY];
    tutorialEditor.propEntryFlowStarted = false;
    tutorialEditor.propSession = propChallenge.createSession();
    tutorialEditor.beginPropEntryFlow();
    assert.equal(tutorialEditor.data.propTutorialVisible, true);
    assert.equal(tutorialEditor.data.propTutorialStep, 0);
    assert.equal(propChallenge.TUTORIAL_STEPS.length, 1);
    assert.equal(propChallenge.TUTORIAL_STEPS[0].title, '一起画');
    const peekStartedAt = Date.now();
    tutorialEditor.onPropTutorialNext();
    const peekDelayMs = Date.now() - peekStartedAt;
    assert.equal(tutorialEditor.data.propTutorialVisible, false);
    assert.equal(tutorialEditor.data.propPeekVisible, true, '开始画后应立刻进入看一看');
    assert.ok(peekDelayMs < 50, `开始画到简笔可见不得再等待准备 loading，实际 ${peekDelayMs}ms`);
    clearTimeout(tutorialEditor.propPeekTimer);

    assert.doesNotMatch(
      fs.readFileSync(require('path').join(__dirname, '../../pages/doodle/doodle.wxml'), 'utf8'),
      /propLineOverlayCanvas/,
      '道具临摹不得再挂载简笔 line overlay canvas'
    );

    console.log('道具临摹页完成链路与 gate 拦截单测通过。');
  } finally {
    canvas.exportImage = oldExport;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
