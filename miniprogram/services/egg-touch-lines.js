const COMMON = [
  '呼呼呼……打呼噜',
  '我刚才睡着了，你别说出去',
  '再睡五分钟',
  '我梦到自己会飞',
  '我梦见一个圆圆的东西，好像是我自己',
  '睡得有点歪，我调整一下',
  '打了个哈欠，壳里全是回声',
  '我在数数，数到一百就起来',
  '刚才好像做梦了，可是我忘了',
  '睡饱了才有力气长大',
  '我把自己团成一团睡',
  '嘘，我在睡觉',
  '外面的世界是什么样的呢',
  '外面有风吗',
  '现在是白天还是晚上',
  '我听见有声音，是你吗',
  '外面是不是有好吃的',
  '我想知道天空长什么样',
  '有人在走路，一下一下的',
  '外面亮亮的，那是什么',
  '世界大吗？比我大吗',
  '外面有没有和我一样的蛋',
  '我猜外面是软的',
  '天上真的有云吗',
  '出去以后我先看哪边好呢',
  '我想看看颜色，什么颜色都行',
  '壳里有点挤，不过很暖和',
  '我翻了个身',
  '我踢了一下，你感觉到了吗',
  '壳有点硬，我靠着睡',
  '我在里面伸了个懒腰',
  '这里黑黑的，可是我不怕',
  '我把耳朵贴在壳上听',
  '我数过了，这里只有我一个',
  '我转了个圈，有点晕',
  '我在壳上敲了敲，咚咚咚',
  '今天我又长大了一点点',
  '我在里面挑了个舒服的姿势',
  '壳里安安静静的，挺好',
  '我刚才打了个嗝',
  '刚才是你在摸我吗',
  '你的手有点凉',
  '有人碰我了，我知道是你',
  '你今天来得挺早',
  '我听见你了',
  '你摸我的时候，我这里暖暖的',
  '你说话我都听见了，就是还不会回你',
  '你在我就安心了',
  '再摸一下也可以的',
  '你今天声音听起来不错',
  '我记住你了',
  '你也在啊，那挺好',
  '我在长牙齿，等下用它敲壳',
  '我攒了好久的力气',
  '我在练习睁眼睛',
  '我在练习怎么站起来',
  '等我出来，第一个看你',
  '我先把自己叠好，出来才好看',
  '我在想出来第一句说什么',
  '我练了一下走路，摔了',
  '我还没准备好，再等等我',
  '我今天很努力地长了长'
];

const PERIOD = {
  day: ['外面亮起来了', '白天有点吵，不过我喜欢', '今天光照到我这边了', '白天过得好快'],
  night: ['外面安静下来了', '该睡啦，你也早点睡', '晚上壳里更暖一点', '夜里我听得更清楚']
};

const WEATHER = {
  sunny: ['外面暖烘烘的', '今天有太阳吧，我这边热热的'],
  cloudy: ['今天的光有点软', '外面灰灰的，也挺好'],
  rain: ['我听见水滴的声音', '下雨天壳里最舒服'],
  snow: ['外面变得好安静，是下雪吗', '有点冷，我缩了缩']
};

const NEAR_HATCH = [
  '壳好像变薄了',
  '我能看见一点点光了',
  '我有点紧张，你别走开',
  '快了，真的快了',
  '我准备好了，就差一下下',
  '待会儿见'
];

function poolFor(context) {
  const source = context || {};
  const period = source.period === 'night' ? 'night' : 'day';
  const weather = WEATHER[source.weather] ? source.weather : 'sunny';
  const pool = COMMON.concat(PERIOD[period], WEATHER[weather]);
  return source.nearHatch ? pool.concat(NEAR_HATCH) : pool;
}

function choose(context, recent, randomValue) {
  const history = Array.isArray(recent) ? recent.slice(-5) : [];
  const pool = poolFor(context);
  const available = pool.filter(line => !history.includes(line));
  const candidates = available.length ? available : pool;
  const random = Number.isFinite(Number(randomValue)) ? Number(randomValue) : Math.random();
  const index = Math.min(candidates.length - 1, Math.floor(Math.max(0, random) * candidates.length));
  return candidates[index] || COMMON[0];
}

module.exports = { COMMON, PERIOD, WEATHER, NEAR_HATCH, poolFor, choose };
