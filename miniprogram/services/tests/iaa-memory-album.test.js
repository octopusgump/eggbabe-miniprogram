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
  assert.deepEqual(
    Object.keys(memory).sort(),
    ['date', 'image', 'line', 'title'],
    '每条纪念只保留图片、标题、日期和一句话'
  );
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
for (const copy of ['还没有共同纪念', '纪念册暂时打不开', '重新试试']) {
  assert.ok(albumTemplate.includes(copy), `纪念册必须包含“${copy}”状态`);
}
for (const removedFeature of ['LOCKED', 'NEW', 'rarity', 'threshold', 'navigateTo', '分享', '保存']) {
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
  await context.onRetry();
  assert.equal(context.data.mode, ALBUM_MODES.READY, '失败重试应回到列表状态');

  console.log('极简纪念册列表、空态、加载态与失败重试校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
