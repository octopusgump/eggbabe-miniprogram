const fixture = require('../fixtures/iaa-star-unlock');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStarUnlockView(options) {
  const state = String(options && options.state || 'AVAILABLE');
  const data = fixture.starUnlockViewFor(state);
  if (!data) {
    return Promise.resolve({ ok: false, error: { code: 'UNKNOWN_LOCAL_STATE', message: '没有找到这个本地演示状态。' } });
  }
  return Promise.resolve({ ok: true, data });
}

function recordCompanion(view) {
  const current = clone(view);
  const status = current && current.star && current.star.dailyClaimStatus;
  if (!current || !status) {
    return Promise.resolve({ ok: false, error: { code: 'INVALID_LOCAL_VIEW', message: '这次陪伴还没有准备好。' } });
  }
  if (status === 'ERROR') {
    return Promise.resolve({ ok: false, error: { code: 'LOCAL_FIXTURE_RECORD_FAILED', message: '刚才没有记下来，请再试一次。' } });
  }
  if (status === 'CLAIMED' || status === 'UNLOCKED') {
    return Promise.resolve({ ok: true, data: current, awardedStars: 0, duplicate: true });
  }

  current.star.balance += 1;
  current.progress = fixture.progressPresentation(current.star.balance, current.star.nextUnlockAt);
  const unlocked = current.star.balance >= current.nextMemory.unlockedAtStar;
  current.star.dailyClaimStatus = unlocked ? 'UNLOCKED' : 'CLAIMED';
  current.newlyUnlockedMemory = unlocked ? clone(current.nextMemory) : null;
  current.helperText = unlocked
    ? '今天的陪伴已经记下，也有一段新的回忆被轻轻打开。'
    : '今天的陪伴已经记下，再陪一会儿也不会重复增加。';
  return Promise.resolve({ ok: true, data: current, awardedStars: 1, duplicate: false });
}

function retryCompanion() {
  return getStarUnlockView({ state: 'AVAILABLE' }).then(result => {
    if (!result.ok) return result;
    return recordCompanion(result.data);
  });
}

module.exports = {
  contractVersion: 'iaa-mvp-v1',
  source: 'local-fixture',
  getStarUnlockView,
  recordCompanion,
  retryCompanion
};
