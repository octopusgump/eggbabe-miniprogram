// 仅供 develop/demo 验收。trial/release 的回复和模型兜底只能来自服务端。
const DEMO_REPLIES = Object.freeze({
  开心: '你来啦，我正好想说句话。',
  平静: '慢慢说，我在听。',
  想念: '今天又见到你啦。',
  兴奋: '我听见啦，我们慢慢说。',
  低落: '今天可以慢一点，我们先一起歇一会儿。',
  default: '我在听。慢慢说就好。'
});

function replyFor(mood) {
  return DEMO_REPLIES[mood] || DEMO_REPLIES.default;
}

module.exports = { DEMO_REPLIES, replyFor };
