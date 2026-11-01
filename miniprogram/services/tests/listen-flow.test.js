const assert = require('assert');
const storage = new Map();
let failWrite = false;
global.wx = {
  getAccountInfoSync: () => ({ miniProgram: { envVersion: 'release' } }),
  getStorageSync: key => storage.get(key),
  setStorageSync: (key, value) => { if (failWrite) throw Error('quota'); storage.set(key, structuredClone(value)); },
  removeStorageSync: key => storage.delete(key)
};
let stars = require('../iaa-star-unlock-adapter');
let listen = require('../listen-adapter');
const rules = require('../listen-rules');
const runtime = require('../runtime-context');
const originalNow = Date.now;
let now = Date.parse('2026-10-19T12:00:00+08:00');
Date.now = () => now;
const day = async () => (await stars.getRoomStarView()).data;
function configure(id, owner = 'owner') { stars.configureRoom(id, { id, ownerId: owner, prototype: '玉兔', lifecycleStage: 'HATCHED' }); }
function answerAll(categoryId) {
  const start = listen.startGroup(categoryId, () => 0);
  assert.equal(start.ok, true);
  const draft = start.data;
  const group = rules.groupById(draft.groupId).group;
  group.questions.forEach(question => { draft.answers[question.id] = { optionId: question.options[4].id, text: '用户可选补充' }; });
  draft.questionIndex = 4;
  assert.equal(listen.saveDraft(draft).ok, true);
  return draft.groupId;
}
(async () => {
  configure('answers-first');
  const before = await day();
  const opened = await stars.recordLetterOpen(before);
  assert.equal(opened.awardedStars, 11); assert.equal(opened.effectiveAdded, false);
  assert.equal((await stars.recordDrawingStart(before)).awardedStars, 0);
  assert.equal((await day()).star.companionDays, 0);
  const firstId = answerAll('habits');
  const [first, duplicate] = await Promise.all([listen.completeGroup(firstId), listen.completeGroup(firstId)]);
  assert.equal(first.awardedStars, 10); assert.equal(first.listenExtraStars, 10); assert.equal(duplicate.awardedStars, 0);
  assert.equal(first.data.feedback.type, 'mock');
  assert.equal((await day()).star.balance, 23); assert.equal((await day()).star.companionDays, 1);
  assert.equal(listen.getState().data.categories.some(item => item.id === 'habits'), false);
  const second = await listen.completeGroup(answerAll('pressure'));
  assert.equal(second.awardedStars, 0); assert.equal(second.duplicate, false, '零星星也是真实的新完成');
  const drawing = await stars.recordDrawingComplete(await day(), 'after-answer', { random: () => 1 });
  assert.equal(drawing.baseAwardedStars, 0); assert.equal(drawing.giftStars, 10);
  assert.equal((await stars.recordDrawingComplete(await day(), 'after-answer')).awardedStars, 0);
  assert.equal((await stars.recordDrawingComplete(await day(), 'second-drawing')).giftStars, 10);
  assert.equal(stars.getActivityCompleted('drawing'), false);
  assert.equal(stars.getActivityCompleted('listen'), true);

  // 模块重载模拟关闭小程序：结果、余额、每日额度和题库位置都恢复。
  delete require.cache[require.resolve('../iaa-star-unlock-adapter')];
  delete require.cache[require.resolve('../listen-adapter')];
  stars = require('../iaa-star-unlock-adapter'); listen = require('../listen-adapter'); configure('answers-first');
  assert.equal((await day()).star.balance, 43);
  assert.equal(listen.getResult(firstId).data.answers[firstId + '_q01'].text, '用户可选补充');
  assert.equal((await listen.completeGroup(firstId)).awardedStars, 0);
  assert.equal((await stars.recordDrawingComplete(await day(), 'after-answer')).awardedStars, 0);

  now += 86400000;
  const next = listen.startGroup('habits'); assert.equal(next.data.groupId, 'listen_habits_g02');
  next.data.answers[next.data.groupId + '_q01'] = { optionId: next.data.groupId + '_q01_b', text: '还没写完' };
  next.data.questionIndex = 1; assert.equal(listen.saveDraft(next.data).ok, true);
  configure('another-pet'); assert.equal(listen.getState().data.draft, null);
  configure('answers-first'); assert.equal(listen.getState().data.draft.questionIndex, 1);
  configure('answers-first', 'other-owner'); assert.equal(listen.getState().data.draft, null);
  configure('answers-first'); assert.equal(listen.getState().data.draft.answers[next.data.groupId + '_q01'].text, '还没写完');
  const resumedId = answerAll('habits');
  now += 86400000;
  await stars.recordLetterOpen(await day());
  const resumed = await listen.completeGroup(resumedId);
  assert.equal(resumed.data.completedDate, '2026-10-21');
  assert.equal(resumed.streakInterrupted, true); assert.equal((await day()).star.companionDays, 1);
  assert.equal(resumed.awardedStars, 10);
  assert.equal((await listen.completeGroup(firstId)).awardedStars, 0, '旧结果跨日不补发');

  configure('drawing-first');
  await stars.recordLetterOpen(await day());
  const drawn = await stars.recordDrawingComplete(await day(), 'first-drawing');
  assert.equal(drawn.baseAwardedStars, 0); assert.equal(drawn.giftStars, 10);
  assert.equal((await listen.completeGroup(answerAll('habits'))).awardedStars, 10);
  assert.equal((await day()).star.companionDays, 1);

  configure('write-failure');
  await stars.recordLetterOpen(await day());
  failWrite = true; assert.equal(listen.startGroup('habits').ok, false); failWrite = false;
  assert.equal(listen.getState().data.draft, null);
  const failedId = answerAll('habits');
  failWrite = true;
  assert.equal((await listen.completeGroup(failedId)).ok, false);
  failWrite = false;
  await stars.recordLetterOpen(await day());
  assert.equal((await day()).star.balance, 13); assert.equal((await day()).star.companionDays, 0);
  assert.equal(stars.getListeningState().cursors.habits, undefined);
  assert.equal(listen.getState().data.draft.groupId, failedId);
  assert.equal((await listen.completeGroup(failedId)).awardedStars, 10);

  configure('midnight-submit');
  await stars.recordLetterOpen(await day());
  now = Date.parse('2026-10-21T23:59:59.999+08:00');
  const midnightId = answerAll('habits');
  const midnightPending = listen.completeGroup(midnightId); now += 1;
  const midnight = await midnightPending;
  assert.equal(midnight.data.completedDate, '2026-10-22');
  assert.equal(midnight.data.reward.date, midnight.data.completedDate);
  assert.equal(stars.getListeningState().day.date, midnight.data.completedDate);
  assert.equal(listen.getState().data.categories.some(item => item.id === 'habits'), false);

  configure('context-switch');
  await stars.recordLetterOpen(await day());
  const switchId = answerAll('habits');
  const pending = listen.completeGroup(switchId); configure('switch-target');
  await stars.recordLetterOpen(await day());
  assert.equal((await pending).ok, false); assert.equal((await day()).star.balance, 13);
  configure('context-switch'); assert.equal(listen.getState().data.draft.groupId, switchId);

  configure('exhaustion');
  await stars.recordLetterOpen(await day());
  let finished = 0;
  while (!listen.getState().data.exhausted) {
    await stars.recordLetterOpen(await day());
    const choices = [...listen.getState().data.categories];
    for (const category of choices) { const result = await listen.completeGroup(answerAll(category.id)); assert.equal(result.ok, true); finished++; }
    assert.equal(listen.getState().data.categories.length, 0, '同日每类只一组');
    now += 86400000;
  }
  assert.equal(finished, 26); assert.equal(listen.startGroup().ok, false);
  assert.equal(Object.keys(stars.getListeningState().results).length, 26);
  assert.equal((await day()).star.companionDays, 6, '五个类目中一类有第六组，不循环其它类');

  configure('continuous-days');
  const { dailyStars } = require('../companion-star-rules');
  for (let i = 1; i <= 11; i++) {
    const opened = await stars.recordLetterOpen(await day());
    assert.equal(opened.baseAwardedStars, dailyStars(i));
    const result = await stars.recordCompanion(opened.data);
    assert.equal(result.baseAwardedStars, 0);
    assert.equal(result.data.star.companionDays, i);
    now += 86400000;
  }
  const invitation = stars.getDailyInvitation(['listen', 'drawing'], () => 0);
  assert.equal(invitation.data.kind, 'listen');
  assert.equal(stars.getDailyInvitation(['drawing'], () => { throw Error('同日不重抽'); }).data.kind, 'listen');
  now += 86400000; assert.equal(stars.getDailyInvitation(['drawing'], () => 0).data.kind, 'drawing');
  console.log('听你说本机闭环通过：恢复、跨日、两活动共用基础、独立+3、失败回滚、连续阶梯、26组用尽、每日邀请稳定。');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Date.now = originalNow; });
