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

  console.log('companion-diary adapter 与房间路由校验通过。');
});
