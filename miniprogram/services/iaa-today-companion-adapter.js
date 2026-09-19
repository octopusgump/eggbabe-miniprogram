const fixture = require('../fixtures/iaa-today-companion');

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
  return Promise.resolve({ ok: true, data });
}

module.exports = {
  contractVersion: 'iaa-mvp-v1',
  source: 'local-fixture',
  getTodayView
};
