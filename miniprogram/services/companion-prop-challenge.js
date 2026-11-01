const TUTORIAL_STORAGE_KEY = 'eggbabe_draw_prop_tutorial_seen_v1';
const LOOK_DURATION_MS = 5000;
const MANUAL_LOOKS = 3;
const TUTORIAL_STEPS = Object.freeze([
  Object.freeze({
    title: '第一步 · 看一看',
    body: '先看一眼简笔，记住它的样子～\n大约几秒后它会隐藏起来'
  }),
  Object.freeze({
    title: '第二步 · 动手画',
    body: '简笔收起来后，拿起画笔开始画吧。忘了长什么样，就点「再看一眼」。'
  }),
  Object.freeze({
    title: '第三步 · 画好了',
    body: '画好了就点下方按钮。认真画够时间，就能解锁这张彩色小道具。'
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
