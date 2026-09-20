const CONTRACT_VERSION = 'iaa-mvp-v1';
const SOURCE = 'local-fixture';

const REVIEW_RATIOS = [
  { dayType: 'NORMAL', label: '普通内容', ratioLabel: '70%' },
  { dayType: 'SURPRISE', label: '小惊喜', ratioLabel: '20%' },
  { dayType: 'RARE', label: '少见事件', ratioLabel: '9%' },
  { dayType: 'SUPER_RARE', label: '完整纪念', ratioLabel: '1%' }
];

const SCENARIOS = [
  {
    id: 'normal-home-unfinished-drawing',
    dayType: 'NORMAL',
    contextType: 'HOME',
    contextLabel: '普通 · 在家',
    reviewRatio: '70%',
    title: '桌上的画还差一点',
    todayLine: '玉兔把画笔放在纸边，好像只是暂时歇一会儿。',
    tomorrowHint: '桌上还压着半张没有画完的纸。',
    visualNote: '不弹任务，不显示完成度；只在原场景留下一处未完成的小细节。',
    image: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_draw_day_v01.webp'
  },
  {
    id: 'surprise-returning-leaf',
    dayType: 'SURPRISE',
    contextType: 'RETURN',
    contextLabel: '归来 · 小惊喜',
    reviewRatio: '20%',
    title: '口袋里藏着一片叶子',
    todayLine: '玉兔刚刚回到家，把沾着雨水的叶子放在窗边。',
    tomorrowHint: '那片叶子已经夹进书里，明天也许会变成一张小书签。',
    visualNote: '归来先讲一件小事，不强调“奖励到账”，也不要求立刻领取。',
    image: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_window_sunset_v01.webp'
  },
  {
    id: 'rare-away-note',
    dayType: 'RARE',
    contextType: 'AWAY',
    contextLabel: '外出 · 留纸条',
    reviewRatio: '9%',
    title: '今天暂时不在家',
    todayLine: '门边放着一张短短的纸条，房间里没有催促你的提示。',
    tomorrowHint: '“我去远一点的地方看看，回来时讲给你听。”',
    visualNote: '外出不泄露实时地点，不出现倒计时，也不把等待包装成任务。',
    image: '/assets/scenes/lifecycle/post-hatch/50-overlays/magic-window/backgrounds-v01/japan/tokyo/magic_window_tokyo_base_v01.webp'
  },
  {
    id: 'super-rare-first-snow',
    dayType: 'SUPER_RARE',
    contextType: 'WEATHER',
    contextLabel: '特殊天气 · 初雪',
    reviewRatio: '1%',
    title: '窗外落下了第一场雪',
    todayLine: '雪落下来的时候，房间忽然变得很安静。',
    tomorrowHint: '窗台上留着一个小小的圆印，明天再看看它是谁留下的。',
    visualNote: '完整纪念以场景变化承载，不叠加签到、连胜或稀有度炫耀。',
    image: '/assets/scenes/lifecycle/pre-hatch/10-background/incubation-room/season-weather-full-scenes/winter_snow_night.webp'
  }
];

module.exports = {
  CONTRACT_VERSION,
  SOURCE,
  REVIEW_RATIOS,
  SCENARIOS
};
