const fixture = require('../fixtures/iaa-today-companion');
const stars = require('./iaa-star-unlock-adapter');
const activityCatalog = require('./companion-activity-catalog');
const listenRules = require('./listen-rules');
const { shanghaiDate } = require('./companion-star-rules');

const LOCAL_ERROR = Object.freeze({
  code: 'LOCAL_FIXTURE_LOAD_FAILED',
  message: '今天的房间没有打开，请再试一次。'
});

function getTodayView(options) {
  const input = options || {};
  const state = input.state || 'ready';
  const scenario = input.scenario || 'normal';

  if (state === 'error') {
    return Promise.resolve({ ok: false, error: Object.assign({}, LOCAL_ERROR) });
  }
  if (state === 'empty') {
    return Promise.resolve({ ok: true, data: null });
  }

  const data = fixture.todayViewFor(scenario);
  if (!data) {
    return Promise.resolve({
      ok: false,
      error: { code: 'UNKNOWN_LOCAL_SCENARIO', message: '没有找到这个本地演示场景。' }
    });
  }
  if (input.selectActivity && scenario === 'normal') {
    const hasQuestions = listenRules.availableCategories(stars.getListeningState(), shanghaiDate()).length > 0 || Boolean(stars.getListeningState().draft);
    const choices = activityCatalog.ACTIVITIES.filter(item => item.kind !== 'listen' || hasQuestions);
    const result = stars.getDailyInvitation(choices.map(item => item.kind), input.random);
    if (!result.ok) return Promise.resolve(result);
    const activity = activityCatalog.byKind(result.data && result.data.kind);
    if (!activity) return Promise.resolve({ ok: false, error: { code: 'ACTIVITY_UNAVAILABLE', message: '今天的活动还没有准备好。' } });
    data.today.activityKind = activity.kind;
    data.today.interactionLabel = activity.label;
    if (activity.title) data.today.title = activity.title;
    if (activity.line) data.today.line = activity.line;
    if (activity.tomorrowHint) data.today.tomorrowHint = activity.tomorrowHint;
  } else data.today.activityKind = scenario === 'normal' ? 'drawing' : 'ordinary';
  if (input.pet) {
    const pet = input.pet;
    const name = String(pet.name || pet.nickname || pet.prototype || '蛋宝宝');
    data.pet = { id: pet.id, name };
    data.today.title = data.today.title.replace(/玉兔/g, name);
    data.today.line = data.today.line.replace(/玉兔/g, name);
    data.today.interactionFeedback = data.today.interactionFeedback.replace(/玉兔/g, name);
  }
  data.dateKey = shanghaiDate();
  return Promise.resolve({ ok: true, data });
}

module.exports = {
  contractVersion: 'iaa-mvp-v1',
  source: 'local-fixture',
  getTodayView
};
