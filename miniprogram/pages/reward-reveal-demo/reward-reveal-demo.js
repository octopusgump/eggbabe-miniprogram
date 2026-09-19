const REVEAL_FIXTURES = {
  DAILY: {
    tier: 'DAILY',
    title: '雨天的叶子',
    memory: '玉兔散步时带回来的一片叶子。',
    dateLabel: '2026年9月20日',
    image: '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/png/keepsake_jade_rabbit_osmanthus_branch_card_square_3d_transparent_v01.png',
    sceneImage: ''
  },
  SPECIAL: {
    tier: 'SPECIAL',
    title: '没画完的画',
    memory: '它说还差一点，第二天真的把颜色补完了。',
    dateLabel: '2026年9月20日',
    image: '/assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/candidates/3d-turnarounds-v01/jade_rabbit_drawing_turnaround_tail_v01.webp',
    sceneImage: ''
  },
  RARE: {
    tier: 'RARE',
    title: '月光下的小旅行',
    memory: '它把远方的一点月光，悄悄带回了家。',
    dateLabel: '2026年9月20日',
    image: '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/png/keepsake_jade_rabbit_moon_phase_cards_card_square_3d_transparent_v01.png',
    sceneImage: ''
  },
  MEMORY: {
    tier: 'MEMORY',
    title: '第一次看雪',
    memory: '原来雪落下来的时候，房间会变得这么安静。',
    dateLabel: '2026年冬 · 和玉兔一起',
    image: '',
    sceneImage: '/assets/scenes/lifecycle/pre-hatch/10-background/incubation-room/season-weather-full-scenes/winter_snow_night.webp'
  }
};

const TIER_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'RARE', label: 'Rare' },
  { value: 'MEMORY', label: 'Memory' }
];

const DURATION_OPTIONS = [
  { value: 1500, label: '1.5 秒' },
  { value: 2200, label: '2.2 秒' },
  { value: 3000, label: '3.0 秒' }
];

Page({
  data: {
    tierOptions: TIER_OPTIONS,
    durationOptions: DURATION_OPTIONS,
    selectedTier: 'DAILY',
    selectedDuration: 2200,
    soundEnabled: false,
    hapticEnabled: false,
    revealVisible: false,
    currentFixture: REVEAL_FIXTURES.DAILY,
    phaseLabel: '等待预览',
    collectedLabel: '',
    backgroundImage: '/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_draw_day_v01.webp'
  },

  onTierTap(event) {
    if (this.data.revealVisible) return;
    const tier = String(event.currentTarget.dataset.tier || 'DAILY');
    this.setData({
      selectedTier: tier,
      currentFixture: REVEAL_FIXTURES[tier] || REVEAL_FIXTURES.DAILY,
      phaseLabel: '等待预览',
      collectedLabel: ''
    });
  },

  onDurationTap(event) {
    if (this.data.revealVisible) return;
    this.setData({ selectedDuration: Number(event.currentTarget.dataset.duration) || 2200 });
  },

  onSoundChange(event) {
    this.setData({ soundEnabled: Boolean(event.detail.value) });
  },

  onHapticChange(event) {
    this.setData({ hapticEnabled: Boolean(event.detail.value) });
  },

  onPreview() {
    if (this.data.revealVisible) return;
    this.setData({ revealVisible: true, phaseLabel: 'discover · 发现', collectedLabel: '' });
  },

  onPhaseChange(event) {
    const labels = {
      discover: 'discover · 发现',
      pause: 'pause · 停顿',
      reveal: 'reveal · 揭晓',
      settle: 'settle · 看清',
      ready: 'ready · 等待收下'
    };
    this.setData({ phaseLabel: labels[event.detail.phase] || event.detail.phase });
  },

  onCollect(event) {
    this.setData({
      revealVisible: false,
      phaseLabel: '完成 · 已回到原场景',
      collectedLabel: `已收下「${event.detail.title}」`
    });
  }
});
