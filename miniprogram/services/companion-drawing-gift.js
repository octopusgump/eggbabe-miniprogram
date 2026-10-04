// 已确认的前端回礼规则；正式首次资格与结算以后由服务端实现。
const PROBABILITY = 0.33;
const STARS = 3;
const LINES = Object.freeze({
  first: '一起画完啦。这三颗小星星，送给你。',
  gift: '画好了，我还给你留了三颗小星星。',
  ordinary: '今天和你一起画画，我很开心。'
});
function decideDrawingGift(first, random) {
  const received = first || (random || Math.random)() < PROBABILITY;
  const kind = first ? 'first' : (received ? 'gift' : 'ordinary');
  return { kind, stars: received ? STARS : 0, line: LINES[kind] };
}
module.exports = { decideDrawingGift };
