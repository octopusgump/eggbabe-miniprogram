const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '../..');
const wxml = fs.readFileSync(path.join(miniprogramRoot, 'pages/doodle/doodle.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(miniprogramRoot, 'pages/doodle/doodle.wxss'), 'utf8');
const pageScript = fs.readFileSync(path.join(miniprogramRoot, 'pages/doodle/doodle-definition.js'), 'utf8');
const componentWxml = fs.readFileSync(path.join(miniprogramRoot, 'components/doodle-editor/doodle-editor.wxml'), 'utf8');
const componentWxss = fs.readFileSync(path.join(miniprogramRoot, 'components/doodle-editor/doodle-editor.wxss'), 'utf8');
const componentScript = fs.readFileSync(path.join(miniprogramRoot, 'components/doodle-editor/doodle-editor.js'), 'utf8');
const noticeWxml = fs.readFileSync(path.join(miniprogramRoot, 'components/inline-notice/inline-notice.wxml'), 'utf8');
const noticeWxss = fs.readFileSync(path.join(miniprogramRoot, 'components/inline-notice/inline-notice.wxss'), 'utf8');
const undoIconPath = path.join(miniprogramRoot, 'assets/ui/3d-toolbar/runtime/ui_3d_toolbar_undo_96_v02.webp');
const clearIconPath = path.join(miniprogramRoot, 'assets/ui/3d-toolbar/runtime/ui_3d_toolbar_clear_96_v01.webp');
const disabledUndoIconPath = path.join(miniprogramRoot, 'assets/ui/3d-toolbar/runtime/ui_3d_toolbar_undo_disabled_96_v01.webp');
const disabledClearIconPath = path.join(miniprogramRoot, 'assets/ui/3d-toolbar/runtime/ui_3d_toolbar_clear_disabled_96_v01.webp');
const eraserOptionsStart = wxml.indexOf(`wx:elif="{{toolPanelOpen && activeTool === 'eraser'}}"`);
const stickerOptionsStart = wxml.indexOf(`wx:if="{{toolPanelOpen && activeTool === 'sticker'}}"`);
const eraserOptionsMarkup = wxml.slice(eraserOptionsStart, stickerOptionsStart);

assert.equal(wxml.includes('canvas-expand-button'), false, '画画页不得保留左上角按钮式放大入口');
assert.equal(pageScript.includes('onToggleCanvasSize'), false, '画画页不得保留按钮式放大状态机');
assert.equal(wxml.includes('page--{{pageTransitionPhase}}'), true, '画画页必须绑定独立的淡入淡出状态');
assert.equal(pageScript.includes("pageTransitionPhase: 'waiting'") && pageScript.includes('this.renderAll();') && pageScript.includes('this.revealEditor();'), true, '蛋体与旧作品渲染完成前必须隐藏整页，之后再统一渐入');
assert.match(wxss, /\.page--waiting\s*\{[^}]*opacity:\s*0;[^}]*\}/, 'Canvas 准备期间必须隐藏整页');
assert.doesNotMatch(wxss, /\.page--waiting\s*\{[^}]*pointer-events:\s*none/, 'Canvas 准备期间必须阻止点击穿透到首页');
assert.match(wxss, /\.page--entering\s*\{[^}]*doodle-page-fade-in 320ms/, '画画页入场必须仅使用 320ms 淡入');
assert.match(wxss, /\.page--exiting\s*\{[^}]*doodle-page-fade-out 320ms/, '画画页离场必须仅使用 320ms 淡出');
assert.equal(pageScript.includes('this.properties && this.properties.embedded') && pageScript.includes("this.triggerEvent('close')"), true, '首页内嵌画画页返回时必须关闭组件，不触发微信原生路由');
assert.match(
  wxss,
  /\.preview\s*\{[^}]*min-height:\s*0;[^}]*flex:\s*1;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*border:\s*0;[^}]*border-radius:\s*0;[^}]*box-shadow:\s*none;/,
  '导航以下必须使用无分层边框的全屏画布，并将蛋保持在可用区域正中'
);
assert.equal(wxml.includes('class="preview" bindtap="onCanvasBackdropTap"') && /class="preview"[\s\S]*class="content" catchtap="onToolPanelTap"/.test(wxml), true, '工具必须位于蛋的画布层之上，点击画布外部时可收起展开设置');
assert.match(wxss, /\.content\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*100;[^}]*left:\s*0;[^}]*right:\s*0;[^}]*bottom:\s*0;/, '工具区域必须明确高于蛋体 Canvas');
assert.match(
  wxss,
  /\.egg-canvas-stack\s*\{[^}]*z-index:\s*1;[^}]*top:\s*-168rpx;[^}]*width:\s*89vw;[^}]*height:\s*89vw;[^}]*transform-origin:\s*center;/,
  '透明蛋壳 Canvas 必须累计上移 168rpx，同时保持约占屏幕一半和正方形比例'
);
assert.match(wxss, /\.preview\s*\{[^}]*isolation:\s*isolate;/, '画布舞台必须建立明确层叠上下文');
assert.doesNotMatch(wxss, /\.egg-canvas-stack\s*\{[^}]*will-change:/, '蛋体不得使用可能越过工具浮层的强制合成提示');
assert.match(wxss, /\.canvas-action-rail\s*\{[^}]*z-index:\s*30;/, '撤销与清空必须明确位于蛋体之上');
assert.match(wxss, /\.canvas-action-rail\s*\{[^}]*top:\s*calc\(50% \+ 72rpx\);/, '撤销与清空按钮组必须相对画布中心适度下移');
assert.match(wxml, /transform:scale\(\{\{canvasScale\}\}\)/, 'Canvas 必须绑定双指缩放倍率');
assert.match(pageScript, /MAX_CANVAS_SCALE\s*=\s*1\.6/, '双指缩放必须限制在安全倍率内');
assert.match(pageScript, /scaledLeft[\s\S]*localX[\s\S]*\/ scale/, '缩放后绘画触点必须反向映射回原始 Canvas 坐标');
assert.equal(wxml.includes('<text class="brush-setting-title">粗细</text>') && wxml.includes('<text class="brush-setting-title">颜色</text>'), true, '画笔左右设置卡必须使用简短清楚的“粗细”和“颜色”标题');
assert.equal(wxml.indexOf('>粗细<') < wxml.indexOf('id="brushSizeTrack"') && wxml.indexOf('id="brushSizeTrack"') < wxml.indexOf('>颜色<') && wxml.indexOf('>颜色<') < wxml.indexOf('class="brush-color-trigger"'), true, '画笔设置必须左侧先放五档粗细、右侧只放当前颜色入口');
assert.equal(wxml.includes('class="brush-selected-color"') && !wxml.includes('brush-color-row'), true, '收起状态的颜色区域只能显示当前选中的单一颜色');
assert.equal(wxml.includes('<cover-view wx:if="{{colorPickerOpen}}" class="brush-color-popover"') && wxml.includes('<cover-view class="brush-color-grid"') && wxml.includes('wx:for="{{brushColors}}"'), true, '颜色面板必须使用能够覆盖原生 Canvas 的 cover-view');
assert.equal(/PANTONE/i.test(wxml), false, '色块选择面板不得出现 Pantone 品牌文案');
assert.equal(pageScript.includes('toolPanelOpen: false'), true, '首次进入画画页时必须只显示三个主工具');
assert.equal(wxml.includes("toolPanelOpen && activeTool === 'brush'") && wxml.includes("toolPanelOpen && activeTool === 'eraser'") && wxml.includes("toolPanelOpen && activeTool === 'sticker'"), true, '三个工具的二级设置必须在用户点击后才显示');
assert.match(wxss, /@keyframes tool-options-fade-in\s*\{[^}]*opacity:\s*0;[^}]*\}/, '工具二级设置必须只使用透明度淡入，不得从侧边滑入');
assert.equal(wxml.includes("tool-section--compact") && wxml.includes('figma-toolbar figma-toolbar--compact') && !wxml.includes('<text wx:if="{{toolPanelOpen}}">'), true, '三个主工具在收起和展开状态都必须保持无文字的紧凑图标 Dock');
assert.match(wxss, /\.content\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*flex-end;[^}]*padding:[^;]*calc\(24rpx \+ env\(safe-area-inset-bottom\)\)/, '收起工具 Dock 必须固定在内容区底部并避开手机安全区');
assert.equal(wxml.includes('class="section tool-section'), false, '二级设置和主工具 Dock 外部不得再包裹整块白色大面板');
assert.match(wxss, /\.tool-section\s*\{[^}]*width:\s*100%;[^}]*padding:\s*0;/, '展开工具时只允许二级设置卡自身占满宽度');
assert.match(wxss, /\.tool-section--compact\s*\{[^}]*width:\s*368rpx;[^}]*padding:\s*0;[^}]*border:\s*0;[^}]*background:\s*transparent;/, '收起状态不得保留工具面板底板');
assert.match(wxss, /\.figma-toolbar--compact\s*\{[^}]*width:\s*368rpx;[^}]*height:\s*112rpx;[^}]*grid-template-columns:\s*repeat\(3,\s*112rpx\);[^}]*padding:\s*0 15rpx;[^}]*border-radius:\s*56rpx;[^}]*background:\s*#FFF;/, '收起工具 Dock 必须复用首页三按钮的尺寸、留白、圆角和白色悬浮质感');
assert.match(wxss, /\.figma-toolbar--with-options\s*\{[^}]*margin:\s*12rpx auto 0;/, '显示二级设置时纯图标 Dock 必须保持居中且只增加上下间距');
assert.equal(eraserOptionsStart >= 0 && stickerOptionsStart > eraserOptionsStart && eraserOptionsMarkup.includes('wx:for="{{eraserSizes}}"') && eraserOptionsMarkup.includes('onEraserSize') && !eraserOptionsMarkup.includes('<slider') && !eraserOptionsMarkup.includes('brush-color-row') && !eraserOptionsMarkup.includes('pattern-row'), true, '橡皮擦展开后只能显示五档面状尺寸选项');
assert.equal(/>\s*(?:画笔|橡皮擦|贴纸)\s*<\/text>/.test(wxml), false, '底部三个工具不得在展开后增加文字标签');
assert.match(wxss, /\.brush-settings-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) 112rpx;[^}]*gap:\s*12rpx;/, '五档粗细必须占据约八成宽度，颜色入口只保留紧凑区域');
assert.match(wxss, /\.brush-setting-group\s*\{[^}]*border-radius:\s*22rpx;[^}]*background:\s*#F7F8F5;/, '两组画笔设置必须使用设计系统的圆角浅色面');
assert.match(wxss, /\.brush-setting-title\s*\{[^}]*font-size:\s*24rpx;/, '粗细与颜色标题必须放大到清晰可读的 24rpx');
assert.match(wxss, /\.brush-color-popover\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*120;[^}]*left:\s*-12rpx;[^}]*right:\s*-12rpx;[^}]*bottom:\s*calc\(100% \+ 12rpx\);[^}]*background:\s*#FFF;/, '十色色块必须在工具卡上方以接近屏幕宽度的最高原生覆盖层展开');
assert.match(wxss, /\.brush-color-grid\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;/, '十种颜色必须使用 cover-view 兼容的两排弹性布局');
assert.match(wxss, /\.brush-color-card\s*\{[^}]*width:\s*20%;[^}]*height:\s*112rpx;[^}]*border:\s*4rpx solid #FFF;/, '每排必须显示五个足够大的颜色块');
assert.match(wxss, /\.brush-color-card--selected\s*\{[^}]*box-shadow:[^}]*#3F5A47/, '默认森林绿及其他选中色必须显示清楚的双层边框');
assert.equal(pageScript.includes('brushColors: shellArtService.BRUSH_COLORS'), true, '页面颜色弹窗必须直接使用完整的十色配置');
assert.equal(!wxml.includes('brush-color-trigger-mark') && !wxss.includes('.brush-color-trigger-chevron'), true, '颜色入口不得继续显示下拉箭头');
assert.equal(wxml.includes('点这里选颜色') && wxml.includes('colorHintRendered') && pageScript.includes('eggbabe_doodle_color_hint_seen_v1'), true, '首次进入画笔设置必须复用首页胶囊提示节奏，引导用户点击颜色');
assert.match(wxss, /\.brush-color-hint\s*\{[^}]*border-radius:\s*999rpx;[^}]*opacity:\s*0;[^}]*transform:\s*translateY\(6rpx\);/, '颜色首次提示必须使用白色胶囊和轻微上浮渐入');
assert.equal(wxml.includes('class="brush-size-label"') && wxml.includes('{{item.pixels}} px'), true, '五档笔触必须直接显示像素值，便于快速比较');
assert.match(wxss, /\.eraser-size-grid\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*1fr\)/, '橡皮擦五档必须使用等宽面状触控区域');
assert.match(wxss, /\.eraser-size-option--selected\s*\{[^}]*background:\s*#E6EED0;/, '橡皮擦选中档位必须使用设计系统绿色面，而不是细线框');
assert.match(wxss, /\.tool-button--selected:first-child\s*\{[^}]*box-shadow:\s*-15rpx 0 0 #FFF0DD;/, '左侧工具选中面必须填满胶囊左端留白');
assert.match(wxss, /\.tool-button--selected:last-child\s*\{[^}]*box-shadow:\s*15rpx 0 0 #FFF0DD;/, '右侧工具选中面必须填满胶囊右端留白');
assert.equal(componentWxml, wxml, '首页内嵌编辑器与独立画画页必须共用相同结构');
assert.equal(componentWxss, wxss, '首页内嵌编辑器与独立画画页必须共用相同视觉布局');
assert.equal(componentScript.includes("require('../../pages/doodle/doodle-definition')") && componentScript.includes('doodleDefinition.onReady.call(this)'), true, '内嵌编辑器必须复用画画页逻辑和 Canvas 就绪生命周期');
assert.equal(wxml.includes('<inline-notice') && wxml.includes('canvasNoticeText'), true, '清空等轻量反馈必须使用可复用的画布内提示组件');
assert.match(wxss, /\.canvas-notice-anchor\s*\{[^}]*top:\s*calc\(50% - 448rpx\);[^}]*left:\s*132rpx;[^}]*right:\s*132rpx;/, '画布内提示必须跟随累计上移 168rpx 后的蛋头位置并避开右侧操作按钮');
assert.equal(noticeWxml.includes('inline-notice--{{tone}}') && noticeWxss.includes('.inline-notice--warning'), true, '标准轻提示只需提供普通与注意两种语义样式');
assert.equal((noticeWxss.match(/\.inline-notice--(?:info|warning)\b/g) || []).length <= 2, true, '标准轻提示不得扩张为多套重复视觉');
assert.equal(wxml.includes('ui_3d_toolbar_undo_96_v02.webp') && wxml.includes('ui_3d_toolbar_clear_96_v01.webp'), true, '撤销和清空必须使用审核通过的 3D 专用图标');
assert.equal(fs.existsSync(undoIconPath), true, '撤销按钮必须包含审核通过的 3D WebP 图标资源');
assert.equal(fs.readFileSync(undoIconPath).subarray(0, 4).toString('ascii'), 'RIFF', '撤销按钮资源必须是有效 WebP');
assert.equal(fs.existsSync(clearIconPath), true, '清空按钮必须包含审核通过的 3D WebP 图标资源');
assert.equal(fs.readFileSync(clearIconPath).subarray(0, 4).toString('ascii'), 'RIFF', '清空按钮资源必须是有效 WebP');
assert.equal(wxml.includes('ui_3d_toolbar_undo_disabled_96_v01.webp') && wxml.includes('ui_3d_toolbar_clear_disabled_96_v01.webp'), true, '撤销和清空必须分别切换到独立的置灰 3D 图标');
assert.equal(fs.existsSync(disabledUndoIconPath) && fs.existsSync(disabledClearIconPath), true, '两枚置灰 3D WebP 图标资源必须存在');
assert.doesNotMatch(wxss, /\.canvas-action-button--disabled\s*\{[^}]*(?:opacity|color)\s*:/, '禁用状态不得降低整颗按钮透明度或淡化文字颜色');

console.log('画画页 50% 蛋体、双指缩放、内嵌画笔设置与统一操作按钮校验通过。');
