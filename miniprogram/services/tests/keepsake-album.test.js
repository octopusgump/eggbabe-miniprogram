const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const { ALBUM_MODES, createKeepsakeAlbumFixture } = require('../../fixtures/keepsake-album');
const adapter = require('../keepsake-album-adapter');

const listTemplate = fs.readFileSync(path.join(root, 'pages/keepsake-album/keepsake-album.wxml'), 'utf8');
const listStyles = fs.readFileSync(path.join(root, 'pages/keepsake-album/keepsake-album.wxss'), 'utf8');
const meetDetailTemplate = fs.readFileSync(
  path.join(root, 'pages/keepsake-album-meet-detail/keepsake-album-meet-detail.wxml'),
  'utf8'
);
const postcardDetailTemplate = fs.readFileSync(
  path.join(root, 'pages/keepsake-album-postcard-detail/keepsake-album-postcard-detail.wxml'),
  'utf8'
);
const roomLogic = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.js'), 'utf8');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));

assert.equal(app.pages.includes('pages/keepsake-album/keepsake-album'), true, '纪念册列表必须注册');
assert.equal(app.pages.includes('pages/keepsake-album-meet-detail/keepsake-album-meet-detail'), true, '遇见详情必须注册');
assert.equal(app.pages.includes('pages/keepsake-album-postcard-detail/keepsake-album-postcard-detail'), true, '明信片详情必须注册');
assert.equal(roomLogic.includes('/pages/keepsake-album/keepsake-album'), true, '百宝箱必须跳转纪念册');

for (const copy of ['还没有遇见', '和蛋宝宝一起拍下第一张融合图吧', '还没有明信片', '走过的风景，会变成一张张明信片']) {
  assert.ok(listTemplate.includes(copy), `纪念册必须包含文案「${copy}」`);
}
assert.equal(listTemplate.includes('keepsake-empty__ring'), true, '空态必须使用描边圆环');
assert.equal(listTemplate.includes('bindtap="onOpenMeet"'), true, '遇见网格必须可进入详情');
assert.equal(listTemplate.includes('bindtap="onOpenPostcard"'), true, '明信片网格必须可进入详情');
assert.equal(listStyles.includes('grid-template-columns: repeat(3'), true, '遇见与明信片列表必须为 3 列');
assert.equal(listStyles.includes('background: #FAFAF8'), true, '纪念册背景必须为 #FAFAF8');
assert.equal(listTemplate.includes('遇见') && listTemplate.includes('明信片'), true, '纪念册必须提供遇见与明信片 Tab');

assert.equal(meetDetailTemplate.includes('meet-detail-hero'), true, '遇见详情必须有大图');
assert.equal(postcardDetailTemplate.includes('postcard-detail-hero'), true, '明信片详情必须有大图');

const ready = createKeepsakeAlbumFixture(ALBUM_MODES.READY);
const empty = createKeepsakeAlbumFixture(ALBUM_MODES.EMPTY);
assert.equal(ready.meets.length, 12, '满态遇见必须为 12 格');
assert.equal(ready.postcards.length, 12, '满态明信片必须为 12 格');
assert.equal(empty.meets.length, 0, '空态遇见必须为空');
assert.equal(empty.postcards.length, 0, '空态明信片必须为空');

(async () => {
  const album = await adapter.getAlbum(ALBUM_MODES.READY);
  assert.equal(album.source, 'local-fixture');
  const meet = await adapter.getMeetDetail('meet-red-wall');
  assert.equal(meet.title, '红墙下');
  const postcard = await adapter.getPostcardDetail('postcard-dongdaemun');
  assert.equal(postcard.title, '东大门街景');
  assert.equal(postcard.paragraphs.length, 2);
  console.log('07 纪念册页面结构、文案与 fixture 校验通过。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
