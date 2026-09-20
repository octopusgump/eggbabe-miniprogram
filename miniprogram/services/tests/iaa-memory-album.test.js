const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  MEMORY_STATES,
  ALBUM_MODES,
  MEMORY_ITEMS,
  createAlbumFixture
} = require('../../fixtures/iaa-memories');
const { createIaaMemoryAdapter } = require('../iaa-memory-adapter');

function loadPage(relativePath) {
  let definition;
  global.Page = page => { definition = page; };
  delete require.cache[require.resolve(relativePath)];
  require(relativePath);
  return definition;
}

function pageContext(page, data) {
  return Object.assign({}, page, {
    data: Object.assign({}, page.data || {}, data || {}),
    setData(patch) {
      Object.assign(this.data, patch);
    }
  });
}

assert.equal(MEMORY_ITEMS.length, 3, '静态纪念册必须且只包含首批三条候选纪念');
assert.deepEqual(
  new Set(MEMORY_ITEMS.map(item => item.state)),
  new Set([MEMORY_STATES.LOCKED, MEMORY_STATES.UNLOCKED, MEMORY_STATES.NEW]),
  '首屏样本必须覆盖 LOCKED、UNLOCKED、NEW 三态'
);
assert.deepEqual(MEMORY_ITEMS.map(item => item.title), ['雨天的叶子', '没画完的画', '第一次看雪']);

for (const memory of MEMORY_ITEMS) {
  for (const asset of [memory.sceneImage, memory.objectImage].filter(Boolean)) {
    assert.equal(
      fs.existsSync(path.join(__dirname, '../..', asset.replace(/^\//, ''))),
      true,
      `纪念素材必须存在：${asset}`
    );
  }
}

for (const mode of Object.values(ALBUM_MODES)) {
  const album = createAlbumFixture(mode);
  assert.equal(album.contractVersion, 'iaa-mvp-v1', `${mode} 必须使用统一合同版本`);
  assert.equal(album.source, 'local-fixture', `${mode} 必须明确标记为本地 fixture`);
  assert.equal(album.memories.length, mode === ALBUM_MODES.READY ? 3 : 0, `${mode} 的列表数据必须符合页面状态`);
}

const app = JSON.parse(fs.readFileSync(path.join(__dirname, '../../app.json'), 'utf8'));
for (const route of [
  'pages/iaa-memory-album-demo/iaa-memory-album-demo',
  'pages/iaa-memory-detail-demo/iaa-memory-detail-demo',
  'pages/iaa-memory-save-demo/iaa-memory-save-demo'
]) assert.ok(app.pages.includes(route), `必须注册隐藏验收页：${route}`);

const albumTemplate = fs.readFileSync(path.join(__dirname, '../../pages/iaa-memory-album-demo/iaa-memory-album-demo.wxml'), 'utf8');
const detailTemplate = fs.readFileSync(path.join(__dirname, '../../pages/iaa-memory-detail-demo/iaa-memory-detail-demo.wxml'), 'utf8');
const saveTemplate = fs.readFileSync(path.join(__dirname, '../../pages/iaa-memory-save-demo/iaa-memory-save-demo.wxml'), 'utf8');
assert.ok(albumTemplate.includes('正在翻开纪念册') && albumTemplate.includes('第一段纪念还在路上') && albumTemplate.includes('刚才没有翻开') && albumTemplate.includes('重新试试'), '纪念册必须提供加载、空、失败与重试验收入口');
for (const label of ['日期', '地点', '角色']) assert.ok(detailTemplate.includes(label), `详情页必须展示${label}`);
assert.ok(saveTemplate.includes('没有拉新奖励、二维码或分享任务'), '保存卡不得加入增长或分享诱导');
assert.ok(saveTemplate.includes('LOCAL FIXTURE · 不保存图片 · 不唤起分享 · 不写入账户'), '保存操作必须明确保持静态 mock 边界');
assert.equal(/二维码|扫码/.test(saveTemplate), true, '页面应明确说明不存在二维码，而非实际渲染二维码');

(async () => {
  const adapter = createIaaMemoryAdapter();
  const album = await adapter.getAlbum(ALBUM_MODES.READY);
  assert.equal(album.memories.length, 3);

  for (const memory of MEMORY_ITEMS) {
    const detail = await adapter.getMemory(memory.id);
    assert.equal(detail.memory.id, memory.id, 'adapter 必须按统一形状提供详情');
    assert.ok(detail.memory.sceneImage, '详情必须包含场景图');
    assert.ok(detail.memory.date && detail.memory.location && detail.memory.character && detail.memory.line, '详情必须包含日期、地点、角色和一句回忆');
  }

  for (const id of ['unfinished-painting', 'first-snow']) {
    const result = await adapter.getSaveCard(id);
    assert.equal(result.card.previewOnly, true, 'Rare / Memory 保存卡只能是静态预览');
    assert.equal(result.card.brand, 'EGGBABE · 蛋宝宝', '保存卡只保留小型品牌标识');
    assert.equal(Boolean(result.card.sceneImage && result.card.date && result.card.quote), true, '保存卡必须包含场景、日期与对白');
  }

  await assert.rejects(
    () => adapter.getSaveCard('rain-leaf'),
    /IAA_MEMORY_SAVE_NOT_ALLOWED/,
    '锁定的普通纪念不得生成保存卡'
  );

  const previousPage = global.Page;
  const previousWx = global.wx;
  const routes = [];
  global.wx = {
    navigateTo(options) {
      routes.push(options.url);
    }
  };

  const albumPage = loadPage('../../pages/iaa-memory-album-demo/iaa-memory-album-demo');
  const albumContext = pageContext(albumPage);
  await albumContext.loadAlbum(ALBUM_MODES.READY);
  albumContext.onOpenMemory({ currentTarget: { dataset: { id: 'rain-leaf' } } });
  assert.equal(routes.length, 0, 'LOCKED 纪念不得打开详情');
  assert.ok(albumContext.data.lockedNotice, '点击 LOCKED 纪念必须给出柔和的原地反馈');
  albumContext.onOpenMemory({ currentTarget: { dataset: { id: 'unfinished-painting' } } });
  assert.equal(routes.pop(), '/pages/iaa-memory-detail-demo/iaa-memory-detail-demo?id=unfinished-painting', 'NEW 纪念必须能打开详情');

  const detailPage = loadPage('../../pages/iaa-memory-detail-demo/iaa-memory-detail-demo');
  const detailContext = pageContext(detailPage, { memory: MEMORY_ITEMS.find(item => item.id === 'first-snow') });
  detailContext.onOpenSaveCard();
  assert.equal(routes.pop(), '/pages/iaa-memory-save-demo/iaa-memory-save-demo?id=first-snow', 'Memory 详情必须能进入静态保存卡');

  const savePage = loadPage('../../pages/iaa-memory-save-demo/iaa-memory-save-demo');
  const saveContext = pageContext(savePage);
  saveContext.onPreviewSave();
  assert.match(saveContext.data.previewNotice, /没有保存到相册.*没有发起分享/, '保存操作必须明确只提供预览反馈');

  global.Page = previousPage;
  global.wx = previousWx;

  console.log('纪念册三态、详情合同、保存卡 mock 边界与异常状态校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
