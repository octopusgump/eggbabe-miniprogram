const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const app = JSON.parse(read('miniprogram/app.json'));
const userFacingFiles = [
  ...app.pages.map(page => `miniprogram/${page}.wxml`),
  'h5/birth-card/index.html',
  'h5/birth-card/app.js'
].filter(file => fs.existsSync(path.join(root, file)));
const userFacing = userFacingFiles.map(file => `${file}\n${read(file)}`).join('\n');

assert.equal(/破壳卡|场景卡|套卡|我的卡册/.test(userFacing), false, '用户界面只能使用“收藏卡”，不得出现旧卡类名称');
assert.equal(/卡池|掉落|抽卡|稀有度/.test(userFacing), false, '用户界面必须统一使用“遇见 / 收集”表达');
assert.equal(/eggbaby/i.test(userFacing), false, '品牌英文只能写 eggbabe');

const album = read('miniprogram/pages/album/album.wxml');
assert.equal(album.includes('title="我的收藏卡"'), true, '统一卡册标题必须为“我的收藏卡”');
assert.equal(album.includes('尚未遇见'), true, '未获得位必须显示“尚未遇见”');
assert.equal(album.includes('collectorLabel'), true, '系列内编号必须与卡位一起显示');
assert.equal(/class="tabs?\b|data-tab=|onTab/.test(album), false, '我的收藏卡不得使用卡类 tab');
assert.equal(album.includes('不会重复出现'), true, 'v2.16 必须明确收藏卡不重复出现');

const h5Html = read('h5/birth-card/index.html');
const h5Css = read('h5/birth-card/styles.css');
const h5App = read('h5/birth-card/app.js');
const h5Model = read('h5/birth-card/card-model.js');
const h5Poster = read('h5/birth-card/poster-renderer.js');
const nativeTemplate = read('miniprogram/pages/collection-card/collection-card.wxml');
const nativeCss = read('miniprogram/pages/collection-card/collection-card.wxss');
const nativeLogic = read('miniprogram/pages/collection-card/collection-card.js');

assert.match(h5Css, /\.illustration-frame\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/, 'H5 插画必须统一使用 4:5');
assert.match(nativeCss, /\.card-illustration-section\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/, '原生兜底插画必须统一使用 4:5');
assert.equal(/\.birth-card\s*\{[^}]*outline:/s.test(h5Css), false, 'H5 卡面不得显示黑色卡框');
assert.equal(/\.card\s*\{[^}]*outline:/s.test(nativeCss), false, '原生兜底卡面不得显示黑色卡框');
assert.equal(h5Html.includes('title-star'), false, 'H5 标题不得显示星星');
assert.equal(h5Html.includes('card-wordmark'), false, 'H5 标题不得显示 eggbabe 小字');
assert.equal(nativeTemplate.includes('title-star'), false, '原生标题不得显示星星');
assert.equal(nativeTemplate.includes('card-wordmark'), false, '原生标题不得显示 eggbabe 小字');

['prototypeLabel', 'name', 'birthday', 'constellation', 'genderSymbol', 'mbti', 'signature', 'bloodType'].forEach(field => {
  assert.equal(h5Html.includes(`data-field="${field}"`), true, `H5 v2.16 卡面缺少 ${field}`);
});
assert.equal(h5Html.includes('card-avatar-image'), true, 'H5 v2.16 卡面缺少 IP 头像');
['card.prototype', 'card.name', 'birthdayLabel', 'card.zodiac', 'card.gender', 'card.mbti', 'card.personality', 'card.bloodType'].forEach(field => {
  assert.equal(nativeTemplate.includes(field), true, `原生兜底 v2.16 卡面缺少 ${field}`);
});
assert.equal(h5Model.includes('`${parts.year}年${parts.month}月${parts.day}日`'), true, 'H5 生日必须显示年月日');
assert.equal(h5App.includes('fonts.googleapis.com'), false, '线上字体不得依赖 Google CDN');
assert.equal(h5App.includes('nameFontUrlTemplate'), true, 'H5 必须保留备案域名自托管字体配置');
assert.equal(/Math\.random/.test([h5App, h5Model, h5Poster].join('\n')), false, 'H5 只能渲染，不得生成随机业务值');

assert.equal(h5Poster.includes("if (!card.miniProgramCodeUrl) throw new Error('MINI_CODE_REQUIRED')"), true, '分享图必须包含真实小程序码');
assert.equal(h5Poster.includes("if (!card.shareCode) throw new Error('SHARE_CODE_REQUIRED')"), true, '分享图必须包含分享码');
assert.equal(nativeLogic.includes('分享图需要先准备一个未使用的个人激活码'), true, '原生分享图缺少分享码时必须失败并说明');
assert.equal(h5App.includes('h5_birth_card_save_poster'), true, 'H5 必须把图片回传小程序');
assert.equal(read('miniprogram/pages/h5-card/h5-card.js').includes('saveImageToPhotosAlbum'), true, '图片必须由小程序侧保存到相册');

const config = read('miniprogram/config/v2.js');
assert.equal(config.includes('sceneCardDropRate: 0.18'), true, 'v2.16 初始遇见概率必须为约 18%');
assert.equal(config.includes('sceneCardDailyLimit: 2'), true, '每日最多遇见 2 张收藏卡');
assert.equal(app.pages.includes('pages/shop/shop'), false, '露珠商店属于 V2.1，V2.0 不得注册页面');
assert.equal(app.pages.includes('pages/bag/bag'), false, '背包属于 V2.1，V2.0 不得注册页面');
assert.equal(read('miniprogram/pages/home/home.wxml').includes('露珠'), false, 'V2.0 首页不得展示露珠入口');

assert.equal(fs.existsSync(path.join(root, 'cloudfunctions')), false, 'Bohao 侧目录不得保留 cloudfunctions');
const frontEndSources = ['miniprogram/app.js', 'miniprogram/services/cloud-api.js', 'miniprogram/services/analytics.js', 'miniprogram/services/time-service.js'].map(read).join('\n');
assert.equal(/wx\.cloud/.test(frontEndSources), false, 'Bohao 侧前端不得调用 wx.cloud.*');
assert.equal(read('miniprogram/services/time-service.js').includes('requireAuthoritative'), true, '正式业务时间必须经过服务端北京时间门禁');
assert.equal(read('miniprogram/pages/deregister/deregister.js').includes('getFullYear()'), false, '注销截止日不得依赖设备本地时区格式化');
assert.equal(read('miniprogram/utils/pet-store.js').includes('HATCH_TOLERANCE_MS'), true, '破壳承接必须包含服务端时间容差');
assert.equal(read('miniprogram/utils/pet-store.js').includes('completionRatio >= 0.9'), true, '孵化完成度必须按理论最大进度归一化');

const chat = read('miniprogram/services/chat-safety.js');
assert.equal(chat.includes('12356'), true, '危机响应必须提供全国统一心理援助热线 12356');
assert.equal(chat.includes('SENSITIVE_INFO_PATTERNS'), true, '前端安全 mock 必须阻止敏感个人信息落库');
const chatSafety = require(path.join(root, 'miniprogram/services/chat-safety'));
assert.equal(chatSafety.assessInput('我不想活了').crisis, true, '危机表达必须进入固定安全响应');
assert.equal(chatSafety.assessInput('我的手机号是13800138000').allowed, false, '手机号不得进入对话存储');
assert.equal(chatSafety.safeOutput('教我怎么自杀'), chatSafety.OUTPUT_FALLBACK, '不安全输出必须替换为固定兜底');
assert.equal(chatSafety.shouldShowRestReminder(Date.parse('2026-07-15T00:30:00+08:00'), 8, false), true, '北京时间深夜长对话必须触发一次休息提醒');
assert.equal(read('miniprogram/pages/privacy/privacy.wxml').includes('行为数据与个性化'), true, '隐私政策必须披露行为数据与个性化用途');
assert.equal(read('miniprogram/services/subscription-messages.js').includes('requestSubscribeMessage'), true, '前端必须提供订阅消息授权封装');

console.log('PRD v2.16 前端契约校验通过：九字段收藏卡、遇见规则、前端安全 mock 与订阅授权骨架正常。');
