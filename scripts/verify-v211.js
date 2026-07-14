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

const album = read('miniprogram/pages/album/album.wxml');
const albumLogic = read('miniprogram/pages/album/album.js');
assert.equal(album.includes('title="我的收藏卡"'), true, '统一卡册标题必须为“我的收藏卡”');
assert.equal(/class="tabs?\b|data-tab=|onTab/.test(`${album}\n${albumLogic}`), false, '我的收藏卡不得再使用卡类 tab');
assert.equal(album.includes('身份收藏'), true, '统一收藏页必须包含一蛋一张的身份收藏分区');
assert.equal(album.includes('收集系列'), true, '统一收藏页必须按收集系列分区');
assert.equal(album.includes('尚未遇见'), true, '系列未获得卡位必须显示“尚未遇见”');
assert.equal(album.includes('item.uniqueCode'), true, '已获得卡位必须让系列编号与全局编号并存');

['pages/shop/shop', 'pages/bag/bag'].forEach(page => {
  assert.equal(app.pages.includes(page), true, `小程序必须注册 ${page}`);
  ['js', 'json', 'wxml', 'wxss'].forEach(extension => {
    assert.equal(fs.existsSync(path.join(root, `miniprogram/${page}.${extension}`)), true, `${page} 缺少 ${extension}`);
  });
});
const home = read('miniprogram/pages/home/home.wxml');
assert.equal(home.includes('商店'), true, '蛋宝宝页必须提供商店入口');
assert.equal(home.includes('背包'), true, '蛋宝宝页必须提供背包入口');

const h5Html = read('h5/birth-card/index.html');
const h5Css = read('h5/birth-card/styles.css');
const h5App = read('h5/birth-card/app.js');
const nativeCardCss = read('miniprogram/pages/collection-card/collection-card.wxss');
const nativeCardTemplate = read('miniprogram/pages/collection-card/collection-card.wxml');
const nativeCardLogic = read('miniprogram/pages/collection-card/collection-card.js');
assert.equal(h5Html.includes('card-title-section'), true, '收藏卡必须有独立名字标题区');
assert.equal(h5Html.includes('card-illustration-section'), true, '收藏卡必须有独立居中插画区');
assert.equal(h5Html.includes('card-data-section'), true, '收藏卡必须有独立三行数据区');
assert.match(h5Css, /\.illustration-frame\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/, '插画必须统一使用 4:5 视口');
assert.equal(/\.birth-card\s*\{[^}]*outline:/s.test(h5Css), false, '收藏卡不得显示黑色描边');
assert.match(nativeCardCss, /\.card\s*\{[^}]*aspect-ratio:\s*9\s*\/\s*16/, '原生收藏卡必须与 H5 使用同一竖版比例');
assert.match(nativeCardCss, /\.card-illustration-section\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/, '原生收藏卡插画视口必须锁定 4:5');
assert.equal(/\.card\s*\{[^}]*outline:/s.test(nativeCardCss), false, '原生收藏卡不得显示黑色描边');
assert.equal(nativeCardTemplate.includes('mode="aspectFill"'), true, '原生收藏卡插画必须铺满 4:5 视口');
assert.equal(nativeCardTemplate.includes('title-star'), false, '原生收藏卡顶部不得显示星星');
assert.equal(nativeCardTemplate.includes('card-wordmark'), false, '原生收藏卡名字上方不得显示 eggbabe 小字');
assert.match(nativeCardCss, /\.card\s*\{[^}]*padding:\s*24rpx;[^}]*gap:\s*16rpx;/s, '原生收藏卡内容必须四周等距');
assert.equal(nativeCardLogic.includes('height: 1067'), true, '原生分享图必须同步为 9:16 竖版');
assert.equal(nativeCardLogic.includes('drawCover(context, illustrationImage, 32, 112, 536, 670)'), true, '原生分享图的 4:5 插画必须铺满视口');
const nativePoster = nativeCardLogic.match(/async drawShareCard\(\)[\s\S]*?\n  },/)[0];
assert.equal(nativePoster.includes("fillText('eggbabe'"), false, '原生分享图名字上方不得显示品牌小字');
assert.equal(nativePoster.includes("fillText('★'"), false, '原生分享图顶部不得显示装饰星星');
assert.equal(h5App.includes('fonts.googleapis.com/css2?family=ZCOOL+KuaiLe'), true, '名字必须按需加载 Google Fonts OFL 版站酷快乐体');
assert.equal(h5App.includes('&text='), true, '名字字体请求必须使用 text 子集化');
assert.equal(/Math\.random/.test(h5App), false, 'H5 只能渲染服务端结果，不得生成随机值');

const generator = read('cloudfunctions/generateHatchCard/index.js');
assert.equal(generator.includes('ILLUSTRATION_POOL'), true, '服务端必须维护带标签的原型插画池');
assert.equal(generator.includes('weightedIllustration'), true, '服务端必须按节令与性格加权选择插画');
assert.equal(generator.includes('illustration_id'), true, '破壳时必须落库固定 illustration_id');
assert.equal(generator.includes('illustration_context'), true, '破壳时必须落库插画选择上下文');
assert.equal(generator.includes('ZODIAC_BOUNDARIES'), true, '星座必须由统一边界表计算');
assert.equal(generator.includes('isValidBirthday'), true, '服务端星座计算前必须校验真实日历日期');

const currency = read('miniprogram/services/currency-store.js');
assert.equal(currency.includes("mode: runtime.getMode()"), true, '货币余额与流水必须带 mode');
assert.equal(currency.includes('time.requireAuthoritative'), true, 'live 货币记账必须要求权威服务器时间');
assert.equal(/recharge|充值|广告/.test(currency), false, 'V2 货币服务不得实现充值或广告换币');

const catalog = read('miniprogram/config/item-catalog.js');
['accessory', 'snack', 'scene-decor'].forEach(category => {
  assert.equal(catalog.includes(`category: '${category}'`), true, `商品目录缺少 ${category} 类别`);
});

const timeService = read('miniprogram/services/time-service.js');
assert.equal(timeService.includes('requireAuthoritative'), true, '时间服务必须公开 live 判定门禁');
assert.equal(timeService.includes('DEMO_EPOCH_MS'), true, 'demo 必须使用固定演示时钟，不得用设备墙上时间作为判定基准');
assert.equal(timeService.includes("return { ok: true, now: Date.now(), authoritative: false"), false, 'demo 判定不得直接接受设备时间');

const currencyCloud = read('cloudfunctions/currencyAccount/index.js');
assert.match(currencyCloud, /collection\('user_inventory'\)\.add\(\{ data: \{ user_id: user\._id, mode: 'live'/, '首次购买新建库存时必须写入 live mode');
const incubationCloud = read('cloudfunctions/recordIncubationAction/index.js');
const dropCloud = read('cloudfunctions/sceneCardDrop/index.js');
assert.equal(incubationCloud.includes("event_name: 'currency_earned'"), true, '孵化互动发放露珠必须写 currency_earned');
assert.equal(dropCloud.includes("event_name: 'currency_earned'"), true, '场景互动发放露珠必须写 currency_earned');

const nativeCard = read('miniprogram/pages/collection-card/collection-card.js');
const h5Poster = read('h5/birth-card/poster-renderer.js');
assert.equal(nativeCard.includes('当前不会生成占位码'), true, '未配置真实小程序码时必须禁用原生分享图');
assert.equal(h5Poster.includes('展会占位'), false, 'H5 分享图不得绘制假小程序码');
assert.equal(h5Poster.includes("if (!card.miniProgramCodeUrl) throw new Error('MINI_CODE_REQUIRED')"), true, '所有分享图都必须包含真实小程序码');

const schema = read('docs/V2_DATA_MODEL.md');
['currency_balances', 'currency_ledger', 'item_catalog', 'user_inventory', 'daily_earn_counters', 'preference_events'].forEach(collection => {
  assert.equal(schema.includes(`\`${collection}\``), true, `数据模型缺少 ${collection}`);
});

console.log('PRD v2.11 契约校验通过：收藏卡统一、H5 三段式、露珠系统与服务器规则完整。');
