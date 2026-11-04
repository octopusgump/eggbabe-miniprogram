const LOOK_DURATION_MS = 5000;
/** Must match prop-peek-anim CSS transition duration (companion-prop-doodle.js). */
const PEEK_POP_IN_MS = 280;
const PEEK_POP_OUT_MS = 280;
const MANUAL_LOOKS = 3;

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
  LOOK_DURATION_MS,
  PEEK_POP_IN_MS,
  PEEK_POP_OUT_MS,
  MANUAL_LOOKS,
  createSession,
  lookHintText
};
