const MEMORY_IMAGE = '/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_draw_day_v01.webp';

const MEMORY = Object.freeze({
  id: 'memory-unfinished-drawing',
  name: '没画完的画',
  line: '它说还差一点，第二天真的把颜色补完了。',
  unlockedAtStar: 3,
  image: MEMORY_IMAGE
});

const STATE_OPTIONS = Object.freeze([
  Object.freeze({ key: 'AVAILABLE', label: '可领取' }),
  Object.freeze({ key: 'CLAIMED', label: '已领取' }),
  Object.freeze({ key: 'UNLOCKED', label: '已解锁' }),
  Object.freeze({ key: 'ERROR', label: '失败' })
]);

const STATE_FIXTURES = Object.freeze({
  AVAILABLE: Object.freeze({ balance: 2, dailyClaimStatus: 'AVAILABLE', newlyUnlockedMemory: null }),
  CLAIMED: Object.freeze({ balance: 2, dailyClaimStatus: 'CLAIMED', newlyUnlockedMemory: null }),
  UNLOCKED: Object.freeze({ balance: 3, dailyClaimStatus: 'UNLOCKED', newlyUnlockedMemory: MEMORY }),
  ERROR: Object.freeze({ balance: 2, dailyClaimStatus: 'ERROR', newlyUnlockedMemory: null })
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function progressPresentation(balance, target) {
  const current = Math.max(0, Number(balance) || 0);
  const next = Math.max(1, Number(target) || 1);
  return {
    current,
    target: next,
    remaining: Math.max(0, next - current),
    percent: Math.min(100, Math.round(current / next * 100))
  };
}

function starUnlockViewFor(stateKey) {
  const state = STATE_FIXTURES[stateKey];
  if (!state) return null;
  const star = {
    balance: state.balance,
    dailyClaimStatus: state.dailyClaimStatus,
    nextUnlockAt: 3
  };
  return clone({
    contractVersion: 'iaa-mvp-v1',
    source: 'local-fixture',
    serverNow: '2026-09-20T08:20:00+08:00',
    dateKey: '2026-09-20',
    pet: { id: 'demo-jade-rabbit', name: '玉兔' },
    star,
    progress: progressPresentation(star.balance, star.nextUnlockAt),
    nextMemory: MEMORY,
    newlyUnlockedMemory: state.newlyUnlockedMemory,
    helperText: state.dailyClaimStatus === 'CLAIMED'
      ? '今天这颗星星已经收好了，再陪一会儿也不会重复增加。'
      : '星星只记录陪伴，不会因为几天没来而减少。'
  });
}

module.exports = {
  MEMORY,
  STATE_OPTIONS,
  starUnlockViewFor,
  progressPresentation
};
