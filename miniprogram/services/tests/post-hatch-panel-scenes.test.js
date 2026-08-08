const assert = require('assert');
const fs = require('fs');
const path = require('path');

const preHatch = require('../../config/pre-hatch-assets').PRE_HATCH;
const postHatchAssets = require('../../config/post-hatch-assets');

const sourceScenes = preHatch.sceneTesterOptions || [];
const panoramaSets = postHatchAssets.POST_HATCH.panoramaSceneSets || {};

assert.equal(sourceScenes.length, 36, '全景场景必须严格跟随破壳前启用的 36 个季节/天气/时段状态');
assert.deepEqual(Object.keys(panoramaSets), sourceScenes.map(scene => scene.key), '全景 scene key 必须与破壳前配置同源且顺序一致');

sourceScenes.forEach(scene => {
  const set = panoramaSets[scene.key];
  assert.equal(set.expected.panorama.endsWith(`/panorama-three-screen/scene-sets/${scene.key}_post_hatch_panorama_v01.webp`), true, `${scene.key} 全景文件名不符合规范`);
  assert.equal(set.ready, Boolean(set.panorama), `${scene.key} 必须完整启用一张全景图，不能使用半套切图`);
  const absolute = path.resolve(__dirname, '../..', `.${set.panorama}`);
  assert.equal(fs.existsSync(absolute), true, `${scene.key} 正式运行时全景资源缺失：${set.panorama}`);
  assert.deepEqual(set.windowMeta, postHatchAssets.POST_HATCH.panoramaFallbackMeta, `${scene.key} 必须使用同一套完整全景窗口坐标`);
});

assert.equal(postHatchAssets.resolvePanoramaScene('unknown_scene'), null, '未知 scene key 不得静默混入其他套装');
const actionScenes = postHatchAssets.POST_HATCH.actionPanoramaScenes || {};
const actionScenesByCharacter = postHatchAssets.POST_HATCH.actionPanoramaScenesByCharacter || {};
assert.deepEqual(Object.keys(actionScenes), ['sleep', 'reading', 'gaming', 'window', 'drawing', 'music'], '18 张日常动作图必须按六个状态、日间/日落/夜间三套登记');
assert.deepEqual(Object.keys(actionScenesByCharacter), ['jade-rabbit', 'boon-koi'], '玉兔与锦鲤都必须登记各自的正式动作全景');
Object.entries(actionScenesByCharacter).forEach(([characterKey, scenes]) => {
  const expectedStates = characterKey === 'jade-rabbit'
    ? ['sleep', 'reading', 'gaming', 'window', 'drawing', 'music', 'tea']
    : ['sleep', 'reading', 'gaming', 'window', 'drawing', 'music'];
  assert.deepEqual(Object.keys(scenes), expectedStates, `${characterKey} 必须登记所有已交付动作`);
  Object.values(scenes).forEach(scene => {
    ['day', 'sunset', 'night'].filter(period => scene.panoramaByPeriod[period]).forEach(period => {
      const panorama = scene.panoramaByPeriod[period];
      const absolute = path.resolve(__dirname, '../..', `.${panorama}`);
      assert.equal(fs.existsSync(absolute), true, `${characterKey} ${scene.stateKey} ${period} 动作全景资源缺失：${panorama}`);
    });
    assert.equal(scene.bakedCharacter && scene.bakedProps, true, `${characterKey} ${scene.stateKey} 动作图必须声明角色与道具已烘焙`);
    assert.deepEqual(scene.windowMeta, postHatchAssets.POST_HATCH.panoramaFallbackMeta, `${characterKey} ${scene.stateKey} 必须复用三屏窗户热区坐标`);
  });
});
const lightsOffPanorama = actionScenes.sleep && actionScenes.sleep.panoramaAfterAction && actionScenes.sleep.panoramaAfterAction.night;
assert.equal(fs.existsSync(path.resolve(__dirname, '../..', `.${lightsOffPanorama}`)), true, '关灯闭眼的夜间睡觉动作图必须存在');
const jadeRabbit = { prototype: '玉兔' };
const sleepState = { atHome: true, key: 'sleep', action: { id: 'lamp_off' } };
const dayAction = postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { weather: 'sunny', period: 'day' }, 'https://cdn.example.com');
assert.equal(dayAction && dayAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_nap_day_v01.webp', '晴朗日间睡觉必须读取对应 CDN 动作全景');
const sunsetAction = postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { weather: 'sunny', period: 'sunset' }, 'https://cdn.example.com');
assert.equal(sunsetAction && sunsetAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_nap_sunset_v01.webp', '晴朗日落睡觉必须读取对应 CDN 动作全景');
const lightsOffAction = postHatchAssets.resolveActionPanorama(jadeRabbit, Object.assign({}, sleepState, { actionDone: true }), { weather: 'sunny', period: 'night' });
assert.equal(lightsOffAction && lightsOffAction.panorama.endsWith('/home_bedroom_nap_lights_off_night_v01.webp') && lightsOffAction.variant === 'lights-off', true, '夜间关灯后必须切换为闭眼关灯动作全景');
assert.equal(postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { weather: 'rain', period: 'day' }), null, '雨天不得静默使用晴天烘焙动作图');
const koiDayAction = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, sleepState, { weather: 'sunny', period: 'day' }, 'https://cdn.example.com');
assert.equal(koiDayAction && koiDayAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/boon-koi/home-bedroom/home_bedroom_nap_day_v01.webp', '锦鲤晴朗日间睡觉必须读取自己的正式动作全景');
assert.equal(postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, sleepState, { weather: 'rain', period: 'day' }), null, '锦鲤雨天不得静默使用晴天烘焙动作图');
const jadeTeaWeatherAction = postHatchAssets.resolveActionPanorama(jadeRabbit, { atHome: true, key: 'tea', action: {} }, { sceneKey: 'spring_cloudy_day', weather: 'cloudy', period: 'day' });
assert.equal(jadeTeaWeatherAction && jadeTeaWeatherAction.panorama.endsWith('/jade-rabbit/home-bedroom/home_bedroom_tea_spring_cloudy_day_v01.webp'), true, '已审核玉兔春季多云泡茶图必须覆盖对应环境键');
const koiNapWeatherAction = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, sleepState, { sceneKey: 'summer_storm_night', weather: 'storm', period: 'night' });
assert.equal(koiNapWeatherAction && koiNapWeatherAction.panorama.endsWith('/boon-koi/home-bedroom/home_bedroom_nap_summer_storm_night_v01.webp'), true, '已审核锦鲤夏季雷暴小憩图必须覆盖对应环境键');
assert.equal(postHatchAssets.POST_HATCH.characterPoses.stare.sunset.endsWith('/jade-rabbit/stare_sunset_v01.webp'), true, '玉兔发呆日落样张必须使用明确的透明 WebP 文件');
assert.equal(postHatchAssets.POST_HATCH.characterPoses.stare.day, '', '日落样张不得静默复用为日间角色图');
assert.equal(postHatchAssets.POST_HATCH.characterPoses.stare.night, '', '日落样张不得静默复用为夜晚角色图');

const lifeSceneLogic = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.js'), 'utf8');
const lifeSceneWxml = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.wxml'), 'utf8');
const lifeSceneStyles = fs.readFileSync(path.resolve(__dirname, '../../pages/life-scene/life-scene.wxss'), 'utf8');
const homeLogic = fs.readFileSync(path.resolve(__dirname, '../../pages/home/home.js'), 'utf8');
const homeWxml = fs.readFileSync(path.resolve(__dirname, '../../pages/home/home.wxml'), 'utf8');
const homeStyles = fs.readFileSync(path.resolve(__dirname, '../../pages/home/home.wxss'), 'utf8');
assert.equal(lifeSceneLogic.includes('assets.resolvePanoramaScene(sceneKey, cdnBase)'), true, '全屏生活空间必须按当前环境 scene key 读取单张全景图，并支持备案 CDN');
assert.equal(homeWxml.includes('post-hatch-redirect'), false, '破壳后不得把 Pano 中屏切片作为可见跳转底图');
assert.equal(homeWxml.includes('postHatchPanoPreload') && homeWxml.includes('bindload="onPostHatchPanoPreloadLoad"'), true, '主页必须在跳转前不可见预热正确的完整 Pano');
assert.equal(homeLogic.includes('preparePostHatchLanding(panorama)') && homeLogic.includes("animationType: 'none'"), true, '预热完成后必须无系统横向导航动画进入生活空间');
assert.equal(homeStyles.includes('.post-hatch-pano-preloader'), true, '破壳后 Pano 预热节点必须脱离可见页面');
assert.equal(/assets\.POST_HATCH\.panoramaFallback(?!Meta)/.test(lifeSceneLogic), false, '破壳后背景加载失败不得静默替换为其他天气场景');
assert.equal(lifeSceneLogic.includes("isDemo: config.localDemoEnabled"), true, '破壳后环境测试器只能在开发验收模式启用');
assert.equal(lifeSceneLogic.includes('onSceneTesterSelect(event)'), true, '破壳后必须支持选择同一套环境测试场景');
assert.equal(lifeSceneLogic.includes('onStageTesterSelect(event)'), true, '破壳后必须支持 Day 1–Day 7 与破壳后阶段测试');
assert.equal(lifeSceneLogic.includes('onCompanionStateTesterSelect(event)'), true, '破壳后开发模式必须支持陪伴状态切换测试');
assert.equal(lifeSceneLogic.includes("key: 'home-talk'"), true, '陪伴状态测试必须覆盖在家且可对话');
assert.equal(lifeSceneLogic.includes("key: 'home-busy'"), true, '陪伴状态测试必须覆盖在家不便对话');
['home-reading', 'home-music', 'home-window', 'home-gaming'].forEach(key => {
  assert.equal(lifeSceneLogic.includes(`key: '${key}'`), true, `陪伴状态测试必须覆盖 ${key} 动作全景`);
});
['home-lazy', 'home-stare', 'home-tea'].forEach(key => {
  assert.equal(lifeSceneLogic.includes(`key: '${key}'`), true, `陪伴状态测试必须显示 ${key} 的缺图配置项`);
});
assert.equal(lifeSceneLogic.includes("key: 'home-talk', label: '在家 · 可对话（画画）', major: 'home', stateKey: 'drawing'"), true, '可对话快捷项必须验证画画动作全景');
assert.equal(lifeSceneLogic.includes("key: 'home-busy', label: '在家 · 不便对话（睡觉）', major: 'home', stateKey: 'sleep', actionDone: true"), true, '不便对话快捷项必须验证闭眼关灯睡觉全景');
assert.equal(lifeSceneLogic.includes('}, () => this.refreshEnvironment());'), true, '完成居家动作后必须重新解析动作全景');
assert.equal(lifeSceneLogic.includes("key: 'away-letter'"), true, '陪伴状态测试必须覆盖不在家写信');
assert.equal(lifeSceneLogic.includes('isCompanionStatePreview()'), true, '陪伴状态测试必须明确隔离预览写入');
assert.equal(lifeSceneWxml.includes('wx:if="{{isDemo && currentState && sceneBackgroundReady}}" class="scene-tester'), true, '破壳后右上角环境测试入口必须等全景图就绪后显示');
assert.equal(lifeSceneWxml.includes('wx:if="{{isDemo && currentState && sceneBackgroundReady}}" class="stage-tester"'), true, '破壳后必须恢复开发版阶段切换入口，并等待全景图就绪后显示');
assert.equal(lifeSceneWxml.includes('catchtap="onStageTesterToggle"') && lifeSceneWxml.includes('catchtap="onStageTesterSelect"'), true, '破壳后阶段切换入口必须支持展开并选择 Day 1–Day 7 / 破壳后');
assert.equal(lifeSceneWxml.includes('class="companion-state-tester"'), true, '破壳后必须显示开发模式陪伴状态测试入口');
assert.equal(lifeSceneWxml.includes('companion-state-tester-option--missing') && lifeSceneWxml.includes('缺图片'), true, '无对应动作全景的测试配置项必须明确显示缺图片并置灰');
assert.equal(/pano-static-character|sceneCharacter3d|Three\.js/.test(`${lifeSceneLogic}\n${lifeSceneWxml}`), false, '3D MVP 关闭后，生活空间不得保留 WebGL 角色依赖或调试入口');
assert.equal(lifeSceneLogic.includes('function characterPosePath(key, environment)'), true, '角色图必须按状态与环境时段取图');
assert.equal(lifeSceneLogic.includes('assets.resolveActionPanorama(this.data.pet, currentState, this.data.dailyWindowEnvironment, cdnBase)'), true, '首次加载必须按当前状态与环境解析动作全景');
assert.equal(lifeSceneLogic.includes('characterPresentation(this.data.pet, currentState, this.data.dailyWindowEnvironment, actionScene)'), true, '动作全景启用时必须抑制独立角色图层');
assert.equal(lifeSceneLogic.includes('const character = characterPresentation(this.data.pet, this.data.currentState, environment, actionScene);'), true, '切换环境测试场景时必须重新判定动作与角色图层');
assert.equal(lifeSceneWxml.includes('showSceneCharacter && sceneCharacterScreen === 1'), true, '中屏发呆角色图必须只渲染到中屏');
assert.equal(lifeSceneWxml.includes('!sceneUsesBakedAction && currentState.action.kind === \'paper\''), true, '烘焙动作全景不得叠加纸张道具层');
assert.equal(lifeSceneWxml.includes('!sceneUsesBakedAction && currentState.action.kind === \'screen\''), true, '烘焙动作全景不得叠加屏幕道具层');
assert.equal(lifeSceneWxml.includes('wx:if="{{!sceneUsesBakedAction}}" class="panel-tone"'), true, '烘焙动作全景不得叠加环境色调层');
assert.equal(lifeSceneStyles.includes('.scene-character--stare'), true, '发呆角色图必须具有独立摆位样式');
assert.equal(lifeSceneLogic.includes('sceneTesterTopPx: Math.round(testerTopPx)'), true, '破壳后环境测试器应与破壳前一样位于第一行');
assert.equal(lifeSceneLogic.includes('stageTesterTopPx: Math.round(testerTopPx + 44)'), true, '破壳后阶段切换入口必须位于场景与状态验收器之间');
assert.equal(lifeSceneLogic.includes('restoreToolboxOnReturn = true') && lifeSceneLogic.includes('toolboxVisible: restoreToolbox'), true, '从百宝箱子页返回生活场景时必须恢复百宝箱，不得只落在空桌面');
assert.equal(lifeSceneWxml.includes('wx:if="{{(!sceneEntered || !initialViewportReady) && !error}}" class="state-layer"'), true, '首帧必须保持加载层直到全景与目标面板定位完成后才能淡入');
assert.equal(lifeSceneLogic.includes('sceneBackgroundReady: true, sceneBackgroundError: false'), true, '全景图加载成功后才能安排首帧淡入');
assert.equal(lifeSceneLogic.includes('scroll-view 在 currentState 就绪前不会挂载；目标屏由快照一次性写入'), true, '首帧目标屏策略必须明确禁止先挂载中屏再异步横滑');
assert.equal(lifeSceneLogic.includes('currentScreen: screen') && lifeSceneLogic.includes('scrollLeft: screen * this.data.panelWidth'), true, '快照就绪时必须一次性定位到当前状态的目标屏');
assert.equal(lifeSceneLogic.includes('scheduleInitialViewportSettle(token)') && lifeSceneLogic.includes('markInitialViewportReady(token)'), true, '首次目标屏必须在不可见状态下等待原生滚动定位完成');
assert.equal(lifeSceneLogic.includes('revealInitialScene()') && lifeSceneWxml.includes("scene-stage {{sceneEntered && initialViewportReady ? 'scene-stage--entered' : ''}}"), true, '进入生活空间必须在背景和目标屏均就绪后使用渐入层');
assert.equal(lifeSceneStyles.includes('.scene-stage{position:absolute;inset:0;opacity:0;') && lifeSceneStyles.includes('.scene-stage--entered{opacity:1;'), true, '场景入场必须是渐入，而非横向页面滑动');
assert.equal(lifeSceneWxml.includes('scene-action-talk-badge'), true, '可对话时的找到 ta 按钮必须展示对话标记');
assert.equal(lifeSceneWxml.includes('scene-action-unread-dot'), true, '新明信片必须在场景入口展示红点提示');
assert.equal(lifeSceneWxml.includes('contextActionShowTalkBadge') && lifeSceneWxml.includes('contextActionHasNewMessage'), true, '红点与可对话徽标必须由互斥状态控制');
assert.equal(lifeSceneStyles.includes('.scene-action-button--talkable'), true, '可对话状态必须与不便对话状态有明确的按钮视觉差异');
assert.equal(lifeSceneStyles.includes('background:#F1EC9A'), true, '可对话徽标必须使用晨露黄，表达互动而非成长状态');
assert.equal(lifeSceneStyles.includes('background:#26362B'), true, '可对话徽标图形必须使用深墨绿');
assert.equal(lifeSceneStyles.includes('top:30rpx;right:16rpx') && lifeSceneStyles.includes('background:#D9463C'), true, '新消息红点必须靠近角色头像头部侧边，并使用功能提示红');
assert.equal(lifeSceneWxml.includes('composer-send--paper-plane'), true, '写信发送按钮必须使用与场景操作一致的 3D 纸飞机视觉');
assert.equal(lifeSceneWxml.includes('adjust-position="{{false}}"') && lifeSceneWxml.includes('bindkeyboardheightchange="onLetterKeyboardHeightChange"'), true, '写信栏必须自主响应键盘高度，避免系统与页面双重上推');
assert.equal(lifeSceneLogic.includes('resolveLetterComposerTop(keyboardHeight, panelHeight, panelWidth)'), true, '写信栏必须根据屏幕与键盘可用高度计算安全位置');
assert.equal(lifeSceneStyles.includes('.scene-composer--letter{position:fixed;bottom:auto;'), true, '写信栏必须脱离底部停靠并放到屏幕上中部');
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
assert.equal(lifeSceneLogic.includes('feedback: \'\',\n        playedActionKind: \'\''), true, '历史 actionDone 不得恢复临时反馈或动作视觉效果');
assert.equal(lifeSceneWxml.includes('statusBubble && !feedback'), true, '状态气泡与动作反馈必须互斥显示');
assert.equal(lifeSceneWxml.includes("isDemo ? 'scene-bubble--demo-safe' : ''"), true, '开发模式气泡必须避开右上角测试控件');
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
