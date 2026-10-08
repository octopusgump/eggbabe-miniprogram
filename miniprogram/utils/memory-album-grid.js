const POLAROID_SOURCES = new Set(['paper', 'exchange', 'tea']);

function inferDisplayType(item) {
  if (item && item.displayType) return item.displayType;
  if (item && item.locked && (item.displayType === 'postcard' || item.source === 'postcard')) return 'postcard';
  if (item && item.source === 'keepsake') return 'keepsake';
  if (item && item.source === 'drawing') return 'drawing';
  if (item && (item.source === 'postcard' || item.displayType === 'postcard')) return 'postcard';
  if (item && (POLAROID_SOURCES.has(item.source) || ['outing', 'solar', 'exchange'].includes(item.kind))) {
    return 'polaroid';
  }
  if (item && item.image && /companion-photos|solar_term/.test(item.image)) return 'polaroid';
  if (item && item.image && /keepsakes/.test(item.image)) return 'keepsake';
  if (item && item.image && /draw/.test(item.image)) return 'drawing';
  if (item && item.image && /postcard/.test(item.image)) return 'postcard';
  return 'polaroid';
}

function buildMetaPill(item, cellKind) {
  if (item && item.metaPill) return item.metaPill;
  if (cellKind === 'keepsake' && item.sourceScene) {
    return `来自 · ${item.sourceScene.replace(/\s*·\s*/g, ' · ')}`;
  }
  if (cellKind === 'postcard' || cellKind === 'postcard_locked') {
    const place = item.place || item.title || '';
    return item.date && place ? `${item.date} · ${place}` : (item.date || place || '');
  }
  return item.date || '';
}

function enrichGridItem(item, index) {
  const base = Object.assign({}, item);
  const locked = Boolean(base.locked);
  let cellKind = inferDisplayType(base);
  if (locked && cellKind === 'postcard') cellKind = 'postcard_locked';
  base.cellKind = cellKind;
  base.locked = cellKind === 'postcard_locked';
  base.metaPill = buildMetaPill(base, cellKind);
  base.listKey = base.listKey || base.id || `${base.date || 'memory'}-${index}`;
  return base;
}

function buildGridItems(pendingPhotos, memories) {
  const pending = (pendingPhotos || []).map((item, index) =>
    enrichGridItem(Object.assign({ pending: true, source: item.source || 'paper' }, item), `p-${index}`)
  );
  const rows = (memories || []).map((item, index) => enrichGridItem(item, index));
  return pending.concat(rows);
}

module.exports = {
  buildGridItems,
  enrichGridItem,
  inferDisplayType
};
