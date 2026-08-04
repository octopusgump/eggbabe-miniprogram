const assert = require('assert');
const geometry = require('../../utils/scene-window-geometry');

const fallback = {
  imageWidth: 2752,
  imageHeight: 1536,
  regions: [{ id: 'main-window', x: 1050, y: 0, width: 1570, height: 800 }]
};

[[375, 667], [390, 844], [430, 932], [768, 1024]].forEach(([panelWidth, panelHeight]) => {
  const panels = geometry.mapPanoramaRegions(Object.assign({}, fallback, { panelWidth, panelHeight }));
  assert.equal(panels.length, 3, `${panelWidth}x${panelHeight} 必须返回三屏热区`);
  assert.equal(panels[0].length, 0, `${panelWidth}x${panelHeight} 左屏没有可见窗户时不得制造假热区`);
  assert.equal(panels[1].length, 1, `${panelWidth}x${panelHeight} 中屏可见窗户必须可点击`);
  assert.equal(panels[2].length, 1, `${panelWidth}x${panelHeight} 右屏可见窗户必须可点击`);
  panels.flat().forEach(item => {
    assert.match(item.style, /^left:\d+(?:\.\d+)?px;top:\d+(?:\.\d+)?px;width:\d+(?:\.\d+)?px;height:\d+(?:\.\d+)?px$/);
  });
});

const tall = geometry.mapPanoramaRegions(Object.assign({}, fallback, { panelWidth: 390, panelHeight: 844 }));
assert.equal(tall[1][0].style, 'left:15.87px;top:0px;width:374.13px;height:439.58px', '高屏中屏热区必须跟随全景裁剪而不是固定 10% / 48%');
assert.equal(tall[2][0].style, 'left:0px;top:0px;width:390px;height:439.58px', '高屏右侧全部可见窗户必须保留点击能力');

const panelLocal = geometry.mapPanelRegions({
  panelWidth: 390,
  panelHeight: 844,
  panels: [null, { imageWidth: 941, imageHeight: 1672, windowRegions: [{ id: 'center', x: 100, y: 0, width: 841, height: 820 }] }, null]
});
assert.equal(panelLocal[1].length, 1, '正式 941x1672 切片必须支持同一套原图坐标映射');

assert.equal(geometry.shouldActivateWindowGesture({ startX: 100, startY: 100, endX: 107, endY: 103, elapsedMs: 220, panelWidth: 390 }), true, '阈值内短触必须打开窗户');
assert.equal(geometry.shouldActivateWindowGesture({ startX: 100, startY: 100, endX: 112, endY: 100, elapsedMs: 180, panelWidth: 390 }), false, '横向滑动不得误触窗户');
assert.equal(geometry.shouldActivateWindowGesture({ startX: 100, startY: 100, endX: 100, endY: 100, elapsedMs: 650, panelWidth: 390 }), false, '长按不得误触窗户');
assert.equal(geometry.shouldActivateWindowGesture({ startX: 100, startY: 100, endX: 100, endY: 100, elapsedMs: 120, moved: true, panelWidth: 390 }), false, 'scroll-view 已滚动时不得打开窗户');

console.log('三屏窗户原图坐标、aspectFill 裁剪、设备尺寸与点击滑动仲裁校验通过。');
