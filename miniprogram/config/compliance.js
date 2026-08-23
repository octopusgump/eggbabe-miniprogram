const AGE_RANGES = Object.freeze([
  Object.freeze({ label: '14 周岁及以下', value: 'AGE_0_14' }),
  Object.freeze({ label: '15-35 周岁', value: 'AGE_15_35' }),
  Object.freeze({ label: '36-60 周岁', value: 'AGE_36_60' }),
  Object.freeze({ label: '60 周岁以上', value: 'AGE_61_PLUS' })
]);

const FEEDBACK_TYPES = Object.freeze([
  Object.freeze({ value: 'AI_CONTENT_VIOLATION', label: 'AI 虚拟宠物对话违规（涉政、色情、暴力、轻生、暧昧诱导）' }),
  Object.freeze({ value: 'AI_MISLEADING_ADVICE', label: 'AI 误导或给出不实医疗、理财建议' }),
  Object.freeze({ value: 'MINOR_USE', label: '未成年人使用相关问题（时长、模式、内容限制）' }),
  Object.freeze({ value: 'SENIOR_SUPPORT', label: '老年人操作、防诈骗或使用指引咨询' }),
  Object.freeze({ value: 'PRIVACY', label: '账号或聊天记录隐私保护问题' }),
  Object.freeze({ value: 'CRISIS_INTERVENTION', label: '极端情绪干预失效（自杀、抑郁、家暴未安抚）' }),
  Object.freeze({ value: 'FUNCTION_FAILURE', label: '功能故障或无法打开宠物对话' }),
  Object.freeze({ value: 'REMINDER_OR_AI_LABEL', label: '时长提醒或 AI 标识缺失' }),
  Object.freeze({ value: 'OTHER', label: '其他申诉、意见建议' })
]);

// 正式值由 getComplianceConfig 接口覆盖；页面只读取这一份配置，不散落联系方式。
const DEFAULT_REMOTE_CONFIG = Object.freeze({
  support: Object.freeze({ phone: '', serviceHours: '', psychologicalHotline: '12356', police: '110', medicalEmergency: '120' }),
  policies: Object.freeze({
    service: Object.freeze({ title: '用户服务协议', version: '', effectiveDate: '', url: '' }),
    privacy: Object.freeze({ title: '隐私政策', version: '', effectiveDate: '', url: '' })
  })
});

const HEALTH_REMINDER_MESSAGE_COUNT = 300;

module.exports = { AGE_RANGES, FEEDBACK_TYPES, DEFAULT_REMOTE_CONFIG, HEALTH_REMINDER_MESSAGE_COUNT };
