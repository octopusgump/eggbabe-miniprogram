const assert = require('assert');
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
    setData(patch) {
      Object.assign(this.data, patch);
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

global.wx = global.wx || {
  getWindowInfo: () => ({ windowWidth: 375, statusBarHeight: 20 }),
  getSystemInfoSync: () => ({ windowWidth: 375, statusBarHeight: 20 }),
  getStorageSync: () => false,
  setStorageSync: () => {},
  getMenuButtonBoundingClientRect: () => ({ left: 281 })
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
    assert.equal(emitted, undefined);
    editor.onPropUnlockOk();
    assert.equal(emitted.kind, 'prop');
    assert.equal(emitted.propId, 'dried_tea_tag');
    assert.equal(emitted.image, '/tmp/prop-drawing.png');
    console.log('道具临摹页完成链路与 gate 拦截单测通过。');
  } finally {
    canvas.exportImage = oldExport;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
