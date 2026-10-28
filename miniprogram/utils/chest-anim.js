/** 百宝箱开合四帧动画时序（与 assets/ui/chest-anim/README.md 一致） */
const CHEST_FRAME_SRCS = Object.freeze([
  '/assets/ui/chest-anim/96/chest-0-closed.png',
  '/assets/ui/chest-anim/96/chest-1-ajar.png',
  '/assets/ui/chest-anim/96/chest-2-half.png',
  '/assets/ui/chest-anim/96/chest-3-open.png'
]);

/** 打开：在 elapsed ms 时切到对应帧索引 */
const OPEN_FRAME_AT_MS = Object.freeze([0, 60, 140, 360]);
const OPEN_FRAME_INDICES = Object.freeze([0, 1, 2, 3]);

/** 关闭：倒放 3→2→1→0 */
const CLOSE_FRAME_AT_MS = Object.freeze([0, 80, 160, 300]);
const CLOSE_FRAME_INDICES = Object.freeze([3, 2, 1, 0]);

const OPEN_DURATION_MS = 360;
const CLOSE_DURATION_MS = 300;

function frameIndexAtElapsed(atMs, indices, elapsedMs) {
  let frame = indices[0];
  for (let i = 0; i < atMs.length; i += 1) {
    if (elapsedMs >= atMs[i]) frame = indices[i];
  }
  return frame;
}

function openFrameAtElapsed(elapsedMs) {
  return frameIndexAtElapsed(OPEN_FRAME_AT_MS, OPEN_FRAME_INDICES, elapsedMs);
}

function closeFrameAtElapsed(elapsedMs) {
  return frameIndexAtElapsed(CLOSE_FRAME_AT_MS, CLOSE_FRAME_INDICES, elapsedMs);
}

/**
 * 按 README 间隔链式切帧；返回 cancel 清理计时器。
 * @param {{ direction: 'open'|'close', reducedMotion?: boolean, onFrame: (index: number) => void, onComplete?: () => void, onStart?: () => void }} options
 */
function runChestFrameSequence(options) {
  const {
    direction,
    reducedMotion = false,
    onFrame,
    onComplete,
    onStart
  } = options;
  const timers = [];
  const cancel = () => {
    timers.forEach(id => clearTimeout(id));
    timers.length = 0;
  };

  const atMs = direction === 'open' ? OPEN_FRAME_AT_MS : CLOSE_FRAME_AT_MS;
  const indices = direction === 'open' ? OPEN_FRAME_INDICES : CLOSE_FRAME_INDICES;
  const terminalFrame = direction === 'open' ? 3 : 0;

  if (typeof onStart === 'function') onStart();

  if (reducedMotion) {
    onFrame(terminalFrame);
    if (typeof onComplete === 'function') onComplete();
    return { cancel };
  }

  atMs.forEach((delay, i) => {
    const id = setTimeout(() => {
      onFrame(indices[i]);
      if (i === atMs.length - 1 && typeof onComplete === 'function') onComplete();
    }, delay);
    timers.push(id);
  });

  return { cancel };
}

module.exports = {
  CHEST_FRAME_SRCS,
  OPEN_FRAME_AT_MS,
  OPEN_FRAME_INDICES,
  CLOSE_FRAME_AT_MS,
  CLOSE_FRAME_INDICES,
  OPEN_DURATION_MS,
  CLOSE_DURATION_MS,
  openFrameAtElapsed,
  closeFrameAtElapsed,
  runChestFrameSequence
};
