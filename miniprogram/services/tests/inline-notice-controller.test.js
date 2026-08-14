const assert = require('assert');
const {
  DEFAULT_DURATION,
  DEFAULT_FADE_DURATION,
  createInlineNoticeController,
  normalizeText,
  normalizeTone
} = require('../../utils/inline-notice-controller');

const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const timers = [];

global.setTimeout = (callback, delay) => {
  const timer = { callback, delay, cleared: false };
  timers.push(timer);
  return timer;
};
global.clearTimeout = timer => {
  if (timer) timer.cleared = true;
};

try {
  const host = {
    data: { noticeText: '', noticeTone: 'info', noticeVisible: false },
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    }
  };
  const controller = createInlineNoticeController(host, {
    textKey: 'noticeText',
    toneKey: 'noticeTone',
    visibleKey: 'noticeVisible',
    timerKey: 'noticeTimer',
    cleanupTimerKey: 'noticeCleanupTimer'
  });

  assert.equal(DEFAULT_DURATION, 1800, '系统轻提示默认显示 1800ms');
  assert.equal(DEFAULT_FADE_DURATION, 180, '系统轻提示默认淡出 180ms');
  assert.equal(normalizeTone('warning'), 'warning', '失败提示只允许 warning 语义');
  assert.equal(normalizeTone('success'), 'info', '不得扩展成功等额外视觉语义');
  assert.equal(normalizeText('  已保存\n请继续  '), '已保存 请继续', '系统提示必须规整为单行短句');

  assert.equal(controller.show('  操作已完成  ', 'success'), true, '有效系统结果必须显示');
  assert.deepEqual(host.data, { noticeText: '操作已完成', noticeTone: 'info', noticeVisible: true }, '系统结果必须使用标准 info 样式');
  assert.equal(timers[0].delay, 1800, '系统结果必须在默认时长后收起');

  assert.equal(controller.show('保存失败，请重试', 'warning'), true, '失败结果必须显示');
  assert.equal(timers[0].cleared, true, '新提示必须覆盖旧提示定时器');
  assert.deepEqual(host.data, { noticeText: '保存失败，请重试', noticeTone: 'warning', noticeVisible: true }, '失败结果必须使用 warning 样式');

  timers[1].callback();
  assert.equal(host.data.noticeVisible, false, '到时必须先淡出提示');
  assert.equal(timers[2].delay, 180, '淡出完成后再卸载文本');
  timers[2].callback();
  assert.equal(host.data.noticeText, '', '淡出完成后必须清理文本');

  const inactiveHost = {
    data: { noticeText: '', noticeTone: 'info', noticeVisible: false },
    setData() { throw new Error('非活跃页面不应写入提示'); }
  };
  const inactiveController = createInlineNoticeController(inactiveHost, { isActive: () => false });
  assert.equal(inactiveController.show('不应显示', 'warning'), false, '离开页面后不得显示系统提示');
} finally {
  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
}

console.log('标准系统轻提示控制器与语义边界校验通过。');
