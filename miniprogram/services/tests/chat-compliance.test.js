const assert = require('assert');
const chatCompliance = require('../chat-compliance');

let result = chatCompliance.advanceSuccessfulMessageCount(297, 2, false);
assert.deepEqual(result, { count: 299, shouldRemind: false }, '未达到阈值不得提醒');
result = chatCompliance.advanceSuccessfulMessageCount(result.count, 2, false);
assert.deepEqual(result, { count: 301, shouldRemind: true }, '跨过阈值时必须提醒');
result = chatCompliance.advanceSuccessfulMessageCount(result.count, 2, true);
assert.deepEqual(result, { count: 303, shouldRemind: false }, '同一会话已经提醒后不得重复提醒');
assert.deepEqual(chatCompliance.advanceSuccessfulMessageCount(299, 0, false), { count: 299, shouldRemind: false }, '失败或重试占位不得增加计数');

console.log('成功消息健康提醒计数校验通过。');
