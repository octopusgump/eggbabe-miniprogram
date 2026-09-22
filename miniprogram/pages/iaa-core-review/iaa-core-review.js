const config = require('../../config/v2');

const CORE_ITEMS = Object.freeze([
  Object.freeze({
    key: 'today',
    step: '01',
    title: '今日陪伴',
    summary: '看见今天的小变化，完成一次轻量陪伴。',
    meta: '当日内容',
    symbol: '♡',
    tone: 'sage',
    route: '/pages/iaa-today-companion/iaa-today-companion'
  }),
  Object.freeze({
    key: 'star',
    step: '02',
    title: '陪伴星星',
    summary: '回到房间左上角，在今日心情处查看累计与进度。',
    meta: '房间状态',
    symbol: '✦',
    tone: 'gold',
    route: '/pages/life-scene/life-scene?entry=iaa-core-review'
  }),
  Object.freeze({
    key: 'tomorrow',
    step: '03',
    title: '明日钩子',
    summary: '信件初始就能看到“明天呢？”，点击后只展开一句明日内容。',
    meta: '同页出现',
    symbol: '☾',
    tone: 'blue',
    route: '/pages/iaa-today-companion/iaa-today-companion?entry=tomorrow-review'
  }),
  Object.freeze({
    key: 'memory',
    step: '04',
    title: '极简纪念册',
    summary: '已暂停开发；只保留列表验收入口，不作为本次上线范围。',
    meta: '留存结果',
    symbol: '◌',
    tone: 'rose',
    route: '/pages/iaa-memory-album-demo/iaa-memory-album-demo'
  })
]);

Page({
  data: {
    isDev: config.localDemoEnabled,
    coreItems: CORE_ITEMS
  },

  onLoad() {
    if (this.data.isDev) return;
    wx.reLaunch({ url: '/pages/welcome/welcome' });
  },

  onOpenItem(event) {
    if (!this.data.isDev) return;
    const key = String(event.currentTarget.dataset.key || '');
    const target = CORE_ITEMS.find(item => item.key === key);
    if (!target) return;
    wx.navigateTo({ url: target.route });
  }
});
