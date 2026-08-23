const assert = require('assert');

const originalWx = global.wx;
const storage = new Map();
global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const compliance = require('../compliance-service');
const runtime = require('../runtime-context');

assert.equal(
  compliance.formatDemoFeedbackReceipt('2026-08-23', 1),
  'DEMO-FB-20260823-001',
  '首个 Demo 反馈编号必须包含业务标识、日期和三位序号'
);
assert.equal(
  compliance.formatDemoFeedbackReceipt('2026-08-23', 12),
  'DEMO-FB-20260823-012',
  'Demo 反馈序号必须补足三位，便于阅读和口述'
);
assert.equal(
  compliance.ACCOUNT_SCOPED_STORAGE_KEYS.includes('compliance_demo_feedback_counter'),
  true,
  '退出账号或清除演示数据时必须同时清除 Demo 反馈计数器'
);

runtime.setMode('demo');

(async () => {
  try {
    const first = await compliance.submitFeedback({ type: 'OTHER', description: '第一次反馈', consent: true });
    const second = await compliance.submitFeedback({ type: 'OTHER', description: '第二次反馈', consent: true });
    assert.match(first.receiptNumber, /^DEMO-FB-\d{8}-001$/, '当天第一条 Demo 反馈必须从 001 开始');
    assert.equal(second.receiptNumber, first.receiptNumber.replace(/001$/, '002'), '同一天的 Demo 反馈序号必须依次递增');
    console.log('Demo 反馈受理编号格式与递增规则校验通过。');
  } finally {
    global.wx = originalWx;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
