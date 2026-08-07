const assert = require('assert');
const fs = require('fs');
const path = require('path');

const preview = require('../../utils/memory-demo-preview');

const pet = {
  name: '小月',
  collectionCard: {
    card_id: 'memory-preview-card',
    display_name: '小月',
    illustration_url: '/assets/cards/YT-S01/yt-s01-001.webp',
    style: '月白桂花款'
  }
};
const source = {
  keepsakes: [{ id: 'real-keepsake' }],
  postcards: [{ id: 'real-postcard' }],
  cardRecommendation: { card: pet.collectionCard, line: '原始推荐语' }
};
const sourceSnapshot = JSON.stringify(source);

const empty = preview.build(0, pet, source);
const partial = preview.build(1, pet, source);
const complete = preview.build(2, pet, source);

assert.deepEqual(empty, { keepsakes: [], postcards: [], cardRecommendation: null }, '第一个预览状态必须同时覆盖三个空态');
assert.equal(partial.keepsakes.length, 3, '第二个预览状态必须展示三件真实资源纪念物');
assert.equal(partial.postcards.length, 2, '第二个预览状态必须展示两张明信片');
assert.equal(partial.cardRecommendation.card.card_id, 'memory-preview-card', '有内容状态必须展示当前蛋宝宝真实收藏卡');
assert.equal(complete.keepsakes.length, 10, '第三个预览状态必须覆盖当前配置中十件带正式图片的纪念物');
assert.equal(complete.postcards.length, 4, '第三个预览状态必须展示完整演示明信片内容');
assert.equal(complete.keepsakes.every(item => item.asset && item.sourceScene), true, '预览纪念物必须同时具有正式图片和来源场景');
assert.equal(JSON.stringify(source), sourceSnapshot, '预览构建不得改写服务层返回的真实数据');

const pageRoot = path.resolve(__dirname, '../../pages/life-scenes');
const template = fs.readFileSync(`${pageRoot}/life-scenes.wxml`, 'utf8');
const styles = fs.readFileSync(`${pageRoot}/life-scenes.wxss`, 'utf8');
const logic = fs.readFileSync(`${pageRoot}/life-scenes.js`, 'utf8');

assert.equal(template.includes('wx:if="{{isDemo && !loading}}" class="memory-preview-switch"'), true, '预览切换按钮必须严格受开发版开关保护');
assert.equal(template.includes('bindtap="onCycleMemoryPreview"'), true, '预览按钮必须支持三个状态循环');
assert.equal(template.includes('class="keepsake-grid"') && template.includes('bindtap="onOpenKeepsake"'), true, '纪念物必须使用三列缩略图列表并支持进入单件详情');
assert.equal(template.includes('wx:if="{{selectedKeepsake}}"') && template.includes('class="keepsake-detail"'), true, '纪念物详情必须独立展示大图与故事');
assert.equal(template.includes('class="postcard-list"') && template.includes('bindtap="onOpenPostcard"'), true, '明信片必须使用封面列表并支持进入正文详情');
assert.equal(template.includes('wx:elif="{{selectedPostcard}}"') && template.includes('class="postcard-detail"'), true, '明信片详情必须独立展示封面与正文');
assert.equal(/解锁|未解锁|已解锁/.test(template), false, '纪念物列表不得照搬参考稿中的收集或解锁表达');
assert.equal(/无内容|少量内容|丰富内容|有几件|有全套/.test(template), false, '协作提示词不得显示在游戏页面中');
assert.equal(logic.includes('isDemo: config.localDemoEnabled'), true, '页面必须使用不可由普通用户修改的开发版门禁');
assert.equal(logic.includes('keepsake_id=') && logic.includes('postcard_id='), true, '列表项必须通过独立路由层级打开详情，保证左上角返回到列表');
assert.equal(/setStorage|writeState|cloudApi/.test(logic), false, '预览切换不得写入本地业务数据或调用后端');
assert.equal(styles.includes('background:#002900'), true, '选中标签与主操作必须使用设计系统深绿');
assert.equal(styles.includes('color:#1A1A1A'), true, '一级文字必须使用设计系统标准色');
assert.equal(styles.includes('color:#5C5C5C'), true, '二级文字必须使用设计系统标准色');
assert.equal(styles.includes('border:1rpx solid #E5E3DF'), true, '卡片与控件必须使用标准分隔线色');
assert.equal(/font-weight:(650|700)/.test(styles), false, '页面字重不得超过设计系统规定的 600');
assert.equal(/#3F5A47|#2D3830|#788077/.test(styles), false, '页面不得继续使用旧版近似色');

console.log('回忆页三态预览、正式数据隔离与设计 token 校验通过。');
