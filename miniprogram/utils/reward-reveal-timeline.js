const MIN_DURATION = 1500;
const MAX_DURATION = 3000;
const DEFAULT_DURATION = 2200;
const MIN_PAUSE = 200;

const TIER_ALIASES = {
  DAILY: 'DAILY',
  SPECIAL: 'SPECIAL',
  RARE: 'RARE',
  MEMORY: 'MEMORY'
};

function clampDuration(value) {
  const duration = Number(value);
  if (!Number.isFinite(duration)) return DEFAULT_DURATION;
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(duration)));
}

function normalizeTier(value) {
  return TIER_ALIASES[String(value || '').toUpperCase()] || 'DAILY';
}

function buildTimeline(duration) {
  const total = clampDuration(duration);
  const discoverAt = Math.round(total * .22);
  const revealAt = Math.max(discoverAt + MIN_PAUSE, Math.round(total * .42));
  const settleAt = Math.max(revealAt + 180, Math.round(total * .72));
  return {
    duration: total,
    pauseDuration: revealAt - discoverAt,
    steps: [
      { phase: 'pause', at: discoverAt },
      { phase: 'reveal', at: revealAt },
      { phase: 'settle', at: settleAt },
      { phase: 'ready', at: total }
    ]
  };
}

function createRewardRevealTimeline(options) {
  const config = options || {};
  const schedule = buildTimeline(config.duration);
  const setTimer = config.setTimer || setTimeout;
  const clearTimer = config.clearTimer || clearTimeout;
  const onPhase = typeof config.onPhase === 'function' ? config.onPhase : () => {};
  let timers = [];
  let running = false;

  function clear() {
    timers.forEach(timer => clearTimer(timer));
    timers = [];
    running = false;
  }

  function start() {
    clear();
    running = true;
    onPhase('discover', { at: 0, duration: schedule.duration });
    timers = schedule.steps.map(step => setTimer(() => {
      if (!running) return;
      onPhase(step.phase, { at: step.at, duration: schedule.duration });
      if (step.phase === 'ready') running = false;
    }, step.at));
    return schedule;
  }

  return {
    start,
    clear,
    getSchedule: () => schedule,
    isRunning: () => running
  };
}

module.exports = {
  MIN_DURATION,
  MAX_DURATION,
  DEFAULT_DURATION,
  MIN_PAUSE,
  clampDuration,
  normalizeTier,
  buildTimeline,
  createRewardRevealTimeline
};
