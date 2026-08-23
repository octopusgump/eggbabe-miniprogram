const storage = require('./storage-migration');
const config = require('../config/compliance');

const DEMO_AGE_KEY = 'compliance_age_range';
const DAILY_NOTICE_KEY = 'compliance_ai_notice_date';
const DEMO_FEEDBACK_COUNTER_KEY = 'compliance_demo_feedback_counter';
const ACCOUNT_SCOPED_STORAGE_KEYS = Object.freeze([DEMO_AGE_KEY, DAILY_NOTICE_KEY, DEMO_FEEDBACK_COUNTER_KEY]);
const VALID_AGE_VALUES = new Set(config.AGE_RANGES.map(item => item.value));

function cloudApi() { return require('./cloud-api'); }
function runtime() { return require('./runtime-context'); }

function normalizeAgeRange(value) {
  const normalized = String(value || '').toUpperCase();
  return VALID_AGE_VALUES.has(normalized) ? normalized : '';
}

function getAgeRange() {
  if (runtime().getMode() === 'demo') {
    return Promise.resolve({ ok: true, mode: 'demo', ageRange: normalizeAgeRange(storage.read(runtime().scopedKey(DEMO_AGE_KEY), '')) });
  }
  return cloudApi().getAgeRange().then(result => {
    if (!result || !result.ok) return result || { ok: false, code: 'AGE_RANGE_LOAD_FAILED', message: '年龄区间没有加载好，请重试' };
    return { ok: true, mode: 'live', ageRange: normalizeAgeRange(result.age_range || result.ageRange) };
  });
}

function saveAgeRange(ageRange) {
  const normalized = normalizeAgeRange(ageRange);
  if (!normalized) return Promise.resolve({ ok: false, code: 'AGE_RANGE_INVALID', message: '请选择年龄区间' });
  const selectedAt = new Date().toISOString();
  if (runtime().getMode() === 'demo') {
    try {
      storage.set(runtime().scopedKey(DEMO_AGE_KEY), normalized);
      return Promise.resolve({ ok: true, mode: 'demo', ageRange: normalized, source: 'SELF_DECLARED', selectedAt });
    } catch (error) {
      return Promise.resolve({ ok: false, code: 'LOCAL_WRITE_FAILED', message: '保存失败，请重试' });
    }
  }
  return cloudApi().saveAgeRange({ age_range: normalized, source: 'SELF_DECLARED', selected_at: selectedAt }).then(result => {
    if (!result || !result.ok) return result || { ok: false, code: 'AGE_RANGE_SAVE_FAILED', message: '保存失败，请重试' };
    const confirmed = normalizeAgeRange(result.age_range || result.ageRange);
    if (!confirmed) return { ok: false, code: 'AGE_RANGE_CONFIRMATION_INVALID', message: '保存结果无效，请重试' };
    return { ok: true, mode: 'live', ageRange: confirmed };
  });
}

function formatDemoFeedbackReceipt(dateKey, sequence) {
  const compactDate = String(dateKey || '').replace(/-/g, '');
  const normalizedSequence = Math.max(1, Math.floor(Number(sequence) || 1));
  return `DEMO-FB-${compactDate}-${String(normalizedSequence).padStart(3, '0')}`;
}

function nextDemoFeedbackReceipt(now) {
  const timestamp = Number(now) || Date.now();
  const dateKey = businessDateKey(timestamp);
  const key = runtime().scopedKey(DEMO_FEEDBACK_COUNTER_KEY);
  const previous = storage.read(key, null);
  const sequence = previous && previous.dateKey === dateKey
    ? Math.max(0, Number(previous.sequence) || 0) + 1
    : 1;
  try { storage.set(key, { dateKey, sequence }); }
  catch (error) {}
  return formatDemoFeedbackReceipt(dateKey, sequence);
}

function submitFeedback(payload) {
  const body = Object.assign({}, payload, { message_id: payload.messageId || null, submitted_at: payload.submittedAt });
  delete body.messageId;
  delete body.submittedAt;
  if (runtime().getMode() === 'demo') {
    return Promise.resolve({ ok: true, mode: 'demo', receiptNumber: nextDemoFeedbackReceipt() });
  }
  return cloudApi().submitFeedback(body).then(result => {
    if (!result || !result.ok) return result || { ok: false, code: 'FEEDBACK_SUBMIT_FAILED', message: '提交失败，请重试' };
    const receiptNumber = String(result.receipt_number || result.receiptNumber || '');
    return receiptNumber
      ? { ok: true, mode: 'live', receiptNumber }
      : { ok: false, code: 'FEEDBACK_RECEIPT_MISSING', message: '受理编号没有返回，请重试' };
  });
}

function mergeRemoteConfig(result) {
  const source = result && (result.compliance_config || result.complianceConfig || result);
  const remoteSupport = source && source.support || {};
  const support = Object.assign({}, config.DEFAULT_REMOTE_CONFIG.support, remoteSupport, {
    phone: remoteSupport.phone || remoteSupport.customer_service_phone || '',
    serviceHours: remoteSupport.serviceHours || remoteSupport.service_hours || '',
    psychologicalHotline: remoteSupport.psychologicalHotline || remoteSupport.psychological_hotline || config.DEFAULT_REMOTE_CONFIG.support.psychologicalHotline,
    police: remoteSupport.police || config.DEFAULT_REMOTE_CONFIG.support.police,
    medicalEmergency: remoteSupport.medicalEmergency || remoteSupport.medical_emergency || config.DEFAULT_REMOTE_CONFIG.support.medicalEmergency
  });
  const remotePolicies = source && source.policies || {};
  const policies = {};
  Object.keys(config.DEFAULT_REMOTE_CONFIG.policies).forEach(key => {
    policies[key] = Object.assign({}, config.DEFAULT_REMOTE_CONFIG.policies[key], remotePolicies[key] || {});
  });
  return { support, policies };
}

function getComplianceConfig() {
  if (runtime().getMode() === 'demo') return Promise.resolve({ ok: true, mode: 'demo', config: mergeRemoteConfig(null) });
  return cloudApi().getComplianceConfig().then(result => {
    if (!result || !result.ok) return { ok: false, code: result && result.code || 'CONFIG_LOAD_FAILED', message: result && result.message || '服务信息没有加载好，请重试', config: mergeRemoteConfig(null) };
    return { ok: true, mode: 'live', config: mergeRemoteConfig(result) };
  });
}

function businessDateKey(now) {
  const date = new Date((Number(now) || Date.now()) + 8 * 60 * 60 * 1000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function takeDailyAiNotice(now) {
  const key = runtime().scopedKey(DAILY_NOTICE_KEY);
  const today = businessDateKey(now);
  if (storage.read(key, '') === today) return false;
  try { storage.set(key, today); return true; }
  catch (error) { return true; }
}

module.exports = { ACCOUNT_SCOPED_STORAGE_KEYS, normalizeAgeRange, getAgeRange, saveAgeRange, formatDemoFeedbackReceipt, submitFeedback, getComplianceConfig, businessDateKey, takeDailyAiNotice };
