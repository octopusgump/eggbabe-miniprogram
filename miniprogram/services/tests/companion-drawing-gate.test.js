const assert = require('assert');
const gate = require('../companion-drawing-gate');

const tracker = gate.createTracker();
let now = 0;
for (let index = 0; index < 5; index += 1) {
  const strokeId = gate.beginStroke(tracker, 'brush');
  for (let step = 0; step < 4; step += 1) {
    gate.trackActiveElapsed(tracker, now);
    gate.trackPoint(tracker, 'brush', {
      x: 0.35 + index * 0.05 + step * 0.02,
      y: 0.35 + index * 0.04 + step * 0.015
    });
    now += 1000;
  }
  gate.endStroke(tracker, strokeId, 'brush', false);
}

let result = gate.evaluate(tracker);
assert.equal(result.ok, true, '五笔、十五秒、五格应通过');

const weak = gate.createTracker();
const weakId = gate.beginStroke(weak, 'brush');
gate.trackPoint(weak, 'brush', { x: 0.5, y: 0.5 }, 0);
gate.endStroke(weak, weakId, 'brush', false);
result = gate.evaluate(weak);
assert.equal(result.ok, false);
assert.equal(result.hint, gate.INCOMPLETE_HINT);

const rebuilt = gate.rebuildFromOperations([
  { type: 'stroke', tool: 'brush', points: [{ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }] },
  { type: 'stroke', tool: 'eraser', points: [{ x: 0.5, y: 0.5 }] }
]);
assert.equal(rebuilt.activeStrokeIds.size, 1);

console.log('一起画 v2 完成门槛单测通过。');
