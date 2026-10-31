const assert = require('assert');
const fs = require('fs');
const path = require('path');
const storage = new Map();
global.wx = {
  getAccountInfoSync: () => ({ miniProgram: { envVersion: 'release' } }),
  getStorageSync: key => storage.get(key),
  setStorageSync: (key, value) => storage.set(key, structuredClone(value))
};
const stars = require('../iaa-star-unlock-adapter');
const listen = require('../listen-adapter');
const rules = require('../listen-rules');
(async () => {
  for (let count = 0; count < 5; count++) {
    const id = 'required-five-' + count;
    stars.configureRoom(id, { id, ownerId: 'test', prototype: '玉兔', lifecycleStage: 'HATCHED' });
    const draft = listen.startGroup('habits').data;
    const group = rules.groupById(draft.groupId).group;
    const fullAnswers = {};
    group.questions.forEach((question, index) => {
      const answer = { optionId: question.options[0].id, text: '' };
      fullAnswers[question.id] = answer;
      draft.answers[question.id] = index < count ? answer : { optionId: '', text: '只有补充，不算选了答案' };
    });
    draft.questionIndex = 4;
    assert.equal(listen.saveDraft(draft).ok, true);
    const before = structuredClone(stars.getListeningState());
    const view = (await stars.getRoomStarView()).data;
    assert.equal((await listen.completeGroup(draft.groupId)).error.code, 'ANSWERS_REQUIRED');
    // 绕过页面和完成适配器，直接调用奖励入口也不得给不完整草稿发星。
    const result = await stars.recordListeningComplete(view, draft.groupId, {
      groupId: draft.groupId, categoryId: draft.categoryId, title: group.title,
      answers: fullAnswers, feedback: rules.selectFeedback(group, fullAnswers), contentVersion: draft.contentVersion
    });
    assert.equal(result.ok, false, count + '个有效答案不得经结算入口完成');
    assert.equal(result.error.code, 'ANSWERS_REQUIRED');
    assert.deepEqual(stars.getListeningState(), before, '拒绝后不改变草稿、类别及结果');
    assert.equal((await stars.getRoomStarView()).data.star.balance, 2);
    assert.equal((await stars.getRoomStarView()).data.star.companionDays, 0);
    draft.answers = fullAnswers;
    assert.equal(listen.saveDraft(draft).ok, true);
    const incompleteRecord = { groupId: draft.groupId, categoryId: draft.categoryId, answers: {} };
    assert.equal((await stars.recordListeningComplete(view, draft.groupId, incompleteRecord)).ok, false, '结果本身也须包含五个有效答案');
    const completed = await listen.completeGroup(draft.groupId);
    assert.equal(completed.ok, true); assert.equal(completed.awardedStars, 10);
    assert.equal((await listen.completeGroup(draft.groupId)).awardedStars, 0);
  }
  for (const missing of [undefined, null]) {
    const id = 'missing-answers-' + String(missing);
    stars.configureRoom(id, { id, ownerId: 'test', prototype: '玉兔', lifecycleStage: 'HATCHED' });
    const draft = listen.startGroup('habits').data;
    const group = rules.groupById(draft.groupId).group;
    const state = stars.getListeningState();
    if (missing === undefined) delete state.draft.answers;
    else state.draft.answers = null;
    assert.equal(stars.saveListeningState(state).ok, true);
    const answers = Object.fromEntries(group.questions.map(q => [q.id, { optionId: q.options[0].id, text: '' }]));
    const result = await stars.recordListeningComplete((await stars.getRoomStarView()).data, draft.groupId,
      { groupId: draft.groupId, categoryId: draft.categoryId, answers });
    assert.equal(result.ok, false); assert.equal(result.error.code, 'ANSWERS_REQUIRED');
    assert.equal((await stars.getRoomStarView()).data.star.balance, 2);
    assert.equal((await stars.getRoomStarView()).data.star.companionDays, 0);
  }
  const root = path.resolve(__dirname, '../..');
  const template = fs.readFileSync(path.join(root, 'pages/listen/listen.wxml'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'pages/listen/listen.wxss'), 'utf8');
  assert.equal(/跳过|onSkip|class="skip"/.test(template), false, '答题页不再提供跳过入口');
  assert.equal(/\.skip(?:[\s:.{-]|$)/.test(css), false, '清除跳过专属样式');
  assert.ok(template.includes('bind:back="onReturnRoom"'), '保留主动返回和草稿恢复');
  console.log('完整五题门槛通过：0～4答拒绝、直接结算拒绝、补充不代答、五答发一次、无跳过入口。');
})().catch(error => { console.error(error); process.exitCode = 1; });
