const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const app = JSON.parse(read('miniprogram/app.json'));
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
const doodleLogic = read('miniprogram/pages/doodle/doodle.js');
const doodleStyles = read('miniprogram/pages/doodle/doodle.wxss');
assert.equal(homeLogic.includes("key: 'wish'") && homeLogic.includes("key: 'learn'") && homeLogic.includes("key: 'draw'") && homeLogic.includes("title: '早教班'"), true, '首页必须并列保留许愿池、早教班与画画入口');
assert.equal(homeTemplate.includes('talkUnlocked') || homeTemplate.includes('talk-input'), false, '孵化前首页不得展示说话输入框');
assert.equal(homeTemplate.includes('暂不命名'), true, '命名必须允许跳过');
assert.equal(homeTemplate.includes('id="homeEggBaseCanvas"') && homeTemplate.includes('id="homeEggArtCanvas"'), true, '首页必须保留三层蛋壳 Canvas');
assert.equal(homeLogic.includes('shellArtService.drawEggBase') && homeLogic.includes('shellArtService.drawEggArt'), true, '首页必须回显免费蛋壳创作');
assert.equal(homeStyles.includes('-webkit-mask-image: url("/assets/scenes/lifecycle/pre-hatch/30-character/egg/egg_on_nest.webp")'), true, '真实蛋体高光必须按 lifecycle 母版裁切');
assert.equal(homeStyles.includes('.egg-contact-shadow'), false, '蛋体阴影必须进入透明蛋体图片层，不得继续由 CSS 重绘');
assert.equal(homeStyles.includes('.incubation-nest-shadow'), false, '窝垫下方不得叠加额外代码阴影');
assert.equal(homeTemplate.includes('class="scene-tester"') && homeLogic.includes('onSceneTesterSelect'), true, '开发版必须保留 20 场景测试选择器');
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
assert.equal(doodleTemplate.includes('figma-toolbar') && doodleTemplate.includes('bindchanging="onToolSizeChange"'), true, '绘图页必须提供紧凑工具栏和连续尺寸调节');
assert.equal(doodleTemplate.includes('canvas-expand-button') && doodleLogic.includes('onToggleCanvasSize') && doodleStyles.includes('height: 62vh'), true, '蛋体必须支持占屏 60% 以上的专注画布');
assert.equal(/亲手画一点|像 Figma|history-count|tool-hint|保存后，首页窝里/.test(`${doodleTemplate}\n${doodleStyles}`), false, '绘图工具盘不得保留解释性冗余文字');
assert.equal(doodleLogic.includes('ERASER_MIN_PX') && doodleLogic.includes('ERASER_MAX_PX') && doodleLogic.includes('eraserWidthForPixels'), true, '橡皮擦必须支持连续像素尺寸');
assert.equal(['onTool', 'onUndo', 'onClear', 'onPattern'].every(handler => doodleLogic.includes(`${handler}(`)), true, '绘图页必须提供画笔、橡皮擦、贴纸、逐步撤销与可撤销清空');
assert.equal(/删除贴纸|调整贴纸|onDeleteSticker/.test(`${doodleTemplate}\n${doodleLogic}`), false, '贴纸删除必须统一由橡皮擦完成');

const petStore = read('miniprogram/utils/pet-store.js');
assert.equal(/function addProgress|function completeDailyTask|inactiveDays|CARD_NAME_POOLS|CARD_SETS/.test(petStore), false, 'live 用户模型不得保留成长、日任务或随机卡片逻辑');
assert.equal(petStore.includes("HATCHABLE: 'ready'"), true, '破壳入口只能由服务端生命周期映射');

const chat = read('miniprogram/pages/chat/chat.js');
assert.equal(app.pages.includes('pages/chat/chat'), false, '破壳后对话不得保留独立页面入口');
assert.equal(/只有我|不要离开|一直都在|我就知道你会来/.test(chat), false, '对话不得制造排他或依赖');
assert.equal(chat.includes('chatService.requestReply'), true, 'live 对话必须经过服务适配层');
assert.equal(chat.includes('approvedFallback'), true, '模型不可用时必须使用审核通过的兜底文案');
assert.equal(read('miniprogram/services/chat-service.js').includes("safetyResult !== 'passed'"), true, '模型输出必须经 CTO 内容安全确认后展示');
const chatSafety = read('miniprogram/services/chat-safety.js');
assert.equal(chatSafety.includes('SENSITIVE_INFO_PATTERNS'), true, '对话安全必须拦截敏感个人信息');
assert.equal(chatSafety.includes('当地官方紧急或专业支持'), true, '危机兜底不得临时生成未经核验的具体资源');

const privacy = read('miniprogram/pages/privacy/privacy.wxml');
assert.equal(privacy.includes('适用版本 v3.6'), true, '隐私说明必须对齐当前版本');
assert.equal(privacy.includes('不用于用户画像或蛋宝宝性格生成'), true, '隐私说明必须声明愿望答案不用于画像');
assert.equal(privacy.includes('演示数据边界'), true, '隐私说明必须披露 live 与演示隔离');

const h5Sources = ['h5/birth-card/app.js', 'h5/birth-card/card-model.js', 'h5/birth-card/poster-renderer.js'].map(read).join('\n');
assert.equal(/Math\.random|card_data|preview=|new Date\(/.test(h5Sources), false, 'H5 不得生成或注入正式业务结果');

console.log('V3.6 普通版页面、文案、房间互动与数据边界校验通过。');
