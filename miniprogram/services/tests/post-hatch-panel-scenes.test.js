const assert = require('assert');
const fs = require('fs');
const childProcess = require('child_process');
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
  assert.equal(set.panorama, set.expected.panorama, `${scene.key} 必须精确使用约定的完整全景路径`);
  const absolute = path.resolve(__dirname, '../..', `.${set.panorama}`);
  assert.equal(fs.existsSync(absolute), true, `${scene.key} 正式运行时全景资源缺失：${set.panorama}`);
  assert.deepEqual(set.windowMeta, postHatchAssets.POST_HATCH.panoramaFallbackMeta, `${scene.key} 必须使用同一套完整全景窗口坐标`);
});

assert.equal(postHatchAssets.resolvePanoramaScene('unknown_scene'), null, '未知 scene key 不得静默混入其他套装');
const actionScenes = postHatchAssets.POST_HATCH.actionPanoramaScenes || {};
const actionScenesByCharacter = postHatchAssets.POST_HATCH.actionPanoramaScenesByCharacter || {};
assert.deepEqual(Object.keys(actionScenes), ['sleep', 'stare', 'reading', 'gaming', 'window', 'drawing', 'music'], '21 张通用日常动作图必须按七个状态、日间/日落/夜间三套登记');
assert.deepEqual(Object.keys(actionScenesByCharacter), ['jade-rabbit', 'boon-koi'], '玉兔与锦鲤都必须登记各自的正式动作全景');
Object.entries(actionScenesByCharacter).forEach(([characterKey, scenes]) => {
  const expectedStates = ['sleep', 'stare', 'reading', 'gaming', 'window', 'drawing', 'music', 'lazy'];
  assert.deepEqual(Object.keys(scenes), expectedStates, `${characterKey} 必须登记所有已交付动作`);
  Object.values(scenes).forEach(scene => {
    const registeredSceneKeys = Object.keys(scene.panoramaBySceneKey);
    assert.equal(registeredSceneKeys.length > 0, true, `${characterKey} ${scene.stateKey} 必须至少登记一个环境键`);
    registeredSceneKeys.forEach(sceneKey => {
      assert.equal(Object.prototype.hasOwnProperty.call(panoramaSets, sceneKey), true, `${characterKey} ${scene.stateKey} 登记了未知环境键：${sceneKey}`);
      const panorama = scene.panoramaBySceneKey[sceneKey];
      const absolute = path.resolve(__dirname, '../..', `.${panorama}`);
      assert.equal(fs.existsSync(absolute), true, `${characterKey} ${scene.stateKey} ${sceneKey} 动作全景资源缺失：${panorama}`);
    });
    assert.equal(scene.bakedCharacter && scene.bakedProps, true, `${characterKey} ${scene.stateKey} 动作图必须声明角色与道具已烘焙`);
    assert.deepEqual(scene.windowMeta, postHatchAssets.POST_HATCH.panoramaFallbackMeta, `${characterKey} ${scene.stateKey} 必须复用三屏窗户热区坐标`);
  });
});
const lightsOffPanorama = actionScenes.sleep
  && actionScenes.sleep.panoramaAfterActionBySceneKey
  && actionScenes.sleep.panoramaAfterActionBySceneKey.spring_clear_night;
assert.equal(fs.existsSync(path.resolve(__dirname, '../..', `.${lightsOffPanorama}`)), true, '关灯闭眼的夜间睡觉动作图必须存在');
const jadeRabbit = { prototype: '玉兔' };
const sleepState = { atHome: true, key: 'sleep', action: { id: 'lamp_off' } };
const dayAction = postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { sceneKey: 'spring_clear_day', weather: 'sunny', period: 'day' }, 'https://cdn.example.com');
assert.equal(dayAction && dayAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_nap_day_v01.webp', '春季晴朗日间睡觉必须读取对应 CDN 动作全景');
const sunsetAction = postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { sceneKey: 'spring_clear_sunset', weather: 'sunny', period: 'sunset' }, 'https://cdn.example.com');
assert.equal(sunsetAction && sunsetAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_nap_sunset_v01.webp', '春季晴朗日落睡觉必须读取对应 CDN 动作全景');
const lazyState = { atHome: true, key: 'lazy' };
const lazyDayAction = postHatchAssets.resolveActionPanorama(jadeRabbit, lazyState, { sceneKey: 'spring_clear_day', weather: 'sunny', period: 'day' }, 'https://cdn.example.com');
assert.equal(lazyDayAction && lazyDayAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/jade-rabbit/home-bedroom/home_bedroom_lazy_day_v01.webp', '玉兔春季晴朗日间小憩必须读取已晋级的正式动作全景');
['day', 'sunset', 'night'].forEach(period => {
  const sceneKey = `spring_clear_${period}`;
  const sleepPanorama = postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { sceneKey, weather: 'sunny', period });
  const lazyPanorama = postHatchAssets.resolveActionPanorama(jadeRabbit, lazyState, { sceneKey, weather: 'sunny', period });
  assert.equal(Boolean(sleepPanorama && lazyPanorama), true, `玉兔 ${period} 必须同时具备独立的睡觉与小憩图片`);
  assert.notEqual(sleepPanorama.panorama, lazyPanorama.panorama, `玉兔 ${period} 的睡觉与小憩不得复用同一张图片`);
});
assert.equal(postHatchAssets.resolveActionPanorama(jadeRabbit, lazyState, { sceneKey: 'spring_rain_day', weather: 'rain', period: 'day' }), null, '玉兔小憩不得在未登记的雨天复用春季晴天动作图');
const koiLazyDayAction = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, lazyState, { sceneKey: 'spring_clear_day', weather: 'sunny', period: 'day' });
assert.equal(koiLazyDayAction && koiLazyDayAction.panorama.endsWith('/boon-koi/home-bedroom/home_bedroom_lazy_day_v01.webp'), true, '锦鲤春季晴朗日间小憩必须读取自己的正式动作全景');
const stareState = { atHome: true, key: 'stare' };
['day', 'sunset', 'night'].forEach(period => {
  const sceneKey = `spring_clear_${period}`;
  const jadeStare = postHatchAssets.resolveActionPanorama(jadeRabbit, stareState, { sceneKey, weather: 'sunny', period });
  const koiStare = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, stareState, { sceneKey, weather: 'sunny', period });
  assert.equal(jadeStare && jadeStare.panorama.endsWith(`/jade-rabbit/home-bedroom/home_bedroom_stare_${period}_v01.webp`), true, `玉兔 ${period} 发呆必须读取自己的正式动作全景`);
  assert.equal(koiStare && koiStare.panorama.endsWith(`/boon-koi/home-bedroom/home_bedroom_stare_${period}_v01.webp`), true, `锦鲤 ${period} 发呆必须读取自己的正式动作全景`);
});
assert.equal(postHatchAssets.resolveActionPanorama(jadeRabbit, stareState, { sceneKey: 'spring_rain_day', weather: 'rain', period: 'day' }), null, '发呆不得在未登记的雨天复用春季晴天动作图');
const lightsOffAction = postHatchAssets.resolveActionPanorama(jadeRabbit, Object.assign({}, sleepState, { actionDone: true }), { sceneKey: 'spring_clear_night', weather: 'sunny', period: 'night' });
assert.equal(lightsOffAction && lightsOffAction.panorama.endsWith('/home_bedroom_nap_lights_off_night_v01.webp') && lightsOffAction.variant === 'lights-off', true, '夜间关灯后必须切换为闭眼关灯动作全景');
assert.equal(postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { sceneKey: 'spring_rain_day', weather: 'rain', period: 'day' }), null, '雨天不得静默使用晴天烘焙动作图');
// 通用晴朗动作图只烘焙了春季窗景；夏、秋、冬晴天必须回落空房全景，不得跨季节代用。
['summer_clear_day', 'autumn_clear_day', 'winter_clear_day'].forEach(sceneKey => {
  assert.equal(postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { sceneKey, weather: 'sunny', period: 'day' }), null, `${sceneKey} 不得复用春季烘焙动作图`);
});
assert.equal(postHatchAssets.resolveActionPanorama(jadeRabbit, sleepState, { weather: 'sunny', period: 'day' }), null, '缺少环境键时不得按时段猜测动作全景');
const koiDayAction = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, sleepState, { sceneKey: 'spring_clear_day', weather: 'sunny', period: 'day' }, 'https://cdn.example.com');
assert.equal(koiDayAction && koiDayAction.panorama, 'https://cdn.example.com/assets/scenes/lifecycle/post-hatch/60-action-scenes/boon-koi/home-bedroom/home_bedroom_nap_day_v01.webp', '锦鲤春季晴朗日间睡觉必须读取自己的正式动作全景');
['day', 'sunset', 'night'].forEach(period => {
  const sceneKey = `spring_clear_${period}`;
  const sleepPanorama = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, sleepState, { sceneKey, weather: 'sunny', period });
  const lazyPanorama = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, lazyState, { sceneKey, weather: 'sunny', period });
  assert.equal(Boolean(sleepPanorama && lazyPanorama), true, `锦鲤 ${period} 必须同时具备独立的睡觉与小憩图片`);
  assert.notEqual(sleepPanorama.panorama, lazyPanorama.panorama, `锦鲤 ${period} 的睡觉与小憩不得复用同一张图片`);
});
assert.equal(postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, sleepState, { sceneKey: 'spring_rain_day', weather: 'rain', period: 'day' }), null, '锦鲤雨天不得静默使用晴天烘焙动作图');
assert.equal(postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, Object.assign({}, sleepState, { actionDone: true }), { sceneKey: 'spring_clear_night', weather: 'sunny', period: 'night' }).variant, 'default', '锦鲤没有关灯资产时不得复用玉兔关灯版本');
const koiNapWeatherAction = postHatchAssets.resolveActionPanorama({ prototype: '锦鲤' }, sleepState, { sceneKey: 'summer_storm_night', weather: 'storm', period: 'night' });
assert.equal(koiNapWeatherAction && koiNapWeatherAction.panorama.endsWith('/boon-koi/home-bedroom/home_bedroom_nap_summer_storm_night_v01.webp'), true, '已审核锦鲤夏季雷暴小憩图必须覆盖对应环境键');
const manifest = JSON.parse(childProcess.execFileSync(process.execPath, ['scripts/print-environment-cdn-manifest.js'], { cwd: process.cwd(), encoding: 'utf8' }));
const actionAssets = manifest.assets.filter(item => item.kind === 'post_hatch_action_panorama');
assert.equal(actionAssets.length, 52, 'CDN 清单必须覆盖玉兔与锦鲤各 24 张春季动作图、玉兔关灯变体和 3 张季节天气动作图（共 52 条运行时路径）');
assert.equal(new Set(actionAssets.map(item => item.cdn_path)).size, 52, 'CDN 动作清单不得出现同一张图被登记到多个环境键');
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
assert.equal(lifeSceneLogic.includes('isCompanionStatePreview()'), true, '陪伴状态测试必须明确隔离预览写入');
assert.equal(lifeSceneWxml.includes('wx:if="{{isDemo && currentState && sceneBackgroundReady}}" class="scene-tester'), true, '破壳后右上角环境测试入口必须等全景图就绪后显示');
assert.equal(lifeSceneWxml.includes('wx:if="{{isDemo && currentState && sceneBackgroundReady}}" class="stage-tester"'), true, '破壳后必须恢复开发版阶段切换入口，并等待全景图就绪后显示');
assert.equal(lifeSceneWxml.includes('catchtap="onStageTesterToggle"') && lifeSceneWxml.includes('catchtap="onStageTesterSelect"'), true, '破壳后阶段切换入口必须支持展开并选择 Day 1–Day 7 / 破壳后');
assert.equal(lifeSceneWxml.includes('class="companion-state-tester"'), true, '破壳后必须显示开发模式陪伴状态测试入口');
assert.equal(lifeSceneWxml.includes('companion-state-tester-option--missing') && lifeSceneWxml.includes('缺图片'), true, '无对应动作全景的测试配置项必须明确显示缺图片并置灰');
assert.equal(/pano-static-character|sceneCharacter3d|Three\.js/.test(`${lifeSceneLogic}\n${lifeSceneWxml}`), false, '3D MVP 关闭后，生活空间不得保留 WebGL 角色依赖或调试入口');
assert.equal(lifeSceneLogic.includes('assets.resolveActionPanorama(this.data.pet, currentState, this.data.dailyWindowEnvironment, cdnBase)'), true, '首次加载必须按当前状态与环境解析动作全景');
assert.equal(/sceneCharacterImage|scene-character__pose-image|scene-character__floor-shadow|class="panel-tone"|class="scene-prop/.test(`${lifeSceneLogic}\n${lifeSceneWxml}`), false, '正式动作全景不得再叠加透明角色、接触阴影、CSS 道具或色调层');
assert.equal(lifeSceneWxml.includes('class="scene-character-hotspot') && lifeSceneWxml.includes('bindtap="onCharacterTap"'), true, '烘焙角色仍必须保留可访问的互动热区');
assert.equal(lifeSceneStyles.includes('.scene-character-hotspot{') && lifeSceneStyles.includes('background:transparent'), true, '角色热区不得额外绘制视觉内容');
assert.equal(lifeSceneLogic.includes('sceneTesterTopPx: Math.round(testerTopPx)'), true, '破壳后环境测试器应与破壳前一样位于第一行');
assert.equal(lifeSceneLogic.includes('stageTesterTopPx: Math.round(testerTopPx + 44)'), true, '破壳后阶段切换入口必须位于场景与状态验收器之间');
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
assert.equal(chatLogic.includes('reducedMotionEnabled()') && chatWxml.includes("reducedMotion ? 'page--reduced' : ''") && chatStyles.includes('.page--reduced .loading-orbit,.page--reduced .typing-bubble view{animation:none}'), true, '聊天页必须在系统减少动态效果时退化为静态三点');
assert.equal(lifeSceneWxml.includes('aria-label="打开我的和设置"') && lifeSceneWxml.includes('bindtap="onOpenMySettings"') && lifeSceneWxml.includes('src="{{mySettingsIcon}}"'), true, '右下角必须使用我的/设置图标并直接打开我的页');
assert.equal(lifeSceneLogic.includes("onOpenMySettings() {\n    wx.switchTab({ url: '/pages/my/my' });"), true, '我的/设置入口不得经过中间弹层');
assert.equal(/scene-action-unread-dot|contextActionHasNewMessage|toolboxHasNewMessage/.test(`${lifeSceneLogic}\n${lifeSceneWxml}\n${lifeSceneStyles}`), false, '停用的明信片不得在生活场景显示不可处理的未读提示');
assert.equal(Boolean(postHatchAssets.POST_HATCH.sceneActions.toolbox) && ['card', 'postcards', 'keepsakes'].every(key => postHatchAssets.POST_HATCH.sceneActions.toolboxItems[key]), true, '已完成的百宝箱与复杂内容图片配置必须保留供后续版本使用');
assert.equal(/sendLetter|sendPostHatchLetter|onSendLetter|onLetterInput|scene-composer--letter|composer-send--paper-plane|write_letter|scene_letter_button/.test(`${lifeSceneLogic}\n${lifeSceneWxml}\n${lifeSceneStyles}\n${postHatchCompanionLogic}\n${cloudApiLogic}`), false, '写信的界面、事件、服务与云接口必须完全移除');
assert.equal(lifeSceneWxml.includes('wx:if="{{currentState.atHome}}" class="scene-context-entry"'), true, '左下角沟通入口只能在居家时显示');
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
