const assert = require('assert');
const { buildGridItems, enrichGridItem } = require('../../utils/memory-album-grid');

const polaroid = enrichGridItem({ id: 'p1', source: 'paper', image: '/x/companion-photos/a.webp', date: '9 月 1 日' }, 0);
assert.equal(polaroid.cellKind, 'polaroid');
assert.equal(polaroid.metaPill, '9 月 1 日');

const locked = enrichGridItem(
  { id: 'l1', displayType: 'postcard', locked: true, image: '/x/postcard/a.webp', date: '9 月 2 日', place: '东京' },
  1
);
assert.equal(locked.cellKind, 'postcard_locked');
assert.equal(locked.locked, true);

const keepsake = enrichGridItem(
  { id: 'k1', displayType: 'keepsake', sourceScene: '在家 · 小憩', image: '/x/keepsakes/a.webp' },
  2
);
assert.equal(keepsake.cellKind, 'keepsake');
assert.equal(keepsake.metaPill, '来自 · 在家 · 小憩');

const grid = buildGridItems([{ id: 'pending', source: 'paper', image: '/x/companion-photos/b.webp', date: '9 月 3 日' }], [polaroid]);
assert.equal(grid.length, 2);
assert.equal(grid[0].pending, true);
assert.equal(grid[0].cellKind, 'polaroid');

console.log('回忆方格类型映射与列表合并校验通过。');
