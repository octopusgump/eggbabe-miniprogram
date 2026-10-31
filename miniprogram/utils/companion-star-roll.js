// 房间左上角星星余额：从旧值滚到新值（加、减同一套曲线）。
function easeOutCubic(t) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}

function rollDurationMs(from, to, reducedMotion) {
  if (reducedMotion) return 0;
  const delta = Math.abs(Number(to) - Number(from));
  if (delta <= 0) return 0;
  return Math.min(1600, Math.max(480, delta * 72));
}

function rollFrameValue(from, to, progress) {
  const start = Number(from);
  const end = Number(to);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return end;
  if (start === end) return end;
  const eased = easeOutCubic(progress);
  return Math.round(start + (end - start) * eased);
}

module.exports = {
  easeOutCubic,
  rollDurationMs,
  rollFrameValue
};
