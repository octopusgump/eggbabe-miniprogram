const GRID_SIZE = 10;
const MIN_STROKES = 5;
const MIN_ACTIVE_MS = 15000;
const MIN_CELLS = 5;
const IDLE_GAP_MS = 1200;
const EGG_RX = 0.4;
const EGG_RY = 0.46;

const INCOMPLETE_HINT = '再画一会儿，让我看得清楚一点。';

function cellIndex(normalizedPoint) {
  if (!normalizedPoint) return -1;
  const x = Number(normalizedPoint.x);
  const y = Number(normalizedPoint.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return -1;
  const dx = (x - 0.5) / EGG_RX;
  const dy = (y - 0.5) / EGG_RY;
  if ((dx * dx) + (dy * dy) > 1) return -1;
  const col = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor(x * GRID_SIZE)));
  const row = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor(y * GRID_SIZE)));
  return row * GRID_SIZE + col;
}

function createTracker() {
  return {
    strokeSerial: 0,
    activeStrokeIds: new Set(),
    activeMs: 0,
    cells: new Set(),
    lastActiveAt: null,
    trackingStroke: false
  };
}

function beginStroke(tracker, tool) {
  if (!tracker || tool === 'sticker') return null;
  tracker.strokeSerial += 1;
  const strokeId = tracker.strokeSerial;
  if (tool === 'brush') {
    tracker.activeStrokeIds.add(strokeId);
    tracker.trackingStroke = true;
  } else {
    tracker.trackingStroke = tool === 'eraser';
  }
  return strokeId;
}

function trackPoint(tracker, tool, point) {
  if (!tracker || !tracker.trackingStroke || !point) return;
  if (tool === 'brush') {
    const index = cellIndex(point);
    if (index >= 0) tracker.cells.add(index);
  }
}

function trackActiveElapsed(tracker, timestamp) {
  if (!tracker || !Number.isFinite(timestamp)) return;
  if (tracker.lastActiveAt != null) {
    const gap = timestamp - tracker.lastActiveAt;
    if (gap > 0 && gap <= IDLE_GAP_MS) tracker.activeMs += gap;
  }
  tracker.lastActiveAt = timestamp;
}

function endStroke(tracker, strokeId, tool, cancelled) {
  if (!tracker) return;
  tracker.trackingStroke = false;
  if (tool === 'brush' && cancelled && strokeId) tracker.activeStrokeIds.delete(strokeId);
}

function undoStroke(tracker, operation) {
  if (!tracker || !operation || operation.type !== 'stroke' || operation.tool !== 'brush') return;
  if (operation.gateStrokeId) tracker.activeStrokeIds.delete(operation.gateStrokeId);
}

function snapshot(tracker) {
  return {
    strokes: tracker ? tracker.activeStrokeIds.size : 0,
    activeMs: tracker ? tracker.activeMs : 0,
    cells: tracker ? tracker.cells.size : 0
  };
}

function rebuildFromOperations(operations) {
  const tracker = createTracker();
  (operations || []).forEach(operation => {
    if (!operation || operation.type !== 'stroke' || operation.tool !== 'brush') return;
    const strokeId = beginStroke(tracker, 'brush');
    (operation.points || []).forEach(point => trackPoint(tracker, 'brush', point));
    tracker.activeMs += Math.max(0, ((operation.points || []).length - 1) * 3200);
    endStroke(tracker, strokeId, 'brush', false);
    operation.gateStrokeId = strokeId;
  });
  return tracker;
}

function evaluate(tracker) {
  const metrics = snapshot(tracker);
  const ok = metrics.strokes >= MIN_STROKES
    && metrics.activeMs >= MIN_ACTIVE_MS
    && metrics.cells >= MIN_CELLS;
  return Object.assign({ ok, hint: ok ? '' : INCOMPLETE_HINT }, metrics);
}

module.exports = {
  GRID_SIZE,
  MIN_STROKES,
  MIN_ACTIVE_MS,
  MIN_CELLS,
  INCOMPLETE_HINT,
  cellIndex,
  createTracker,
  beginStroke,
  trackPoint,
  trackActiveElapsed,
  endStroke,
  undoStroke,
  snapshot,
  evaluate,
  rebuildFromOperations
};
