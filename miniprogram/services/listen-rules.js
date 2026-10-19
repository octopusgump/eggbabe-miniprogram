// 只核对选项 ID；自由文字不进入匹配，也不拼接宠物反馈。
const bank = require('../fixtures/listen-bank');
function groupById(id) {
  for (const category of bank.categories) {
    const group = category.groups.find(item => item.id === id);
    if (group) return { category, group };
  }
  return null;
}
function selected(answers, questionId) { return answers[questionId] && answers[questionId].optionId; }
function complete(group, answers) {
  return group.questions.every(question => question.options.some(option => option.id === selected(answers, question.id)));
}
function selectFeedback(group, answers) {
  if (!complete(group, answers)) return null;
  const matches = group.matchedFeedback.filter(feedback =>
    feedback.requiredAnswers.every(item => item.optionIds.includes(selected(answers, item.questionId))) &&
    !feedback.excludedAnswers.some(item => item.optionIds.includes(selected(answers, item.questionId)))
  ).map(feedback => ({ feedback, support: new Set(feedback.requiredAnswers.map(item => item.questionId)).size }));
  const highest = matches.length ? Math.max(...matches.map(item => item.support)) : 0;
  const best = matches.filter(item => item.support === highest);
  const feedback = best.length === 1 ? best[0].feedback : group.fallbackFeedback;
  return { id: feedback.id, type: feedback.type, petFeedback: feedback.petFeedback };
}
function availableCategories(state, date) {
  const completed = state.day && state.day.date === date ? state.day.categories : [];
  return bank.categories.filter(category => !completed.includes(category.id) && (state.cursors[category.id] || 0) < category.groups.length);
}
function firstIncomplete(group, answers) {
  const index = group.questions.findIndex(question => !question.options.some(option => option.id === selected(answers, question.id)));
  return index < 0 ? group.questions.length - 1 : index;
}
module.exports = { bank, groupById, complete, selectFeedback, availableCategories, firstIncomplete };
