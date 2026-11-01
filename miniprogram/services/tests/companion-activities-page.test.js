const assert = require('assert');
const pageModel = require('../companion-activities-page');
const stars = require('../iaa-star-unlock-adapter');
const listenAdapter = require('../listen-adapter');

stars.resetRoomStarView('AVAILABLE');

(async () => {
  const view = await pageModel.buildViewAsync();
  assert.equal(view.playable.length, 5);
  assert.equal(view.comingSoon.length, 1);
  assert.equal(view.comingSoon[0].title, '交友');
  assert.equal(view.comingSoon[0].phaseTag, '下期');
  assert.ok(view.comingSoon[0].modalLines[0].includes('交友玩法还在准备中'));
  assert.equal(view.playable.find(row => row.key === 'listen').route, '/pages/listen/listen');
  const listen = view.playable.find(row => row.key === 'listen');
  assert.equal(listen.earn, true, '听你说须展示赚星而非花星');
  assert.equal(listen.ctaPrefix, '赚');
  assert.equal(listen.ctaSuffix, '10');
  assert.equal(view.playable.find(row => row.key === 'drawing').route, '/pages/doodle/doodle?entry=companion&mode=prop&source=activity');
  assert.equal(view.playable.find(row => row.key === 'drawing').disabled, false, '一起画每日可重复进入');
  assert.ok(view.starBalanceIcon.includes('/assets/ui/activity-list/runtime/'));
  console.log('活动页列表与路由口径校验通过。');
})();
