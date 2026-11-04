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
  editor.setData({
    propDrawingLocked: false,
    propPeekVisible: false
  });
  return editor;
}

global.wx = global.wx || {
  getWindowInfo: () => ({ windowWidth: 375, statusBarHeight: 20 }),
  getSystemInfoSync: () => ({ windowWidth: 375, statusBarHeight: 20 }),
  getStorageSync: () => undefined,
  setStorageSync: () => {},
  getMenuButtonBoundingClientRect: () => ({ left: 281 }),
  getImageInfo: (options) => {
    if (options && typeof options.success === 'function') options.success({ width: 100, height: 100 });
  },
  nextTick: (fn) => { if (typeof fn === 'function') fn(); },
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

const canvas = require('../../utils/canvas-2d');

(async () => {
  const oldExport = canvas.exportImage;
  try {
    const editor = createEditor();
    assert.equal(editor.companionPropMode, true);
    assert.equal(typeof editor.preloadPropEntryAssets, 'function');
    assert.equal(await editor.preloadPropEntryAssets(), true);
    editor.gateTracker = gate.createTracker();
    let canvasNoticeCalls = 0;
    editor.showCanvasNotice = () => { canvasNoticeCalls += 1; };
    assert.equal((await editor.completeCompanionDrawing()).ok, false, '未达标不得完成');
    assert.equal(canvasNoticeCalls, 0, '未达标须用再看一眼浮层，不得走画布顶栏提示');
    assert.equal(editor.data.propLookGateHintVisible, true);
    assert.equal(editor.data.propLookGateHintText, gate.INCOMPLETE_HINT);

    editor.gateTracker = gate.createTracker();
    editor.propSession = propChallenge.createSession();
    editor.setData({ propDrawingLocked: false, propUnlockVisible: false, propPeekVisible: false });
    editor.onPropLookAgain();
    assert.equal(editor.data.propPeekVisible, true, '再看一眼有余额须直接打开简笔卡片，不受 v2 门槛拦截');
    assert.equal(editor.data.propSessionLookRemaining, 2, '手动再看须扣减额度');
    editor.onPropPeekCardTap();
    await new Promise(resolve => setTimeout(resolve, propChallenge.PEEK_POP_OUT_MS + 40));
    assert.equal(editor.data.propPeekVisible, false);

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
    assert.equal(emitted.image, undefined, '一次性临摹不向房间传递画作文件');
    assert.equal('image' in emitted, false);

    const adapter = require('../iaa-star-unlock-adapter');
    adapter.configureRoom('prop-no-draft');
    const draftEditor = createEditor();
    draftEditor.shellArt.operations.push({ type: 'stroke', tool: 'brush', points: [{ x: 1, y: 1 }] });
    draftEditor.onHide();
    assert.equal(adapter.getCompanionDraft(), null, '道具临摹中途退出不得写入草稿');

    const peekEditor = createEditor();
    peekEditor.propSession = propChallenge.createSession();
    peekEditor.propEntryFlowStarted = false;
    peekEditor.revealEditor();
    assert.equal(peekEditor.data.propPeekVisible, false, '页未完全显现前不得开始看一看计时');
    peekEditor.setData({ pageTransitionPhase: 'visible' }, () => {
      peekEditor.beginPropEntryFlow();
    });
    assert.equal(peekEditor.data.propPeekVisible, true, '页可见后应自动开始看一看');
    assert.equal(peekEditor.data.propPeekAnimPhase, 'shown', '看一看出现须进入 shown phase');
    const sketchSrc = peekEditor.data.propSketchSrc;
    peekEditor.onPropPeekCardTap();
    assert.equal(peekEditor.data.propPeekAnimating, true);
    assert.equal(peekEditor.data.propPeekAnimPhase, 'leave', '收起简笔须进入 leave phase');
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
    peekEditor.data.propUnlockVisible = false;
    peekEditor.gateTracker = buildPassingTracker();
    peekEditor.onPropLookAgain();
    assert.equal(peekEditor.data.propPeekVisible, true, '再看一眼须再次打开同一张简笔');
    peekEditor.onPropPeekCardTap();
    await new Promise(resolve => setTimeout(resolve, propChallenge.PEEK_POP_OUT_MS + 40));
    assert.equal(peekEditor.data.propPeekVisible, false, '再看一眼收起后卡片必须消失');
    assert.notEqual(peekEditor.data.propLineOverlayVisible, true, '收起后画纸仍须保持空白，不铺简笔 canvas');
    clearTimeout(peekEditor.propPeekTimer);

    const entryEditor = createEditor();
    entryEditor.propEntryFlowStarted = false;
    entryEditor.propSession = propChallenge.createSession();
    entryEditor.setData({ pageTransitionPhase: 'visible' }, () => {
      entryEditor.beginPropEntryFlow();
    });
    assert.equal(entryEditor.data.propPeekVisible, true, '首次进页应直接进入看一看，无教程');
    clearTimeout(entryEditor.propPeekTimer);

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
