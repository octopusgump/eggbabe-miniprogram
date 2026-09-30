const assert = require('assert');
const adapter = require('../iaa-star-unlock-adapter');
const canvas = require('../../utils/canvas-2d');
const definition = require('../../pages/doodle/doodle-definition');
let backs = 0, failBack = false;
global.wx = { navigateBack(options) { backs++; if (failBack) options.fail(); }, showToast() {} };
function editor() {
  const state = Object.assign({}, definition, {
    companionDrawing: true, pageActive: true,
    data: { canvasReady: true }, shellArt: { operations: [{ type: 'stroke', tool: 'brush', points: [{x: 1, y: 1}] }] },
    editRevision: 1, savedRevision: 0, emitted: [],
    setData(patch) { Object.assign(this.data, patch); }, pageTransitionDuration: () => 0,
    showCanvasNotice() {}, getOpenerEventChannel() { return { emit: (name, memory) => this.emitted.push({name, memory}) }; }
  });
  return state;
}
(async () => {
  const originalExport = canvas.exportImage;
  let finish;
  canvas.exportImage = () => new Promise(resolve => { finish = resolve; });
  adapter.configureRoom('export-return');
  const waiting = editor();
  const save = waiting.onManualSave();
  const back = waiting.onBack();
  assert.ok(waiting.manualSaveTask, '画好了必须持有可等待的导出任务');
  assert.equal(backs, 0, '返回必须等导出结束');
  finish('/tmp/waiting-work.png');
  await Promise.all([save, back]);
  assert.equal(backs, 1, '导出结束只返回一次');
  assert.equal(waiting.emitted.length, 1);
  assert.equal(adapter.getCompanionDraft(), null, '完成后返回不能把已完成作品写回草稿');

  adapter.configureRoom('export-unload');
  const disposed = editor();
  const late = disposed.onManualSave();
  disposed.onUnload();
  const draft = adapter.getCompanionDraft();
  finish('/tmp/late-work.png');
  assert.equal((await late).ok, false);
  assert.equal(disposed.emitted.length, 0, '卸载后的导出不能发送完成事件');
  assert.deepEqual(adapter.getCompanionDraft(), draft, '迟到导出不能清掉退出时保存的草稿');
  assert.equal(backs, 1, '迟到导出不进行第二次返回');

  adapter.configureRoom('export-hide');
  const hidden = editor();
  const hiddenTask = hidden.onManualSave(); hidden.onHide();
  finish('/tmp/background-work.png');
  assert.equal((await hiddenTask).ok, false);
  assert.equal(hidden.emitted.length, 0);
  assert.ok(adapter.getCompanionDraft(), '后台导出取消时保留草稿');
  hidden.onShow();
  canvas.exportImage = async () => '/tmp/retry-work.png';
  failBack = true;
  await hidden.onManualSave();
  assert.equal(hidden.emitted.length, 1);
  assert.equal(hidden.backInProgress, false, '返回失败后可重试');
  assert.equal(adapter.getCompanionDraft(), null);
  failBack = false;
  await hidden.onManualSave();
  assert.equal(hidden.emitted.length, 1, '返回失败后重试不再次完成或再次奖励');
  assert.equal(adapter.getCompanionDraft(), null);
  canvas.exportImage = originalExport;
  console.log('画画导出生命周期：返回等待、销毁取消、后台保留草稿、返回失败重试与完成去重通过。');
})().catch(error => { console.error(error); process.exit(1); });
