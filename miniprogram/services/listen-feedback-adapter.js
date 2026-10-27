const config = require('../config/v2');

const FALLBACK = '谢谢回答！';
const PROMPT = `基于用户对以下每道题目的回答，按照小红书风格给出一个关于该用户最显著特征的简短描述（不超过 80 个字）。文案要给用户治愈感、让用户有分享欲。 若信息不足或内容敏感，只输出：谢谢回答！
题目及回答如下：
`;

function buildAnswerBlock(group, answers) {
  return group.questions.map(question => {
    const input = answers[question.id] || {};
    const option = question.options.find(item => item.id === input.optionId);
    const label = option ? option.label : '未选';
    const extra = String(input.text || '').trim();
    return `题目：${question.text}\n回答：${label}${extra ? `（补充：${extra}）` : ''}`;
  }).join('\n\n');
}

function sanitizeModelText(text) {
  const trimmed = String(text || '').replace(/\s+/g, ' ').trim();
  if (!trimmed || trimmed === FALLBACK) return FALLBACK;
  if (trimmed.length > 80) return trimmed.slice(0, 80);
  return trimmed;
}

function mockFeedback(group, answers) {
  const block = buildAnswerBlock(group, answers);
  if (!block.trim()) return FALLBACK;
  return '和你聊下来，感觉你是个愿意把日常小事讲清楚的人。';
}

function requestChat(apiUrl, apiKey, body) {
  return new Promise((resolve, reject) => {
    if (!wx || typeof wx.request !== 'function') return reject(new Error('NO_WX_REQUEST'));
    wx.request({
      url: apiUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      data: body,
      timeout: config.requestTimeoutMs || 15000,
      success: res => resolve(res),
      fail: err => reject(err || new Error('REQUEST_FAILED'))
    });
  });
}

async function generateFeedback(group, answers, options) {
  const opts = options || {};
  const apiKey = opts.apiKey !== undefined ? opts.apiKey : config.listenFeedbackApiKey;
  const apiUrl = opts.apiUrl || config.listenFeedbackApiUrl || 'https://api.deepseek.com/chat/completions';
  const userContent = `${PROMPT}\n${buildAnswerBlock(group, answers)}`;
  if (!apiKey) {
    return { ok: true, petFeedback: mockFeedback(group, answers), source: 'mock', type: 'mock' };
  }
  try {
    const response = await requestChat(apiUrl, apiKey, {
      model: opts.model || 'deepseek-chat',
      messages: [{ role: 'user', content: userContent }],
      max_tokens: 120,
      temperature: 0.7
    });
    const status = Number(response.statusCode || 0);
    const content = response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message
      ? response.data.choices[0].message.content : '';
    if (status < 200 || status >= 300 || !content) return { ok: true, petFeedback: FALLBACK, source: 'deepseek-fallback', type: 'ai' };
    return { ok: true, petFeedback: sanitizeModelText(content), source: 'deepseek', type: 'ai' };
  } catch (error) {
    return { ok: true, petFeedback: FALLBACK, source: 'deepseek-error', type: 'ai' };
  }
}

module.exports = { FALLBACK, PROMPT, generateFeedback, buildAnswerBlock, mockFeedback, sanitizeModelText };
