const { shanghaiDate } = require('./companion-star-rules');
const { readyThemes } = require('./companion-theme-catalog');
const { petKey } = require('./companion-photo-catalog');
const clone = value => value == null ? null : JSON.parse(JSON.stringify(value));
const LABELS = ['一起画完啦！', '有份小礼物！', '惊喜加倍！'];

// 每个实例只绑定一个宠物房间；换房间由 adapter 创建新实例。
// 仅本次运行内的前端状态，不读账户、画像或模型记忆。
function createThemeState(options) {
  const catalog = options && options.catalog;
  const cycles = new Map();
  const invitations = new Map();
  const results = new Map();
  const rewardedDays = new Set();
  const owned = new Set((options && options.ownedPropIds || []).filter(id => typeof id === 'string'));
  let boundPet = null;
  let active = null;
  let sequence = 0;

  function invitation(pet, date) {
    const requestedPet = petKey(pet);
    if (boundPet && boundPet !== requestedPet) return null;
    boundPet = requestedPet;
    if (active) return clone(active);
    const day = date || shanghaiDate();
    if (rewardedDays.has(day)) return null;
    const key = `${petKey(pet)}:${day}`;
    if (invitations.has(key)) return clone(invitations.get(key));
    const available = readyThemes(pet, catalog);
    if (!available.length) return null;
    const cycleKey = petKey(pet);
    let seen = cycles.get(cycleKey) || new Set();
    if (available.every(theme => seen.has(theme.id))) seen = new Set();
    const theme = available.find(item => !seen.has(item.id));
    seen.add(theme.id);
    cycles.set(cycleKey, seen);
    const next = { id: `theme-${day}-${++sequence}`, date: day, theme: clone(theme), step: 0 };
    invitations.set(key, next);
    return clone(next);
  }

  function begin(pet, id, date) {
    const offer = invitation(pet, date);
    if (!offer || offer.id !== id) return { ok: false, code: 'THEME_INVITATION_REQUIRED' };
    if (!active) active = clone(offer);
    return { ok: true, data: clone(active) };
  }

  function setStep(id, step) {
    if (!active || active.id !== id || !Number.isInteger(step) || step < 0 || step > 3) return false;
    active.step = step;
    return true;
  }

  function complete(id, memory, art, options) {
    if (results.has(id)) return { ok: true, duplicate: true, data: clone(results.get(id)) };
    const stroke = art && Array.isArray(art.operations) && art.operations.some(item =>
      item.type === 'stroke' && item.tool !== 'eraser' && Array.isArray(item.points) && item.points.length > 0);
    if (!active || active.id !== id || !memory || !memory.image || !stroke) {
      return { ok: false, code: 'THEME_DRAWING_REQUIRED' };
    }
    const day = options && options.date || shanghaiDate();
    if (rewardedDays.has(day)) return { ok: false, code: 'THEME_DAILY_LIMIT' };
    const roll = (options && options.random || Math.random)();
    const tier = roll < 0.6 ? 0 : (roll < 0.9 ? 1 : 2);
    const theme = active.theme;
    const duplicateProp = tier > 0 && owned.has(theme.id);
    const stars = 1 + (tier === 2 ? 3 : 0) + (duplicateProp ? 2 : 0);
    const prop = tier > 0 && !duplicateProp ? { id: theme.id, name: theme.name } : null;
    const result = {
      id, date: day, theme: clone(theme), tier, label: LABELS[tier], stars, prop, duplicateProp,
      line: duplicateProp ? `${theme.name}已拥有，改送2颗星星。` : tier === 0 ? '星星送给你。' :
        (tier === 1 ? `${theme.name}送给你。` : `${theme.name}和星星都给你。`),
      memory: Object.assign({}, clone(memory), { id, date: day, source: 'theme-drawing' })
    };
    if (prop) owned.add(theme.id);
    rewardedDays.add(day);
    results.set(id, result);
    active = null;
    return { ok: true, duplicate: false, data: clone(result) };
  }

  return { invitation, begin, setStep, complete, getActive: () => clone(active) };
}
module.exports = { createThemeState };
