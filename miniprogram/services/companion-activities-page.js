const assets = require('../config/companion-activities-page-assets');
const listenAdapter = require('./listen-adapter');
const stars = require('./iaa-star-unlock-adapter');

function listenDailyFull() {
  const state = listenAdapter.getState().data;
  if (state.exhausted) return true;
  return !state.categories.length && Boolean(state.completedToday);
}

function row(key, title, icon, options) {
  const disabled = Boolean(options.disabled);
  if (disabled) {
    return { key, title, icon, disabled: true, ctaText: '明天再来', ctaWide: true, route: '', comingSoon: false, dimmed: false, earn: false };
  }
  if (options.comingSoon) {
    return {
      key,
      title,
      icon,
      disabled: false,
      ctaText: '想玩',
      ctaWide: false,
      route: '',
      comingSoon: true,
      dimmed: true,
      earn: false,
      phaseTag: options.phaseTag || '下期',
      modalLines: options.modalLines || []
    };
  }
  if (options.earn) {
    return { key, title, icon, disabled: false, ctaPrefix: '赚', ctaSuffix: '10', ctaWide: false, route: options.route || '', comingSoon: false, dimmed: false, earn: true, cost: 10 };
  }
  return {
    key,
    title,
    icon,
    disabled: false,
    ctaPrefix: '花',
    ctaSuffix: String(options.cost || 20),
    ctaWide: false,
    route: options.route || '',
    comingSoon: false,
    dimmed: false,
    earn: false,
    cost: options.cost || 20
  };
}

function buildView(starBalance) {
  const balance = typeof starBalance === 'number' && starBalance >= 0 ? starBalance : '—';
  return {
    starBalanceIcon: assets.starBalance,
    starBalance: balance,
    playable: [
      row('drawing', '一起画', assets.icons.draw, {
        disabled: stars.getActivityCompleted('drawing'),
        route: '/pages/doodle/doodle?entry=companion',
        cost: 20
      }),
      row('listen', '听你说', assets.icons.listen, {
        disabled: listenDailyFull(),
        route: '/pages/listen/listen',
        cost: 20
      }),
      row('meet', '遇见你', assets.icons.meet, { route: '', cost: 20 }),
      row('travel', '旅行', assets.icons.travel, { route: '', cost: 20 }),
      row('work', '打工', assets.icons.work, { earn: true, route: '', cost: 10 })
    ],
    comingSoon: [
      row('friend', '交友', assets.icons.friend, {
        comingSoon: true,
        phaseTag: '下期',
        modalLines: ['交友玩法还在准备中，下期就和你见面～', '上线后会在这里第一时间亮起来。']
      })
    ]
  };
}

async function buildViewAsync() {
  const result = await stars.getRoomStarView();
  const balance = result.ok && result.data && result.data.star ? result.data.star.balance : -1;
  return buildView(balance);
}

module.exports = { buildView, buildViewAsync, listenDailyFull };
