const assert = require('assert');
const entry = require('../companion-prop-doodle-entry');

assert.equal(entry.LEGACY_COMPANION_FREE_DOODLE_ENTRY_ENABLED, false, '旧自由涂鸦入口须默认关闭');

assert.equal(
  entry.buildPropDoodleUrl({ source: 'activity' }),
  '/pages/doodle/doodle?entry=companion&mode=prop&source=activity'
);
assert.equal(
  entry.buildPropDoodleUrl({ source: 'letter' }),
  '/pages/doodle/doodle?entry=companion&mode=prop&source=letter'
);
assert.match(entry.buildPropDoodleUrl({ source: 'room', propId: 'wood-rattle' }), /propId=wood-rattle/);

const legacy = entry.normalizeCompanionEntryQuery({ entry: 'companion', source: 'letter' });
assert.equal(legacy.upgradedFromLegacyFreeDoodle, true);
assert.equal(legacy.query.mode, 'prop');
assert.equal(legacy.legacyFreeDoodleBlocked, true);

const prop = entry.normalizeCompanionEntryQuery({ entry: 'companion', mode: 'prop', source: 'activity' });
assert.equal(prop.upgradedFromLegacyFreeDoodle, false);
assert.equal(prop.query.mode, 'prop');

const shell = entry.normalizeCompanionEntryQuery({ entry: 'shell' });
assert.equal(shell.query.entry, 'shell');
assert.equal(shell.upgradedFromLegacyFreeDoodle, false);

let navigatedUrl = '';
let warmedUrl = '';
entry.openPropDoodleNavigation({
  wx: {
    navigateTo(options) {
      navigatedUrl = options.url;
      if (options.success) options.success();
    }
  },
  url: entry.buildPropDoodleUrl({ source: 'letter' }),
  source: 'letter',
  stars: { beginCompanionPropDrawing: () => Promise.resolve({ ok: true, cost: 0 }) },
  prefetch: { warmPropDoodleEntry: ({ pageUrl }) => { warmedUrl = pageUrl; } },
  navigateOptions: { events: { companionDrawingCompleted: () => {} } }
}).then(result => {
  assert.equal(result.ok, true);
  assert.equal(warmedUrl, entry.buildPropDoodleUrl({ source: 'letter' }));
  assert.equal(navigatedUrl, entry.buildPropDoodleUrl({ source: 'letter' }));
  console.log('一起画统一入口：URL、旧链升级与导航封装通过。');
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
