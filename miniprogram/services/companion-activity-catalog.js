// 信件邀请配置。后续小游戏增加一个条目即可，不按按钮文案判断路由。
const ACTIVITIES = Object.freeze([
  Object.freeze({ kind: 'listen', route: '/pages/listen/listen', label: '听你说', title: '想听你说件小事', line: '有几件小事想和你聊聊，你来选就好。', tomorrowHint: '别的小事，我们下次接着说。' }),
  Object.freeze({ kind: 'drawing', route: '/pages/doodle/doodle?entry=companion', label: '一起画' })
]);
function byKind(kind) { return ACTIVITIES.find(item => item.kind === kind); }
module.exports = { ACTIVITIES, byKind };
