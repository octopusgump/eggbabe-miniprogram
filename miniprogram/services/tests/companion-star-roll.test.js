const assert = require('assert');
const { rollDurationMs, rollFrameValue } = require('../../utils/companion-star-roll');

assert.equal(rollFrameValue(11, 21, 0), 11);
assert.equal(rollFrameValue(11, 21, 1), 21);
const mid = rollFrameValue(21, 11, 0.5);
assert.ok(mid > 11 && mid < 21, '递减滚变中间帧落在区间内');
assert.equal(rollDurationMs(11, 21, false), 720);
assert.equal(rollDurationMs(11, 21, true), 0);
assert.equal(rollDurationMs(5, 5, false), 0);

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const roomTemplate = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.wxml'), 'utf8');
const roomLogic = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.js'), 'utf8');
const roomStyles = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.wxss'), 'utf8');

assert.match(roomTemplate, /<companion-roll-number[^>]+value="\{\{companionStarRollValue\}\}"/, '房间左上角用滚变组件展示余额');
assert.match(roomTemplate, /companionStarGainLabel/, '滚变时须展示实际增量 +N');
assert.match(roomLogic, /maybePlayRoomStarRoll/, '须在房间桌面就绪后再播滚变');
assert.match(roomLogic, /canShowRoomStarRoll/, '滚变前须检查 overlay 与场景就绪');
assert.match(roomStyles, /\.companion-balance__gain[\s\S]*?color:\s*#35483C/, '增量文字与余额数字同色，保证浅底可读');
assert.match(roomStyles, /\.companion-balance__amount[\s\S]*?color:\s*#35483C/, '余额数字色');

console.log('companion-star-roll 校验通过：加减余额滚变、房间模板与触发逻辑。');
