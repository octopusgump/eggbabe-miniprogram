const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  MIN_DURATION,
  MAX_DURATION,
  DEFAULT_DURATION,
  MIN_PAUSE,
  clampDuration,
  normalizeTier,
  buildTimeline,
  createRewardRevealTimeline
} = require('../../utils/reward-reveal-timeline');

const componentRoot = path.resolve(__dirname, '../../components/reward-reveal');
const demoRoot = path.resolve(__dirname, '../../pages/reward-reveal-demo');
const template = fs.readFileSync(path.join(componentRoot, 'reward-reveal.wxml'), 'utf8');
const logic = fs.readFileSync(path.join(componentRoot, 'reward-reveal.js'), 'utf8');
const styles = fs.readFileSync(path.join(componentRoot, 'reward-reveal.wxss'), 'utf8');
const demoLogic = fs.readFileSync(path.join(demoRoot, 'reward-reveal-demo.js'), 'utf8');
const demoTemplate = fs.readFileSync(path.join(demoRoot, 'reward-reveal-demo.wxml'), 'utf8');
const app = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../app.json'), 'utf8'));

assert.equal(MIN_DURATION, 1500, 'Reveal 下限必须为 1.5 秒');
assert.equal(MAX_DURATION, 3000, 'Reveal 上限必须为 3 秒');
assert.equal(DEFAULT_DURATION, 2200, 'Reveal 默认节奏必须为 2.2 秒');
assert.equal(clampDuration(900), MIN_DURATION, '过短节奏必须收敛到 1.5 秒');
assert.equal(clampDuration(4200), MAX_DURATION, '过长节奏必须收敛到 3 秒');
assert.equal(clampDuration('invalid'), DEFAULT_DURATION, '无效节奏必须回到默认值');

for (const duration of [1500, 2200, 3000]) {
  const timeline = buildTimeline(duration);
  assert.equal(timeline.duration, duration, `${duration}ms 应保持在允许范围内`);
  assert.ok(timeline.pauseDuration >= MIN_PAUSE, `${duration}ms 节奏必须保留至少 0.2 秒停顿`);
  assert.deepEqual(timeline.steps.map(step => step.phase), ['pause', 'reveal', 'settle', 'ready'], '必须按发现、停顿、揭晓、收下的顺序推进');
  assert.equal(timeline.steps.at(-1).at, duration, 'ready 必须在配置总时长到达');
}

for (const tier of ['DAILY', 'SPECIAL', 'RARE', 'MEMORY']) {
  assert.equal(normalizeTier(tier.toLowerCase()), tier, `${tier} 必须可被组件识别`);
  assert.ok(demoLogic.includes(`${tier}: {`), `演示页必须提供 ${tier} fixture`);
}

const scheduled = [];
const phases = [];
const timeline = createRewardRevealTimeline({
  duration: 2200,
  setTimer(callback, delay) {
    const timer = { callback, delay, cleared: false };
    scheduled.push(timer);
    return timer;
  },
  clearTimer(timer) { timer.cleared = true; },
  onPhase(phase) { phases.push(phase); }
});
timeline.start();
assert.deepEqual(phases, ['discover'], '启动时必须先进入发现阶段');
scheduled.sort((a, b) => a.delay - b.delay).forEach(timer => timer.callback());
assert.deepEqual(phases, ['discover', 'pause', 'reveal', 'settle', 'ready'], '时间线必须完整走完且顺序稳定');
assert.equal(timeline.isRunning(), false, 'ready 后时间线必须结束');

assert.ok(template.includes("normalizedTier !== 'MEMORY'"), 'Daily / Special / Rare 必须走卡片式揭晓');
assert.ok(template.includes('reward-reveal__memory-scene'), 'Memory 必须走完整场景结尾');
assert.ok(template.includes('<view wx:else class="reward-reveal__scene-fallback">'), 'Memory 有场景图时不得被兜底背景覆盖');
assert.ok(template.includes('画面信息完整，不依赖声音或震动'), '静音和无震动时必须明确保持完整视觉语义');
assert.ok(logic.includes("source: 'local-fixture'"), '组件输出必须明确标记本地 fixture 来源');
assert.equal(/vibrate|createInnerAudioContext|play\(/.test(logic), false, '静态验收组件不得隐式调用震动或播放声音');
assert.match(styles, /reward-reveal--ready \.reward-reveal__collect-wrap\{[^}]*pointer-events:auto/, '只有 ready 阶段可以收下');
assert.ok(demoTemplate.includes('收下后会直接回到这张原场景'), '演示页必须说明收下后回到原场景');
assert.ok(app.pages.includes('pages/reward-reveal-demo/reward-reveal-demo'), '开发验收页必须注册，便于微信开发者工具直接打开');
assert.equal(fs.readFileSync(path.resolve(__dirname, '../../pages/home/home.wxml'), 'utf8').includes('reward-reveal-demo'), false, '正式首页不得出现开发验收入口');

console.log('Reward Reveal 四档、1.5–3 秒节奏、停顿和静默体验校验通过。');
