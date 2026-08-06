const assert = require('assert');

const originalWx = global.wx;
const originalPage = global.Page;
const routes = [];
const toasts = [];
const storage = {};

global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  removeStorageSync(key) { delete storage[key]; },
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
      colorHintSeen: true,
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
  assert.equal(brush.data.toolPanelOpen, false, '首次进入必须只展示画笔、橡皮擦与贴纸三个主工具');
  assert.equal(brush.data.colorPickerOpen, false, '首次进入不得提前展开颜色弹窗');
  doodlePage.onTool.call(brush, { currentTarget: { dataset: { tool: 'brush' } } });
  assert.equal(brush.data.toolPanelOpen, true, '点击画笔后必须显示颜色和笔触设置');
  doodlePage.onToggleBrushColorPicker.call(brush);
  assert.equal(brush.data.colorPickerOpen, true, '点击当前颜色必须展开十色色块弹窗');
  doodlePage.onTool.call(brush, { currentTarget: { dataset: { tool: 'eraser' } } });
  assert.equal(brush.data.activeTool, 'eraser', '点击橡皮擦后必须切换到橡皮擦设置');
  assert.equal(brush.data.colorPickerOpen, false, '切换到其他工具时必须收起颜色弹窗');
  assert.equal(brush.data.eraserSizeIndex, 3, '橡皮擦默认必须选中五档中的 15px 中档');

  const firstHint = context({ toolPanelOpen: true, activeTool: 'brush' });
  firstHint.pageActive = true;
  firstHint.colorHintSeen = false;
  delete storage.eggbabe_doodle_color_hint_seen_v1;
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;
  const pendingTimers = [];
  global.setTimeout = (callback, delay) => {
    pendingTimers.push({ callback, delay });
    return pendingTimers.length;
  };
  global.clearTimeout = () => {};
  try {
    doodlePage.scheduleColorHint.call(firstHint);
    const delayedHint = pendingTimers.shift();
    assert.equal(delayedHint.delay, 420, '颜色首次提示必须沿用首页提示的短延迟节奏');
    delayedHint.callback();
    assert.equal(firstHint.data.colorHintRendered, true, '首次提示到点后必须先挂载胶囊');
    const revealHint = pendingTimers.shift();
    assert.equal(revealHint.delay, 20, '首次提示挂载后必须再渐入，避免突然闪现');
    revealHint.callback();
    assert.equal(firstHint.data.colorHintVisible, true, '颜色首次提示必须正常显示');
    assert.equal(storage.eggbabe_doodle_color_hint_seen_v1, true, '颜色提示实际显示后必须记录为已看过');
  } finally {
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    doodlePage.dismissColorHint.call(firstHint);
  }

  doodlePage.onTool.call(brush, { currentTarget: { dataset: { tool: 'brush' } } });
  doodlePage.onCanvasTouchStart.call(brush, { touches: [touch(150, 150)] });
  assert.equal(brush.data.toolPanelOpen, false, '开始绘画时必须收起工具设置');
  assert.ok(brush.currentStroke, '单指按下必须开始画笔笔迹');
  assert.equal(Math.round(brush.currentStroke.width * brush.artLayer.width), 5, '默认画笔必须是 5px');
  doodlePage.onCanvasTouchEnd.call(brush, { touches: [], changedTouches: [touch(150, 150)] });
  assert.equal(brush.shellArt.operations.length, 1, '单指抬起必须提交当前笔迹');

  brush.setData({ toolPanelOpen: true, colorPickerOpen: true });
  doodlePage.onBrushColor.call(brush, { currentTarget: { dataset: { token: 'berry-pink' } } });
  assert.equal(brush.data.colorPickerOpen, false, '选择颜色后必须立即收起颜色弹窗');
  assert.equal(brush.data.selectedBrushColorName, '莓果粉', '颜色入口必须同步显示当前选中颜色的可访问名称');
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
  assert.equal(Math.round(brush.shellArt.operations[2].width * brush.artLayer.width), 15, '橡皮擦档位标注必须等于实际 Canvas 擦除像素');
  doodlePage.onUndo.call(brush);
  doodlePage.onUndo.call(brush);
  assert.equal(brush.shellArt.operations.length, 1, '连续撤销必须逐步回退橡皮擦和后一笔画笔');

  doodlePage.onTool.call(brush, { currentTarget: { dataset: { tool: 'brush' } } });
  doodlePage.onCanvasBackdropTap.call(brush);
  assert.equal(brush.data.toolPanelOpen, false, '点击画布空白区域必须恢复为收起 Dock');
  brush.setData({ toolPanelOpen: true, colorPickerOpen: true });
  doodlePage.onToolPanelTap.call(brush);
  assert.equal(brush.data.toolPanelOpen, true, '点击工具浮层内部不得误收起设置');
  assert.equal(brush.data.colorPickerOpen, true, '点击颜色弹窗内部不得误收起弹窗');
  brush.setData({ toolPanelOpen: false });

  brush.setData({ colorPickerOpen: true });
  doodlePage.selectBrushSize.call(brush, 4);
  assert.equal(brush.data.brushSizeIndex, 5, '五档笔宽必须允许直接选择最粗档');
  assert.equal(brush.data.toolSizeLabel, '18 px', '笔宽轨必须显示当前实际像素值');
  assert.equal(brush.data.colorPickerOpen, false, '改选粗细时必须收起颜色弹窗');
  brush.brushSizeTrackRect = { left: 100, width: 250 };
  doodlePage.onBrushSizeScrub.call(brush, { touches: [touch(225, 0)] });
  assert.equal(brush.data.brushSizeIndex, 3, '横向滑动笔宽轨必须吸附到对应档位');
  doodlePage.onEraserSize.call(brush, { currentTarget: { dataset: { index: 4 } } });
  assert.equal(brush.data.eraserSizeIndex, 5, '橡皮擦必须允许直接选择第五档');
  assert.equal(brush.data.eraserSizePx, 30, '橡皮擦第五档必须对应真实 30px 擦除宽度');

  const pinch = context();
  doodlePage.onCanvasTouchStart.call(pinch, { touches: [touch(150, 150)] });
  assert.equal(pinch.undoStack.length, 1, '待提交笔迹必须先保存撤销快照');
  pinch.setData({ toolPanelOpen: true });
  doodlePage.onCanvasTouchStart.call(pinch, { touches: [touch(100, 150), touch(200, 150)] });
  assert.equal(pinch.data.toolPanelOpen, false, '开始双指缩放时必须同步收起工具设置');
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
  clearable.setData({ toolPanelOpen: true });
  doodlePage.onClear.call(clearable);
  assert.equal(clearable.data.toolPanelOpen, false, '点击清空时必须同步收起工具设置');
  assert.equal(clearable.shellArt.operations.length, 0, '清空必须移除全部画笔与贴纸操作');
  assert.equal(clearable.data.canvasNoticeText, '已清空，可以撤销', '清空提示必须使用画布内标准文案');
  assert.equal(clearable.data.canvasNoticeTone, 'info', '清空提示必须使用普通提示样式');
  assert.equal(clearable.data.canvasNoticeVisible, true, '清空提示必须立即显示在蛋头上方');
  assert.equal(toasts.includes('已清空，可以撤销'), false, '清空提示不得继续调用位置不可控的系统 Toast');
  clearable.setData({ toolPanelOpen: true });
  doodlePage.onUndo.call(clearable);
  assert.equal(clearable.data.toolPanelOpen, false, '点击撤销时必须同步收起工具设置');
  assert.equal(clearable.shellArt.operations.length, 2, '清空后撤销必须完整恢复画笔与贴纸');
  assert.equal(clearable.data.canvasNoticeVisible, false, '撤销清空后必须及时收起已经失效的清空提示');

  const stickerWarning = context({ activeTool: 'sticker', selectedPattern: '' });
  doodlePage.onCanvasTouchStart.call(stickerWarning, { touches: [touch(150, 150)] });
  assert.equal(stickerWarning.data.canvasNoticeText, '先选择一种贴纸', '贴纸未选择时必须复用画布内提示');
  assert.equal(stickerWarning.data.canvasNoticeTone, 'warning', '需要用户处理的画布提示必须使用注意样式');
  doodlePage.dismissCanvasNotice.call(stickerWarning);

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

  const embeddedBack = context();
  embeddedBack.properties = { embedded: true };
  embeddedBack.triggerEvent = eventName => { embeddedBack.closedEvent = eventName; };
  const embeddedRouteCount = routes.length;
  await doodlePage.onBack.call(embeddedBack);
  assert.equal(embeddedBack.closedEvent, 'close', '首页内嵌编辑器返回时必须通知首页关闭');
  assert.equal(routes.length, embeddedRouteCount, '首页内嵌编辑器返回时不得触发微信原生路由');

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
