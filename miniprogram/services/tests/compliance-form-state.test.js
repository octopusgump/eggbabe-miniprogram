const assert = require('assert');

const compliance = require('../compliance-service');
const originalSaveAgeRange = compliance.saveAgeRange;
const originalSubmitFeedback = compliance.submitFeedback;
const originalPage = global.Page;
const originalWx = global.wx;
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

function contextFor(definition, data) {
  return Object.assign({}, definition, {
    data: Object.assign({}, definition.data, data || {}),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    }
  });
}

async function flush() { await Promise.resolve(); await Promise.resolve(); }

(async () => {
  try {
    global.wx = { showToast() {}, navigateBack() {}, redirectTo() {}, navigateTo() {} };
    const timers = [];
    global.setTimeout = (callback, delay) => {
      timers.push({ callback, delay });
      return timers.length;
    };
    global.clearTimeout = () => {};

    let agePage;
    global.Page = definition => { agePage = definition; };
    delete require.cache[require.resolve('../../pages/age-range/age-range')];
    require('../../pages/age-range/age-range');

    let ageCalls = 0;
    let resolveAgeSave;
    compliance.saveAgeRange = () => {
      ageCalls += 1;
      return new Promise(resolve => { resolveAgeSave = resolve; });
    };
    const settingsAge = contextFor(agePage, { source: 'settings', confirmed: 'AGE_15_35', selected: 'AGE_61_PLUS', saving: false, loadError: '' });
    agePage.onConfirm.call(settingsAge);
    agePage.onConfirm.call(settingsAge);
    assert.equal(ageCalls, 1, '年龄保存中必须禁止重复提交');
    assert.equal(settingsAge.data.saving, true, '年龄保存请求期间必须显示保存中');
    resolveAgeSave({ ok: false, message: '保存失败，请重试' });
    await flush();
    assert.equal(settingsAge.data.selected, 'AGE_15_35', '设置页修改失败必须恢复旧年龄值');
    assert.equal(settingsAge.data.saveError, '保存失败，请重试', '年龄保存失败必须可见且允许再次选择后重试');

    let feedbackPage;
    global.Page = definition => { feedbackPage = definition; };
    delete require.cache[require.resolve('../../pages/feedback/feedback')];
    require('../../pages/feedback/feedback');

    assert.equal(feedbackPage.data.typeIndex, 0, '反馈选择器初始下标必须在可选范围内');
    assert.equal(feedbackPage.data.type, '', '有效初始下标不得被误判为用户已经选择诉求类型');
    assert.equal(feedbackPage.data.typeOptions[0].value, '', '反馈选择器必须使用独立占位项，不能与第一种诉求共用下标');
    const emptyFeedback = contextFor(feedbackPage);
    feedbackPage.onToggleTypePanel.call(emptyFeedback);
    assert.equal(emptyFeedback.data.typePanelOpen, true, '点击诉求类型字段必须展开页面内选择面板');
    feedbackPage.onSelectType.call(emptyFeedback, { currentTarget: { dataset: { index: '1' } } });
    assert.equal(emptyFeedback.data.type, 'AI_CONTENT_VIOLATION', '用户选择后必须写入对应诉求类型');
    assert.equal(emptyFeedback.data.typePanelOpen, false, '选择诉求类型后必须收起选择面板');
    feedbackPage.onToggleTypePanel.call(emptyFeedback);
    feedbackPage.onSelectType.call(emptyFeedback, { currentTarget: { dataset: { index: '2' } } });
    assert.equal(emptyFeedback.data.type, 'AI_MISLEADING_ADVICE', '诉求类型必须支持从已选值切换到其他选项');
    const reportedFeedback = contextFor(feedbackPage);
    feedbackPage.onLoad.call(reportedFeedback, { messageId: 'msg_reported_1' });
    assert.equal(reportedFeedback.data.typeIndex, 1, '从 AI 消息举报进入时必须自动选中违规对话类型');
    assert.equal(reportedFeedback.data.type, 'AI_CONTENT_VIOLATION', '消息举报不得停留在未选择诉求类型的不可提交状态');

    let toastTitle = '';
    global.wx.showToast = options => { toastTitle = options.title; };
    feedbackPage.onSubmit.call(reportedFeedback);
    assert.equal(reportedFeedback.data.submitError, '请填写问题详细描述', '点击灰色提交按钮时必须明确提示尚未填写问题描述');
    assert.equal(toastTitle, '请填写问题详细描述', '未满足必填条件时必须提供即时点击反馈');
    reportedFeedback.data.description = '需要举报的对话内容';
    feedbackPage.refreshCanSubmit.call(reportedFeedback, { description: reportedFeedback.data.description });
    feedbackPage.onSubmit.call(reportedFeedback);
    assert.equal(reportedFeedback.data.submitError, '请勾选同意隐私政策', '未知情同意时必须明确提示并阻止提交');

    let feedbackCalls = 0;
    let resolveFeedback;
    compliance.submitFeedback = () => {
      feedbackCalls += 1;
      return new Promise(resolve => { resolveFeedback = resolve; });
    };
    const feedback = contextFor(feedbackPage, {
      typeIndex: 1,
      type: 'AI_CONTENT_VIOLATION',
      description: '保留这段反馈内容',
      consent: true,
      messageId: 'msg_1024',
      canSubmit: true,
      submitting: false
    });
    feedbackPage.onSubmit.call(feedback);
    feedbackPage.onSubmit.call(feedback);
    assert.equal(feedbackCalls, 1, '反馈提交中必须禁止重复提交');
    assert.equal(feedback.data.submitting, true, '点击提交后必须立即进入提交中状态');
    assert.equal(feedback.data.canSubmit, false, '提交中按钮必须保持禁用');
    resolveFeedback({ ok: false, message: '提交失败，请重试' });
    await flush();
    assert.equal(feedback.data.submitting, true, '快速失败时也必须先展示提交中状态');
    assert.equal(timers[0].delay, 600, '提交中状态必须具有足够的最短可见时间');
    timers.shift().callback();
    await flush();
    assert.equal(feedback.data.description, '保留这段反馈内容', '反馈失败后填写内容不得丢失');
    assert.equal(feedback.data.messageId, 'msg_1024', '反馈失败后关联消息 ID 不得丢失');

    compliance.submitFeedback = () => Promise.resolve({ ok: true, receiptNumber: 'FB-20260821-001' });
    feedback.data.canSubmit = true;
    feedbackPage.onSubmit.call(feedback);
    await flush();
    assert.equal(feedback.data.submitting, true, '快速成功时也必须先展示提交中状态');
    timers.shift().callback();
    await flush();
    assert.equal(feedback.data.receiptNumber, 'FB-20260821-001', '反馈成功必须展示受理编号');
    assert.equal(feedback.data.description, '', '反馈成功后必须清空表单');
    assert.equal(feedback.data.typeIndex, 0, '反馈成功后选择器必须恢复有效初始下标');
    assert.equal(feedback.data.type, '', '反馈成功后必须恢复未选择状态');

    console.log('年龄与反馈保存中、失败重试和成功状态校验通过。');
  } finally {
    compliance.saveAgeRange = originalSaveAgeRange;
    compliance.submitFeedback = originalSubmitFeedback;
    global.Page = originalPage;
    global.wx = originalWx;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
