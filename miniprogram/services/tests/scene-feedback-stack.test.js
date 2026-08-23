const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  DIALOGUE_DURATION,
  SYSTEM_DURATION,
  WARNING_DURATION,
  FADE_DURATION,
  QUEUE_GAP,
  SYSTEM_TTL,
  MAX_PENDING,
  createSceneFeedbackController
} = require('../../utils/scene-feedback-controller');

const componentRoot = path.resolve(__dirname, '../../components/scene-feedback-stack');
const template = fs.readFileSync(path.join(componentRoot, 'scene-feedback-stack.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(componentRoot, 'scene-feedback-stack.wxss'), 'utf8');
const homeLogic = fs.readFileSync(path.resolve(__dirname, '../../pages/home/home.js'), 'utf8');
const homeTemplate = fs.readFileSync(path.resolve(__dirname, '../../pages/home/home.wxml'), 'utf8');
const lifeLogic = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.js'), 'utf8');
const lifeTemplate = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.wxml'), 'utf8');

assert.equal(DIALOGUE_DURATION, 2200, '角色对白必须完整展示 2200ms');
assert.equal(SYSTEM_DURATION, 1800, '普通系统提示必须展示 1800ms');
assert.equal(WARNING_DURATION, 2400, '注意态系统提示必须留出更长阅读时间');
assert.equal(FADE_DURATION, 180, '前景卡片淡出必须使用 180ms');
assert.equal(QUEUE_GAP, 150, '两条反馈之间必须保留 150ms 呼吸间隔');
assert.equal(SYSTEM_TTL, 4000, '已经由 UI 表达的系统结果不得等待超过 4 秒');
assert.equal(MAX_PENDING, 2, '待播队列最多保留两条');
assert.equal(template.includes('scene-feedback-stack__back') && template.includes('scene-feedback-stack__front--{{variant}}'), true, '组件必须同时提供后置黑卡与前景语义卡');
assert.match(styles, /\.scene-feedback-stack\{[^}]*position:fixed;[^}]*top:34vh;[^}]*pointer-events:none/, '破壳前后反馈必须固定在同一视口的中间偏上位置');
assert.match(styles, /\.scene-feedback-stack__front--dialogue\{[^}]*background:rgba\(255,253,247,\.94\);[^}]*color:#3D4930/, '角色对白必须使用白底深色字');
assert.match(styles, /\.scene-feedback-stack__front--system\{[^}]*background:rgba\(18,21,18,\.72\);[^}]*color:#FFF/, '系统提示必须使用半透明黑底白字');
assert.match(styles, /\.scene-feedback-stack__back\{[^}]*top:-10rpx;[^}]*transform:scale\(\.96\)/, '待播系统提示必须作为缩小的后置卡片露出');
assert.equal(homeTemplate.includes('<scene-feedback-stack') && lifeTemplate.includes('<scene-feedback-stack'), true, '破壳前首页和破壳后生活空间必须复用同一个双层反馈组件');
assert.equal(homeLogic.includes("this.showSystemNotice('名字已更新', 'info', 'pet-name-updated')"), true, '改名结果必须进入黑底系统提示队列');
assert.equal(homeLogic.includes("this.showSystemNotice(lampOn ? '台灯已打开' : '台灯已关闭', 'info', 'lamp-state')"), true, '灯光变化必须进入黑底系统提示队列');
assert.equal(homeLogic.includes("this.showFeedback('我暖起来了。')") && lifeLogic.includes("this.showFeedback('我暖起来了。')"), true, '破壳前后角色语言必须进入白底对白队列');
assert.equal(lifeLogic.includes('const shouldShowStatusBubble = currentState.atHome'), true, '角色外出时不得加入角色对白');

const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const timers = [];
let now = 1000;

global.setTimeout = (callback, delay) => {
  const timer = { callback, delay, cleared: false, ran: false };
  timers.push(timer);
  return timer;
};
global.clearTimeout = timer => {
  if (timer) timer.cleared = true;
};

function runTimer(delay) {
  const timer = timers.find(item => !item.cleared && !item.ran && item.delay === delay);
  assert.ok(timer, `缺少 ${delay}ms 定时器`);
  timer.ran = true;
  timer.callback();
}

try {
  const host = {
    data: {},
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    }
  };
  const controller = createSceneFeedbackController(host, { now: () => now });

  controller.showSystem('名字已更新', 'info', 'name');
  controller.showDialogue('我暖起来了。', 'warm');
  runTimer(0);
  assert.equal(host.data.sceneFeedbackVariant, 'dialogue', '同一轮产生对白和系统提示时必须先展示对白');
  assert.equal(host.data.sceneFeedbackText, '我暖起来了。', '前景必须显示角色对白');
  assert.equal(host.data.sceneFeedbackSystemBehind, true, '等待中的系统提示必须显示黑色后置卡');

  runTimer(DIALOGUE_DURATION);
  assert.equal(host.data.sceneFeedbackVisible, false, '对白到时后必须先淡出');
  assert.equal(host.data.sceneFeedbackPromoting, true, '对白淡出时黑色后置卡必须开始补位');
  runTimer(FADE_DURATION);
  runTimer(QUEUE_GAP);
  assert.equal(host.data.sceneFeedbackVariant, 'system', '对白结束后必须播放系统提示');
  assert.equal(host.data.sceneFeedbackText, '名字已更新', '补位后的黑卡必须显示待播系统文字');
  assert.equal(host.data.sceneFeedbackVisible, true, '系统提示补位后必须可见');

  controller.clear();
  controller.showDialogue('第一句对白', 'dialogue-1');
  runTimer(0);
  controller.showSystem('系统结果一', 'info', 'system-1');
  controller.showSystem('系统结果二', 'info', 'system-2');
  controller.showSystem('系统结果三', 'info', 'system-3');
  controller.showDialogue('更新后的对白', 'dialogue-2');
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.pending.length, MAX_PENDING, '待播队列不得超过上限');
  assert.equal(snapshot.pending.filter(item => item.variant === 'dialogue').length, 1, '待播角色对白最多保留一条');
  assert.equal(snapshot.pending[0].text, '更新后的对白', '新角色对白必须排在普通系统提示之前');

  controller.clear();
  controller.showDialogue('不会被过期提示打断', 'dialogue-3');
  runTimer(0);
  controller.showSystem('已经过时的结果', 'info', 'stale-system');
  now += SYSTEM_TTL + 1;
  runTimer(DIALOGUE_DURATION);
  assert.equal(host.data.sceneFeedbackPromoting, false, '等待超过四秒的系统结果不得再补位播放');
  controller.clear();
} finally {
  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
}

console.log('双层反馈组件、对白优先和有限队列校验通过。');
