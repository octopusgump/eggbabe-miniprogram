const DEFAULT_MOOD_TYPE = 'CURIOSITY';

const MOOD_TYPES = Object.freeze([
  'JOY',
  'CALM',
  'EXCITEMENT',
  'CURIOSITY',
  'CARE',
  'ANXIETY',
  'FRUSTRATION',
  'FATIGUE'
]);

// 每日心情仅用于前端静态展示。这里没有日期、概率、权重、评分或持久化逻辑。
// 破壳前后只因角色是否仍在蛋壳中而使用不同的一句话，名称与通用 Emoji 完全共用。
const DAILY_MOOD_MOCKS = Object.freeze({
  JOY: Object.freeze({
    moodType: 'JOY', moodLabel: '愉快', icon: '😊', tone: 'bright',
    preHatchText: '我把开心一点点存进壳里，现在快装满了。',
    postHatchText: '我想了想，觉得自己运气挺不错的。'
  }),
  CALM: Object.freeze({
    moodType: 'CALM', moodLabel: '平静', icon: '😌', tone: 'neutral',
    preHatchText: '我的心跳找到了最舒服的节奏，不快也不慢。',
    postHatchText: '今天不想说太多话，就这样待着挺好。'
  }),
  EXCITEMENT: Object.freeze({
    moodType: 'EXCITEMENT', moodLabel: '兴奋', icon: '🤩', tone: 'bright',
    preHatchText: '我今天的心跳快得能当鼓点用。',
    postHatchText: '我今天一刻都停不下来，坐下三秒又想起来。'
  }),
  CURIOSITY: Object.freeze({
    moodType: 'CURIOSITY', moodLabel: '好奇', icon: '🤔', tone: 'neutral',
    preHatchText: '我在壳里说话，外面听得见吗？',
    postHatchText: '我今天一直在想一件事，还没想明白。'
  }),
  CARE: Object.freeze({
    moodType: 'CARE', moodLabel: '关怀', icon: '🤗', tone: 'neutral',
    preHatchText: '我知道有些事很难，难就慢慢来。',
    postHatchText: '我想安静陪一会儿，就在旁边不出声。'
  }),
  ANXIETY: Object.freeze({
    moodType: 'ANXIETY', moodLabel: '焦虑', icon: '😰', tone: 'subdued',
    preHatchText: '我壳里有个地方一直在跳，跳得我心慌。',
    postHatchText: '我今天心里一直不太稳，说不上来为什么。'
  }),
  FRUSTRATION: Object.freeze({
    moodType: 'FRUSTRATION', moodLabel: '沮丧', icon: '😞', tone: 'subdued',
    preHatchText: '我刚才想说一句话，结果一紧张忘了。',
    postHatchText: '有件事我试了好几次，还是不行，先放着吧。'
  }),
  FATIGUE: Object.freeze({
    moodType: 'FATIGUE', moodLabel: '疲惫', icon: '🥱', tone: 'subdued',
    preHatchText: '我把自己缩成最小的一团，这样比较省力气。',
    postHatchText: '我今天没什么力气，动一下要歇三下。'
  })
});

const MOOD_PREVIEW_OPTIONS = Object.freeze(MOOD_TYPES.map(moodType => {
  const mood = DAILY_MOOD_MOCKS[moodType];
  return Object.freeze({ key: moodType, label: `${mood.icon} ${mood.moodLabel}` });
}));

function normalizeMoodType(moodType) {
  const value = String(moodType || '').toUpperCase();
  return Object.prototype.hasOwnProperty.call(DAILY_MOOD_MOCKS, value) ? value : DEFAULT_MOOD_TYPE;
}

function mockDailyMood(stage, moodType) {
  const source = DAILY_MOOD_MOCKS[normalizeMoodType(moodType)];
  const preHatch = stage !== 'post-hatch';
  return Object.freeze({
    moodType: source.moodType,
    moodLabel: source.moodLabel,
    icon: source.icon,
    tone: source.tone,
    text: preHatch ? source.preHatchText : source.postHatchText
  });
}

module.exports = {
  DEFAULT_MOOD_TYPE,
  MOOD_TYPES,
  DAILY_MOOD_MOCKS,
  MOOD_PREVIEW_OPTIONS,
  normalizeMoodType,
  mockDailyMood
};
