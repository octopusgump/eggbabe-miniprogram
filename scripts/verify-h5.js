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
const appJson = JSON.parse(read('miniprogram/app.json'));
const h5Page = read('miniprogram/pages/h5-card/h5-card.js');
const miniBridge = read('miniprogram/services/birth-card-h5.js');
const localPetStore = read('miniprogram/utils/pet-store.js');
const cloudCardGenerator = read('cloudfunctions/generateHatchCard/index.js');
const nicknamePage = read('miniprogram/pages/nickname/nickname.js');

assert.equal(appJson.pages.includes('pages/h5-card/h5-card'), true, '小程序必须注册 H5 web-view 容器页');
assert.equal(read('miniprogram/pages/h5-card/h5-card.wxml').includes('<web-view'), true, 'H5 容器必须使用 web-view');
assert.equal(css.includes('--hero-ratio: 70%'), true, '卡面必须明确 70% Hero 区');
assert.equal(css.includes('--data-ratio: 30%'), true, '卡面必须明确 30% 数据区');
assert.equal(html.includes('eggbabe'), true, 'H5 卡面必须使用 eggbabe 品牌字标');
assert.equal(/Math\.random/.test([app, read('h5/birth-card/card-model.js'), read('h5/birth-card/poster-renderer.js')].join('\n')), false, 'H5 不得生成任何随机卡片值');
assert.equal(app.includes('card_data'), true, 'H5 必须支持 URL JSON 注入');
assert.equal(app.includes('card_id'), true, 'H5 必须支持 card_id 拉取');
assert.equal(app.includes("params.get('api_base')"), false, '正式卡不得从可编辑 URL 接受 API 地址');
assert.equal(app.includes("injected.mode === 'demo'"), true, 'URL 注入必须强制限制为 demo 卡');
assert.equal(app.includes('generatePoster'), true, 'H5 必须支持生成分享长图');
assert.equal(app.includes("/pages/nickname/nickname"), true, 'H5 档案必须提供改名入口');
assert.equal(miniBridge.includes('card_data'), true, '预览模式必须把已定稿 JSON 注入 H5');
assert.equal(h5Page.includes("native=1"), true, 'H5 地址未配置时必须回退当前原生页面');
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

console.log('H5 工程校验通过：数据注入、70/30 卡面、web-view 接入与导出能力完整。');
