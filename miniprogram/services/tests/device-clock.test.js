const assert = require('assert');
const deviceClock = require('../device-clock');

const localTime = new Date(2026, 6, 26, 19, 18, 30, 250);
const clock = deviceClock.snapshot(localTime);

assert.equal(clock.timeText, '19:18', '数字时钟必须使用设备本地时间');
assert.equal(clock.dateText, '7月26日 周日', '数字时钟必须显示设备本地日期');
assert.equal(Math.abs(clock.hourAngle - 219.25208333333333) < 0.000001, true, '时针必须包含分秒带来的连续偏移');
assert.equal(Math.abs(clock.minuteAngle - 111.025) < 0.000001, true, '分针必须包含秒数带来的连续偏移');
assert.equal(Math.abs(clock.secondAngle - 181.5) < 0.000001, true, '秒针必须包含毫秒带来的平滑偏移');
assert.equal(deviceClock.millisecondsUntilNextSecond(localTime.getTime()), 750, '首次刷新必须对齐下一整秒');
assert.equal(deviceClock.millisecondsUntilNextSecond(2000), 1000, '整秒时必须等待完整一秒');

console.log('设备时钟本地时间、指针角度与整秒校准通过。');
