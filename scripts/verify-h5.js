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
  'miniprogram/pages/h5-card/h5-card.js',
  'miniprogram/pages/h5-card/h5-card.wxml'
];
required.forEach(file => assert.equal(fs.existsSync(path.join(root, file)), true, `缺少 H5 交付文件：${file}`));

const html = read('h5/birth-card/index.html');
const css = read('h5/birth-card/styles.css');
const app = read('h5/birth-card/app.js');
const poster = read('h5/birth-card/poster-renderer.js');
const appJson = JSON.parse(read('miniprogram/app.json'));
const h5Page = read('miniprogram/pages/h5-card/h5-card.js');
const miniBridge = read('miniprogram/services/birth-card-h5.js');
const localPetStore = read('miniprogram/utils/pet-store.js');
const cloudCardGenerator = read('cloudfunctions/generateHatchCard/index.js');
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
const h5Bindings = { mbti: 'data-field="mbti"', constellation: 'data-field="constellation"', birthday: 'data-field="birthday"' };
const h5StatPositions = faceContract.statOrder.map(field => cardFace.indexOf(h5Bindings[field]));
assert.equal(h5StatPositions.every((position, index) => position >= 0 && (!index || position > h5StatPositions[index - 1])), true, 'H5 信息顺序必须服从共享卡面契约');
['stat-row', 'stat-icon--mbti', 'stat-icon--constellation', 'stat-icon--birthday'].forEach(className => {
  assert.equal(cardFace.includes(className), true, `H5 卡面缺少参考图信息行 ${className}`);
});
assert.equal(css.includes('.stat-grid'), true, 'H5 收藏卡必须统一使用三行信息牌布局');
assert.equal(css.toLowerCase().includes('border: 1.5px solid #94ab61'), true, 'H5 信息牌必须使用参考图的绿色圆角边框');
assert.equal(poster.includes('drawCollectibleStats'), true, '分享海报必须使用与卡面一致的三行信息牌');
assert.equal(poster.includes('card.statRows.map'), true, '分享海报必须消费卡片模型中已经按契约排序的信息行');
assert.equal(poster.includes('const CARD_HEIGHT = 1920'), true, '分享长图的卡面必须同步为 9:16 竖版');
const posterTitle = poster.match(/function drawTitle[\s\S]*?\n  }/)[0];
assert.equal(posterTitle.includes("fillText('★'"), false, '分享长图顶部不得显示星星');
assert.equal(posterTitle.includes("fillText('eggbabe'"), false, '分享长图名字上方不得显示品牌小字');
assert.equal(poster.includes('CARD_HEIGHT * 0.105'), true, '分享长图标题区必须与屏显 10.5% 契约一致');
assert.equal(poster.includes("if (figure) drawCover(context, figure"), true, '分享长图的 4:5 插画必须铺满视口');
assert.equal(cardFace.includes('data-field="bloodType"'), false, 'MVP 正面不得显示血型');
assert.equal(cardFace.includes('data-field="signature"'), false, 'MVP 正面不得显示性格长句');
assert.equal(cardFace.includes('data-field="initialOwner"'), false, 'MVP 正面不得显示初始主人');
assert.equal(app.includes('card.setCode'), false, '收藏卡名字下方不得再渲染套装编号');
assert.equal(cardFace.includes('card-subtitle'), false, '卡面不得显示名字下方的旧副标题');
assert.equal(cardFace.includes('card-footer'), false, '卡面不得显示状态和唯一副本编号区');
assert.equal(app.includes('fonts.googleapis.com/css2?family=ZCOOL+KuaiLe'), true, '名字必须加载 Google Fonts OFL 版站酷快乐体');
assert.equal(app.includes('&text='), true, '名字字体必须按实际名字做 text 子集化');
assert.equal(poster.includes('card.code'), true, '分享长图脚注必须包含全局编号');
assert.equal(poster.includes('miniProgramCodeUrl'), true, '分享长图必须消费真实小程序码');
assert.equal(app.includes('card.setName}'), false, 'MVP 收藏卡正面不得额外显示套装名');
assert.equal(app.includes('card.treatment}'), false, 'MVP 收藏卡正面不得额外显示 BASE 标签');
assert.equal(/Math\.random/.test([app, read('h5/birth-card/card-model.js'), read('h5/birth-card/poster-renderer.js')].join('\n')), false, 'H5 不得生成任何随机卡片值');
assert.equal(app.includes('card_data'), true, 'H5 必须支持 URL JSON 注入');
assert.equal(app.includes('card_id'), true, 'H5 必须支持 card_id 拉取');
assert.equal(app.includes("params.get('api_base')"), false, '正式卡不得从可编辑 URL 接受 API 地址');
assert.equal(app.includes("injected.mode === 'demo'"), true, 'URL 注入必须强制限制为 demo 卡');
assert.equal(app.includes('generatePoster'), true, 'H5 必须支持生成分享长图');
assert.equal(app.includes("/pages/nickname/nickname"), true, 'H5 档案必须提供改名入口');
assert.equal(miniBridge.includes('card_data'), true, '预览模式必须把已定稿 JSON 注入 H5');
assert.equal(h5Page.includes("native=1"), true, 'H5 地址未配置时必须回退当前原生页面');
assert.equal(h5Page.includes('toH5CollectibleCard'), true, 'H5 容器必须能打开套装收藏卡副本');
assert.equal(h5Page.includes('onShow()'), true, '从改名页返回时必须刷新 H5 卡面');
assert.equal(nicknamePage.includes('await syncQueue.flush()'), true, '已破壳正式卡改名后必须等待云端同步再返回 H5');
assert.equal(/eggbaby/i.test([html, css, app, miniBridge].join('\n')), false, 'H5 不得出现错误品牌名 eggbaby');
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
assert.deepEqual(extractNamePools(localPetStore), extractNamePools(cloudCardGenerator), '本地与云端角色名字池及顺序必须完全一致');

const catalogFiles = figureCatalog.assets.map(asset => asset.file).sort();
const actualFigureFiles = fs.readdirSync(figureDirectory).filter(file => /\.(?:jpg|png|webp)$/i.test(file)).sort();
assert.deepEqual(actualFigureFiles, catalogFiles, '角色素材文件必须全部登记到 figures/catalog.json，且目录表不得引用缺失文件');
for (const file of actualFigureFiles) {
  assert.equal(/^(?:YT|KOI)__[a-z0-9-]+__[a-z0-9-]+__v\d{2}\.(?:jpg|png|webp)$/.test(file), true, `角色素材命名不符合统一规范：${file}`);
}
assert.equal(firstSet.setSize, firstSet.cards.length, '套装 setSize 必须等于实际清单数量');
assert.deepEqual(firstSet.treatments, ['BASE'], 'MVP 第一季只能发布 BASE 版本');
assert.deepEqual(firstSet.cardFaceFields, ['name', 'birthday', 'constellation', 'mbti', 'collector_number'], 'MVP 卡面只保留用户确认的可见字段');
const figureIds = new Set(figureCatalog.assets.map(asset => asset.id));
firstSet.cards.forEach((card, index) => {
  assert.equal(card.collectorNumber, index + 1, '套装清单编号必须连续且不可重排');
  assert.equal(card.collectorLabel, `${String(index + 1).padStart(3, '0')}/${String(firstSet.setSize).padStart(3, '0')}`, 'collectorLabel 格式错误');
  assert.equal(card.treatment, 'BASE', 'MVP 卡片不得提前引入 parallel');
  assert.equal(figureIds.has(card.heroAssetId), true, `套装引用了未登记 Hero：${card.heroAssetId}`);
});

console.log('H5 工程校验通过：数据注入、三段式水彩卡面、web-view 接入与导出能力完整。');
