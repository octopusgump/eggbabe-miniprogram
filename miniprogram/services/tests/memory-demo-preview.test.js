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
assert.equal(complete.keepsakes.length, 9, '第三个预览状态必须覆盖当前配置中九件带正式图片的纪念物');
assert.equal(complete.keepsakes[0].sourceScene, '在家 · 小憩', '居家来历文字必须使用统一的“小憩”产品名称和自然的“在家”表达');
assert.equal(complete.postcards.length, 1, '第三个预览状态必须只显示一个东京旅程入口');
assert.equal(complete.postcards[0].journeyId, 'tokyo-preview-2026-08-07', '东京旅程入口必须绑定稳定 journey_id');
assert.equal(complete.postcards[0].postcards.length, 12, '东京旅程必须包含当前十二张待验收图片');
assert.deepEqual(Array.from(new Set(complete.postcards[0].postcards.map(item => item.sceneId))), ['alley', 'terrace'], '同一次东京旅程必须包含咖啡巷与城市露台两个场景');
assert.equal(complete.postcards[0].postcards.every(item => item.asset && fs.existsSync(path.resolve(__dirname, '../..', item.asset.replace(/^\/+/, '')))), true, '东京旅程中的每张候选图片都必须存在');
assert.equal(complete.keepsakes.every(item => item.asset && item.sourceScene), true, '预览纪念物必须同时具有正式图片和来源场景');
assert.equal(JSON.stringify(source), sourceSnapshot, '预览构建不得改写服务层返回的真实数据');

const pageRoot = path.resolve(__dirname, '../../pages/life-scenes');
const template = fs.readFileSync(`${pageRoot}/life-scenes.wxml`, 'utf8');
const styles = fs.readFileSync(`${pageRoot}/life-scenes.wxss`, 'utf8');
const logic = fs.readFileSync(`${pageRoot}/life-scenes.js`, 'utf8');
const journeyPageRoot = path.resolve(__dirname, '../../pages/journey-scene');
const journeyTemplate = fs.readFileSync(`${journeyPageRoot}/journey-scene.wxml`, 'utf8');
const journeyLogic = fs.readFileSync(`${journeyPageRoot}/journey-scene.js`, 'utf8');
const appConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../app.json'), 'utf8'));

assert.equal(template.includes('wx:if="{{isDemo && !loading}}" class="memory-preview-switch"'), true, '预览切换按钮必须严格受开发版开关保护');
assert.equal(template.includes('bindtap="onCycleMemoryPreview"'), true, '预览按钮必须支持三个状态循环');
assert.equal(template.includes('class="section-tabs"') || template.includes('bindtap="onSelectSection"'), false, '百宝箱各回忆入口必须直接展示对应内容，不得在顶部重复显示栏目切换');
assert.equal(logic.includes('onSelectSection(event)'), false, '回忆列表不得保留已移除的顶部栏目切换处理器');
assert.equal(template.includes('class="keepsake-grid"') && template.includes('bindtap="onOpenKeepsake"'), true, '纪念物必须使用三列缩略图列表并支持进入单件详情');
assert.equal(template.includes('wx:if="{{selectedKeepsake}}"') && template.includes('class="keepsake-detail"'), true, '纪念物详情必须独立展示大图与故事');
assert.equal(template.includes('class="keepsake-memory"') && template.includes('我还记得'), true, '纪念物故事必须以第一人称回忆区承载，不直接散落在页面上');
assert.equal(styles.includes('.keepsake-detail__art{height:560rpx') && styles.includes('.keepsake-memory{') && styles.includes('background:#FFF6F5') && styles.includes('color:#80625D'), true, '纪念物详情必须收紧主图，并使用 Design System 回忆 tint');
assert.equal(template.includes('来自：{{selectedKeepsake.sourceScene}}') && styles.includes('.keepsake-detail__meta{display:block;margin-top:24rpx;padding:0 40rpx') && styles.includes('font-weight:600'), true, '纪念物来历文字必须补全“来自”语义、增加字重，并与回忆区内容左对齐');
assert.equal(template.includes('class="postcard-list"') && template.includes('bindtap="onOpenPostcard"'), true, '明信片必须使用封面列表并支持进入正文详情');
assert.equal(template.includes('hover-class="keepsake-grid-item--pressed"') && (template.match(/class="memory-card-glare"/g) || []).length >= 2, true, '纪念物与明信片小卡片必须共用按压波光层');
assert.equal(styles.includes('@keyframes memory-card-glare-sweep') && styles.includes('animation:memory-card-glare-sweep .4s ease-out both') && styles.includes('.keepsake-grid-item--pressed{transform:scale(.98)}'), true, '纪念物小卡片点击时必须使用 400ms 波光和统一的 0.98 按压反馈');
assert.equal(styles.includes('prefers-reduced-motion:reduce') && styles.includes('.keepsake-grid-item--pressed{transform:none}') && styles.includes('.postcard-list-item--pressed .memory-card-glare{opacity:.18;transform:none}'), true, '波光与卡片位移需有减少动态效果的静态退化');
assert.equal(template.includes('bindtouchmove="onPostcardGlareMove"') || logic.includes('onPostcardGlareMove'), false, '小卡片波光不得用高频触摸事件干扰列表滚动');
assert.equal(template.includes('wx:elif="{{selectedPostcard}}"') && template.includes('class="postcard-detail"'), true, '明信片详情必须独立展示封面与正文');
assert.equal(template.includes('class="postcard-journey-swiper"') && template.includes('bindchange="onPostcardSlideChange"'), true, '同一次旅程的多张明信片必须在详情内左右滑动');
assert.equal(template.includes('class="postcard-journey-image"') && template.includes('mode="aspectFit"'), true, '横版旅途图片必须完整显示，不得用 aspectFill 裁切主体');
assert.equal(template.includes('bindtap="onOpenJourneyScene"'), true, '旅程明信片大图必须可点击进入旅途回放场景');
assert.equal(template.includes('postcard-journey-art--interactive') && template.includes('hover-class="postcard-journey-art--pressed"'), true, '明信片大图必须保持图片本身的可点击语义与按压反馈');
assert.equal(template.includes('左右滑动看这次旅程'), false, '明信片详情不得显示易被误解为按钮的滑动胶囊提示');
assert.equal(logic.includes('/pages/journey-scene/journey-scene?journey_id='), true, '大图入口必须打开独立旅途回放页');
assert.equal(logic.includes('journeyId: journey.journeyId || \'\'') && logic.includes('slides') && logic.includes('this.returnPostcardIndex = index'), true, '大图入口必须传递 journey_id、当前索引与同次旅程画面，并在返回后保留原明信片位置');
assert.equal(appConfig.pages.includes('pages/journey-scene/journey-scene'), true, '旅途回放页必须注册为小程序页面');
assert.equal(journeyTemplate.includes('class="journey-stage"') && journeyTemplate.includes('bindchange="onSlideChange"'), true, '旅途回放必须使用全屏场景容器浏览同次旅程');
assert.equal(journeyTemplate.includes('mode="aspectFit"') && journeyTemplate.includes('binderror="onImageError"'), true, '回放画面必须完整显示，并在图片失败时进入安全状态');
assert.equal(journeyTemplate.includes('正在展开这段旅程…') && journeyTemplate.includes('返回明信片'), true, '回放必须覆盖加载与可返回的失败状态');
assert.equal(/postHatch|cloudApi|performPostHatchAction|writeState|setStorage/.test(journeyLogic), false, '旅途回放页不得调用当前状态、动作或存储接口');
assert.equal(/require\([^)]*(?:post-hatch|cloud-api|pet-store|memory-demo-preview)[^)]*\)/.test(journeyLogic), false, '旅途回放页不得导入实时状态、动作、存储或开发夹具；破壳保护只在明信片入口页完成');
assert.equal(journeyLogic.includes('没有收到可回放的旅程内容') && journeyLogic.includes('这次旅程的数据没有对上') && journeyLogic.includes('这张旅途画面没有加载好'), true, '无数据、错误数据和图片失败必须有明确的安全反馈');
assert.equal(journeyLogic.includes('failedSlideIndexes.has(index)') && journeyLogic.includes('failedSlideIndexes.add(index)'), true, '后台预加载失败的图片在用户滑到时也必须进入可返回的错误状态');
const journeySlideHandler = journeyLogic.slice(journeyLogic.indexOf('onSlideChange'), journeyLogic.indexOf('onImageError'));
assert.equal(journeySlideHandler.includes('setData({ current: index })'), true, '旅途回放横向浏览只能更新当前显示索引');
assert.equal(/postHatch|cloudApi|perform|writeState|setStorage|navigate/.test(journeySlideHandler), false, '旅途回放横向浏览不得触发业务状态、动作、存储或跳转');
assert.equal(/解锁|未解锁|已解锁/.test(template), false, '纪念物列表不得照搬参考稿中的收集或解锁表达');
assert.equal(/无内容|少量内容|丰富内容|有几件|有全套/.test(template), false, '协作提示词不得显示在游戏页面中');
assert.equal(logic.includes('isDemo: config.localDemoEnabled'), true, '页面必须使用不可由普通用户修改的开发版门禁');
assert.equal(logic.includes("petStore.getStage(pet) !== 'hatched'"), true, '非破壳用户必须在明信片入口页被拦截，不能打开回放');
assert.equal(logic.includes('keepsake_id=') && logic.includes('postcard_id='), true, '列表项必须通过独立路由层级打开详情，保证左上角返回到列表');
const slideHandler = logic.slice(logic.indexOf('onPostcardSlideChange'), logic.indexOf('onOpenKeepsake'));
assert.equal(slideHandler.includes('setData({ selectedPostcardIndex: index })'), true, '左右滑动只允许更新当前画廊索引');
assert.equal(/postHatch|cloudApi|perform|writeState|setStorage/.test(slideHandler), false, '左右浏览明信片不得改变玉兔当前状态或写入业务数据');
assert.equal(/setStorage|writeState|cloudApi/.test(logic), false, '预览切换不得写入本地业务数据或调用后端');
assert.equal(require('../../config/build-environment').resolvePolicy('trial').localDemoEnabled, false, '体验版不得启用东京候选预览');
assert.equal(require('../../config/build-environment').resolvePolicy('release').localDemoEnabled, false, '正式版不得启用东京候选预览');
assert.equal(styles.includes('background:#002900'), true, '选中标签与主操作必须使用设计系统深绿');
assert.equal(styles.includes('color:#1A1A1A'), true, '一级文字必须使用设计系统标准色');
assert.equal(styles.includes('color:#5C5C5C'), true, '二级文字必须使用设计系统标准色');
assert.equal(styles.includes('border:1rpx solid #E5E3DF'), true, '卡片与控件必须使用标准分隔线色');
assert.equal(/font-weight:(650|700)/.test(styles), false, '页面字重不得超过设计系统规定的 600');
assert.equal(/#3F5A47|#2D3830|#788077/.test(styles), false, '页面不得继续使用旧版近似色');

console.log('回忆页三态预览、正式数据隔离与设计 token 校验通过。');
