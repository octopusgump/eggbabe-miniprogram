const rules = require('./listen-rules');
const stars = require('./iaa-star-unlock-adapter');
const { shanghaiDate } = require('./companion-star-rules');
const clone = value => JSON.parse(JSON.stringify(value));
const failure = (code, message) => ({ ok: false, error: { code, message } });
function getState() {
  const state = stars.getListeningState();
  const categories = rules.availableCategories(state, shanghaiDate());
  return { ok: true, data: { draft: state.draft, categories: categories.map(category => ({ id: category.id, name: category.name, title: category.groups[state.cursors[category.id] || 0].title })), completedToday: state.day && state.day.date === shanghaiDate() ? state.day.categories.length : 0, pendingResult: state.pendingResult ? state.results[state.pendingResult] : null, exhausted: rules.bank.categories.every(category => (state.cursors[category.id] || 0) >= category.groups.length) } };
}
function startGroup(categoryId, random) {
  const state = stars.getListeningState();
  if (state.draft) return { ok: true, data: clone(state.draft), resumed: true };
  const available = rules.availableCategories(state, shanghaiDate());
  if (!available.length) return failure('NO_GROUP_AVAILABLE', '今天先聊到这里。');
  const index = Math.min(available.length - 1, Math.max(0, Math.floor((random || Math.random)() * available.length)));
  const category = categoryId ? available.find(item => item.id === categoryId) : available[index];
  if (!category) return failure('CATEGORY_UNAVAILABLE', '这个话题暂时没有新的问题。');
  const group = category.groups[state.cursors[category.id] || 0];
  state.pendingResult = null;
  state.draft = { groupId: group.id, categoryId: category.id, questionIndex: 0, answers: {}, startedAt: Date.now(), contentVersion: rules.bank.contentVersion };
  const saved = stars.saveListeningState(state);
  return saved.ok ? { ok: true, data: clone(state.draft) } : saved;
}
function saveDraft(draft) {
  const state = stars.getListeningState();
  if (!draft || !state.draft || state.draft.groupId !== draft.groupId) return failure('DRAFT_CHANGED', '这组回答已更新，请重新打开。');
  const entry = rules.groupById(draft.groupId);
  if (!entry || !Number.isInteger(draft.questionIndex) || draft.questionIndex < 0 || draft.questionIndex > 4) return failure('INVALID_DRAFT', '这组回答还没有准备好。');
  const answers = {};
  for (const question of entry.group.questions) {
    const input = draft.answers[question.id];
    if (!input) continue;
    if (input.optionId && !question.options.some(option => option.id === input.optionId)) return failure('INVALID_OPTION', '请重新选择一个答案。');
    answers[question.id] = { optionId: input.optionId || '', text: String(input.text || '').slice(0, 1000) };
  }
  state.draft = Object.assign({}, state.draft, { questionIndex: draft.questionIndex, answers });
  const saved = stars.saveListeningState(state);
  return saved.ok ? { ok: true, data: clone(state.draft) } : saved;
}
function completeGroup(groupId) {
  const state = stars.getListeningState();
  if (state.results[groupId]) return Promise.resolve({ ok: true, duplicate: true, data: clone(state.results[groupId]), awardedStars: 0 });
  const draft = state.draft;
  const entry = rules.groupById(groupId);
  if (!draft || draft.groupId !== groupId || !entry || !rules.complete(entry.group, draft.answers)) return Promise.resolve(failure('ANSWERS_REQUIRED', '先把这组五个答案选好吧。'));
  const feedback = rules.selectFeedback(entry.group, draft.answers);
  if (!feedback) return Promise.resolve(failure('FEEDBACK_UNAVAILABLE', '这次回应还没有准备好，请再试一次。'));
  const scope = stars.getRoomScope();
  const record = { groupId, categoryId: draft.categoryId, title: entry.group.title, answers: clone(draft.answers), feedback, contentVersion: draft.contentVersion };
  // 在共享结算中统一取完成日期；不在异步等待前决定“今天”。
  return stars.getRoomStarView().then(view => scope === stars.getRoomScope() ? stars.recordListeningComplete(view.data, groupId, record) : failure('CONTEXT_CHANGED', '当前宠物已切换，请重新打开。')).then(result =>
    result.ok ? { ok: true, data: result.listeningResult, duplicate: result.duplicate, awardedStars: result.awardedStars, streakInterrupted: result.streakInterrupted } : result
  );
}
function getResult(groupId) {
  const result = stars.getListeningState().results[groupId];
  return result ? { ok: true, data: clone(result), awardedStars: 0, duplicate: true } : failure('RESULT_NOT_FOUND', '没有找到这组回答。');
}
function acknowledgeFeedback(groupId) {
  const state = stars.getListeningState();
  if (state.pendingResult !== groupId) return { ok: true };
  state.pendingResult = null;
  return stars.saveListeningState(state);
}
module.exports = { contractVersion: 'iaa-mvp-v1', source: 'local-fixture', getState, startGroup, saveDraft, completeGroup, getResult, acknowledgeFeedback };
