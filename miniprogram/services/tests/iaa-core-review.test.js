const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const pageRoot = path.join(root, 'pages/iaa-core-review');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const logic = fs.readFileSync(path.join(pageRoot, 'iaa-core-review.js'), 'utf8');
const template = fs.readFileSync(path.join(pageRoot, 'iaa-core-review.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(pageRoot, 'iaa-core-review.wxss'), 'utf8');
const scopeDoc = fs.readFileSync(path.resolve(root, '../docs/iaa-core-loop-scope.md'), 'utf8');

const reviewRoute = 'pages/iaa-core-review/iaa-core-review';
const expectedRoutes = [
  '/pages/iaa-today-companion/iaa-today-companion',
  '/pages/life-scene/life-scene?entry=iaa-core-review',
  '/pages/iaa-today-companion/iaa-today-companion?entry=tomorrow-review',
  '/pages/iaa-memory-album-demo/iaa-memory-album-demo'
];

assert.equal(app.pages[0], reviewRoute, '四项验收台必须是开发启动第一页');
assert.equal(app.pages.includes('pages/iaa-star-unlock/iaa-star-unlock'), false, '陪伴星星不得继续注册为独立页面');
assert.equal(app.pages.includes('pages/iaa-memory-detail-demo/iaa-memory-detail-demo'), false, '纪念详情不得继续注册');
assert.equal(app.pages.includes('pages/iaa-memory-save-demo/iaa-memory-save-demo'), false, '纪念保存卡不得继续注册');
assert.equal(app.pages.includes('pages/tomorrow-engine-demo/tomorrow-engine-demo'), false, '明日提示必须留在今日陪伴流程，不得注册为独立页面');

for (const route of expectedRoutes) {
  assert.equal(logic.includes(`route: '${route}'`), true, `验收台必须提供入口：${route}`);
}
assert.equal((logic.match(/route: '\/pages\//g) || []).length, 4, '验收台必须且只能有四个页面入口');
for (const label of ['今日陪伴', '陪伴星星', '明日提示', '极简纪念册']) {
  assert.equal(logic.includes(label), true, `验收台缺少保留项：${label}`);
}
for (const boundary of ['LOCAL FIXTURE', 'NO BACKEND', '不代表已合入 main']) {
  assert.equal(template.includes(boundary), true, `首屏必须显示边界：${boundary}`);
}
assert.equal(/reward|ad-state|compliance-demo|广告验收/.test(`${logic}\n${template}`), false, '验收台不得引入奖励、广告或独立合规入口');
assert.equal(/wx\.(?:request|cloud|setStorage|getStorage)/.test(logic), false, '验收台不得联网或读写账户状态');
assert.equal(styles.includes('background:#123719') && styles.includes('border-radius:36rpx'), true, '验收首页必须保留清晰的核心视觉层级');
assert.equal(scopeDoc.includes('今日陪伴 → 陪伴星星 → 明日提示 → 极简纪念册'), true, '范围文档必须固定唯一主循环');
assert.equal(scopeDoc.includes('奖励揭晓') && scopeDoc.includes('广告状态') && scopeDoc.includes('独立合规验收页'), true, '范围文档必须写清删减项');

let definition;
const previousPage = global.Page;
const previousWx = global.wx;
const routes = [];
global.Page = page => { definition = page; };
global.wx = { navigateTo({ url }) { routes.push(url); } };
delete require.cache[require.resolve('../../pages/iaa-core-review/iaa-core-review')];
require('../../pages/iaa-core-review/iaa-core-review');

assert.equal(definition.data.coreItems.length, 4, '页面数据必须只有四项');
for (const item of definition.data.coreItems) {
  definition.onOpenItem({ currentTarget: { dataset: { key: item.key } } });
}
assert.deepEqual(routes, expectedRoutes, '四张卡片必须按主循环顺序进入对应页面');
definition.onOpenItem({ currentTarget: { dataset: { key: 'unknown' } } });
assert.equal(routes.length, 4, '未知卡片不得跳转');

global.Page = previousPage;
global.wx = previousWx;

console.log('IAA 四项验收首页、路由收敛、静态边界与跳转顺序校验通过。');
