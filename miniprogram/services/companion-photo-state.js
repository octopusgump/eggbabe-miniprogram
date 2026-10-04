// 前端运行内状态；不代表真实账户持久化。
const { shanghaiDate } = require('./companion-star-rules');
function copy(value) { return JSON.parse(JSON.stringify(value)); }
function createPhotoState() {
  const offered = new Map();
  const days = new Map();
  let firstDone = false;
  function getPending() { return [...offered.values()].filter(item => !item.collected).map(copy); }
  function find(id) { return offered.has(id) ? copy(offered.get(id)) : null; }
  function receive(id) {
    const item = offered.get(id);
    if (!item) return null;
    item.collected = true;
    return copy(item);
  }
  function offer(photos, options) {
    const date = shanghaiDate();
    if (days.has(date)) return copy(days.get(date));
    const available = photos.filter(item => !offered.has(item.id) && item.kind !== 'exchange');
    const special = available.find(item => item.kind === 'solar');
    const ordinary = available.filter(item => item.kind === 'outing');
    const random = options && options.random || Math.random;
    let photo = special || null;
    if (!photo && ordinary.length && (!firstDone || random() < 0.33)) photo = ordinary.length === 1 ? ordinary[0] : ordinary[Math.min(ordinary.length - 1, Math.floor(random() * ordinary.length))];
    const result = photo ? Object.assign({}, copy(photo), { date, collected: false, source: 'paper' }) : null;
    days.set(date, result);
    if (result) { offered.set(result.id, result); firstDone = true; }
    return result ? copy(result) : null;
  }
  function purchase(photo) {
    if (offered.has(photo.id)) return find(photo.id);
    const item = Object.assign({}, copy(photo), { date: shanghaiDate(), collected: true, source: 'exchange' });
    offered.set(item.id, item);
    return copy(item);
  }
  return { getPending, find, receive, offer, purchase };
}
module.exports = { createPhotoState };
