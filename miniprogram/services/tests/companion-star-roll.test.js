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

assert.match(roomTemplate, /<companion-roll-number[^>]+value="\{\{companionStarRollValue\}\}"/, '房间左上角用滚变组件展示余额');
assert.equal(roomTemplate.includes('companion-balance__gain'), false, '不再单独展示 +N，只滚变主数字');
assert.match(roomLogic, /flushCompanionStarRoomFeedback/, '关信或从子页回房应补播滚变');
assert.match(roomLogic, /companionStarRollValue/, '滚变展示值与 adapter 余额分离');

console.log('companion-star-roll 校验通过：加减余额滚变、房间模板与触发逻辑。');
