const assert = require('assert');
const chestAnim = require('../../utils/chest-anim');

assert.deepEqual(chestAnim.OPEN_FRAME_AT_MS, [0, 60, 140, 360]);
assert.deepEqual(chestAnim.CLOSE_FRAME_AT_MS, [0, 80, 160, 300]);
assert.equal(chestAnim.CHEST_FRAME_SRCS.length, 4);

assert.equal(chestAnim.openFrameAtElapsed(-1), 0);
assert.equal(chestAnim.openFrameAtElapsed(0), 0);
assert.equal(chestAnim.openFrameAtElapsed(59), 0);
assert.equal(chestAnim.openFrameAtElapsed(60), 1);
assert.equal(chestAnim.openFrameAtElapsed(139), 1);
assert.equal(chestAnim.openFrameAtElapsed(140), 2);
assert.equal(chestAnim.openFrameAtElapsed(359), 2);
assert.equal(chestAnim.openFrameAtElapsed(360), 3);

assert.equal(chestAnim.closeFrameAtElapsed(0), 3);
assert.equal(chestAnim.closeFrameAtElapsed(79), 3);
assert.equal(chestAnim.closeFrameAtElapsed(80), 2);
assert.equal(chestAnim.closeFrameAtElapsed(159), 2);
assert.equal(chestAnim.closeFrameAtElapsed(160), 1);
assert.equal(chestAnim.closeFrameAtElapsed(299), 1);
assert.equal(chestAnim.closeFrameAtElapsed(300), 0);

const { cancel } = chestAnim.runChestFrameSequence({
  direction: 'open',
  onFrame: () => {},
  onComplete: () => {}
});
assert.equal(typeof cancel, 'function');
cancel();

const fs = require('fs');
const path = require('path');
const lifeSceneLogic = fs.readFileSync(path.join(__dirname, '../../pages/life-scene/life-scene.js'), 'utf8');
const lifeSceneTemplate = fs.readFileSync(path.join(__dirname, '../../pages/life-scene/life-scene.wxml'), 'utf8');
assert.match(lifeSceneTemplate, /toolbox-chest-icon/);
assert.match(lifeSceneLogic, /chestAnimating/);
assert.match(lifeSceneLogic, /onChestAnimatingChange/);

console.log('chest-anim 时序与四帧路径校验通过。');
