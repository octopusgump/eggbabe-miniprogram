const assert = require('assert');
const fs = require('fs');
const path = require('path');
const fixture = require('../tomorrow-engine-fixture');
const adapterModule = require('../tomorrow-engine-adapter');

const pageRoot = path.resolve(__dirname, '../../pages/tomorrow-engine-demo');
const pageLogic = fs.readFileSync(path.join(pageRoot, 'tomorrow-engine-demo.js'), 'utf8');
const template = fs.readFileSync(path.join(pageRoot, 'tomorrow-engine-demo.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(pageRoot, 'tomorrow-engine-demo.wxss'), 'utf8');
const adapterSource = fs.readFileSync(path.resolve(__dirname, '../tomorrow-engine-adapter.js'), 'utf8');
const fixtureSource = fs.readFileSync(path.resolve(__dirname, '../tomorrow-engine-fixture.js'), 'utf8');
const app = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../app.json'), 'utf8'));

assert.equal(fixture.CONTRACT_VERSION, 'iaa-mvp-v1', '合同版本必须固定为 iaa-mvp-v1');
assert.equal(fixture.SOURCE, 'local-fixture', '数据必须明确标记为本地 fixture');
assert.deepEqual(fixture.SCENARIOS.map(item => item.dayType), ['NORMAL', 'SURPRISE', 'RARE', 'SUPER_RARE'], '必须固定覆盖四种内容类型');
assert.deepEqual(fixture.SCENARIOS.map(item => item.contextType), ['HOME', 'RETURN', 'AWAY', 'WEATHER'], '必须覆盖普通、归来、外出和特殊天气提示');
assert.deepEqual(fixture.REVIEW_RATIOS.map(item => item.ratioLabel), ['70%', '20%', '9%', '1%'], '内容审查标签必须完整保留 70/20/9/1');
assert.equal(fixture.SCENARIOS.every(item => item.tomorrowHint && item.visualNote && item.image), true, '每类内容都必须有明日提示、审查备注与候选画面');
assert.equal(fixture.SCENARIOS.every(item => fs.existsSync(path.resolve(__dirname, '../..', item.image.replace(/^\//, '')))), true, '所有候选画面必须存在');

for (const type of ['NORMAL', 'SURPRISE', 'RARE', 'SUPER_RARE']) {
  const view = adapterModule.buildReviewView(type);
  assert.equal(adapterModule.validateReviewView(view), true, `${type} 必须符合统一视图合同`);
  assert.equal(view.contractVersion, 'iaa-mvp-v1', `${type} 必须带合同版本`);
  assert.equal(view.source, 'local-fixture', `${type} 必须带 fixture 来源`);
  assert.equal(view.reviewOnly, true, `${type} 必须明确只用于内容审查`);
  assert.equal(view.scenario.dayType, type, `${type} 不得被随机替换为其他内容`);
}

const firstView = adapterModule.buildReviewView('NORMAL');
firstView.scenario.title = '已改写';
assert.notEqual(adapterModule.buildReviewView('NORMAL').scenario.title, '已改写', 'adapter 每次必须返回隔离副本');

assert.equal(/Math\.random|random\(|概率算法|用户分群逻辑/.test(`${fixtureSource}\n${adapterSource}\n${pageLogic}`), false, '前端不得实现随机概率或用户分群');
assert.equal(/wx\.(?:request|cloud|setStorage|getStorage)|cloud-api|post-hatch-companion/.test(`${adapterSource}\n${pageLogic}`), false, '审查页不得联网、读写存储或调用现有业务服务');
assert.equal(/setInterval|countdown|streak/.test(`${adapterSource}\n${pageLogic}`), false, '审查页不得实现倒计时或连续签到机制');
assert.ok(template.includes('wx:if="{{debugMode}}"') && template.includes('开发验收'), '开发控制必须只在显式 debug 模式显示');
assert.ok(pageLogic.includes("query && query.debug === '1'"), '普通入口不得自动显示开发控制');
assert.equal(template.includes('Tomorrow Engine 候选内容'), false, '用户页面不得出现内部引擎名称');
assert.equal(template.includes('内容审查备注') || template.includes('本页不会做'), false, '用户页面不得夹带审查说明和产品边界');
assert.ok(template.includes('明天再来看') && template.includes('scenario.tomorrowHint'), '用户页面必须直接呈现留给明天的线索');
assert.ok(template.includes('wx:if="{{loading}}"') && template.includes('wx:elif="{{empty}}"') && template.includes('wx:elif="{{failed}}"'), '页面必须覆盖加载、空态和失败态');
assert.ok(template.includes('bindtap="onRetry"') && pageLogic.includes('onRetry()'), '空态和失败态必须可重试');
assert.ok(app.pages.includes('pages/tomorrow-engine-demo/tomorrow-engine-demo'), '隐藏开发页必须注册，供开发者工具直接打开');
assert.equal(fs.readFileSync(path.resolve(__dirname, '../../pages/home/home.wxml'), 'utf8').includes('tomorrow-engine-demo'), false, '正式首页不得出现开发验收入口');
assert.ok(styles.includes('background:#294736') && styles.includes('color:#28372D') && styles.includes('overflow-wrap:anywhere'), '用户页面必须使用陪伴页视觉语言并支持长文案');
assert.equal(/font-weight:(650|700)/.test(styles), false, '页面字重不得超过设计系统规定的 600');

console.log('Tomorrow Engine 四类固定 fixture、统一 adapter、四态页面与隔离边界校验通过。');
