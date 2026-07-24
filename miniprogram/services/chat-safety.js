const CRISIS_PATTERNS = [/不想活/, /想死/, /自杀/, /结束生命/, /伤害自己/, /活不下去/];
const UNSAFE_PATTERNS = [/赌博/, /下注/, /色情/, /成人内容/, /怎么自残/, /怎么自杀/];
const SENSITIVE_INFO_PATTERNS = [/\b1[3-9]\d{9}\b/, /\b\d{17}[\dXx]\b/, /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/];
const CRISIS_RESPONSE = '听起来你现在正承受很难熬的感受。请先联系一位你信任、能马上陪在身边的人；如有紧急危险，请立即联系当地官方紧急或专业支持。';
const OUTPUT_FALLBACK = '我在听。我们先慢一点，照顾好现在的感受。';

function assessInput(value) {
  const text = String(value || '').trim();
  if (CRISIS_PATTERNS.some(pattern => pattern.test(text))) return { allowed: true, crisis: true, text };
  if (SENSITIVE_INFO_PATTERNS.some(pattern => pattern.test(text))) return { allowed: false, code: 'SENSITIVE_INFO', message: '为了保护隐私，请不要发送手机号、身份证号或邮箱。' };
  if (UNSAFE_PATTERNS.some(pattern => pattern.test(text))) return { allowed: false, code: 'UNSAFE_CONTENT', message: '换个说法试试' };
  return { allowed: true, crisis: false, text };
}

function safeOutput(value) {
  const text = String(value || '');
  return UNSAFE_PATTERNS.concat(CRISIS_PATTERNS).some(pattern => pattern.test(text)) ? OUTPUT_FALLBACK : text;
}

function isSafeDisplayText(value) {
  const text = String(value || '');
  return !UNSAFE_PATTERNS.concat(CRISIS_PATTERNS, SENSITIVE_INFO_PATTERNS).some(pattern => pattern.test(text));
}

function shouldShowRestReminder(timestamp, turnCount, alreadyShown) {
  if (alreadyShown || turnCount < 8) return false;
  const date = new Date(Number(timestamp) + 8 * 60 * 60 * 1000);
  const hour = date.getUTCHours();
  return hour >= 23 || hour < 6;
}

module.exports = { CRISIS_RESPONSE, OUTPUT_FALLBACK, assessInput, safeOutput, isSafeDisplayText, shouldShowRestReminder };
