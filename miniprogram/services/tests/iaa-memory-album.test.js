const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
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

assert.ok(MEMORY_ITEMS.length > 0, 'READY 状态必须提供已解锁纪念');
for (const memory of MEMORY_ITEMS) {
  for (const key of ['date', 'image', 'line', 'title']) {
    assert.ok(Object.prototype.hasOwnProperty.call(memory, key), `每条纪念必须包含 ${key}`);
  }
  assert.equal(
    fs.existsSync(path.join(__dirname, '../..', memory.image.replace(/^\//, ''))),
    true,
    `纪念图片必须存在：${memory.image}`
  );
}

for (const mode of Object.values(ALBUM_MODES)) {
  const album = createAlbumFixture(mode);
  assert.equal(album.contractVersion, 'iaa-mvp-v1', `${mode} 必须使用统一合同版本`);
  assert.equal(album.source, 'local-fixture', `${mode} 必须明确标记为本地 fixture`);
  assert.equal(album.memories.length, mode === ALBUM_MODES.READY ? MEMORY_ITEMS.length : 0, `${mode} 的列表数据必须符合页面状态`);
}

const albumTemplate = fs.readFileSync(path.join(__dirname, '../../pages/iaa-memory-album-demo/iaa-memory-album-demo.wxml'), 'utf8');
const albumStyles = fs.readFileSync(path.join(__dirname, '../../pages/iaa-memory-album-demo/iaa-memory-album-demo.wxss'), 'utf8');
for (const copy of ['还没有共同纪念', '纪念册暂时打不开', '重新试试']) {
  assert.ok(albumTemplate.includes(copy), `纪念册必须包含“${copy}”状态`);
}
assert.equal(albumTemplate.includes('class="memory-grid"'), true, '回忆必须使用三列方格墙');
assert.equal(albumTemplate.includes('class="memory-list"'), false, '回忆不得继续使用纵向卡片列表');
assert.equal(albumTemplate.includes('memory-grid-expand'), true, '回忆展开必须使用格下内联区域');
assert.equal(albumTemplate.includes('selectedMemory &&"') || albumTemplate.includes('selectedMemory}}" class="album-detail-mask"'), false, '回忆展开不得使用全屏遮罩弹窗');
assert.equal(albumTemplate.includes('inline-notice'), true, '回忆展开 meta 必须使用标准轻提示');
assert.equal(albumStyles.includes('grid-template-columns: repeat(3'), true, '回忆方格必须为 3 列');
assert.equal(albumStyles.includes('memory-cell--polaroid::before'), true, '拍立得格必须使用居中图钉');
assert.equal(albumTemplate.includes('暗格 · 待解锁'), true, '未解锁旅途暗格必须显示待解锁说明');
assert.equal(albumStyles.includes('memory-cell--postcard-locked'), true, '未解锁旅途必须使用模糊暗格与锁');
assert.equal(albumStyles.includes('memory-cell__locked-dim'), true, '未解锁旅途必须有压暗层');
for (const removedFeature of ['NEW', 'rarity', 'threshold']) {
  assert.equal(albumTemplate.includes(removedFeature), false, `列表不得保留 ${removedFeature} 能力`);
}

(async () => {
  const adapter = createIaaMemoryAdapter();
  const album = await adapter.getAlbum(ALBUM_MODES.READY);
  assert.equal(album.memories.length, MEMORY_ITEMS.length);

  const page = loadPage('../../pages/iaa-memory-album-demo/iaa-memory-album-demo');
  const context = pageContext(page);
  await context.loadAlbum(ALBUM_MODES.EMPTY);
  assert.equal(context.data.memories.length, 0, '空状态不得混入纪念数据');
  assert.equal(context.data.gridItems.length, 0, '空状态不得混入方格数据');
  await context.onRetry();
  assert.equal(context.data.mode, ALBUM_MODES.READY, '失败重试应回到列表状态');
  await context.loadAlbum(ALBUM_MODES.READY);
  assert.equal(context.data.gridItems.length, MEMORY_ITEMS.length, 'READY 状态方格数量必须与 fixture 一致');
  const lockedCell = context.data.gridItems.find(item => item.locked);
  assert.ok(lockedCell, 'fixture 必须包含未解锁旅途剪影格');
  lockedCell && context.onTapGridCell({ currentTarget: { dataset: { key: lockedCell.listKey } } });
  assert.equal(context.data.selectedMemory, null, '未解锁格点击不得展开');

  console.log('极简纪念册列表、空态、加载态与失败重试校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
