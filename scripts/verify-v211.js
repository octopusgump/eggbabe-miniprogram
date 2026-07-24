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
assert.equal(homeTemplate.includes('一起待一会儿'), true, '首页必须提供无任务压力的自由陪伴入口');
assert.equal(homeTemplate.includes('跟我说说话'), true, '等待破壳首页必须提供常驻文字输入');
assert.equal(homeTemplate.includes('暂不命名'), true, '命名必须允许跳过');
assert.equal(homeTemplate.includes('id="homeEggBaseCanvas"') && homeTemplate.includes('id="homeEggArtCanvas"'), true, '首页必须保留三层蛋壳 Canvas');
assert.equal(homeLogic.includes('shellArtService.drawEggBase') && homeLogic.includes('shellArtService.drawEggArt'), true, '首页必须回显免费蛋壳创作');
assert.equal(homeStyles.includes('-webkit-mask-image: url("/assets/scenes/incubation/webp/egg_base_day.webp")'), true, '真实蛋体高光必须按母版裁切');
assert.equal(homeStyles.includes('.egg-contact-shadow'), true, '必须保留窝垫实时阴影');
assert.equal(homeLogic.includes('vibrateCuddleTick'), true, '长按贴贴必须保留体感反馈');
assert.equal(homeTemplate.includes('cuddle-track'), false, '长按贴贴不得显示任务式进度条');
assert.equal(homeTemplate.includes('room-element-layer'), true, '首页必须提供固定小房间小物层');
assert.equal(/room-coffee-effect[\s\S]*room-brush-stroke[\s\S]*room-scarf-weave/.test(homeTemplate), true, '咖啡机、画笔和围巾必须有独立即时表现');
const roomElementsSource = homeLogic.slice(homeLogic.indexOf('const ROOM_ELEMENTS'), homeLogic.indexOf('const COMPANION_ACTIONS'));
assert.deepEqual(
  Array.from(roomElementsSource.matchAll(/key: '([^']+)'/g), match => match[1]),
  ['lamp', 'coffee', 'brush', 'scarf', 'window'],
  '五类房间小物必须默认可用'
);

const petStore = read('miniprogram/utils/pet-store.js');
assert.equal(/function addProgress|function completeDailyTask|inactiveDays|CARD_NAME_POOLS|CARD_SETS/.test(petStore), false, 'live 用户模型不得保留成长、日任务或随机卡片逻辑');
assert.equal(petStore.includes("HATCHABLE: 'ready'"), true, '破壳入口只能由服务端生命周期映射');

const chat = read('miniprogram/pages/chat/chat.js');
assert.equal(/只有我|不要离开|一直都在|我就知道你会来/.test(chat), false, '对话不得制造排他或依赖');
assert.equal(chat.includes('chatService.requestReply'), true, 'live 对话必须经过服务适配层');
assert.equal(chat.includes('approvedFallback'), true, '模型不可用时必须使用审核通过的兜底文案');
assert.equal(read('miniprogram/services/chat-service.js').includes("safetyResult !== 'passed'"), true, '模型输出必须经 CTO 内容安全确认后展示');
const chatSafety = read('miniprogram/services/chat-safety.js');
assert.equal(chatSafety.includes('SENSITIVE_INFO_PATTERNS'), true, '对话安全必须拦截敏感个人信息');
assert.equal(chatSafety.includes('当地官方紧急或专业支持'), true, '危机兜底不得临时生成未经核验的具体资源');

const privacy = read('miniprogram/pages/privacy/privacy.wxml');
assert.equal(privacy.includes('适用版本 v2.28'), true, '隐私说明必须对齐当前版本');
assert.equal(privacy.includes('普通版不处理兴趣画像'), true, '隐私说明必须披露数据最小化边界');
assert.equal(privacy.includes('演示数据边界'), true, '隐私说明必须披露 live 与演示隔离');

const h5Sources = ['h5/birth-card/app.js', 'h5/birth-card/card-model.js', 'h5/birth-card/poster-renderer.js'].map(read).join('\n');
assert.equal(/Math\.random|card_data|preview=|new Date\(/.test(h5Sources), false, 'H5 不得生成或注入正式业务结果');

console.log('v2.28 普通版页面、文案、房间互动与数据边界校验通过。');
