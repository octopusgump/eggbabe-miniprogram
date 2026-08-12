const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const app = JSON.parse(read('miniprogram/app.json'));
const preHatchAssets = require(path.join(root, 'miniprogram/config/pre-hatch-assets')).PRE_HATCH;
const userFacingFiles = app.pages
  .map(page => `miniprogram/${page}.wxml`)
  .filter(file => fs.existsSync(path.join(root, file)) && !file.includes('/privacy/'));
const userFacing = userFacingFiles.map(read).join('\n');

assert.equal(/破壳卡|场景卡|套卡|我的卡册/.test(userFacing), false, '用户界面只能使用“收藏卡”');
assert.equal(/卡池|掉落|抽取|稀有|集齐|好感度|关系等级|今日完成|连续到访|再点一次|还差几次/.test(userFacing), false, '普通版用户界面不得出现游戏化引导');
assert.equal(new RegExp(['egg', 'baby'].join(''), 'i').test(userFacing), false, '品牌英文只能写 eggbabe');

const homeTemplate = read('miniprogram/pages/home/home.wxml');
const homeLogic = read('miniprogram/pages/home/home.js');
const homeStyles = read('miniprogram/pages/home/home.wxss');
const doodleTemplate = read('miniprogram/pages/doodle/doodle.wxml');
const doodleLogic = read('miniprogram/pages/doodle/doodle-definition.js');
const doodleStyles = read('miniprogram/pages/doodle/doodle.wxss');
assert.equal(homeLogic.includes("key: 'wish'") && homeLogic.includes("key: 'learn'") && homeLogic.includes("key: 'draw'") && homeLogic.includes("title: '早教班'"), true, '首页必须并列保留许愿池、早教班与画画入口');
assert.equal(homeTemplate.includes('talkUnlocked') || homeTemplate.includes('talk-input'), false, '孵化前首页不得展示说话输入框');
assert.equal(homeTemplate.includes('暂不命名'), true, '命名必须允许跳过');
assert.equal(homeTemplate.includes('id="homeEggBaseCanvas"') && homeTemplate.includes('id="homeEggArtCanvas"'), true, '首页必须保留三层蛋壳 Canvas');
assert.equal(homeLogic.includes('shellArtService.drawEggBase') && homeLogic.includes('shellArtService.drawEggArt'), true, '首页必须回显免费蛋壳创作');
assert.equal(homeTemplate.includes('src="{{eggShellOverlays.depth}}"') && homeTemplate.includes('src="{{eggShellOverlays.specular}}"'), true, '真实蛋体光影必须使用透明 WebP image 层，路径从配置读取');
assert.equal(
  preHatchAssets.eggShellOverlays.depth.endsWith('/egg_shell_depth_overlay_512_v01.webp')
    && preHatchAssets.eggShellOverlays.specular.endsWith('/egg_shell_specular_overlay_512_v01.webp'),
  true,
  '蛋体光影层必须登记为审核通过的 512 WebP'
);
assert.equal(/(?:mask-image|background-image)\s*:\s*url\([^)]*\/assets\//.test(homeStyles), false, 'WXSS 不得通过 url() 读取本地图片');
assert.equal(homeStyles.includes('.egg-contact-shadow'), false, '蛋体阴影必须进入透明蛋体图片层，不得继续由 CSS 重绘');
assert.equal(homeStyles.includes('.incubation-nest-shadow'), false, '窝垫下方不得叠加额外代码阴影');
assert.equal(homeTemplate.includes('class="scene-tester ') && homeLogic.includes('onSceneTesterSelect'), true, '开发版必须保留场景测试选择器');
assert.equal(homeLogic.includes('vibrateCuddleTick'), true, '长按贴贴必须保留体感反馈');
assert.equal(homeTemplate.includes('cuddle-track'), false, '长按贴贴不得显示任务式进度条');
assert.equal(homeTemplate.includes('room-lamp-hotspot') && homeLogic.includes('onLampTap'), true, '台灯必须作为画面热区直接互动');
assert.equal(/coffee|scarf|room-element-layer|roomSound/.test(`${homeTemplate}\n${homeLogic}\n${homeStyles}`), false, '咖啡机、围巾与旧物件按钮层必须移除');
assert.equal(/\.companion-grid\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*row;/.test(homeStyles) && homeStyles.includes('.companion-item--draw::before'), true, '三个入口必须保持同排，并在画画入口前保留分隔线');
assert.equal(homeTemplate.includes('companion-primary-dock') && homeStyles.includes('.companion-primary-dock { width: 368rpx;') && homeStyles.includes('padding: 0 15rpx;') && homeStyles.includes('backdrop-filter: blur(14rpx)'), true, '许愿池、早教班与画画必须使用带左右留白的同一组三等分半透明生活操作栏');
assert.equal(homeLogic.includes('companionActionsFor(state.records, state.serverDate)') && homeLogic.includes('今天已经回答，点击查看'), true, '许愿池与早教班必须保留当天记录并允许点击回看');
assert.equal(homeTemplate.includes('completed-check') || homeTemplate.includes('completed-mark'), false, '首页不得用勾选或完成章汇总当天动作');
assert.equal(!/<view\s+wx:if="\{\{item\.key/.test(homeTemplate) && homeTemplate.includes("item.key === 'draw'") && homeTemplate.includes('draw-action-spark'), true, '画画入口必须与其他底部功能共用同一白色胶囊底');
assert.equal(doodleTemplate.indexOf('class="preview"') < doodleTemplate.indexOf('class="content"'), true, '绘图蛋体必须位于滚动区域外并固定在页面顶端');
assert.equal(doodleTemplate.includes('figma-toolbar--compact') && doodleTemplate.includes('wx:for="{{eraserSizes}}"') && doodleTemplate.includes('bindtap="onEraserSize"'), true, '绘图页必须提供紧凑工具栏和五档面状橡皮擦尺寸');
assert.equal(!doodleTemplate.includes('canvas-expand-button') && doodleLogic.includes('beginPinch') && doodleLogic.includes('MAX_CANVAS_SCALE = 1.6') && doodleStyles.includes('width: 89vw'), true, '蛋体必须默认占屏约 50%，并支持双指缩放绘画');
assert.equal(doodleTemplate.includes('canvas-action-rail') && doodleStyles.includes('width: 112rpx; height: 224rpx;') && doodleStyles.includes('gap: 0;') && doodleStyles.includes('.canvas-action-button + .canvas-action-button { border-top: 1rpx solid #E5E3DF;') && doodleTemplate.indexOf('canvas-action-rail') < doodleTemplate.indexOf('figma-toolbar'), true, '撤销与清空必须作为一个两段胶囊纵向固定在画布右侧');
assert.equal(doodleTemplate.includes('save-status--{{saveStatus}}') && doodleTemplate.includes('bindtap="onManualSave"') && !doodleLogic.includes('AUTO_SAVE_DELAY') && doodleLogic.includes("saveStatusText: '已保存'"), true, '返回旁必须展示明确的手动保存状态，绘画过程不得自动上传');
assert.equal(doodleTemplate.includes('<cover-view wx:if="{{colorPickerOpen}}" class="brush-color-popover"') && doodleTemplate.includes('brush-color-grid') && doodleTemplate.includes('brush-size-track') && doodleLogic.includes('selectedBrushColor') && !doodleTemplate.includes('蛋壳颜色'), true, '页面必须使用覆盖 Canvas 的全宽两排十色色块弹窗与五档可视笔宽轨，不得再提供整颗蛋换底色');
assert.equal(!doodleTemplate.includes('保存我的蛋壳') && doodleTemplate.indexOf('bindtap="onManualSave"') < doodleTemplate.indexOf('class="preview"'), true, '手动保存只能位于左上导航，不得恢复底部保存按钮');
assert.equal(/亲手画一点|像 Figma|history-count|tool-hint|保存后，首页窝里/.test(`${doodleTemplate}\n${doodleStyles}`), false, '绘图工具盘不得保留解释性冗余文字');
assert.equal(doodleLogic.includes('ERASER_SIZES') && doodleLogic.includes('selectEraserSize') && doodleLogic.includes('eraserWidthForPixels'), true, '橡皮擦必须使用五档真实像素尺寸，同时保留旧作品宽度重放');
assert.equal(['onTool', 'onUndo', 'onClear', 'onPattern'].every(handler => doodleLogic.includes(`${handler}(`)), true, '绘图页必须提供画笔、橡皮擦、贴纸、逐步撤销与可撤销清空');
assert.equal(/删除贴纸|调整贴纸|onDeleteSticker/.test(`${doodleTemplate}\n${doodleLogic}`), false, '贴纸删除必须统一由橡皮擦完成');

const petStore = read('miniprogram/utils/pet-store.js');
assert.equal(/function addProgress|function completeDailyTask|inactiveDays|CARD_NAME_POOLS|CARD_SETS/.test(petStore), false, 'live 用户模型不得保留成长、日任务或随机卡片逻辑');
assert.equal(petStore.includes("HATCHABLE: 'ready'"), true, '破壳入口只能由服务端生命周期映射');

const lifeSceneLogic = read('miniprogram/pages/life-scene/life-scene.js');
const chatPageLogic = read('miniprogram/pages/chat/chat.js');
const postHatchCompanion = read('miniprogram/services/post-hatch-companion.js');
const chatService = read('miniprogram/services/chat-service.js');
const activeChatFlow = `${lifeSceneLogic}\n${chatPageLogic}\n${postHatchCompanion}\n${chatService}`;
assert.equal(app.pages.includes('pages/chat/chat'), true, '破壳后居家对话必须使用完整页面');
assert.equal(/只有我|不要离开|一直都在|我就知道你会来/.test(activeChatFlow), false, '对话不得制造排他或依赖');
assert.equal(lifeSceneLogic.includes('/pages/chat/chat?state_key=') && chatPageLogic.includes('postHatch.sendSceneMessage'), true, '生活场景必须直达完整对话页，并进入统一陪伴服务');
assert.equal(!postHatchCompanion.includes('chatSafety') && !chatPageLogic.includes('validateChatInput'), true, '破壳后输入校验和危机处理不得在 App 决策，必须交由服务端处理');
assert.equal(postHatchCompanion.includes('chatService.requestReply'), true, 'live 对话必须经过服务适配层');
assert.equal(postHatchCompanion.includes('function getChatHistory(pet, cursor, limit)') && postHatchCompanion.includes('normalizeChatHistoryMessage'), true, '对话历史必须由服务端读取并经统一适配层展示');
assert.equal(chatPageLogic.includes('postHatch.sendSceneMessage(this.data.pet, this.data.snapshot, text, clientMessageId)') && !chatPageLogic.includes('confirmedHistoryBefore'), true, 'App 只能传递当前消息和稳定客户端消息 ID，不得上传页面 history');
assert.equal(postHatchCompanion.includes('chatService.approvedFallback'), true, '模型不可用时必须使用审核通过的兜底文案');
assert.equal(chatService.includes('DISPLAYABLE_SAFETY_RESULTS') && !chatService.includes('safeOutput('), true, '模型输出及危机安全结果必须以服务端审核内容为准，App 不得改写');
assert.equal(!chatService.includes('history:') && !chatService.includes('scene_context:'), true, 'chatReply 最小请求不得上传模型历史或场景上下文');
const chatSafety = read('miniprogram/services/chat-safety.js');
assert.equal(chatSafety.includes('SENSITIVE_INFO_PATTERNS'), true, '对话安全必须拦截敏感个人信息');
assert.equal(!chatSafety.includes('当地官方紧急或专业支持'), true, 'App 不得内置危机固定模板或临时生成未经核验的具体资源');

const privacy = read('miniprogram/pages/privacy/privacy.wxml');
assert.equal(privacy.includes('适用版本 v3.7'), true, '隐私说明必须对齐当前版本');
assert.equal(privacy.includes('不用于用户画像或蛋宝宝性格生成'), true, '隐私说明必须声明愿望答案不用于画像');
assert.equal(privacy.includes('演示数据边界'), true, '隐私说明必须披露 live 与演示隔离');

const h5Sources = ['h5/birth-card/app.js', 'h5/birth-card/card-model.js', 'h5/birth-card/poster-renderer.js'].map(read).join('\n');
assert.equal(/Math\.random|card_data|preview=|new Date\(/.test(h5Sources), false, 'H5 不得生成或注入正式业务结果');

console.log('V3.7 普通版页面、文案、房间互动与数据边界校验通过。');
