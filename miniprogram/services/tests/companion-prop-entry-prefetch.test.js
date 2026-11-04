const assert = require('assert');
const prefetch = require('../companion-prop-entry-prefetch');
const propAssets = require('../companion-prop-assets');

const calls = { images: [], pages: [] };

global.wx = {
  getImageInfo(options) {
    calls.images.push(options.src);
    if (options && typeof options.success === 'function') options.success({ width: 10, height: 10 });
  },
  preloadPage(options) {
    calls.pages.push(options.url);
    if (options && typeof options.success === 'function') options.success({});
  }
};

const companionAdapter = require('../iaa-star-unlock-adapter');
companionAdapter.configureRoom('prefetch-test-room');

(async () => {
  prefetch.resetWarmPropDoodleEntryForTests();
  calls.images.length = 0;
  calls.pages.length = 0;
  const resolved = prefetch.resolveDailyPropEntry();
  assert.ok(resolved.entry && resolved.sketch, '须能解析当日道具');
  assert.equal(resolved.sketch, propAssets.resolveLinePath(resolved.entry));

  await prefetch.warmPropDoodleEntry({
    pageUrl: '/pages/doodle/doodle?entry=companion&mode=prop&source=activity'
  });
  assert.equal(calls.images.includes(resolved.sketch), true, '须预载简笔');
  assert.equal(calls.pages.length, 1, '须尝试 preloadPage');

  calls.images.length = 0;
  await prefetch.warmPropDoodleEntry({
    pageUrl: '/pages/doodle/doodle?entry=companion&mode=prop&source=activity'
  });
  assert.equal(calls.images.length, 0, '同键预热须去重');

  console.log('道具临摹进页预载单测通过。');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
