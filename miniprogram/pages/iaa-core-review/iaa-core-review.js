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
    title: '明日提示',
    summary: '留下一句轻线索，给明天一个回来的理由。',
    meta: '次日线索',
    symbol: '☾',
    tone: 'blue',
    route: '/pages/tomorrow-engine-demo/tomorrow-engine-demo'
  }),
  Object.freeze({
    key: 'memory',
    step: '04',
    title: '极简纪念册',
    summary: '只保留已解锁的纪念，不做复杂收集系统。',
    meta: '留存结果',
    symbol: '◌',
    tone: 'rose',
    route: '/pages/iaa-memory-album-demo/iaa-memory-album-demo'
  })
]);

Page({
  data: {
    coreItems: CORE_ITEMS
  },

  onOpenItem(event) {
    const key = String(event.currentTarget.dataset.key || '');
    const target = CORE_ITEMS.find(item => item.key === key);
    if (!target) return;
    wx.navigateTo({ url: target.route });
  }
});
