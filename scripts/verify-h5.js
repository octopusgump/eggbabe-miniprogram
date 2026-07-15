const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const required = [
  'h5/birth-card/index.html',
  'h5/birth-card/styles.css',
  'h5/birth-card/app.js',
  'h5/birth-card/card-model.js',
  'h5/birth-card/asset-config.js',
  'h5/birth-card/poster-renderer.js',
  'h5/birth-card/runtime-config.js',
  'h5/birth-card/assets/fonts/README.md',
  'h5/birth-card/assets/fonts/google-sans/GoogleSans-Variable.woff2',
  'h5/birth-card/assets/fonts/google-sans/OFL.txt',
  'h5/birth-card/assets/fonts/noto-sans-sc/NotoSansSC-Variable.woff2',
  'h5/birth-card/assets/fonts/noto-sans-sc/OFL.txt',
  'h5/birth-card/assets/fonts/zcool-kuaile/ZCOOLKuaiLe-Regular.woff2',
  'h5/birth-card/assets/fonts/zcool-kuaile/OFL.txt',
  'miniprogram/pages/h5-card/h5-card.js',
  'miniprogram/pages/h5-card/h5-card.wxml'
];
required.forEach(file => assert.equal(fs.existsSync(path.join(root, file)), true, `缺少 H5 交付文件：${file}`));

const html = read('h5/birth-card/index.html');
const css = read('h5/birth-card/styles.css');
const app = read('h5/birth-card/app.js');
const runtimeConfig = read('h5/birth-card/runtime-config.js');
const poster = read('h5/birth-card/poster-renderer.js');
const appJson = JSON.parse(read('miniprogram/app.json'));
const h5Page = read('miniprogram/pages/h5-card/h5-card.js');
const miniBridge = read('miniprogram/services/birth-card-h5.js');
const localPetStore = read('miniprogram/utils/pet-store.js');
const nicknamePage = read('miniprogram/pages/nickname/nickname.js');
const figureDirectory = path.join(root, 'h5/birth-card/assets/figures');
const figureCatalog = JSON.parse(read('h5/birth-card/assets/figures/catalog.json'));
const firstSet = JSON.parse(read('h5/birth-card/assets/sets/YT-S01.json'));
const faceContract = JSON.parse(read('h5/birth-card/card-face-contract.json'));
const cardFace = html.match(/<section id="card-view"[\s\S]*?<\/section>/)[0];

assert.equal(appJson.pages.includes('pages/h5-card/h5-card'), true, '小程序必须注册 H5 web-view 容器页');
assert.equal(read('miniprogram/pages/h5-card/h5-card.wxml').includes('<web-view'), true, 'H5 容器必须使用 web-view');
assert.match(css, /\.birth-card\s*\{[^}]*aspect-ratio:\s*9\s*\/\s*16/, '卡面必须使用竖版比例承载 4:5 插画');
assert.match(css, /\.illustration-frame\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/, '卡面插画视口必须锁定 4:5');
assert.equal(/\.birth-card\s*\{[^}]*outline:/s.test(css), false, '卡面不得显示黑色内描边');
assert.match(css, /\.hero-figure\s*\{[^}]*object-fit:\s*cover/, '4:5 插画必须铺满视口，不得留白');
['card-title-section', 'card-illustration-section', 'card-data-section'].forEach(className => assert.equal(cardFace.includes(className), true, `H5 卡面缺少三段式结构 ${className}`));
assert.equal(html.includes('eggbabe'), true, 'H5 卡面必须使用 eggbabe 品牌字标');
assert.equal(cardFace.includes('title-star'), false, 'H5 收藏卡顶部不得显示星星');
assert.equal(cardFace.includes('card-wordmark'), false, 'H5 收藏卡名字上方不得显示 eggbabe 小字');
assert.match(css, /\.birth-card\s*\{[^}]*padding:\s*14px;[^}]*gap:\s*8px;/s, 'H5 收藏卡内容必须四周等距');
assert.match(css, /\.collect-badge\s*\{[^}]*padding:\s*6px 10px;[^}]*font-size:\s*13px;/s, 'H5 系列序号必须放大');
assert.equal(/@media \(max-width: 360px\)[\s\S]*?\.card-data-section\s*\{[^}]*padding/.test(css), false, 'H5 小屏不得破坏卡片内容的四边等距');
assert.equal(/@media \(max-width: 360px\)[\s\S]*?\.card-title-section\s*\{[^}]*padding/.test(css), false, 'H5 小屏必须保留名字与放大序号的安全间距');
assert.equal(cardFace.includes('data-field="birthday"'), true, 'MVP 正面必须显示生日');
assert.equal(cardFace.includes('data-field="constellation"'), true, 'MVP 正面必须显示星座');
assert.equal(cardFace.includes('data-field="mbti"'), true, 'MVP 正面必须显示 MBTI');
['name', 'prototypeLabel', 'birthday', 'constellation', 'genderSymbol', 'mbti', 'signature', 'bloodType'].forEach(field => {
  assert.equal(cardFace.includes(`data-field="${field}"`), true, `H5 卡面缺少 v2.17 字段 ${field}`);
});
assert.equal(cardFace.includes('card-avatar-image'), true, 'H5 卡面必须显示 IP 形象头像');
const cardHeader = cardFace.match(/<header class="card-title-section">[\s\S]*?<\/header>/)[0];
assert.equal(cardHeader.includes('data-field="prototypeLabel"'), false, '类型不得继续重复显示在名字下方');
const statLabels = Array.from(cardFace.matchAll(/<dt>([^<]+)<\/dt>/g), match => match[1]);
assert.deepEqual(statLabels, ['类型', '生日', '星座', '性别', '血型', 'MBTI'], '正面必须按类型优先顺序显示六个信息豆腐块');
assert.equal(cardFace.includes('data-field="setName"'), true, '收集系列卡必须额外显示系列名');
assert.equal(cardFace.includes('data-field="cardTitle"'), true, '收集系列卡必须额外显示卡名');
assert.equal(css.includes('.stat-grid'), true, 'H5 收藏卡必须使用收紧的两列信息布局');
assert.equal(css.includes('.card-signature'), true, '性情独白必须作为独立留白气口');
assert.match(css, /\.stat-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*\.85fr\)\s*minmax\(0,\s*1\.15fr\)/s, '六个信息豆腐块必须使用两列三行网格，并为完整生日保留足够宽度');
assert.match(css, /\.stat-grid dt\s*\{[^}]*font-size:\s*12px/s, 'H5 信息标签字号必须放大到可读尺寸');
assert.match(css, /\.stat-grid dd\s*\{[^}]*font-size:\s*13px/s, 'H5 信息值字号必须放大到可读尺寸');
assert.match(css, /\.card-signature\s*\{[^}]*white-space:\s*normal/s, 'H5 性情独白必须允许完整换行');
assert.equal(/\.card-signature\s*\{[^}]*text-overflow:\s*ellipsis/s.test(css), false, 'H5 性情独白不得使用省略号截断');
assert.equal(app.includes('function fitCardSignature()'), true, 'H5 必须按数据区可用高度缩放长独白');
assert.equal(app.includes('dataSection.scrollHeight > dataSection.clientHeight'), true, 'H5 长独白适配必须以真实布局溢出为准');
assert.equal(poster.includes('drawCardData'), true, '分享海报必须使用与卡面一致的九字段信息区');
assert.equal(poster.includes('const CARD_HEIGHT = 1920'), true, '分享长图的卡面必须同步为 9:16 竖版');
const posterTitle = poster.match(/function drawTitle[\s\S]*?\n  }/)[0];
assert.equal(posterTitle.includes("fillText('★'"), false, '分享长图顶部不得显示星星');
assert.equal(posterTitle.includes("fillText('eggbabe'"), false, '分享长图名字上方不得显示品牌小字');
assert.equal(posterTitle.includes('card.prototypeLabel'), false, '分享长图名字下方不得重复显示类型');
assert.equal(poster.includes("['类型', card.prototypeLabel]"), true, '分享长图信息区必须把类型放在六块首位');
assert.equal(poster.includes("['MBTI', card.mbti]"), true, '分享长图 MBTI 必须并入第六个信息块');
assert.equal(poster.includes('CARD_HEIGHT * 0.11'), true, '分享长图标题区必须与屏显 11% 契约一致');
assert.equal(poster.includes("if (figure) drawCover(context, figure"), true, '分享长图的 4:5 插画必须铺满视口');
const posterRenderer = require('../h5/birth-card/poster-renderer');
const drawnPosterText = [];
const posterContext = {
  beginPath() {}, moveTo() {}, arcTo() {}, closePath() {}, fill() {},
  measureText(value) { return { width: Array.from(String(value)).length * 20 }; },
  fillText(value) { drawnPosterText.push(String(value)); }
};
const posterSignature = '安静、柔软、很会表达对你的喜欢，也愿意一直陪你慢慢长大。';
posterRenderer.drawCardData(posterContext, {
  prototypeLabel: '玉兔', birthdayLabel: '2026年7月14日', constellationLabel: '巨蟹座 ♋',
  genderSymbol: '♀', bloodType: 'A', mbti: 'ESFP', signature: posterSignature
});
assert.equal(drawnPosterText.join('').includes(posterSignature), true, '分享长图必须把完整性情独白逐行绘制出来');
assert.equal(cardFace.includes('data-field="initialOwner"'), false, 'MVP 正面不得显示初始主人');
assert.equal(app.includes('card.setCode'), false, '收藏卡名字下方不得再渲染套装编号');
assert.equal(cardFace.includes('card-subtitle'), false, '卡面不得显示名字下方的旧副标题');
assert.equal(cardFace.includes('card-footer'), false, '卡面不得显示状态和唯一副本编号区');
assert.equal(app.includes('fonts.googleapis.com'), false, '中国大陆线上不得依赖 Google Fonts CDN');
assert.equal(app.includes('nameFontUrlTemplate'), true, '名字字体必须保留备案域名自托管子集 URL 模板');
assert.equal(app.includes('nameFontUrl'), true, '名字字体必须支持整包静态自托管回退');
assert.equal(app.includes('googleSansFontUrl'), true, '英文字体必须支持静态自托管配置');
assert.equal(app.includes('notoSansScFontUrl'), true, 'Noto Sans SC 必须支持本地中文 fallback 配置');
assert.match(app, /loadFont\([\s\S]*?'Noto Sans SC'[\s\S]*?lazy:\s*true[\s\S]*?\);/, 'Noto Sans SC 必须注册为按需加载的本地 fallback');
assert.equal(app.includes("weight: '400 700'"), true, 'Google Sans 可变字重范围必须与字体二进制一致');
assert.equal(runtimeConfig.includes("notoSansScFontUrl: './assets/fonts/noto-sans-sc/NotoSansSC-Variable.woff2'"), true, 'Noto Sans SC 默认地址必须指向本地 WOFF2');
assert.match(css, /"PingFang SC", "Noto Sans SC", "Helvetica Neue", "Microsoft YaHei", sans-serif/, '中文 fallback 顺序必须优先 PingFang SC，再使用本地 Noto Sans SC');
assert.equal(poster.includes('"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif'), true, '分享长图必须使用本地 Noto Sans SC 中文 fallback');
assert.equal(poster.includes('"Google Sans", "Helvetica Neue", Arial, sans-serif'), true, '分享长图纯英文与数字 token 必须使用 Google Sans');
assert.equal(app.includes("loadFont('ZCOOL KuaiLe'"), true, '名字必须加载自托管 OFL 版站酷快乐体');
assert.equal(poster.includes('card.code'), true, '分享长图脚注必须包含全局编号');
assert.equal(poster.includes('miniProgramCodeUrl'), true, '分享长图必须消费真实小程序码');
assert.equal(poster.includes('card.shareCode'), true, '分享长图必须包含未使用的个人分享码');
assert.equal(app.includes('card.treatment}'), false, 'MVP 收藏卡正面不得额外显示 BASE 标签');
assert.equal(/Math\.random/.test([app, read('h5/birth-card/card-model.js'), read('h5/birth-card/poster-renderer.js')].join('\n')), false, 'H5 不得生成任何随机卡片值');
assert.equal(app.includes('card_data'), true, 'H5 必须支持 URL JSON 注入');
assert.equal(app.includes('card_id'), true, 'H5 必须支持 card_id 拉取');
assert.equal(app.includes("params.get('api_base')"), false, '正式卡不得从可编辑 URL 接受 API 地址');
assert.equal(app.includes("injected.mode === 'demo'"), true, 'URL 注入必须强制限制为 demo 卡');
assert.equal(app.includes('generatePoster'), true, 'H5 必须支持生成分享长图');
assert.equal(app.includes('h5_birth_card_save_poster'), true, 'H5 必须把分享图数据回传小程序保存');
assert.equal(h5Page.includes('saveImageToPhotosAlbum'), true, '小程序容器必须负责把 H5 分享图保存到相册');
assert.equal(app.includes("/pages/nickname/nickname"), true, 'H5 档案必须提供改名入口');
assert.equal(miniBridge.includes('card_data'), true, '预览模式必须把已定稿 JSON 注入 H5');
assert.equal(h5Page.includes("native=1"), true, 'H5 地址未配置时必须回退当前原生页面');
assert.equal(h5Page.includes('toH5CollectibleCard'), true, 'H5 容器必须能打开套装收藏卡副本');
assert.equal(h5Page.includes('onShow()'), true, '从改名页返回时必须刷新 H5 卡面');
assert.equal(nicknamePage.includes('await syncQueue.flush()'), true, '已破壳正式卡改名后必须等待云端同步再返回 H5');
const forbiddenBrand = new RegExp(['egg', 'baby'].join(''), 'i');
assert.equal(forbiddenBrand.test([html, css, app, miniBridge].join('\n')), false, 'H5 不得出现错误品牌名');
function extractNamePools(source) {
  const block = source.match(/const CARD_NAME_POOLS = \{([\s\S]*?)\n\};/);
  assert.ok(block, '生成层必须定义 CARD_NAME_POOLS');
  return ['玉兔', '锦鲤'].reduce((result, prototype) => {
    const pool = block[1].match(new RegExp(`'${prototype}': \\[(.*?)\\]`));
    assert.ok(pool, `名字池缺少 ${prototype}`);
    result[prototype] = Array.from(pool[1].matchAll(/'([^']+)'/g), match => match[1]);
    return result;
  }, {});
}
const pools = extractNamePools(localPetStore);
assert.equal(pools['玉兔'].length >= 18 && pools['锦鲤'].length >= 18, true, '前端 mock 必须保留两套固定名字池');

const catalogFiles = figureCatalog.assets.map(asset => asset.file).sort();
const actualFigureFiles = fs.readdirSync(figureDirectory).filter(file => /\.(?:jpg|png|webp)$/i.test(file)).sort();
assert.deepEqual(actualFigureFiles, catalogFiles, '角色素材文件必须全部登记到 figures/catalog.json，且目录表不得引用缺失文件');
for (const file of actualFigureFiles) {
  assert.equal(/^(?:YT|KOI)__[a-z0-9-]+__[a-z0-9-]+__v\d{2}\.(?:jpg|png|webp)$/.test(file), true, `角色素材命名不符合统一规范：${file}`);
}
assert.equal(firstSet.setSize, firstSet.cards.length, '套装 setSize 必须等于实际清单数量');
assert.deepEqual(firstSet.treatments, ['BASE'], 'MVP 第一季只能发布 BASE 版本');
assert.deepEqual(firstSet.cardFaceFields, ['avatar_id', 'prototype', 'name', 'birthday', 'constellation', 'gender', 'mbti', 'signature', 'blood_type', 'collector_number'], 'v2.17 卡面必须冻结九项身份字段与系列编号');
const figureIds = new Set(figureCatalog.assets.map(asset => asset.id));
firstSet.cards.forEach((card, index) => {
  assert.equal(card.collectorNumber, index + 1, '套装清单编号必须连续且不可重排');
  assert.equal(card.collectorLabel, `${String(index + 1).padStart(3, '0')}/${String(firstSet.setSize).padStart(3, '0')}`, 'collectorLabel 格式错误');
  assert.equal(card.treatment, 'BASE', 'MVP 卡片不得提前引入 parallel');
  assert.equal(figureIds.has(card.heroAssetId), true, `套装引用了未登记 Hero：${card.heroAssetId}`);
});

let albumDefinition;
let navigatedTo = '';
let toastTitle = '';
global.wx = {
  getStorageSync() { return undefined; },
  setStorageSync() {},
  removeStorageSync() {},
  navigateTo({ url }) { navigatedTo = url; },
  showToast({ title }) { toastTitle = title; }
};
global.Page = definition => { albumDefinition = definition; };
const petStore = require('../miniprogram/utils/pet-store');
const h5Bridge = require('../miniprogram/services/birth-card-h5');
const originalGetPet = petStore.getPet;
const originalToCollectible = h5Bridge.toH5CollectibleCard;
const originalBuildUrl = h5Bridge.buildH5Url;
petStore.getPet = () => ({ id: 'pet-1', collectionCard: { id: 'identity-1' } });
h5Bridge.toH5CollectibleCard = () => ({ card_id: 'owned-card', mode: 'demo' });
h5Bridge.buildH5Url = () => '';
delete require.cache[require.resolve('../miniprogram/pages/album/album.js')];
require('../miniprogram/pages/album/album.js');
delete global.Page;
const albumPage = Object.assign({}, albumDefinition, { data: { sceneCards: [{ id: 'owned-card' }] } });
albumPage.onOpenSetCard({ currentTarget: { dataset: { id: 'owned-card' } } });
assert.equal(toastTitle, '', 'H5 未部署时不得只显示“配置后开放”提示');
assert.equal(navigatedTo, '/pages/collection-card/collection-card?sceneCardId=owned-card&native=1', 'H5 未部署时必须打开已拥有收藏卡的原生完整卡面');
let h5PageDefinition;
let redirectedTo = '';
global.wx.redirectTo = ({ url }) => { redirectedTo = url; };
global.Page = definition => { h5PageDefinition = definition; };
delete require.cache[require.resolve('../miniprogram/pages/h5-card/h5-card.js')];
require('../miniprogram/pages/h5-card/h5-card.js');
delete global.Page;
const h5FallbackPage = Object.assign({}, h5PageDefinition, { sceneCardId: 'owned-card' });
h5FallbackPage.openNativeFallback('card', true);
assert.equal(redirectedTo, '/pages/collection-card/collection-card?sceneCardId=owned-card&native=1', 'web-view 地址失效时也必须回退到同一张已拥有收藏卡');
const nativeCardPage = read('miniprogram/pages/collection-card/collection-card.js');
const nativeCardTemplate = read('miniprogram/pages/collection-card/collection-card.wxml');
const nativeCardStyles = read('miniprogram/pages/collection-card/collection-card.wxss');
assert.equal(nativeCardPage.includes('query.sceneCardId'), true, '原生完整卡面必须读取已拥有收藏卡 ID');
assert.equal(nativeCardPage.includes('toH5CollectibleCard'), true, '原生回退必须消费与 H5 相同的已定稿卡片数据');
assert.equal(nativeCardTemplate.includes('待接入小程序码'), false, '原生完整卡面不得显示待接入小程序码按钮');
assert.equal(nativeCardTemplate.includes('分享给好友'), false, '原生完整卡面不得显示分享给好友按钮');
assert.equal(nativeCardTemplate.includes('posterUnavailableReason'), false, '移除按钮后不得残留无操作价值的小程序码提示');
assert.equal(nativeCardTemplate.includes('shareCanvas'), false, '移除原生分享按钮后不得保留隐藏分享画布');
assert.equal(nativeCardPage.includes('drawShareCard'), false, '移除原生分享按钮后不得继续后台生成分享图');
assert.equal(nativeCardPage.includes('onSave()'), false, '移除原生保存按钮后不得保留不可达保存处理器');
assert.equal(nativeCardTemplate.includes('sceneCard.collectorLabel'), true, '原生完整卡面必须显示系列编号');
assert.equal(nativeCardTemplate.includes('sceneCard.setName'), true, '原生完整卡面必须显示收集系列');
assert.equal(nativeCardTemplate.includes('class="prototype-name"'), false, '原生回退名字下方不得重复显示类型');
assert.deepEqual(Array.from(nativeCardTemplate.matchAll(/<text class="stat-label">([^<]+)<\/text>/g), match => match[1]), ['类型', '生日', '星座', '性别', '血型', 'MBTI'], '原生回退必须显示同顺序的六个信息块');
assert.match(nativeCardStyles, /\.stat-label\s*\{[^}]*font-size:\s*21rpx/s, '原生回退信息标签字号必须放大');
assert.match(nativeCardStyles, /\.stat-value\s*\{[^}]*font-size:\s*23rpx/s, '原生回退信息值字号必须放大');
assert.match(nativeCardStyles, /\.card-signature\s*\{[^}]*white-space:\s*normal/s, '原生回退性情独白必须允许完整换行');
assert.equal(/\.card-signature\s*\{[^}]*text-overflow:\s*ellipsis/s.test(nativeCardStyles), false, '原生回退性情独白不得使用省略号截断');
assert.equal(nativeCardTemplate.includes('{{signatureClass}}'), true, '原生回退必须按独白长度应用可读的紧凑字号');
assert.equal(nativeCardStyles.includes('.card-signature--compact'), true, '原生回退必须提供长独白紧凑样式');
assert.equal(nativeCardStyles.includes('.card-signature--dense'), true, '原生回退必须提供超长独白密集样式');
const sceneCardStore = require('../miniprogram/services/scene-card-store');
const originalListSceneCards = sceneCardStore.list;
const originalCollectionSummary = sceneCardStore.collectionSummary;
petStore.getPet = () => ({ id: 'incubating-pet', prototype: '玉兔', collectionCard: null });
sceneCardStore.list = () => [{ id: 'orphan-card', character: '玉兔', cardId: 'yt-s01-010' }];
sceneCardStore.collectionSummary = () => ({ setCode: 'YT-S01', slots: [{ owned: true }], ownedUnique: 1, total: 10 });
albumPage.setData = changes => { albumPage.data = Object.assign({}, albumPage.data, changes); };
albumPage.onShow();
assert.deepEqual(albumPage.data.sceneCards, [], '尚未孵化的当前宠物不得显示旧会话遗留的孤立收藏卡');
assert.equal(albumPage.data.summary, null, '尚未孵化时不得显示可点击的收集系列进度');

h5Bridge.toH5CollectibleCard = originalToCollectible;
h5Bridge.buildH5Url = originalBuildUrl;
const identityCard = { id: 'identity-1', mode: 'demo', prototype: '玉兔', name: '月团', birthday: '2026-07-14', zodiac: '巨蟹座', gender: '♀', mbti: 'INFP', bloodType: 'O', personality: '安静地陪你看月亮。', illustration_id: 'YT__watercolor__bath' };
const ownedSceneCard = { id: 'owned-card', mode: 'demo', character: '玉兔', cardId: 'yt-s01-010', name: '月夜泡泡浴', setCode: 'YT-S01', setName: '玉兔初见·水彩日常', collectorLabel: '010/010', image: '/assets/cards/YT-S01/yt-s01-010.webp' };
petStore.getPet = () => ({ id: 'hatched-pet', prototype: '玉兔', collectionCard: identityCard, inviteCodes: [] });
sceneCardStore.list = () => [ownedSceneCard];
let nativeCardDefinition;
global.Page = definition => { nativeCardDefinition = definition; };
delete require.cache[require.resolve('../miniprogram/pages/collection-card/collection-card.js')];
require('../miniprogram/pages/collection-card/collection-card.js');
delete global.Page;
const nativeDetailPage = Object.assign({}, nativeCardDefinition);
nativeDetailPage.data = Object.assign({}, nativeCardDefinition.data);
nativeDetailPage.setData = changes => { nativeDetailPage.data = Object.assign({}, nativeDetailPage.data, changes); };
nativeDetailPage.onLoad({ sceneCardId: 'owned-card', native: '1' });
assert.equal(nativeDetailPage.data.isCollectible, true, '已获得收藏卡必须进入具体卡面状态');
assert.equal(nativeDetailPage.data.sceneCard.name, '月夜泡泡浴', '具体卡面必须加载当前收藏卡名称');
assert.equal(nativeDetailPage.data.sceneCard.collectorLabel, '010/010', '具体卡面必须加载当前收藏卡编号');
assert.equal(nativeDetailPage.data.illustration, '/assets/cards/YT-S01/yt-s01-010.webp', '具体卡面必须加载当前收藏卡插画');
petStore.getPet = originalGetPet;
sceneCardStore.list = originalListSceneCards;
sceneCardStore.collectionSummary = originalCollectionSummary;
delete global.wx;

console.log('H5 工程校验通过：数据注入、三段式水彩卡面、web-view 接入与导出能力完整。');
