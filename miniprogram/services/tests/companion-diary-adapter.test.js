const assert = require('assert');
const fs = require('fs');
const path = require('path');
const adapter = require('../companion-diary-adapter');

const pet = { id: 'demo-pet', name: 'dbb', prototype: 'YT' };

adapter.getDiaryDetail({ pet, entry: 'room' }).then(result => {
  assert.equal(result.ok, true);
  assert.equal(typeof result.data.id, 'string');
  assert.equal(result.data.salutation, '亲爱的主人，');
  assert.match(result.data.imageUrl, /home_bedroom_window_day_v01\.webp$/);
  assert.match(result.data.signOff, /dbb/);
  assert.equal(adapter.DETAIL_FIELD_KEYS.includes('body'), true);

  return adapter.getDiaryDetail({ pet: {} });
}).then(empty => {
  assert.equal(empty.ok, false);
  assert.equal(empty.error.code, 'NO_PET');

  const root = path.resolve(__dirname, '../..');
  const lifeScene = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.js'), 'utf8');
  assert.match(lifeScene, /\/pages\/companion-diary\/companion-diary\?entry=room/);
  assert.equal(/\/pages\/collection-card\/collection-card/.test(lifeScene), false, '百宝箱日记不得进入收藏卡');

  const appJson = fs.readFileSync(path.join(root, 'app.json'), 'utf8');
  assert.match(appJson, /pages\/companion-diary\/companion-diary/);

  const diaryWxml = fs.readFileSync(path.join(root, 'pages/companion-diary/companion-diary.wxml'), 'utf8');
  assert.match(diaryWxml, /diary-share-dock/);
  assert.match(diaryWxml, /分享这篇日记/);
  assert.match(diaryWxml, /\/assets\/icons\/send-ink\.svg/);
  assert.equal(/diary-share-pill/.test(diaryWxml), false, '顶栏不得放置与胶囊冲突的分享按钮');

  const diaryWxss = fs.readFileSync(path.join(root, 'pages/companion-diary/companion-diary.wxss'), 'utf8');
  assert.match(diaryWxss, /\.diary-share-actions__primary[\s\S]*width:\s*100%/);
  assert.match(diaryWxss, /\.diary-share-actions__secondary[\s\S]*width:\s*100%/);
  assert.match(
    diaryWxss,
    /\.diary-share-actions__secondary[\s\S]*border:\s*3rpx solid #002900/,
    '分享底栏次按钮须与 Figma / app-button 一致使用 3rpx #002900 描边'
  );
  assert.match(
    diaryWxss,
    /\.diary-share-actions \.button-label[\s\S]*font-size:\s*30rpx[\s\S]*font-weight:\s*600/,
    '分享底栏按钮文案须为 30rpx / 600'
  );

  console.log('companion-diary adapter 与房间路由校验通过。');
});
