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
      waitForPageExit() {
        this.setData({ pageTransitionPhase: 'exiting' });
        return Promise.resolve();
      }
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

  const manualSave = context();
  let manualUploadCount = 0;
  manualSave.shellArt.operations = [shellArt.createSticker('star', 1, { x: 0.5, y: 0.5 })];
  manualSave.performPersistence = async () => {
    manualUploadCount += 1;
    return { ok: true };
  };
  doodlePage.markDirty.call(manualSave);
  assert.equal(manualSave.data.saveStatus, 'unsaved', '产生修改后必须进入等待手动保存状态');
  assert.equal(manualSave.data.saveStatusText, '保存', '未保存状态必须提供明确的保存入口');
  assert.equal(manualUploadCount, 0, '绘画、撤销或清空后不得自动上传作品');
  const successResult = await doodlePage.onManualSave.call(manualSave);
  assert.equal(successResult.ok, true, '用户点击保存后必须返回成功状态');
  assert.equal(manualSave.savedRevision, 1, '手动保存成功必须推进已保存版本');
  assert.equal(manualSave.data.saveStatus, 'saved', '手动保存成功后必须显示已保存');
  assert.notEqual(manualSave.data.canvasNoticeText, '已保存', '保存成功只更新左上角状态，不得在蛋后方重复显示提示');
  assert.equal(manualUploadCount, 1, '一次用户确认只能触发一次作品上传');
  await doodlePage.onManualSave.call(manualSave);
  assert.equal(manualUploadCount, 1, '没有新修改时重复点击不得再次上传');

  const saveFailure = context();
  saveFailure.editRevision = 1;
  saveFailure.pageActive = true;
  saveFailure.performPersistence = async () => ({ ok: false, message: '测试保存失败' });
  const failureResult = await doodlePage.onManualSave.call(saveFailure);
  assert.equal(failureResult.ok, false, '手动保存失败必须保留失败状态');
  assert.equal(saveFailure.savedRevision, 0, '手动保存失败不得错误推进已保存版本');
  assert.equal(saveFailure.data.saveStatus, 'error', '手动保存失败后必须显示重新保存状态');
  assert.equal(saveFailure.data.saveStatusText, '重新保存', '保存失败必须允许用户明确重试');
  assert.equal(saveFailure.data.canvasNoticeText, '测试保存失败', '保存失败必须使用画布内深色轻提示反馈');

  const racingSave = context();
  racingSave.editRevision = 1;
  let racingUploadCount = 0;
  let resolveSave;
  racingSave.performPersistence = () => {
    racingUploadCount += 1;
    return new Promise(resolve => { resolveSave = resolve; });
  };
  const racingPromise = doodlePage.onManualSave.call(racingSave);
  doodlePage.markDirty.call(racingSave);
  resolveSave({ ok: true });
  const racingResult = await racingPromise;
  assert.equal(racingResult.ok, false, '保存期间出现新编辑时旧请求不得宣称全部已保存');
  assert.equal(racingSave.savedRevision, 1, '保存竞态只能推进到请求对应的编辑版本');
  assert.equal(racingSave.data.saveStatus, 'unsaved', '保存期间的新编辑必须继续显示未保存');
  assert.equal(racingUploadCount, 1, '保存期间的新编辑不得自动追加第二次上传');

  const savedBack = context();
  await doodlePage.onBack.call(savedBack);
  assert.equal(routes.pop(), 'BACK', '没有未保存修改时点击返回必须直接离开页面');

  const dirtyBack = context();
  dirtyBack.editRevision = 1;
  let dirtyBackUploads = 0;
  dirtyBack.performPersistence = async () => {
    dirtyBackUploads += 1;
    return { ok: true };
  };
  const dirtyRouteCount = routes.length;
  await doodlePage.onBack.call(dirtyBack);
  assert.equal(dirtyBack.data.exitConfirmVisible, true, '未保存时点击返回必须显示二次确认');
  assert.equal(routes.length, dirtyRouteCount, '未保存确认前不得退出页面');
  assert.equal(dirtyBackUploads, 0, '点击返回不得隐式上传作品');
  doodlePage.onExitConfirmTap.call(dirtyBack);
  assert.equal(dirtyBack.data.exitConfirmVisible, false, '点击确认窗口外的遮罩必须关闭弹窗并保留草稿');
  await doodlePage.onBack.call(dirtyBack);
  await doodlePage.onDiscardAndExit.call(dirtyBack);
  assert.equal(routes.pop(), 'BACK', '点击右上角关闭后必须离开独立画画页');
  assert.equal(dirtyBackUploads, 0, '右上角关闭不得产生任何上传');

  const confirmSave = context({ exitConfirmVisible: true });
  confirmSave.editRevision = 1;
  let confirmSaveUploads = 0;
  confirmSave.performPersistence = async () => {
    confirmSaveUploads += 1;
    return { ok: true };
  };
  await doodlePage.onSaveAndExit.call(confirmSave);
  assert.equal(confirmSaveUploads, 1, '确认窗口点击保存必须只上传一次当前作品');
  assert.equal(routes.pop(), 'BACK', '确认窗口保存成功后必须退出到上一页');

  const confirmSaveFailure = context({ exitConfirmVisible: true });
  confirmSaveFailure.editRevision = 1;
  confirmSaveFailure.pageActive = true;
  const failureRouteCount = routes.length;
  confirmSaveFailure.performPersistence = async () => ({ ok: false, message: '确认窗口保存失败' });
  await doodlePage.onSaveAndExit.call(confirmSaveFailure);
  assert.equal(confirmSaveFailure.data.exitConfirmVisible, true, '确认窗口保存失败后必须停留当前页面');
  assert.equal(confirmSaveFailure.data.exitConfirmSaving, false, '保存失败后必须恢复按钮以便重试或继续画');
  assert.equal(confirmSaveFailure.data.exitConfirmErrorText, '确认窗口保存失败', '保存失败原因必须直接显示在确认窗口内');
  assert.equal(routes.length, failureRouteCount, '确认窗口保存失败不得退出页面');

  const embeddedBack = context({ exitConfirmVisible: false });
  embeddedBack.editRevision = 1;
  embeddedBack.properties = { embedded: true };
  embeddedBack.triggerEvent = eventName => { embeddedBack.closedEvent = eventName; };
  const embeddedRouteCount = routes.length;
  await doodlePage.onBack.call(embeddedBack);
  assert.equal(embeddedBack.data.exitConfirmVisible, true, '回到小房间前也必须提示未保存修改');
  assert.equal(embeddedBack.closedEvent, undefined, '用户确认前不得关闭首页内嵌编辑器');
  await doodlePage.onDiscardAndExit.call(embeddedBack);
  assert.equal(embeddedBack.closedEvent, 'close', '确认不保存后首页内嵌编辑器必须通知首页关闭');
  assert.equal(routes.length, embeddedRouteCount, '首页内嵌编辑器返回时不得触发微信原生路由');

  const embeddedSavedBack = context();
  embeddedSavedBack.editRevision = 1;
  embeddedSavedBack.properties = { embedded: true };
  embeddedSavedBack.performPersistence = async () => ({ ok: true });
  embeddedSavedBack.triggerEvent = (eventName, detail) => {
    embeddedSavedBack.closedEvent = eventName;
    embeddedSavedBack.closedDetail = detail;
  };
  await doodlePage.onManualSave.call(embeddedSavedBack);
  await doodlePage.onBack.call(embeddedSavedBack);
  assert.equal(embeddedSavedBack.closedEvent, 'close', '顶部保存后返回必须关闭首页内嵌编辑器');
  assert.deepEqual(embeddedSavedBack.closedDetail, { saved: true }, '顶部保存后返回必须通知桌面显示更新提示');

  const savingBack = context();
  savingBack.editRevision = 1;
  let resolveSavingBack;
  savingBack.performPersistence = () => new Promise(resolve => { resolveSavingBack = resolve; });
  const activeSave = doodlePage.onManualSave.call(savingBack);
  const activeBack = doodlePage.onBack.call(savingBack);
  resolveSavingBack({ ok: true });
  await Promise.all([activeSave, activeBack]);
  assert.equal(routes.pop(), 'BACK', '用户已手动保存时，快速返回必须等待该次上传成功后退出');

  console.log('画画页笔宽颜色、双指缩放、撤销清空与手动保存退出确认校验通过。');
} finally {
  global.wx = originalWx;
  global.Page = originalPage;
}
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
