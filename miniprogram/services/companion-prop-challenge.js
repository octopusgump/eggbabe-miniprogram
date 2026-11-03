const TUTORIAL_STORAGE_KEY = 'eggbabe_draw_prop_tutorial_seen_v1';
const LOOK_DURATION_MS = 5000;
/** Must match exportPropPeekFlipAnim duration in companion-prop-doodle.js (580ms). */
const PEEK_FLIP_MS = 580;
const MANUAL_LOOKS = 3;
const TUTORIAL_STEPS = Object.freeze([
  Object.freeze({
    title: '一起画',
    body: '先看一眼简笔，几秒后会收起来。拿起画笔临摹，忘了就点「再看一眼」，画完点「画好了」。',
    showStepDots: false,
    showSkip: false,
    primaryLabel: '开始画'
  })
]);

function hasSeenTutorial() {
  try {
    return Boolean(wx.getStorageSync(TUTORIAL_STORAGE_KEY));
  } catch (error) {
    return false;
  }
}

function markTutorialSeen() {
  try {
    wx.setStorageSync(TUTORIAL_STORAGE_KEY, true);
  } catch (error) {}
}

function createSession() {
  return {
    lookRemaining: MANUAL_LOOKS,
    peekVisible: false,
    peekPhase: 'hidden',
    drawingLocked: true,
    unlockVisible: false
  };
}

function lookHintText(lookRemaining) {
  const safe = Math.max(0, Math.min(MANUAL_LOOKS, Number(lookRemaining) || 0));
  return `再看一眼 · ${safe}/${MANUAL_LOOKS} 次`;
}

module.exports = {
  TUTORIAL_STORAGE_KEY,
  LOOK_DURATION_MS,
  PEEK_FLIP_MS,
  MANUAL_LOOKS,
  TUTORIAL_STEPS,
  hasSeenTutorial,
  markTutorialSeen,
  createSession,
  lookHintText
};
