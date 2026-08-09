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

// ---------------------------------------------------------------------------
// 场景锚点：母图像素 → 本机屏幕位置
// ---------------------------------------------------------------------------
const postHatchAssets = require('../../config/post-hatch-assets');
const lifeScenes = require('../../utils/life-scenes');

const anchorMeta = postHatchAssets.POST_HATCH.panoramaFallbackMeta;
const DEVICES = [[375, 667], [390, 844], [430, 932], [768, 1024]];

// 同一个母图定点在任何机型上都必须落在同一屏；这正是旧的 CSS 百分比做不到的事。
DEVICES.forEach(([panelWidth, panelHeight]) => {
  const mapped = geometry.mapPanoramaPoints({
    imageWidth: anchorMeta.width,
    imageHeight: anchorMeta.height,
    panelWidth,
    panelHeight,
    points: { left: { x: 349, y: 1095 }, middle: { x: 1459, y: 1129 }, right: { x: 2474, y: 543 } }
  });
  assert.equal(mapped.left.panel, 0, `${panelWidth}x${panelHeight} 左屏锚点必须留在左屏`);
  assert.equal(mapped.middle.panel, 1, `${panelWidth}x${panelHeight} 中屏锚点必须留在中屏`);
  assert.equal(mapped.right.panel, 2, `${panelWidth}x${panelHeight} 右屏锚点必须留在右屏`);
  Object.values(mapped).forEach(item => {
    assert.match(item.style, /^left:-?\d+(?:\.\d+)?px;top:-?\d+(?:\.\d+)?px$/, '锚点样式必须是纯像素定位');
  });
});

assert.deepEqual(geometry.mapPanoramaPoints({ imageWidth: 0, points: { a: { x: 1, y: 1 } } }), {}, '缺少尺寸信息时不得凭空生成锚点');
assert.deepEqual(
  geometry.mapPanoramaPoints({ imageWidth: 2823, imageHeight: 1672, panelWidth: 375, panelHeight: 667, points: { bad: { x: 'x', y: 1 } } }),
  {},
  '非法锚点必须被丢弃，不得回落到 0,0'
);

// 每个居家状态都要有完整的三个锚点，且锚点推出的屏必须与业务状态声明的 screen 一致。
lifeScenes.HOME_STATES.forEach(state => {
  [{ prototype: '玉兔' }, { prototype: '锦鲤' }].forEach(pet => {
    const definition = lifeScenes.resolveDefinition('home', state.key);
    const anchors = postHatchAssets.resolveStateAnchors(pet, definition);
    ['character', 'action', 'talk'].forEach(name => {
      assert.ok(anchors[name] && Number.isFinite(anchors[name].x) && Number.isFinite(anchors[name].y), `${state.key} 缺少 ${name} 锚点`);
    });
    DEVICES.forEach(([panelWidth, panelHeight]) => {
      const mapped = geometry.mapPanoramaPoints({
        imageWidth: anchorMeta.width,
        imageHeight: anchorMeta.height,
        panelWidth,
        panelHeight,
        points: { character: anchors.character, action: anchors.action }
      });
      assert.equal(mapped.character.panel, state.screen, `${state.key} 的角色锚点必须落在 life-scenes.js 声明的第 ${state.screen} 屏`);
      assert.equal(mapped.action.panel, state.action.screen, `${state.key} 的动作锚点必须落在动作声明的第 ${state.action.screen} 屏`);
    });
  });
});

// 外出时家里没有人，不得渲染角色与动作提示。
lifeScenes.AWAY_STATES.forEach(state => {
  const anchors = postHatchAssets.resolveStateAnchors({ prototype: '玉兔' }, lifeScenes.resolveDefinition(state.major, state.key));
  assert.equal(anchors.character, null, `${state.key} 外出时不得有角色锚点`);
  assert.equal(anchors.action, null, `${state.key} 外出时不得有动作锚点`);
});

console.log('场景锚点换算校验通过。');
