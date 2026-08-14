const { normalizeText, normalizeTone } = require('./inline-notice-controller');

const DIALOGUE_DURATION = 2200;
const SYSTEM_DURATION = 1800;
const WARNING_DURATION = 2400;
const FADE_DURATION = 180;
const QUEUE_GAP = 150;
const SYSTEM_TTL = 4000;
const MAX_PENDING = 2;

function createSceneFeedbackController(host, options) {
  const settings = Object.assign({
    textKey: 'sceneFeedbackText',
    variantKey: 'sceneFeedbackVariant',
    toneKey: 'sceneFeedbackTone',
    visibleKey: 'sceneFeedbackVisible',
    systemBehindKey: 'sceneFeedbackSystemBehind',
    promotingKey: 'sceneFeedbackPromoting',
    reducedMotion: () => false,
    isActive: () => true,
    now: () => Date.now()
  }, options || {});

  let current = null;
  let pending = [];
  let sequence = 0;
  let pumpTimer = null;
  let displayTimer = null;
  let transitionTimer = null;
  let gapTimer = null;

  function setData(patch, callback) {
    if (!host || typeof host.setData !== 'function') return;
    host.setData(patch, callback);
  }

  function clearTimers() {
    clearTimeout(pumpTimer);
    clearTimeout(displayTimer);
    clearTimeout(transitionTimer);
    clearTimeout(gapTimer);
    pumpTimer = null;
    displayTimer = null;
    transitionTimer = null;
    gapTimer = null;
  }

  function isExpired(item) {
    return item.variant === 'system' && item.tone !== 'warning' && settings.now() - item.createdAt > SYSTEM_TTL;
  }

  function pruneExpired() {
    pending = pending.filter(item => !isExpired(item));
  }

  function nextIndex() {
    pruneExpired();
    const dialogueIndex = pending.findIndex(item => item.variant === 'dialogue');
    return dialogueIndex >= 0 ? dialogueIndex : (pending.length ? 0 : -1);
  }

  function peekNext() {
    const index = nextIndex();
    return index >= 0 ? pending[index] : null;
  }

  function hasQueuedSystem() {
    pruneExpired();
    return pending.some(item => item.variant === 'system');
  }

  function refreshBackplate() {
    const systemBehind = Boolean(current && current.variant === 'dialogue' && hasQueuedSystem());
    setData({
      [settings.systemBehindKey]: systemBehind,
      [settings.promotingKey]: false
    });
  }

  function durationFor(item) {
    if (item.variant === 'dialogue') return DIALOGUE_DURATION;
    return item.tone === 'warning' ? WARNING_DURATION : SYSTEM_DURATION;
  }

  function pump() {
    pumpTimer = null;
    if (current || !settings.isActive()) return;
    const index = nextIndex();
    if (index < 0) return;
    current = pending.splice(index, 1)[0];
    const systemBehind = current.variant === 'dialogue' && hasQueuedSystem();
    const token = current.id;
    setData({
      [settings.textKey]: current.text,
      [settings.variantKey]: current.variant,
      [settings.toneKey]: current.tone,
      [settings.visibleKey]: false,
      [settings.systemBehindKey]: systemBehind,
      [settings.promotingKey]: false
    }, () => {
      if (!current || current.id !== token || !settings.isActive()) return;
      setData({ [settings.visibleKey]: true });
      displayTimer = setTimeout(finishCurrent, durationFor(current));
    });
  }

  function schedulePump() {
    if (pumpTimer || current || !settings.isActive()) return;
    pumpTimer = setTimeout(pump, 0);
  }

  function finishCurrent() {
    displayTimer = null;
    if (!current) return;
    const next = peekNext();
    const promotingSystem = Boolean(current.variant === 'dialogue' && next && next.variant === 'system');
    setData({
      [settings.visibleKey]: false,
      [settings.systemBehindKey]: promotingSystem,
      [settings.promotingKey]: promotingSystem
    });
    const fadeDelay = settings.reducedMotion() ? 20 : FADE_DURATION;
    transitionTimer = setTimeout(() => {
      transitionTimer = null;
      current = null;
      if (!promotingSystem) {
        setData({
          [settings.textKey]: '',
          [settings.systemBehindKey]: false,
          [settings.promotingKey]: false
        });
      }
      const gapDelay = settings.reducedMotion() ? 0 : QUEUE_GAP;
      gapTimer = setTimeout(() => {
        gapTimer = null;
        pump();
      }, gapDelay);
    }, fadeDelay);
  }

  function trimPending(newItem) {
    while (pending.length > MAX_PENDING) {
      const removableSystem = newItem.variant === 'dialogue'
        ? pending.map(item => item.variant).lastIndexOf('system')
        : pending.findIndex(item => item.variant === 'system');
      pending.splice(removableSystem >= 0 ? removableSystem : pending.length - 1, 1);
    }
  }

  function enqueue(variant, text, tone, key) {
    const message = normalizeText(text);
    if (!message || !settings.isActive()) return false;
    const itemKey = String(key || `${variant}:${message}`);
    if (current && current.key === itemKey) return false;

    const item = {
      id: `scene-feedback-${settings.now()}-${sequence += 1}`,
      key: itemKey,
      text: message,
      tone: normalizeTone(tone),
      variant,
      createdAt: settings.now()
    };
    pending = pending.filter(entry => entry.key !== itemKey);
    if (variant === 'dialogue') {
      pending = pending.filter(entry => entry.variant !== 'dialogue');
      pending.unshift(item);
    } else {
      pending.push(item);
    }
    trimPending(item);
    if (current) refreshBackplate();
    else schedulePump();
    return true;
  }

  function showDialogue(text, key) {
    return enqueue('dialogue', text, 'info', key);
  }

  function showSystem(text, tone, key) {
    return enqueue('system', text, tone, key);
  }

  function clear() {
    clearTimers();
    current = null;
    pending = [];
    setData({
      [settings.textKey]: '',
      [settings.variantKey]: 'dialogue',
      [settings.toneKey]: 'info',
      [settings.visibleKey]: false,
      [settings.systemBehindKey]: false,
      [settings.promotingKey]: false
    });
  }

  function getSnapshot() {
    return {
      current: current && Object.assign({}, current),
      pending: pending.map(item => Object.assign({}, item))
    };
  }

  return { showDialogue, showSystem, clear, destroy: clear, getSnapshot };
}

module.exports = {
  DIALOGUE_DURATION,
  SYSTEM_DURATION,
  WARNING_DURATION,
  FADE_DURATION,
  QUEUE_GAP,
  SYSTEM_TTL,
  MAX_PENDING,
  createSceneFeedbackController
};
