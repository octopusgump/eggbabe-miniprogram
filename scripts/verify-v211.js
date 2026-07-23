const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const app = JSON.parse(read('miniprogram/app.json'));
// Historical demo migration regression only. Collection/dew/shop assertions below
// protect the existing demo until an independent demo build is cut; they do not
// define ordinary-release requirements. See PRD v2.28 and the compliance checklist.
const userFacingFiles = [
  ...app.pages.map(page => `miniprogram/${page}.wxml`),
  'h5/birth-card/index.html',
  'h5/birth-card/app.js'
].filter(file => fs.existsSync(path.join(root, file)));
const userFacing = userFacingFiles.map(file => `${file}\n${read(file)}`).join('\n');

assert.equal(/破壳卡|场景卡|套卡|我的卡册/.test(userFacing), false, '用户界面只能使用“收藏卡”，不得出现旧卡类名称');
assert.equal(/卡池|掉落|抽卡|稀有度/.test(userFacing), false, '历史 demo 迁移回归：用户界面不得直接出现卡池 / 掉落 / 抽卡 / 稀有度');
const forbiddenBrand = new RegExp(['egg', 'baby'].join(''), 'i');
assert.equal(forbiddenBrand.test(userFacing), false, '品牌英文只能写 eggbabe');
assert.equal(/>EGGBABE</.test(userFacing), false, '用户可见品牌字标必须使用小写 eggbabe');
assert.equal(/它/.test(userFacing), false, '蛋宝宝相关用户文案必须使用第一人称“我”');

const album = read('miniprogram/pages/album/album.wxml');
assert.equal(album.includes('title="我的收藏卡"'), true, '统一卡册标题必须为“我的收藏卡”');
assert.equal(album.includes('尚未遇见'), true, '未获得位必须显示“尚未遇见”');
assert.equal(album.includes('collectorLabel'), true, '系列内编号必须与卡位一起显示');
assert.equal(/class="tabs?\b|data-tab=|onTab/.test(album), false, '我的收藏卡不得使用卡类 tab');
assert.equal(album.includes('不会重复出现'), true, 'v2.23 必须明确收藏卡不重复出现');

const h5Html = read('h5/birth-card/index.html');
const h5Css = read('h5/birth-card/styles.css');
const h5App = read('h5/birth-card/app.js');
const h5Model = read('h5/birth-card/card-model.js');
const h5Poster = read('h5/birth-card/poster-renderer.js');
const nativeTemplate = read('miniprogram/pages/collection-card/collection-card.wxml');
const nativeCss = read('miniprogram/pages/collection-card/collection-card.wxss');
const nativeLogic = read('miniprogram/pages/collection-card/collection-card.js');
const nativeSignatureFontCss = read('miniprogram/assets/fonts/zcool-kuaile/font.wxss');
const nativeSignatureFont = require('../miniprogram/assets/fonts/zcool-kuaile/signature-font');

assert.match(h5Css, /\.illustration-frame\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/, 'H5 插画必须统一使用 4:5');
assert.match(nativeCss, /\.card-illustration-section\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/, '原生兜底插画必须统一使用 4:5');
assert.equal(/\.birth-card\s*\{[^}]*outline:/s.test(h5Css), false, 'H5 卡面不得显示黑色卡框');
assert.equal(/\.card\s*\{[^}]*outline:/s.test(nativeCss), false, '原生兜底卡面不得显示黑色卡框');
assert.equal(h5Html.includes('title-star'), false, 'H5 标题不得显示星星');
assert.equal(h5Html.includes('card-wordmark'), false, 'H5 标题不得显示 eggbabe 小字');
assert.equal(nativeTemplate.includes('title-star'), false, '原生标题不得显示星星');
assert.equal(nativeTemplate.includes('card-wordmark'), false, '原生标题不得显示 eggbabe 小字');

['prototypeLabel', 'name', 'birthday', 'constellation', 'genderSymbol', 'mbti', 'signature', 'bloodType'].forEach(field => {
  assert.equal(h5Html.includes(`data-field="${field}"`), true, `H5 v2.23 卡面缺少 ${field}`);
});
assert.equal(h5Html.includes('card-avatar-image'), true, 'H5 v2.23 卡面缺少 IP 头像');
['cardView.prototype_name', 'cardView.name', 'birthdayLabel', 'cardView.constellation', 'genderLabel', 'cardView.mbti', 'cardView.signature', 'cardView.blood_type'].forEach(field => {
  assert.equal(nativeTemplate.includes(field), true, `原生兜底 v2.23 卡面缺少 ${field}`);
});
assert.equal(h5Model.includes('`${parts.year}年${parts.month}月${parts.day}日`'), true, 'H5 生日必须显示年月日');
assert.equal(h5App.includes('fonts.googleapis.com'), false, '线上字体不得依赖 Google CDN');
assert.equal(h5App.includes('nameFontUrlTemplate'), true, 'H5 必须保留备案域名自托管字体配置');
assert.equal(/Math\.random/.test([h5App, h5Model, h5Poster].join('\n')), false, 'H5 只能渲染，不得生成随机业务值');

assert.equal(h5Poster.includes("if (!card.miniProgramCodeUrl) throw new Error('MINI_CODE_REQUIRED')"), true, '分享图必须包含真实小程序码');
assert.equal(h5Poster.includes("if (!card.shareCode) throw new Error('SHARE_CODE_REQUIRED')"), true, '分享图必须包含分享码');
assert.equal(nativeTemplate.includes('待接入小程序码'), false, '原生兜底不得显示待接入小程序码按钮');
assert.equal(nativeTemplate.includes('分享给好友'), false, '原生兜底不得显示分享给好友按钮');
assert.equal(nativeTemplate.includes('shareCanvas'), false, '原生兜底不得恢复旧分享画布');
assert.equal(nativeTemplate.includes('canvas-id="cardPosterCanvas"'), true, '原生兜底必须提供当前收藏卡保存画布');
assert.equal(nativeTemplate.includes('<text class="button-label">保存图片</text>'), true, '原生兜底底部必须提供保存图片按钮');
assert.equal(nativeTemplate.includes('class="save-image-button"'), true, '原生保存按钮必须使用页面专用样式');
assert.equal(nativeTemplate.includes('disabled="{{savingImage}}"'), true, '保存按钮不得因首次海报生成失败而永久禁用');
assert.match(nativeCss, /\.actions\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*stretch;[^}]*width:\s*100%/s, '原生保存操作区必须占满内容宽度');
assert.match(nativeCss, /\.save-image-button\s*\{[^}]*width:\s*100%\s*!important;[^}]*max-width:\s*none\s*!important;[^}]*margin:\s*0\s*!important/s, '原生保存图片按钮必须强制铺满内容宽度');
assert.equal(nativeLogic.includes('wx.openSetting'), true, '原生保存图片必须处理相册权限恢复');
assert.equal(nativeLogic.includes("analytics.track('card_save'"), true, '原生保存成功必须上报 card_save');
assert.equal(nativeLogic.includes('drawPetAvatar'), false, '原生导出卡面也必须移除左上角 IP 头像');
assert.equal(nativeCss.includes('@import "../../assets/fonts/zcool-kuaile/font.wxss"'), true, '原生屏显必须引入本地站酷快乐体');
assert.equal(nativeSignatureFontCss.includes('data:font/truetype;base64,'), true, '原生屏显字体必须随小程序包本地交付');
assert.equal(nativeLogic.includes('wx.loadFontFace'), false, '原生卡面不得依赖旧 Canvas 不支持的动态字体接口');
assert.equal(nativeLogic.includes('context.drawImage(signatureImage.path, 40, 934, 520, 112)'), true, '原生保存图必须绘制预渲染的 ZCOOL 性情独白');
assert.equal(Object.keys(nativeSignatureFont.IMAGE_BY_TEXT).length, 6, '原生保存图必须覆盖全部六条可产出性情独白');
assert.equal(fs.existsSync(path.join(root, 'miniprogram/assets/fonts/zcool-kuaile/OFL.txt')), true, '原生小程序发布包必须附带站酷快乐体 OFL 许可证');
assert.match(nativeCss, /\.card-signature\s*\{[^}]*margin-top:\s*24rpx;[^}]*font-family:\s*"ZCOOL KuaiLe Signature"[^}]*font-size:\s*50\.4rpx/s, '原生性情独白必须使用站酷快乐体并放大两倍');
assert.match(h5Css, /\.card-signature\s*\{[^}]*margin:\s*12px 0 0;[^}]*font-family:\s*var\(--name-font\);[^}]*font-size:\s*28\.8px/s, 'H5 性情独白必须使用站酷快乐体并放大两倍');
assert.equal(h5App.includes('h5_birth_card_save_poster'), true, 'H5 必须把图片回传小程序');
assert.equal(read('miniprogram/pages/h5-card/h5-card.js').includes('saveImageToPhotosAlbum'), true, '图片必须由小程序侧保存到相册');

const config = read('miniprogram/config/v2.js');
assert.equal(config.includes("version: '2.26.0-preview'"), true, '前端版本必须为 v2.26');
assert.equal(config.includes('sceneCardDropRate: 0.18'), true, '历史 demo 迁移回归：旧场景卡概率仍为 18%');
assert.equal(config.includes('sceneCardDailyLimit: 2'), true, '历史 demo 迁移回归：旧场景卡每日上限仍为 2 张');
assert.equal(app.pages.includes('pages/shop/shop'), true, '历史 demo 迁移回归：迁移前仍保留露珠商店资产');
assert.equal(app.pages.includes('pages/bag/bag'), true, '历史 demo 迁移回归：迁移前仍保留背包资产');
assert.equal(read('miniprogram/pages/home/home.wxml').includes('今日通过点击已收集'), true, '首页露珠余额必须提供今日 X / 10 轻量说明');
const homeTemplate = read('miniprogram/pages/home/home.wxml');
const homeLogic = read('miniprogram/pages/home/home.js');
const homeStyles = read('miniprogram/pages/home/home.wxss');
const doodleTemplate = read('miniprogram/pages/doodle/doodle.wxml');
const doodleLogic = read('miniprogram/pages/doodle/doodle.js');
const shellArtLogic = read('miniprogram/services/egg-shell-art.js');
const visibleEggBlock = homeTemplate.match(/<view wx:if="\{\{stage !== 'hatched'\}\}" class="egg egg-shell[^"]*"[\s\S]*?<\/view>/);
const incubationFeedbackLogic = [
  homeLogic,
  read('miniprogram/pages/wish/wish.js'),
  read('miniprogram/pages/lesson/lesson.js'),
  read('miniprogram/pages/doodle/doodle.js'),
  read('miniprogram/pages/nickname/nickname.js')
].join('\n');
const incubationSceneAssets = ['spring', 'summer', 'autumn', 'winter'].flatMap(season => (
  ['day', 'night'].map(period => `miniprogram/assets/scenes/incubation/webp/incubation_${season}_${period}.webp`)
));
const incubationInteractionAssets = ['touch', 'talk', 'quiet', 'window', 'wish', 'learn', 'draw', 'secret']
  .map(name => `miniprogram/assets/scenes/incubation/svg/interaction_${name}.svg`);
assert.equal(
  incubationSceneAssets.concat(incubationInteractionAssets, ['miniprogram/assets/scenes/incubation/webp/egg_base_day.webp'])
    .every(file => fs.existsSync(path.join(root, file))),
  true,
  '孵化首页引用的 8 张场景、8 个互动图标与透明蛋主体必须全部存在'
);
assert.equal(homeTemplate.includes('一起待一会儿'), true, '孵化首页必须使用无任务压力的自由陪伴入口');
assert.equal(homeTemplate.includes('孵化记录') || homeTemplate.includes('class="eyebrow"'), false, '首页左上角只保留蛋宝宝昵称，不得显示孵化记录眉题');
assert.equal((homeLogic.match(/interaction_(?:touch|talk|quiet|window|wish|learn|draw|secret)\.svg/g) || []).length, 8, '必须接入 8 个独立互动图标');
assert.equal(/task-row|task-reward|今天陪我做的事/.test(homeTemplate), false, '自由陪伴入口不得显示任务编号、完成态或奖励比例');
assert.equal(homeTemplate.includes('id="homeEggBaseCanvas"') && homeTemplate.includes('id="homeEggArtCanvas"'), true, '首页必须用独立 Canvas 渲染蛋体颜色与上层绘图');
assert.equal(homeLogic.includes('shellArtService.drawEggBase') && homeLogic.includes('shellArtService.drawEggArt'), true, '首页必须回显保存后的三层蛋壳');
assert.equal(homeTemplate.includes('egg-shell-preview') && homeTemplate.includes('egg-render-cache'), true, '首页必须使用屏幕外 Canvas 合成，再以普通图片显示在孵化窝中');
assert.equal(!!visibleEggBlock, true, '首页必须保留位于孵化窝中的可交互蛋体容器');
assert.equal(visibleEggBlock[0].includes('<canvas'), false, '可见蛋体容器不得嵌套原生 Canvas，避免滚动时脱离孵化窝');
assert.equal(homeStyles.includes('left: -2000px') && homeLogic.includes('canvas2d.exportImage'), true, '蛋壳 Canvas 必须固定在屏幕外并导出预览图');
assert.equal(homeLogic.includes('setupToken !== this.homeEggSetupToken'), true, '页面卸载后必须丢弃过期的 Canvas 异步初始化结果');
assert.equal(shellArtLogic.includes('/assets/scenes/incubation/webp/egg_base_day.webp'), true, 'Canvas 必须继续使用交付的透明蛋主体作为母版');
assert.equal(homeStyles.includes('.egg-contact-shadow'), true, '蛋宝宝必须具有随动作变化的接触阴影');
assert.match(homeStyles, /\.egg\s*\{[^}]*width:\s*285rpx;[^}]*height:\s*408rpx;/s, '蛋宝宝主体必须在原尺寸基础上放大 50%');
assert.match(homeStyles, /\.egg-contact-shadow\s*\{[^}]*width:\s*267rpx;[^}]*height:\s*47rpx;[^}]*radial-gradient/s, '窝垫必须提供与放大蛋体匹配的实时接触阴影');
assert.equal(homeTemplate.includes('跟我说说话'), true, '孵化期必须提供常驻说话输入');
assert.equal(homeTemplate.includes('/assets/icons/send.svg'), true, '说话输入框必须使用纸飞机发送图标');
assert.equal(homeTemplate.includes('talk-send-arrow'), false, '说话输入框不得继续使用向上箭头');
assert.equal(homeTemplate.includes('talk-count'), false, '说话输入条只保留输入框与发送图标');
assert.equal(homeTemplate.includes('>告诉我<'), false, '说话发送按钮不得占用整块文字按钮');
assert.equal(homeTemplate.includes('每天第一次说话增加 5%'), false, '用户界面不得公开说话的具体进度奖励比例');
assert.equal(/\+\d+%|进度\s*\+\d+%/.test(incubationFeedbackLogic), false, '孵化互动成功提示不得公开后台进度奖励比例');
assert.equal(shellArtLogic.includes("'destination-out'"), true, '橡皮擦必须只清除上层装饰画布');
assert.equal(shellArtLogic.includes("globalCompositeOperation = 'source-atop'"), true, '蛋壳颜色必须以半透明混色保留母版高光');
assert.equal(shellArtLogic.includes('context.drawImage(image, 0, 0, width, height)'), true, '交付蛋图必须作为真实视觉母版直接绘制');
assert.equal(shellArtLogic.includes("globalCompositeOperation = 'source-in'"), false, '不得再用中性渐变覆盖交付蛋图的原始高光和立体阴影');
assert.equal(homeTemplate.includes('egg-shell-specular') && homeTemplate.includes('egg-shell-depth'), true, '真实蛋体必须具有随动作响应的表面光泽与体积反馈层');
assert.equal(homeStyles.includes('-webkit-mask-image: url("/assets/scenes/incubation/webp/egg_base_day.webp")'), true, '光泽反馈必须使用真实蛋体 Alpha 裁切，不得越出蛋壳');
assert.equal(doodleTemplate.includes('星星') === false && doodleLogic.includes('shellArtService.PATTERNS'), true, '绘图页图样必须由受控星星、爱心、叶子配置渲染');
assert.equal(doodleTemplate.includes('撤销') && doodleTemplate.includes('清空') && doodleTemplate.includes('橡皮擦') && doodleTemplate.includes('保存我的蛋壳'), true, '绘图页必须提供撤销、清空、橡皮擦与保存');
assert.equal(doodleTemplate.includes('散落图样') && doodleTemplate.includes('调整贴纸') && doodleTemplate.includes('删除贴纸'), true, '图样必须支持重复铺陈，贴纸必须可移动和单独删除');
assert.equal(doodleLogic.includes('draggingStickerId') && doodleLogic.includes('onDeleteSticker'), true, '贴纸移动与删除必须有真实交互逻辑');
assert.equal(/chooseImage|chooseMedia|chooseMessageFile/.test(doodleLogic), false, '首版蛋壳绘图不得开放图片上传');
assert.equal(homeTemplate.includes('暂不命名'), true, '命名弹层必须允许暂不命名');
assert.equal(homeTemplate.includes('conic-gradient'), true, '历史 demo 迁移回归：迁移前仍保留孵化进度圆环样式');
assert.equal(homeLogic.includes('/pages/nickname/nickname'), true, '破壳后必须可以进入改名页');
assert.equal(homeTemplate.includes("stage === 'hatched' && dailyStatus"), true, '孵化期不得展示每日心情');
assert.equal(/还剩\s*\{\{|天\s*\{\{|小时/.test(homeTemplate), false, '首页不得展示天数或时分倒计时');
assert.equal(homeLogic.includes('spawnTapParticles'), true, '轻点蛋必须在点击位置显示粒子');
assert.equal(homeLogic.includes('vibrateCuddleTick'), true, '长按必须按秒提供体感反馈');
assert.equal(homeStyles.includes('.season-spring') && homeStyles.includes('.weather-rain') && homeStyles.includes('.period-night'), true, '孵化场景必须包含季节、天气、昼夜三层表现');
assert.equal(homeTemplate.includes('id="windowFogCanvas"'), true, '窗外区域必须提供可擦除雾层');
assert.equal(homeLogic.includes("globalCompositeOperation = 'destination-out'"), true, '擦窗必须真实清除雾层而不是叠加白色光斑');
assert.equal(homeStyles.includes('spring-curtain-sway') && homeStyles.includes('summer-leaf-parallax') && homeStyles.includes('autumn-room-warmth'), true, '春帘、夏叶与秋季室内暖光必须各有低频表现');
assert.equal(/getLocation|chooseLocation|startLocationUpdate/.test([homeLogic, read('miniprogram/services/incubation-environment.js')].join('\n')), false, '上海天气不得申请用户定位');
assert.equal(app.pages.includes('pages/hatch-guide/hatch-guide'), false, '孵化修炼手册独立页必须下线');

assert.equal(fs.existsSync(path.join(root, 'cloudfunctions')), false, 'Bohao 侧目录不得保留 cloudfunctions');
const frontEndSources = ['miniprogram/app.js', 'miniprogram/services/cloud-api.js', 'miniprogram/services/analytics.js', 'miniprogram/services/time-service.js'].map(read).join('\n');
assert.equal(/wx\.cloud/.test(frontEndSources), false, 'Bohao 侧前端不得调用 wx.cloud.*');
assert.equal(read('miniprogram/services/time-service.js').includes('requireAuthoritative'), true, '正式业务时间必须经过服务端北京时间门禁');
assert.equal(read('miniprogram/services/time-service.js').includes('return Date.now() + offset'), false, 'live 业务时间不得回退设备时钟');
assert.equal(read('miniprogram/pages/welcome/welcome.js').includes('Date.now()'), false, '账号授权时间不得使用设备时钟');
assert.equal(read('miniprogram/app.js').includes("result.mode !== 'live'"), true, '正式 bootstrap 必须拒绝非 live 数据');
assert.equal(read('miniprogram/pages/deregister/deregister.js').includes('getFullYear()'), false, '注销截止日不得依赖设备本地时区格式化');
assert.equal(read('miniprogram/utils/pet-store.js').includes('HATCH_TOLERANCE_MS'), true, '破壳承接必须包含服务端时间容差');
assert.equal(read('miniprogram/utils/pet-store.js').includes('completionRatio >= 0.9'), true, '孵化完成度必须按理论最大进度归一化');

const chat = read('miniprogram/services/chat-safety.js');
assert.equal(chat.includes('12356'), true, '危机响应必须提供全国统一心理援助热线 12356');
assert.equal(chat.includes('SENSITIVE_INFO_PATTERNS'), true, '前端安全 mock 必须阻止敏感个人信息落库');
const chatSafety = require(path.join(root, 'miniprogram/services/chat-safety'));
assert.equal(chatSafety.assessInput('我不想活了').crisis, true, '危机表达必须进入固定安全响应');
assert.equal(chatSafety.assessInput('我的手机号是13800138000').allowed, false, '手机号不得进入对话存储');
assert.equal(chatSafety.safeOutput('教我怎么自杀'), chatSafety.OUTPUT_FALLBACK, '不安全输出必须替换为固定兜底');
assert.equal(chatSafety.shouldShowRestReminder(Date.parse('2026-07-15T00:30:00+08:00'), 8, false), true, '北京时间深夜长对话必须触发一次休息提醒');
assert.equal(read('miniprogram/pages/privacy/privacy.wxml').includes('行为数据与个性化'), true, '隐私政策必须披露行为数据与个性化用途');
assert.equal(read('miniprogram/services/subscription-messages.js').includes('requestSubscribeMessage'), true, '前端必须提供订阅消息授权封装');

console.log('历史 demo 迁移回归通过；露珠、商店、收集断言不代表普通版要求，发布边界以 PRD v2.28 与合规清单为准。');
