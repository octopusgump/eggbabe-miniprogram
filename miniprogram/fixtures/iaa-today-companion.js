const SCENE_ROOT = '/assets/scenes/lifecycle/post-hatch';

const COMMON = Object.freeze({
  contractVersion: 'iaa-mvp-v1',
  source: 'local-fixture',
  serverNow: '2026-09-20T08:20:00+08:00',
  dateKey: '2026-09-20',
  displayDate: '9月20日 · 星期日',
  pet: Object.freeze({
    id: 'demo-jade-rabbit',
    name: '玉兔'
  }),
  star: Object.freeze({
    balance: 2,
    dailyClaimStatus: 'AVAILABLE',
    nextUnlockAt: 3
  })
});

const TODAY_SCENARIOS = Object.freeze({
  normal: Object.freeze({
    scenarioKey: 'normal',
    dayType: 'NORMAL',
    eyebrow: '普通的一天',
    title: '玉兔在窗边画画',
    line: '这个圆有一点点歪，但我觉得它很像月亮。',
    tomorrowHint: '桌上还压着半张没有画完的纸。',
    interactionLabel: '陪它画一会儿',
    interactionFeedback: '你坐下以后，房间里好像更安静了。',
    atHome: true,
    sceneImage: `${SCENE_ROOT}/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_draw_day_v01.webp`,
    accent: 'sage'
  }),
  surprise: Object.freeze({
    scenarioKey: 'surprise',
    dayType: 'SURPRISE',
    eyebrow: '今天有一点不同',
    title: '玉兔找到一段旧旋律',
    line: '你听，最后一个音像太阳慢慢落下去。',
    tomorrowHint: '收音机里还有一段没听完的旋律。',
    interactionLabel: '一起听完这一段',
    interactionFeedback: '它没有说话，只是把收音机往你这边挪了挪。',
    atHome: true,
    sceneImage: `${SCENE_ROOT}/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_music_sunset_v01.webp`,
    accent: 'amber'
  }),
  away: Object.freeze({
    scenarioKey: 'away',
    dayType: 'RARE',
    eyebrow: '今天出门了',
    title: '房间里留着一张小纸条',
    line: '我去看看风把叶子吹到了哪里，晚一点回来。',
    tomorrowHint: '窗边空着的位置，好像在等什么回来。',
    interactionLabel: '替它收好纸条',
    interactionFeedback: '你把纸条压在杯子旁边，等它回来。',
    atHome: false,
    sceneImage: `${SCENE_ROOT}/10-background/panorama-three-screen/post_hatch_room_panorama_empty_day_placeholder.webp`,
    accent: 'sky'
  }),
  return: Object.freeze({
    scenarioKey: 'return',
    dayType: 'SUPER_RARE',
    eyebrow: '刚刚回到家',
    title: '玉兔带回一片雨后的叶子',
    line: '它的边边会发亮，我想让你也看看。',
    tomorrowHint: '那片叶子被夹进书里，等明天再翻开。',
    interactionLabel: '听它讲回来的路',
    interactionFeedback: '玉兔讲得很慢，像是怕漏掉路上的一点风。',
    atHome: true,
    sceneImage: `${SCENE_ROOT}/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_read_sunset_v01.webp`,
    accent: 'rose'
  })
});

const SCENARIO_OPTIONS = Object.freeze([
  Object.freeze({ key: 'normal', label: '普通' }),
  Object.freeze({ key: 'surprise', label: '惊喜' }),
  Object.freeze({ key: 'away', label: '外出' }),
  Object.freeze({ key: 'return', label: '归来' })
]);

const VIEW_STATE_OPTIONS = Object.freeze([
  Object.freeze({ key: 'ready', label: '内容' }),
  Object.freeze({ key: 'loading', label: '加载' }),
  Object.freeze({ key: 'empty', label: '空态' }),
  Object.freeze({ key: 'error', label: '失败' })
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function todayViewFor(scenarioKey) {
  const scenario = TODAY_SCENARIOS[scenarioKey];
  if (!scenario) return null;
  return clone(Object.assign({}, COMMON, { today: scenario }));
}

module.exports = {
  TODAY_SCENARIOS,
  SCENARIO_OPTIONS,
  VIEW_STATE_OPTIONS,
  todayViewFor
};
