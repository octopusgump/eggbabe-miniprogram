const CRISIS_PATTERNS = [/不想活/, /想死/, /自杀/, /结束生命/, /伤害自己/, /活不下去/];
const UNSAFE_PATTERNS = [/赌博/, /下注/, /色情/, /成人内容/];
const SENSITIVE_INFO_PATTERNS = [/\b1[3-9]\d{9}\b/, /\b\d{17}[\dXx]\b/, /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/];
const MAX_CHAT_LENGTH = 120;

function assessInput(value) {
  const text = String(value || '').trim();
  if (SENSITIVE_INFO_PATTERNS.some(pattern => pattern.test(text))) return { allowed: false, code: 'SENSITIVE_INFO', message: '为了保护隐私，请不要发送手机号、身份证号或邮箱。' };
  if (UNSAFE_PATTERNS.some(pattern => pattern.test(text))) return { allowed: false, code: 'UNSAFE_CONTENT', message: '换个说法试试' };
  return { allowed: true, text };
}

function validateChatInput(value) {
  const text = String(value || '').trim();
  if (!text) return { allowed: false, code: 'EMPTY', message: '先说一句话吧', text };
  if (Array.from(text).length > MAX_CHAT_LENGTH) {
    return { allowed: false, code: 'TOO_LONG', message: `最多说 ${MAX_CHAT_LENGTH} 个字`, text };
  }
  return assessInput(text);
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

module.exports = { MAX_CHAT_LENGTH, assessInput, validateChatInput, isSafeDisplayText, shouldShowRestReminder };
