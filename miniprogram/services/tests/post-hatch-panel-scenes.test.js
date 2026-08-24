const assert = require('assert');
const fs = require('fs');
const childProcess = require('child_process');
const path = require('path');

const postHatchAssets = require('../../config/post-hatch-assets');

const panoramaSets = postHatchAssets.POST_HATCH.panoramaSceneSets || {};
const periodOptions = postHatchAssets.POST_HATCH.periodSceneOptions || [];
const periods = ['day', 'sunset', 'night'];

assert.deepEqual(periodOptions.map(option => option.key), periods, '破壳后场景测试器必须且只能提供白天、落日、黑夜');
assert.deepEqual(Object.keys(panoramaSets), periods, '破壳后空房全景必须与三个时段一一对应');

periodOptions.forEach(option => {
  const set = panoramaSets[option.key];
  assert.equal(set.expected.panorama.endsWith(`/panorama-three-screen/scene-sets/${option.panoramaSource}_post_hatch_panorama_v01.webp`), true, `${option.key} 全景文件名不符合规范`);
  assert.equal(set.panorama, set.expected.panorama, `${option.key} 必须精确使用约定的完整全景路径`);
  const absolute = path.resolve(__dirname, '../..', `.${set.panorama}`);
  assert.equal(fs.existsSync(absolute), true, `${option.key} 正式运行时全景资源缺失：${set.panorama}`);
  assert.deepEqual(set.windowMeta, postHatchAssets.POST_HATCH.panoramaFallbackMeta, `${option.key} 必须使用同一套完整全景窗口坐标`);
});

assert.equal(postHatchAssets.resolvePanoramaScene('unknown_period'), null, '未知时段不得静默混入其他套装');
const actionScenes = postHatchAssets.POST_HATCH.actionPanoramaScenes || {};
const actionScenesByCharacter = postHatchAssets.POST_HATCH.actionPanoramaScenesByCharacter || {};
const expectedStates = ['sleep', 'lazy', 'stare', 'reading', 'gaming', 'window', 'drawing', 'music'];
assert.deepEqual(Object.keys(actionScenes), expectedStates, '正式日常动作必须按八个状态、日间/日落/夜间三套登记');
assert.deepEqual(Object.keys(actionScenesByCharacter), ['jade-rabbit', 'boon-koi'], '玉兔与锦鲤都必须登记各自的正式动作全景');
Object.entries(actionScenesByCharacter).forEach(([characterKey, scenes]) => {
  assert.deepEqual(Object.keys(scenes), expectedStates, `${characterKey} 必须登记所有已交付动作`);
  Object.values(scenes).forEach(scene => {
    const registeredPeriods = Object.keys(scene.panoramaByPeriod);
    assert.deepEqual(registeredPeriods, periods, `${characterKey} ${scene.stateKey} 必须且只能覆盖三个时段`);
    registeredPeriods.forEach(period => {
      assert.equal(Object.prototype.hasOwnProperty.call(panoramaSets, period), true, `${characterKey} ${scene.stateKey} 登记了未知时段：${period}`);
      const panorama = scene.panoramaByPeriod[period];
      const absolute = path.resolve(__dirname, '../..', `.${panorama}`);
      assert.equal(fs.existsSync(absolute), true, `${characterKey} ${scene.stateKey} ${period} 动作全景资源缺失：${panorama}`);
    });
    assert.equal(new Set(Object.values(scene.panoramaByPeriod)).size, 3, `${characterKey} ${scene.stateKey} 必须使用三张独立时段图`);
    assert.equal(scene.bakedCharacter && scene.bakedProps, true, `${characterKey} ${scene.stateKey} 动作图必须声明角色与道具已烘焙`);
    assert.deepEqual(scene.windowMeta, postHatchAssets.POST_HATCH.panoramaFallbackMeta, `${characterKey} ${scene.stateKey} 必须复用三屏窗户热区坐标`);
  });
});
const jadeRabbit = { prototype: '玉兔' };
const sleepState = { atHome: true, key: 'sleep', action: { id: 'lamp_off' } };
const dayAction = postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { period: 'day' }, 'https://cdn.example.com');
assert.equal(dayAction && dayAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_nap_day_v01.webp', '玉兔日间睡觉必须读取根目录正式基础图');
const sunsetAction = postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { period: 'sunset' }, 'https://cdn.example.com');
assert.equal(sunsetAction && sunsetAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_nap_sunset_v01.webp', '玉兔日落睡觉必须读取根目录正式基础图');
const lazyState = { atHome: true, key: 'lazy' };
const lazyDayAction = postHatchAssets.resolveActionPanorama(jadeRabbit, lazyState, { period: 'day' }, 'https://cdn.example.com');
assert.equal(lazyDayAction && lazyDayAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_lazy_day_v01.webp', '玉兔日间小憩必须读取根目录正式基础图');
periods.forEach(period => {
  const sleepPanorama = postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { period });
  const lazyPanorama = postHatchAssets.resolveActionPanorama(jadeRabbit, lazyState, { period });
  assert.equal(Boolean(sleepPanorama && lazyPanorama), true, `玉兔 ${period} 必须同时具备独立的睡觉与小憩图片`);
  assert.notEqual(sleepPanorama.panorama, lazyPanorama.panorama, `玉兔 ${period} 的睡觉与小憩不得复用同一张图片`);
});
const koiLazyDayAction = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, lazyState, { period: 'day' });
assert.equal(koiLazyDayAction && koiLazyDayAction.panorama.endsWith('/boon-koi/home-bedroom/home_bedroom_lazy_day_v01.webp'), true, '锦鲤日间小憩必须读取自己的正式动作全景');
const stareState = { atHome: true, key: 'stare' };
periods.forEach(period => {
  const jadeStare = postHatchAssets.resolveActionPanorama(jadeRabbit, stareState, { period });
  const koiStare = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, stareState, { period });
  assert.equal(jadeStare && jadeStare.panorama.endsWith(`/jade-rabbit/home-bedroom/home_bedroom_stare_${period}_v01.webp`), true, `玉兔 ${period} 发呆必须读取自己的正式基础图`);
  assert.equal(koiStare && koiStare.panorama.endsWith(`/boon-koi/home-bedroom/home_bedroom_stare_${period}_v01.webp`), true, `锦鲤 ${period} 发呆必须读取自己的正式动作全景`);
});
const lightsOffAction = postHatchAssets.resolveActionPanorama(jadeRabbit, Object.assign({}, sleepState, { actionDone: true }), { period: 'night' });
assert.equal(lightsOffAction && lightsOffAction.panorama.endsWith('/home_bedroom_nap_night_v01.webp') && lightsOffAction.variant === 'default', true, '删除关灯特例后必须继续使用夜间正式基础图');
assert.equal(postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { period: 'day' }).panorama.endsWith('/jade-rabbit/home-bedroom/home_bedroom_nap_day_v01.webp'), true, '破壳后动作只需时段即可精确解析');
const koiDayAction = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, sleepState, { period: 'day' }, 'https://cdn.example.com');
assert.equal(koiDayAction && koiDayAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/boon-koi/home-bedroom/home_bedroom_nap_day_v01.webp', '锦鲤日间睡觉必须读取自己的正式动作全景');
periods.forEach(period => {
  const sleepPanorama = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, sleepState, { period });
  const lazyPanorama = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, lazyState, { period });
  assert.equal(Boolean(sleepPanorama && lazyPanorama), true, `锦鲤 ${period} 必须同时具备独立的睡觉与小憩图片`);
  assert.notEqual(sleepPanorama.panorama, lazyPanorama.panorama, `锦鲤 ${period} 的睡觉与小憩不得复用同一张图片`);
});
assert.equal(postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, Object.assign({}, sleepState, { actionDone: true }), { period: 'night' }).variant, 'default', '锦鲤睡觉动作完成后仍使用夜间正式基础图');
assert.equal(postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { period: 'dawn' }), null, '未知时段不得猜测或回退动作图');
const manifest = JSON.parse(childProcess.execFileSync(process.execPath, ['scripts/print-environment-cdn-manifest.js'], { cwd: process.cwd(), encoding: 'utf8' }));
const actionAssets = manifest.assets.filter(item => item.kind === 'post_hatch_action_panorama');
assert.equal(actionAssets.length, 48, 'CDN 动作清单必须只包含玉兔与锦鲤各 24 张正式基础动作图');
assert.equal(new Set(actionAssets.map(item => item.cdn_path)).size, 48, 'CDN 动作清单必须包含 48 个唯一正式路径');
assert.equal(actionAssets.every(item => item.exists && item.sha256 && item.cdn_path.startsWith('/assets/scenes/lifecycle/post-hatch/60-action-scenes/')), true, 'CDN 动作清单中的每个正式 WebP 必须在本地存在并包含校验哈希');
assert.equal(Object.prototype.hasOwnProperty.call(postHatchAssets.POST_HATCH, 'characterPoses'), false, '正式运行时不得登记会与动作全景重复叠加的透明角色图');

const lifeSceneLogic = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.js'), 'utf8');
const lifeSceneWxml = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.wxml'), 'utf8');
const lifeSceneStyles = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.wxss'), 'utf8');
const chatLogic = fs.readFileSync(path.resolve(__dirname, '../../pages/chat/chat.js'), 'utf8');
const chatWxml = fs.readFileSync(path.resolve(__dirname, '../../pages/chat/chat.wxml'), 'utf8');
const chatStyles = fs.readFileSync(path.resolve(__dirname, '../../pages/chat/chat.wxss'), 'utf8');
const postHatchCompanionLogic = fs.readFileSync(path.resolve(__dirname, '../post-hatch-companion.js'), 'utf8');
const cloudApiLogic = fs.readFileSync(path.resolve(__dirname, '../cloud-api.js'), 'utf8');
const homeLogic = fs.readFileSync(path.resolve(__dirname, '../../pages/home/home.js'), 'utf8');
const homeWxml = fs.readFileSync(path.resolve(__dirname, '../../pages/home/home.wxml'), 'utf8');
const homeStyles = fs.readFileSync(path.resolve(__dirname, '../../pages/home/home.wxss'), 'utf8');
assert.equal(lifeSceneLogic.includes('assets.resolvePanoramaScene(period, cdnBase)'), true, '全屏生活空间必须按当前时段读取单张全景图，并支持备案 CDN');
assert.equal(homeWxml.includes('post-hatch-redirect'), false, '破壳后不得把 Pano 中屏切片作为可见跳转底图');
assert.equal(homeWxml.includes('postHatchPanoPreload') && homeWxml.includes('bindload="onPostHatchPanoPreloadLoad"'), true, '主页必须在跳转前不可见预热正确的完整 Pano');
assert.equal(homeLogic.includes('preparePostHatchLanding(panorama)') && homeLogic.includes("animationType: 'none'"), true, '预热完成后必须无系统横向导航动画进入生活空间');
assert.equal(homeStyles.includes('.post-hatch-pano-preloader'), true, '破壳后 Pano 预热节点必须脱离可见页面');
assert.equal(/assets\.POST_HATCH\.panoramaFallback(?!Meta)/.test(lifeSceneLogic), false, '破壳后背景加载失败不得静默替换为其他天气场景');
assert.equal(lifeSceneLogic.includes("isDemo: config.localDemoEnabled"), true, '破壳后环境测试器只能在开发验收模式启用');
assert.equal(lifeSceneLogic.includes('onSceneTesterSelect(event)'), true, '破壳后必须支持选择三个时段测试场景');
assert.equal(lifeSceneLogic.includes("const POST_HATCH_PERIOD_OPTIONS = assets.POST_HATCH.periodSceneOptions || []"), true, '破壳后场景测试器必须与三时段资源配置同源');
assert.equal(lifeSceneWxml.includes('scene-tester-season'), false, '破壳后场景测试器不得再显示四季标签');
assert.equal(lifeSceneLogic.includes('onStageTesterSelect(event)'), true, '破壳后必须支持 Day 1–Day 7 与破壳后阶段测试');
assert.equal(lifeSceneLogic.includes('onCompanionStateTesterSelect(event)'), true, '破壳后开发模式必须支持陪伴状态切换测试');
assert.equal(lifeSceneLogic.includes('const resetCompanionStatePreview = Boolean(') && lifeSceneLogic.includes("companionStateTesterLabel: companionStateTesterMissing\n        ? `${AUTO_COMPANION_STATE_OPTION.label} · 缺图片`"), true, '环境切换使已选动作失配时，验收器必须回到跟随时间并明确标记缺图片');
assert.equal(lifeSceneLogic.includes("key: 'home-talk'"), true, '陪伴状态测试必须覆盖在家且可对话');
assert.equal(lifeSceneLogic.includes("key: 'home-sleep'"), true, '陪伴状态测试必须覆盖睡觉时仍可对话');
['home-lazy', 'home-stare', 'home-reading', 'home-music', 'home-window', 'home-gaming'].forEach(key => {
  assert.equal(lifeSceneLogic.includes(`key: '${key}'`), true, `陪伴状态测试必须覆盖 ${key} 动作全景`);
});
assert.equal(lifeSceneLogic.includes("key: 'home-talk', label: '在家 · 可对话（画画）', major: 'home', stateKey: 'drawing'"), true, '可对话快捷项必须验证画画动作全景');
assert.equal(lifeSceneLogic.includes("key: 'home-sleep', label: '在家 · 睡觉（可对话）', major: 'home', stateKey: 'sleep', actionDone: true"), true, '睡觉快捷项必须验证闭眼关灯全景仍可对话');
assert.equal(lifeSceneLogic.includes('}, () => this.refreshEnvironment());'), true, '完成居家动作后必须重新解析动作全景');
assert.equal(lifeSceneLogic.includes("key: 'away', label: '不在家'"), true, '陪伴状态测试必须覆盖不在家且无写信入口');
assert.equal(lifeSceneLogic.includes("target.key === 'away'") && lifeSceneLogic.includes("status: 'away', reason: 'AWAY'"), true, '开发验收器选择不在家时必须模拟服务端 away chat_access，不能留下可聊天按钮');
assert.equal(lifeSceneLogic.includes("status: 'available', reason: 'AT_HOME', message: '', nextAvailableAt: ''"), true, '开发验收器选择居家状态时必须模拟 available chat_access，不能继承真实外出状态');
assert.equal(lifeSceneLogic.includes('isCompanionStatePreview()'), true, '陪伴状态测试必须明确隔离预览写入');
assert.equal(lifeSceneWxml.includes('wx:if="{{isDemo && acceptanceToolsOpen && currentState && sceneBackgroundReady}}" class="scene-tester'), true, '破壳后环境测试入口必须在验收工具展开且全景图就绪后显示');
assert.equal(lifeSceneWxml.includes('wx:if="{{isDemo && currentState && sceneBackgroundReady}}" class="stage-tester"') && lifeSceneWxml.includes('isDemo && acceptanceToolsOpen && currentState'), true, '破壳后必须提供单一验收入口，并等待全景图就绪后再展开各测试器');
assert.equal(lifeSceneWxml.includes('catchtap="onStageTesterToggle"') && lifeSceneWxml.includes('catchtap="onStageTesterSelect"'), true, '破壳后阶段切换入口必须支持展开并选择 Day 1–Day 7 / 破壳后');
assert.equal(lifeSceneWxml.includes('class="companion-state-tester"'), true, '破壳后必须显示开发模式陪伴状态测试入口');
assert.equal(lifeSceneWxml.includes('companion-state-tester-option--missing') && lifeSceneWxml.includes('缺图片'), true, '无对应动作全景的测试配置项必须明确显示缺图片并置灰');
assert.equal(/pano-static-character|sceneCharacter3d|Three\.js/.test(`${lifeSceneLogic}\n${lifeSceneWxml}`), false, '3D MVP 关闭后，生活空间不得保留 WebGL 角色依赖或调试入口');
assert.equal(lifeSceneLogic.includes('assets.resolveActionPanorama(this.data.pet, currentState, this.data.dailyWindowEnvironment, cdnBase)'), true, '首次加载必须按当前状态与环境解析动作全景');
assert.equal(/sceneCharacterImage|scene-character__pose-image|scene-character__floor-shadow|class="panel-tone"|class="scene-prop/.test(`${lifeSceneLogic}\n${lifeSceneWxml}`), false, '正式动作全景不得再叠加透明角色、接触阴影、CSS 道具或色调层');
assert.equal(lifeSceneWxml.includes('class="scene-character-hotspot') && lifeSceneWxml.includes('bindtap="onCharacterTap"'), true, '烘焙角色仍必须保留可访问的互动热区');
assert.equal(lifeSceneStyles.includes('.scene-character-hotspot{') && lifeSceneStyles.includes('background:transparent'), true, '角色热区不得额外绘制视觉内容');
assert.equal(lifeSceneLogic.includes('acceptanceTesterTopPx: Math.round(testerTopPx)') && lifeSceneLogic.includes('sceneTesterTopPx: Math.round(testerTopPx + 44)'), true, '破壳后第一行必须只保留验收入口，环境测试器在展开后位于下一行');
assert.equal(lifeSceneLogic.includes('stageTesterTopPx: Math.round(testerTopPx + 88)'), true, '破壳后阶段切换入口必须位于场景与状态验收器之间');
assert.equal(/toolboxVisible|onToggleToolbox|onToolboxItemTap|data-target="(?:card|postcards|keepsakes)"/.test(`${lifeSceneLogic}\n${lifeSceneWxml}`), false, 'V3.6 / V3.7 生活场景不得保留百宝箱弹层或复杂内容入口');
assert.equal(lifeSceneWxml.includes('wx:if="{{(!sceneEntered || !initialViewportReady) && !error}}" class="state-layer"'), true, '首帧必须保持加载层直到全景与目标面板定位完成后才能淡入');
assert.equal(lifeSceneLogic.includes('sceneBackgroundReady: true, sceneBackgroundError: false'), true, '全景图加载成功后才能安排首帧淡入');
assert.equal(lifeSceneLogic.includes('scroll-view 在 currentState 就绪前不会挂载；目标屏由快照一次性写入'), true, '首帧目标屏策略必须明确禁止先挂载中屏再异步横滑');
assert.equal(lifeSceneLogic.includes('currentScreen: screen') && lifeSceneLogic.includes('scrollLeft: screen * this.data.panelWidth'), true, '快照就绪时必须一次性定位到当前状态的目标屏');
assert.equal(lifeSceneLogic.includes('scheduleInitialViewportSettle(token)') && lifeSceneLogic.includes('markInitialViewportReady(token)'), true, '首次目标屏必须在不可见状态下等待原生滚动定位完成');
assert.equal(lifeSceneLogic.includes('revealInitialScene()') && lifeSceneWxml.includes("scene-stage {{sceneEntered && initialViewportReady ? 'scene-stage--entered' : ''}}"), true, '进入生活空间必须在背景和目标屏均就绪后使用渐入层');
assert.equal(lifeSceneStyles.includes('.scene-stage{position:absolute;inset:0;opacity:0;') && lifeSceneStyles.includes('.scene-stage--entered{opacity:1;'), true, '场景入场必须是渐入，而非横向页面滑动');
assert.equal(/scene-action-talk-badge|contextActionShowTalkBadge|scene-action-button--talkable/.test(`${lifeSceneLogic}\n${lifeSceneWxml}\n${lifeSceneStyles}`), false, '居家对话入口不得叠加三点对话状态');
assert.equal(/scene-talk-nudge|home-locator-focus|onOpenTalkComposer|composerVisible && currentState\.atHome/.test(`${lifeSceneLogic}\n${lifeSceneWxml}\n${lifeSceneStyles}`), false, '居家入口不得恢复聚焦光圈、三点提示或场景内对话弹层');
assert.equal(lifeSceneLogic.includes('/pages/chat/chat?state_key=') && lifeSceneLogic.includes('scene_chat_button'), true, '居家左下按钮必须直接打开完整对话页');
assert.equal(chatWxml.includes('class="conversation"') && chatWxml.includes('class="composer"') && chatLogic.includes('postHatch.sendSceneMessage'), true, '完整对话页必须同时包含消息区、输入区并复用统一陪伴服务');
assert.equal(chatWxml.includes('id="message-typing"') && chatWxml.includes('aria-label="蛋宝宝正在回复"') && chatLogic.includes("this.setScrollTarget('message-typing')"), true, '等待回复时必须显示可访问的三点气泡并自动滚入视野');
assert.equal(chatStyles.includes('animation:typing .5s ease-in-out infinite') && chatStyles.includes('animation-delay:.08s') && chatStyles.includes('animation-delay:.16s'), true, '正在回复的三点微动效必须按 0.5 秒完整循环依次跳动');
assert.equal(chatLogic.includes('reducedMotionEnabled()') && chatWxml.includes("reducedMotion ? 'page--reduced' : ''") && chatStyles.includes('.page--reduced .loading-orbit,.page--reduced .typing-bubble__dots view{animation:none}'), true, '聊天页必须在系统减少动态效果时退化为静态三点');
assert.equal(lifeSceneWxml.includes('aria-label="打开我的和设置"') && lifeSceneWxml.includes('bindtap="onOpenMySettings"') && lifeSceneWxml.includes('src="{{mySettingsIcon}}"'), true, '右下角必须使用我的/设置图标并直接打开我的页');
assert.equal(lifeSceneLogic.includes("onOpenMySettings() {\n    wx.switchTab({ url: '/pages/my/my' });"), true, '我的/设置入口不得经过中间弹层');
assert.equal(/scene-action-unread-dot|contextActionHasNewMessage|toolboxHasNewMessage/.test(`${lifeSceneLogic}\n${lifeSceneWxml}\n${lifeSceneStyles}`), false, '停用的明信片不得在生活场景显示不可处理的未读提示');
assert.equal(Boolean(postHatchAssets.POST_HATCH.sceneActions.toolbox) && ['card', 'postcards', 'keepsakes'].every(key => postHatchAssets.POST_HATCH.sceneActions.toolboxItems[key]), true, '已完成的百宝箱与复杂内容图片配置必须保留供后续版本使用');
assert.equal(/sendLetter|sendPostHatchLetter|onSendLetter|onLetterInput|scene-composer--letter|composer-send--paper-plane|write_letter|scene_letter_button/.test(`${lifeSceneLogic}\n${lifeSceneWxml}\n${lifeSceneStyles}\n${postHatchCompanionLogic}\n${cloudApiLogic}`), false, '写信的界面、事件、服务与云接口必须完全移除');
assert.equal(lifeSceneWxml.includes('wx:if="{{currentState && currentState.atHome}}" class="scene-context-entry"'), true, '左下角陪伴入口必须只在居家时显示');
assert.equal(lifeSceneWxml.includes('class="away-status-') || lifeSceneWxml.includes('外出中'), false, '外出时左下角必须留空，不显示按钮或状态文案');
assert.equal(/away-status-card|currentState\.(?:majorLabel|label|line)/.test(lifeSceneWxml), false, '外出时不得显示地点、活动、去向或中央叙事卡');
assert.equal(lifeSceneLogic.includes('const shouldShowStatusBubble = currentState.atHome'), true, '外出时不得触发角色动作状态对白');
assert.equal(lifeSceneWxml.includes('class="scene-action-icon-image scene-action-icon-image--companion"') && lifeSceneWxml.includes('src="{{contextActionIcon}}" mode="aspectFill"'), true, '左下角玉兔或锦鲤头像必须使用独立样式铺满圆形按钮');
assert.equal(lifeSceneStyles.includes('.scene-action-icon-image--companion{width:112rpx;height:112rpx;border-radius:50%;filter:none}'), true, '陪伴头像尺寸必须与 112rpx 按钮一致，不得保留外围空白圈');
assert.equal(lifeSceneWxml.includes('scene-action-unavailable-badge'), true, '居家但聊天不可用时必须显示状态标记');
assert.equal(lifeSceneStyles.includes('.scene-action-button--unavailable{width:88rpx;height:88rpx') && lifeSceneStyles.includes('.scene-action-button--unavailable .scene-action-icon-image--companion{width:80rpx;height:80rpx;filter:grayscale(1)'), true, '外出或不可聊天时左下角必须缩为低饱和的小状态按钮，不能继续像可聊天入口');
assert.equal(lifeSceneLogic.includes("chatAccess.status !== 'available'"), true, '聊天入口是否可用必须读取服务端 chat_access 合同');
assert.equal(/resolvePanelSceneSet|panelImages|usingPanoramaFallback|scrollIntoView/.test(lifeSceneLogic), false, '生活空间不得保留三张切图或双重滚动定位逻辑');
assert.deepEqual(postHatchAssets.POST_HATCH.panoramaFallbackMeta, {
  width: 2823,
  height: 1672,
  windowRegions: [{ id: 'main-window', x: 1050, y: 0, width: 1570, height: 800 }]
}, '全景图必须声明实际尺寸和原图窗口区域');
assert.equal((lifeSceneWxml.match(/<image[^>]*world-panorama-bg/g) || []).length, 2, '场景切换仅允许保留一张淡出的旧全景与一张当前全景');
assert.equal(lifeSceneWxml.includes('src="{{panoramaImage}}"'), true, '运行场景和退场过渡必须使用当前全景图');
assert.equal(lifeSceneWxml.includes('pendingPanoramaImage') && lifeSceneWxml.includes('bindload="onPendingPanoramaLoad"'), true, '新全景必须预加载成功后才替换当前底图');
assert.equal(lifeSceneWxml.includes('bindanimationend="onPreviousPanoramaAnimationEnd"'), true, '旧全景淡出必须在动画完成时确定清理');
assert.equal(lifeSceneLogic.includes('onPendingPanoramaError(event)') && lifeSceneLogic.includes('clearPanoramaTransition()'), true, '全景失败、快速切换与生命周期结束时必须清理临时过渡层');
assert.equal(lifeSceneLogic.includes('scheduleInitialSceneDeadline()'), true, '首次背景加载必须有独立的超时兜底，不能无限 loading');
assert.equal(lifeSceneLogic.includes('sceneTransitionError: true') && lifeSceneWxml.includes('房间背景更新失败 · 轻触重试'), true, '运行中背景更新失败必须保留当前场景并提供非阻塞重试');
assert.equal(lifeSceneLogic.includes('|| this.data.pendingPanoramaImage'), false, '首次入场不得等待运行中下一张全景的预加载');
assert.equal(lifeSceneLogic.includes('sceneFeedbackText: \'\',\n        playedActionKind: \'\''), true, '历史 actionDone 不得恢复临时反馈或动作视觉效果');
assert.equal(lifeSceneWxml.includes('<scene-feedback-stack') && lifeSceneLogic.includes('createSceneFeedbackController(this'), true, '状态对白与动作反馈必须统一进入共享双层反馈组件');
assert.equal(/scene-status-bubble|feedback-bubble|scene-bubble--demo-safe/.test(`${lifeSceneWxml}\n${lifeSceneStyles}`), false, '生活空间不得保留随全景或开发工具改变位置的旧气泡');
assert.equal(/panelImages|class="panel-bg"|scroll-into-view/.test(lifeSceneWxml), false, 'WXML 不得保留三张切图节点或双重滚动定位');
assert.equal(lifeSceneLogic.includes('windowGeometry.mapPanoramaRegions'), true, '全景窗口必须用原图坐标映射到设备屏幕');
assert.equal(lifeSceneWxml.includes('daily-window-hotspot--panel-1'), true, '中屏可见窗户必须有独立点击区');
assert.equal(lifeSceneWxml.includes('daily-window-hotspot--panel-2'), true, '右屏可见窗户必须有独立点击区');
assert.equal(lifeSceneWxml.includes('daily-window-hotspot--panel-0'), true, '左屏必须支持未来可见窗户的统一动态热区');
assert.equal(lifeSceneWxml.includes('bindtouchstart="onDailyWindowTouchStart"') && lifeSceneWxml.includes('bindtouchmove="onDailyWindowTouchMove"') && lifeSceneWxml.includes('bindtouchend="onDailyWindowTouchEnd"'), true, '窗户必须自行仲裁点击、拖动和长按');
assert.equal(lifeSceneWxml.includes('catchtap="onDailyWindowTap"'), false, '窗口不得依赖平台 catchtap 猜测滑动意图');
assert.equal(/daily-window-hotspot--panel-1\{[^}]*left:10%|daily-window-hotspot\{[^}]*height:48%/.test(lifeSceneStyles), false, '窗口热区不得继续使用固定设备百分比');
assert.equal(lifeSceneLogic.indexOf('this.openDailyWindow(windowSelector)') < lifeSceneLogic.indexOf('this.runSceneAction(false);', lifeSceneLogic.indexOf('onDailyWindowTap(event)')), true, '窗景必须先打开，动作写入不得阻断点击');

console.log('破壳后单张连续全景、动态窗户坐标和手势校验通过。');
