const TUTORIAL_STORAGE_KEY = 'eggbabe_draw_prop_tutorial_seen_v1';
const LOOK_DURATION_MS = 5000;
const MANUAL_LOOKS = 3;
const TUTORIAL_STEPS = Object.freeze([
  Object.freeze({
    title: '先看一看简笔',
    body: '线稿会在蛋上停留约 5 秒。先记住形状，再开始画。'
  }),
  Object.freeze({
    title: '用画笔临摹',
    body: '简笔收起后就能画。还有 3 次「再看一眼」机会，每次约 5 秒。'
  }),
  Object.freeze({
    title: '画好了交作业',
    body: '画得够认真就能解锁彩色小道具。点「画好了」试试看。'
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
  MANUAL_LOOKS,
  TUTORIAL_STEPS,
  hasSeenTutorial,
  markTutorialSeen,
  createSession,
  lookHintText
};
