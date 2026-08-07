const assets = require('../config/post-hatch-assets');

const MAJOR_SCENES = Object.freeze({
  home: '家',
  travel: '旅行',
  work: '打工',
  school: '上学'
});

const HOME_STATES = [
  {
    key: 'sleep', major: 'home', majorLabel: '家', label: '睡觉', screen: 0,
    line: '我把被角压在脸下面，睡得很安静。', canTalk: false,
    action: { id: 'lamp_off', kind: 'lamp', screen: 0, feedback: '房间暗下来，我翻了个身。' },
    keepsake: { id: 'copper-spoon', name: '糖画铜勺', story: '小喜鹊的奶奶是庙会上画糖画的手艺人。奶奶走后，小喜鹊把那只旧铜勺带在身边，想奶奶了就画一只歪歪扭扭的喜鹊。奶奶说过，画得像不像没关系，甜就行。' }
  },
  {
    key: 'lazy', major: 'home', majorLabel: '家', label: '赖床', screen: 0,
    line: '我听见窗外亮起来了，还想再缩一会儿。', canTalk: false,
    action: { id: 'pull_blanket', kind: 'blanket', screen: 0, feedback: '被子轻轻盖好，我往里缩了缩。' },
    keepsake: { id: 'soft-button', name: '旧木纽扣', story: '这颗纽扣原本缝在一条很旧的围巾上。围巾散线以后，我把它留了下来。天气凉的时候握一会儿，就像有人替我把领口掖好了。' }
  },
  {
    key: 'stare', major: 'home', majorLabel: '家', label: '发呆', screen: 1,
    line: '我盯着桌上的光斑，看它慢慢走过半张纸。', canTalk: true,
    action: { id: 'tap_pet', kind: 'pet', screen: 1, feedback: '我慢半拍地回头看你。' },
    keepsake: { id: 'sun-speck', name: '一小片光', story: '它原本只在桌角停了一会儿。我伸手去接，掌心什么也没有，心里却亮了一点。后来每次发呆，我都会看看它今天落在哪里。' }
  },
  {
    key: 'tea', major: 'home', majorLabel: '家', label: '泡茶', screen: 1,
    line: '杯口冒着一点热气，我正等它凉下来。', canTalk: true,
    action: { id: 'push_cup', kind: 'cup', screen: 1, feedback: '杯子被推近一点，我小小地抿了一口。' },
    keepsake: { id: 'tea-tag', name: '晒干的茶签', story: '第一次自己泡茶时，我把水放得太烫，等了很久才喝到。那张小茶签被蒸汽吹得卷了边。后来我总留着它，提醒自己好东西可以慢一点。' }
  },
  {
    key: 'drawing', major: 'home', majorLabel: '家', label: '涂涂画画', screen: 1,
    line: '我画了半张纸，还没有决定它像云还是像鱼。', canTalk: true,
    action: { id: 'turn_paper', kind: 'paper', screen: 1, feedback: '画纸转向你，线条终于看清了。' },
    keepsake: { id: 'short-pencil', name: '短短的铅笔', story: '这支铅笔越画越短，最后只剩两根手指那么长。我舍不得扔，因为每一道被削掉的木屑里都有一张画。现在画新东西前，我还是会先用它轻轻起稿。' }
  },
  {
    key: 'reading', major: 'home', majorLabel: '家', label: '看书', screen: 1,
    line: '这一页讲到月亮，我把耳朵靠近一点听。', canTalk: true,
    action: { id: 'turn_book_page', kind: 'book', screen: 1, feedback: '书页翻过去，故事又向前走了一小格。' },
    keepsake: { id: 'short-pencil', name: '短短的铅笔', story: '这支铅笔越画越短，最后只剩两根手指那么长。我舍不得扔，因为每一道被削掉的木屑里都有一张画。现在画新东西前，我还是会先用它轻轻起稿。' }
  },
  {
    key: 'gaming', major: 'home', majorLabel: '家', label: '打游戏', screen: 1,
    line: '这一关差一点就过去了，我连耳朵都没敢动。', canTalk: false,
    action: { id: 'tap_screen', kind: 'screen', screen: 1, feedback: '画面里的小角色跳了一下，我没有抬头。' },
    keepsake: { id: 'paper-token', name: '纸做的小徽章', story: '有一关我试了很多次都没过去，就给自己剪了一枚歪歪的小徽章。它什么也不代表，只是让我愿意再笑一次。后来卡住的时候，我都会把它放在屏幕边。' }
  },
  {
    key: 'music', major: 'home', majorLabel: '家', label: '听音乐', screen: 1,
    line: '这首歌的尾巴轻轻绕了一圈，我还不想按暂停。', canTalk: true,
    action: { id: 'listen_together', kind: 'music', screen: 1, feedback: '旋律又走了一小段，房间里像多了一点月光。' },
    keepsake: { id: 'wood-rattle', name: '小拨浪鼓', story: '课堂结束时，老师拿它演示声音怎样一圈圈传出去。我轻轻摇了一下，教室里的人都笑了。后来每当想不出问题，我就听它先替我开个头。' }
  },
  {
    key: 'window', major: 'home', majorLabel: '家', label: '看窗外', screen: 2,
    line: '远处的云走得很慢，我想和你一起看一会儿。', canTalk: true,
    action: { id: 'view_daily_window', kind: 'window', screen: 2, feedback: '窗外的光慢慢铺开，我陪你看着上海此刻的天空。' },
    keepsake: { id: 'window-leaf', name: '窗边的叶子', story: '风把它送到窗沿时，叶脉还透着光。我没有把它夹进很厚的书里，只放在每天都看得见的地方。它变干以后，风吹过的纹路反而更清楚了。' }
  }
];

const AWAY_STATES = [
  { key: 'dali', major: 'travel', majorLabel: '旅行', label: '大理', line: '大理的风比我想的大，我把帽子按住了一路。', keepsake: { id: 'dali-cloud', name: '苍山脚下的云石', story: '我在风很大的路边看到它，白色纹路像一小片被压住的云。带回来以后，我总把它放在窗边。天气变化时，那片云也像会换一种颜色。' } },
  { key: 'cafe', major: 'work', majorLabel: '打工', label: '咖啡店', line: '今天学会把杯子擦得很亮，窗外的光都照进来了。', keepsake: { id: 'cafe-coaster', name: '软木杯垫', story: '忙乱的时候，有位客人把歪掉的杯垫扶正了。那只是一个很小的动作，却让桌面突然安静下来。后来收桌子时，我也总会顺手替下一位摆正它。' } },
  { key: 'ai-class', major: 'school', majorLabel: '上学', label: '学 AI', line: '老师说问题问得好，答案才会慢慢靠近。', keepsake: { id: 'wood-rattle', name: '小拨浪鼓', story: '课堂结束时，老师拿它演示声音怎样一圈圈传出去。我轻轻摇了一下，教室里的人都笑了。后来每当想不出问题，我就听它先替我开个头。' } },
  { key: 'beijing', major: 'travel', majorLabel: '旅行', label: '北京', line: '银杏叶落在红墙边，风一吹就翻了个金色的面。', keepsake: { id: 'ginkgo-leaf', name: '一片银杏叶', story: '它落下来时正好停在我的鞋尖。我把它夹在信纸里带回家，边缘慢慢变得像金色的小扇子。每次写信，我都会先看看它有没有又轻一点。' } },
  { key: 'restaurant', major: 'work', majorLabel: '打工', label: '餐厅', line: '最后一张桌子收好了，我偷偷闻了一下刚出炉的面包香。', keepsake: { id: 'bread-ticket', name: '手写面包签', story: '厨房第一次让我替刚出炉的面包写名字，我把一个字写得太胖。大家没有重写，只在旁边画了一张笑脸。后来那张签一直留在我的口袋里。' } },
  { key: 'weather-class', major: 'school', majorLabel: '上学', label: '学气象预报', line: '我学会看云的边缘，原来雨来之前会先留下小小的暗线。', keepsake: { id: 'cloud-note', name: '云朵观察纸', story: '第一张观察纸上，我把每一朵云都画成了棉花糖。老师说没关系，先记住自己看见的样子。后来预报天气前，我还是会先画一朵属于今天的云。' } },
  { key: 'xishuangbanna', major: 'travel', majorLabel: '旅行', label: '西双版纳', line: '雨落在很大的叶子上，我躲在下面听了好久。', keepsake: { id: 'rain-seed', name: '雨林里的种荚', story: '雨停后，它从很高的树上落在我旁边，里面还有一颗轻轻晃动的种子。我没有把它打开，只带回了那一点沙沙声。后来下雨时，我总会摇一摇它。' } },
  { key: 'delivery', major: 'work', majorLabel: '打工', label: '送外卖', line: '最后一份餐刚好还是热的，我把车骑得很稳。', keepsake: { id: 'delivery-clip', name: '红色订单夹', story: '风把第一张订单吹跑时，一位路人替我追了很远。我后来换了这个红色夹子，再大的风也不怕。每次夹好一张纸，我都会想起那个人跑回来的样子。' } },
  { key: 'carwash', major: 'work', majorLabel: '打工', label: '洗车', line: '水珠在车窗上排成一条线，太阳一照就有了小彩虹。', keepsake: { id: 'rainbow-cloth', name: '彩虹擦车布', story: '它本来只是块灰扑扑的旧布，沾了水以后却映出一点彩色的光。师傅说，认真擦过的地方都会亮起来。后来收工前，我总用它把最后一小块水迹擦干。' } },
  { key: 'english-class', major: 'school', majorLabel: '上学', label: '学英语', line: '今天记住了一个很长的单词，我念慢一点就不会打结。', keepsake: { id: 'word-book', name: '单词红宝书', story: '第一页的单词我总是念错，就在旁边画了一条小鱼帮自己记住。后来书页越来越满，那条鱼一直留在最前面。每次翻开它，我还是会先把第一个词慢慢念一遍。' } }
];

const STORY_LINE = [
  HOME_STATES[0], HOME_STATES[1], HOME_STATES[2], AWAY_STATES[0], HOME_STATES[3],
  AWAY_STATES[1], HOME_STATES[4], AWAY_STATES[2], HOME_STATES[5], HOME_STATES[6], AWAY_STATES[3],
  HOME_STATES[7], AWAY_STATES[4], HOME_STATES[8], HOME_STATES[0], AWAY_STATES[5], HOME_STATES[3],
  AWAY_STATES[6], AWAY_STATES[7], AWAY_STATES[9], AWAY_STATES[8]
];

const STATE_BY_ID = HOME_STATES.concat(AWAY_STATES).reduce((result, state) => {
  result[`${state.major}:${state.key}`] = state;
  if (state.keepsake) state.keepsake.asset = assets.POST_HATCH.keepsakes[state.keepsake.id] || '';
  return result;
}, {});

function isNightHour(hour) {
  return hour >= 23 || hour < 6;
}

function stateForSlot(slotIndex, slotStart) {
  const base = STORY_LINE[Math.abs(Number(slotIndex || 0)) % STORY_LINE.length];
  const hour = new Date(Number(slotStart || 0) + 8 * 60 * 60 * 1000).getUTCHours();
  const state = isNightHour(hour) && base.major !== 'home'
    ? (hour < 4 ? HOME_STATES[0] : HOME_STATES[6])
    : base;
  return resolveDefinition(state.major, state.key);
}

function resolveDefinition(major, key) {
  const state = STATE_BY_ID[`${major}:${key}`];
  if (!state) return null;
  const atHome = state.major === 'home';
  return Object.assign({}, state, {
    atHome,
    screen: atHome ? state.screen : 1,
    canTalk: atHome && !!state.canTalk,
    action: atHome
      ? Object.assign({}, state.action)
      : { id: 'write_letter', kind: 'letter', screen: 1, feedback: '信已经寄出，家里又安静下来。' },
    keepsake: state.keepsake ? Object.assign({}, state.keepsake) : null,
    previewImage: assets.POST_HATCH.panoramaFallback
  });
}

module.exports = { MAJOR_SCENES, HOME_STATES, AWAY_STATES, STORY_LINE, resolveDefinition, stateForSlot, assets };
