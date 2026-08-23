const DEFAULT_DURATION = 1800;
const DEFAULT_FADE_DURATION = 180;

// 仅管理系统性的短暂结果与失败；锦鲤、玉兔的对白必须继续使用白底黑字气泡。

function normalizeTone(value) {
  return value === 'warning' ? 'warning' : 'info';
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function createInlineNoticeController(host, options) {
  const settings = Object.assign({
    textKey: 'inlineNoticeText',
    toneKey: 'inlineNoticeTone',
    visibleKey: 'inlineNoticeVisible',
    timerKey: 'inlineNoticeTimer',
    cleanupTimerKey: 'inlineNoticeCleanupTimer',
    duration: DEFAULT_DURATION,
    fadeDuration: DEFAULT_FADE_DURATION,
    isActive: () => true
  }, options || {});

  function clearTimers() {
    clearTimeout(host[settings.timerKey]);
    clearTimeout(host[settings.cleanupTimerKey]);
    host[settings.timerKey] = null;
    host[settings.cleanupTimerKey] = null;
  }

  function dismiss() {
    clearTimers();
    if (!host.data || !host.data[settings.textKey]) return;
    host.setData({ [settings.visibleKey]: false });
    host[settings.cleanupTimerKey] = setTimeout(() => {
      host[settings.cleanupTimerKey] = null;
      if (host.data && !host.data[settings.visibleKey]) host.setData({ [settings.textKey]: '' });
    }, settings.fadeDuration);
  }

  function show(text, tone) {
    const message = normalizeText(text);
    if (!message || !settings.isActive()) return false;
    clearTimers();
    host.setData({
      [settings.textKey]: message,
      [settings.toneKey]: normalizeTone(tone),
      [settings.visibleKey]: false
    }, () => {
      if (!settings.isActive()) return;
      host.setData({ [settings.visibleKey]: true });
      host[settings.timerKey] = setTimeout(dismiss, settings.duration);
    });
    return true;
  }

  return {
    show,
    dismiss,
    destroy: clearTimers,
    clearTimers
  };
}

module.exports = {
  DEFAULT_DURATION,
  DEFAULT_FADE_DURATION,
  createInlineNoticeController,
  normalizeText,
  normalizeTone
};
