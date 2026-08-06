const assert = require('assert');

const originalWx = global.wx;
const originalPage = global.Page;
const routes = [];
const toasts = [];

global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getStorageSync() { return undefined; },
  setStorageSync() {},
  removeStorageSync() {},
  showToast(options) { toasts.push(options.title); },
  navigateBack(options) {
    routes.push('BACK');
    if (options && options.success) options.success();
  }
};

let doodlePage;
global.Page = definition => { doodlePage = definition; };

async function run() {
try {
  const shellArt = require('../egg-shell-art');
  require('../../pages/doodle/doodle');

  function context(data) {
    return Object.assign({}, doodlePage, {
      data: Object.assign({}, doodlePage.data, data || {}),
      shellArt: shellArt.defaultShellArt(),
      undoStack: [],
      operationSequence: 0,
      editRevision: 0,
      savedRevision: 0,
      saveTracked: true,
      artLayer: { width: 300, height: 300, left: 0, top: 0 },
      setData(patch, callback) {
        Object.assign(this.data, patch);
        if (callback) callback();
      },
      renderArt() {},
      renderAll() {},
      scheduleAutoSave() {}
    });
  }

  function touch(x, y) {
    return { clientX: x, clientY: y, x, y };
  }

  const brush = context();
  doodlePage.onCanvasTouchStart.call(brush, { touches: [touch(150, 150)] });
  assert.ok(brush.currentStroke, '单指按下必须开始画笔笔迹');
  assert.equal(Math.round(brush.currentStroke.width * brush.artLayer.width), 5, '默认画笔必须是 5px');
  doodlePage.onCanvasTouchEnd.call(brush, { touches: [], changedTouches: [touch(150, 150)] });
  assert.equal(brush.shellArt.operations.length, 1, '单指抬起必须提交当前笔迹');

  doodlePage.onBrushColor.call(brush, { currentTarget: { dataset: { token: 'berry-pink' } } });
  doodlePage.onCanvasTouchStart.call(brush, { touches: [touch(160, 160)] });
  doodlePage.onCanvasTouchEnd.call(brush, { touches: [], changedTouches: [touch(160, 160)] });
  assert.deepEqual(
    brush.shellArt.operations.map(operation => operation.color),
    ['#526B4D', '#C97682'],
    '每一笔必须独立保留绘制时选择的颜色'
  );

  brush.data.activeTool = 'eraser';
  doodlePage.onCanvasTouchStart.call(brush, { touches: [touch(160, 160)] });
  doodlePage.onCanvasTouchEnd.call(brush, { touches: [], changedTouches: [touch(160, 160)] });
  assert.equal(brush.shellArt.operations[2].tool, 'eraser', '橡皮擦必须继续保存为可重放的擦除操作');
  doodlePage.onUndo.call(brush);
  doodlePage.onUndo.call(brush);
  assert.equal(brush.shellArt.operations.length, 1, '连续撤销必须逐步回退橡皮擦和后一笔画笔');

  doodlePage.selectBrushSize.call(brush, 4);
  assert.equal(brush.data.brushSizeIndex, 5, '五档笔宽必须允许直接选择最粗档');
  assert.equal(brush.data.toolSizeLabel, '18 px', '笔宽轨必须显示当前实际像素值');
  brush.brushSizeTrackRect = { left: 100, width: 250 };
  doodlePage.onBrushSizeScrub.call(brush, { touches: [touch(225, 0)] });
  assert.equal(brush.data.brushSizeIndex, 3, '横向滑动笔宽轨必须吸附到对应档位');

  const pinch = context();
  doodlePage.onCanvasTouchStart.call(pinch, { touches: [touch(150, 150)] });
  assert.equal(pinch.undoStack.length, 1, '待提交笔迹必须先保存撤销快照');
  doodlePage.onCanvasTouchStart.call(pinch, { touches: [touch(100, 150), touch(200, 150)] });
  assert.equal(pinch.currentStroke, null, '第二根手指开始缩放时必须取消未完成笔迹');
  assert.equal(pinch.undoStack.length, 0, '取消的临时笔迹不得污染撤销栈');
  doodlePage.onCanvasTouchMove.call(pinch, { touches: [touch(75, 150), touch(225, 150)] });
  assert.equal(pinch.data.canvasScale, 1.5, '双指间距变化必须更新 Canvas 缩放倍率');
  assert.deepEqual(
    doodlePage.canvasPoint.call(pinch, { touches: [touch(150, 150)] }),
    { x: 0.5, y: 0.5 },
    '缩放后画布中心触点不得发生偏移'
  );
  doodlePage.onCanvasTouchEnd.call(pinch, { touches: [touch(75, 150)] });
  doodlePage.onCanvasTouchStart.call(pinch, { touches: [touch(150, 150)] });
  assert.equal(pinch.currentStroke, null, '缩放结束但仍有手指停留时不得误画');
  doodlePage.onCanvasTouchEnd.call(pinch, { touches: [] });
  doodlePage.onCanvasTouchStart.call(pinch, { touches: [touch(150, 150)] });
  assert.ok(pinch.currentStroke, '双指全部离开后必须恢复单指绘画');

  const sticker = context({ activeTool: 'sticker', selectedPattern: 'star' });
  doodlePage.onCanvasTouchStart.call(sticker, { touches: [touch(150, 150)] });
  assert.ok(sticker.pendingStickerPoint, '贴纸必须等待单指手势结束后再落下');
  doodlePage.onCanvasTouchStart.call(sticker, { touches: [touch(100, 150), touch(200, 150)] });
  assert.equal(sticker.pendingStickerPoint, null, '贴纸手势转为双指缩放时必须取消待放置贴纸');
  assert.equal(sticker.shellArt.operations.length, 0, '双指缩放不得误添加贴纸');
  doodlePage.onCanvasTouchEnd.call(sticker, { touches: [] });
  doodlePage.onCanvasTouchStart.call(sticker, { touches: [touch(150, 150)] });
  doodlePage.onCanvasTouchEnd.call(sticker, { touches: [], changedTouches: [touch(150, 150)] });
  assert.equal(sticker.shellArt.operations.length, 1, '正常单指点击仍必须添加贴纸');

  const clearable = context();
  clearable.shellArt.operations = [
    shellArt.createStroke('brush', [{ x: 0.4, y: 0.4 }], 1, shellArt.DEFAULT_BRUSH_WIDTH, '#526B4D'),
    shellArt.createSticker('heart', 2, { x: 0.6, y: 0.6 })
  ];
  doodlePage.onClear.call(clearable);
  assert.equal(clearable.shellArt.operations.length, 0, '清空必须移除全部画笔与贴纸操作');
  doodlePage.onUndo.call(clearable);
  assert.equal(clearable.shellArt.operations.length, 2, '清空后撤销必须完整恢复画笔与贴纸');

  const saveSuccess = context();
  saveSuccess.shellArt.operations = [shellArt.createSticker('star', 1, { x: 0.5, y: 0.5 })];
  saveSuccess.editRevision = 1;
  saveSuccess.performPersistence = async () => ({ ok: true });
  const successResult = await doodlePage.persistCurrent.call(saveSuccess, { silent: true });
  assert.equal(successResult.ok, true, '自动保存成功必须返回成功状态');
  assert.equal(saveSuccess.savedRevision, 1, '自动保存成功必须推进已保存版本');
  assert.equal(saveSuccess.data.saveStatus, 'saved', '自动保存成功后必须显示已保存');

  const saveFailure = context();
  saveFailure.editRevision = 1;
  saveFailure.pageActive = true;
  saveFailure.performPersistence = async () => ({ ok: false, message: '测试保存失败' });
  const failureResult = await doodlePage.persistCurrent.call(saveFailure, { silent: true });
  assert.equal(failureResult.ok, false, '自动保存失败必须保留失败状态');
  assert.equal(saveFailure.savedRevision, 0, '自动保存失败不得错误推进已保存版本');
  assert.equal(saveFailure.data.saveStatus, 'unsaved', '自动保存失败后必须恢复未保存状态');

  const racingSave = context();
  racingSave.editRevision = 1;
  let resolveSave;
  racingSave.performPersistence = () => new Promise(resolve => { resolveSave = resolve; });
  const racingPromise = doodlePage.persistCurrent.call(racingSave, { silent: true });
  racingSave.editRevision = 2;
  resolveSave({ ok: true });
  const racingResult = await racingPromise;
  assert.equal(racingResult.ok, false, '保存期间出现新编辑时旧请求不得宣称全部已保存');
  assert.equal(racingSave.savedRevision, 1, '保存竞态只能推进到请求对应的编辑版本');
  assert.equal(racingSave.data.saveStatus, 'unsaved', '保存期间的新编辑必须继续显示未保存');

  const backSuccess = context();
  backSuccess.editRevision = 1;
  backSuccess.performPersistence = async () => ({ ok: true });
  await doodlePage.onBack.call(backSuccess);
  assert.equal(routes.pop(), 'BACK', '点击返回必须等待保存成功后再离开页面');

  const backFailure = context();
  backFailure.editRevision = 1;
  backFailure.performPersistence = async () => ({ ok: false, message: '测试保存失败' });
  const routeCount = routes.length;
  await doodlePage.onBack.call(backFailure);
  assert.equal(routes.length, routeCount, '返回保存失败时必须停留当前页面');
  assert.equal(backFailure.data.saveStatus, 'unsaved', '返回保存失败后必须允许用户重试');
  assert.equal(toasts.pop(), '测试保存失败', '返回保存失败必须提供明确反馈');

  console.log('画画页笔宽颜色、双指缩放、撤销清空与自动保存状态机校验通过。');
} finally {
  global.wx = originalWx;
  global.Page = originalPage;
}
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
