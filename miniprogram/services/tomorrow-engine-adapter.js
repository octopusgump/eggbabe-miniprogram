const fixture = require('./tomorrow-engine-fixture');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDayType(value) {
  const type = String(value || '').toUpperCase();
  return fixture.SCENARIOS.some(item => item.dayType === type) ? type : 'NORMAL';
}

function buildReviewView(dayType) {
  const normalizedType = normalizeDayType(dayType);
  const scenario = fixture.SCENARIOS.find(item => item.dayType === normalizedType);
  return {
    contractVersion: fixture.CONTRACT_VERSION,
    source: fixture.SOURCE,
    reviewOnly: true,
    ratioNotice: '70 / 20 / 9 / 1 仅用于内容审查，不代表前端正在运行分发概率。',
    scenario: clone(scenario),
    reviewRatios: clone(fixture.REVIEW_RATIOS)
  };
}

function validateReviewView(view) {
  if (!view || view.contractVersion !== 'iaa-mvp-v1') return false;
  if (view.source !== 'local-fixture' || view.reviewOnly !== true) return false;
  if (!view.scenario || !view.scenario.id || !view.scenario.dayType) return false;
  return ['NORMAL', 'SURPRISE', 'RARE', 'SUPER_RARE'].includes(view.scenario.dayType);
}

function createTomorrowEngineAdapter() {
  return {
    loadReview(dayType) {
      return Promise.resolve(buildReviewView(dayType));
    },
    listReviewOptions() {
      return clone(fixture.REVIEW_RATIOS);
    }
  };
}

module.exports = {
  normalizeDayType,
  buildReviewView,
  validateReviewView,
  createTomorrowEngineAdapter
};
