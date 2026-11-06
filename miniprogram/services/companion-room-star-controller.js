const { rollDurationMs } = require('../utils/companion-star-roll');

function displayValue(page) {
  const roll = Number(page.data.companionStarRollValue);
  if (roll >= 0) return roll;
  const balance = Number(page.data.companionStarBalance);
  return balance >= 0 ? balance : -1;
}

function formatGainLabel(delta) {
  const change = Number(delta);
  if (!change) return '';
  return change > 0 ? `+${change}` : String(change);
}

function scheduleAwardEnd(page) {
  clearTimeout(page.companionStarAwardTimer);
  const from = displayValue(page);
  const to = Number(page.data.companionStarBalance);
  const duration = rollDurationMs(from, to, page.data.reducedMotion);
  const hold = duration > 0 ? Math.min(duration + 180, 2000) : 900;
  page.companionStarAwardTimer = setTimeout(() => {
    if (page.pageActive) {
      page.setData({ companionStarAwardVisible: false, companionStarGainLabel: '' });
    }
  }, hold);
}

function maybePlayAward(page, canShow) {
  const target = Number(page.data.companionStarBalance);
  const from = displayValue(page);
  if (target < 0 || from < 0) {
    page.companionStarAwardPending = false;
    return false;
  }
  if (!page.companionStarAwardPending && from === target) return false;
  if (typeof canShow === 'function' && !canShow(page)) return false;
  const delta = target - from;
  page.companionStarAwardPending = false;
  if (from === target) return false;
  page.setData({
    companionStarRollValue: target,
    companionStarAwardVisible: true,
    companionStarGainLabel: formatGainLabel(delta)
  });
  scheduleAwardEnd(page);
  return true;
}

function loadCompanionStar(page, starAdapter, options) {
  const settings = options || {};
  return starAdapter.getRoomStarView().then(result => {
    if (!page.pageActive || !result.ok || !result.data || !result.data.star) return result;
    const balance = Number(result.data.star.balance || 0);
    const claimed = result.data.star.dailyClaimStatus !== 'AVAILABLE';
    const fromDisplay = displayValue(page);
    const balanceChanged = fromDisplay >= 0 && balance !== fromDisplay;
    const drawingDone = Boolean(result.data.star.drawingCompleted);
    const patch = {
      companionStarBalance: balance,
      companionDays: Number(result.data.star.companionDays || 0),
      companionStarClaimed: claimed,
      companionStarProgressText: '',
      togetherDrawDockLabel: drawingDone ? '去玩' : '赚 10✦'
    };
    if (balanceChanged) {
      page.companionStarAwardPending = true;
    } else if (fromDisplay < 0) {
      patch.companionStarRollValue = balance;
      patch.companionStarAwardVisible = false;
      patch.companionStarGainLabel = '';
    }
    page.setData(patch);
    clearTimeout(page.companionStarAwardTimer);
    if (balanceChanged) {
      const canShow = settings.canShowAward;
      if (!maybePlayAward(page, canShow)) {
        page.setData({ companionStarAwardVisible: false, companionStarGainLabel: '' });
      }
    } else if (!balanceChanged) {
      page.setData({ companionStarAwardVisible: false, companionStarGainLabel: '' });
    }
    return result;
  });
}

module.exports = {
  displayValue,
  formatGainLabel,
  maybePlayAward,
  loadCompanionStar
};
