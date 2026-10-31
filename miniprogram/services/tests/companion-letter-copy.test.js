const assert = require('assert');
const catalog = require('../companion-activity-catalog');
const fixture = require('../../fixtures/iaa-today-companion');

const listen = catalog.byKind('listen');
assert.equal(listen.title, '想听你说件小事');
assert.equal(listen.line, '有几件小事想和你聊聊，你来选就好。');
assert.equal(listen.tomorrowHint, '别的小事，我们下次接着说。');
assert.equal(listen.label, '听你说');

const away = fixture.todayViewFor('away').today;
assert.equal(away.title, '房间里留着一封信件');
assert.equal(away.line, '我去看看风把叶子吹到了哪里，晚一点回来。');
assert.equal(away.interactionLabel, '替他收好信件');
assert.equal(away.tomorrowHint, '窗边空着的位置，好像在等什么回来。');
assert.equal(away.interactionFeedback, '你把信件压在杯子旁边，等它回来。');

console.log('信件文案与 Figma 05 听你说 / PRD 外出牵挂口径一致。');
