const assert = require('assert');
const rules = require('../listen-rules');
let combinations = 0, ties = 0;
const reachable = new Set();
for (const category of rules.bank.categories) for (const group of category.groups) {
  assert.equal(group.questions.length, 5);
  assert.equal(group.matchedFeedback.length, 3);
  for (const question of group.questions) {
    assert.equal(question.options.length, 5);
    assert.equal(question.options[4].label, '都不是...');
  }
  for (let n = 0; n < 3125; n++) {
    let value = n;
    const answers = {};
    for (const question of group.questions) {
      answers[question.id] = { optionId: question.options[value % 5].id, text: '' };
      value = Math.floor(value / 5);
    }
    const eligible = group.matchedFeedback.filter(feedback => {
      for (const row of feedback.requiredAnswers) if (!row.optionIds.includes(answers[row.questionId].optionId)) return false;
      for (const row of feedback.excludedAnswers) if (row.optionIds.includes(answers[row.questionId].optionId)) return false;
      return true;
    });
    const supports = eligible.map(item => new Set(item.requiredAnswers.map(row => row.questionId)).size);
    const max = Math.max(0, ...supports);
    const top = eligible.filter((item, index) => supports[index] === max);
    const expected = top.length === 1 ? top[0] : group.fallbackFeedback;
    const actual = rules.selectFeedback(group, answers);
    assert.equal(actual.id, expected.id);
    assert.equal(actual.petFeedback, expected.petFeedback);
    if (actual.type === 'matched') reachable.add(actual.id);
    if (top.length > 1) ties++;
    Object.values(answers).forEach(item => { item.text = '其实我不同意选项，也想换个话题。'; });
    assert.equal(rules.selectFeedback(group, answers).id, actual.id, '文字仅保存，不能影响选择');
    combinations++;
  }
  assert.equal(rules.selectFeedback(group, {}), null, '未完成不能以保底冒充反馈');
}
assert.equal(combinations, 81250);
assert.equal(reachable.size, 78);
assert.equal(ties, 58);
console.log(`听你说反馈通过：${combinations} 组选项组合，78 条可达，58 个并列保底，文字不参与。`);
