const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const miniprogram = path.join(root, 'miniprogram');
const errors = [];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { errors.push(`${path.relative(root, file)}: ${error.message}`); return {}; }
}

const project = readJson(path.join(root, 'project.config.json'));
if (project.miniprogramRoot !== 'miniprogram/') errors.push('project.config.json 必须设置 miniprogramRoot 为 miniprogram/');

const app = readJson(path.join(miniprogram, 'app.json'));
const pages = app.pages || [];
if (!pages.length) errors.push('app.json 没有注册页面');
if (pages.some(page => page.includes('scene-picker') || page.includes('scene-live'))) errors.push('最新 PRD 禁止编译孵化场景选择页面');
if (!pages.includes('pages/chat/chat')) errors.push('居家对话必须注册完整聊天页面');
if (pages.includes('pages/decor-studio/decor-studio')) errors.push('主 PRD 未放行每日额度与装饰物库，不得注册 AI 布置页面');

const globalStyles = fs.readFileSync(path.join(miniprogram, 'app.wxss'), 'utf8');
for (const rule of ['display: flex !important', 'align-items: center !important', 'justify-content: center !important', 'line-height: normal !important']) {
  if (!globalStyles.includes(rule)) errors.push(`全局按钮居中规则缺失：${rule}`);
}

const buttonStyles = fs.readFileSync(path.join(miniprogram, 'components/button/button.wxss'), 'utf8');
if (!/\.btn\s*\{[^}]*height:\s*96rpx;[^}]*border-radius:\s*999rpx;/s.test(buttonStyles)) {
  errors.push('公共文字 CTA 必须保持 96rpx 高的完整胶囊');
}

const buttonStyleContracts = [
  ['custom-tab-bar/index.wxss', /\.tab-item\s*\{[^}]*width:\s*112rpx;[^}]*height:\s*112rpx;[^}]*border-radius:\s*50%;[^}]*background:\s*#FFF;/s, '底部“我的”入口必须为独立的圆形按钮'],
  ['pages/home/home.wxss', /\.companion-primary-dock\s*\{[^}]*width:\s*368rpx;[^}]*height:\s*112rpx;[^}]*flex-direction:\s*row;[^}]*padding:\s*0 15rpx;[^}]*box-sizing:\s*border-box;[^}]*border-radius:\s*56rpx;[^}]*background:\s*#FFF;/s, '首页许愿池、早教班与画画必须组成带左右留白的三等分统一胶囊'],
  ['pages/home/home.wxss', /\.companion-primary-dock \.companion-item\s*\{[^}]*width:\s*112rpx;[^}]*height:\s*112rpx;[^}]*flex:\s*0 0 112rpx;/s, '首页统一胶囊内的三个入口必须保持相同的有效触控尺寸'],
  ['pages/doodle/doodle.wxss', /\.figma-toolbar\s*\{[^}]*width:\s*100%;[^}]*height:\s*104rpx;[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\);[^}]*border-radius:\s*52rpx;/s, '底部创作工具必须只保留画笔、橡皮擦与贴纸三等分宽幅胶囊'],
  ['components/daily-window-detail/daily-window-detail.wxss', /\.daily-window__back\s*\{[^}]*width:112rpx;[^}]*height:112rpx;[^}]*border-radius:50%;/s, '窗景返回必须为 112rpx 圆形按钮']
];
for (const [relative, pattern, message] of buttonStyleContracts) {
  const source = fs.readFileSync(path.join(miniprogram, relative), 'utf8');
  if (!pattern.test(source)) errors.push(message);
}

for (const page of pages) {
  for (const extension of ['js', 'json', 'wxml', 'wxss']) {
    const file = path.join(miniprogram, `${page}.${extension}`);
    if (!fs.existsSync(file)) errors.push(`缺少页面文件：${page}.${extension}`);
  }
  const pageJsonFile = path.join(miniprogram, `${page}.json`);
  const config = readJson(pageJsonFile);
  for (const [name, relative] of Object.entries(config.usingComponents || {})) {
    const componentBase = path.resolve(path.dirname(pageJsonFile), relative);
    for (const extension of ['js', 'json', 'wxml', 'wxss']) {
      if (!fs.existsSync(`${componentBase}.${extension}`)) errors.push(`${page}: 组件 ${name} 缺少 ${extension} 文件`);
    }
  }
  const wxmlFile = path.join(miniprogram, `${page}.wxml`);
  if (fs.existsSync(wxmlFile)) {
    const wxml = fs.readFileSync(wxmlFile, 'utf8');
    if (/<\/?(?:div|span|b)(?:\s|>)/.test(wxml)) errors.push(`${page}.wxml 使用了非小程序 HTML 标签`);
    for (const match of wxml.matchAll(/<button\b[\s\S]*?<\/button>/g)) {
      const button = match[0];
      if (!button.includes('avatar-btn') && !button.includes('button-label')) errors.push(`${page}.wxml 存在未使用统一居中标签的原生按钮`);
    }
  }
}

const homeSource = fs.readFileSync(path.join(miniprogram, 'pages/home/home.wxml'), 'utf8');
if (/孵化场景|scene-picker|scene-live/.test(homeSource)) errors.push('首页仍包含旧版孵化场景入口');
if (/看看 ta 此刻在做什么|state-card|status-daily|post-hatch-entries|ta 带回来的东西|今日收藏卡/.test(homeSource)) errors.push('破壳后首页仍包含旧卡片、常驻心情或分散回忆入口');

const lifeScenes = require(path.join(miniprogram, 'utils/life-scenes'));
const lifeSceneTemplate = fs.readFileSync(path.join(miniprogram, 'pages/life-scene/life-scene.wxml'), 'utf8');
const lifeSceneLogic = fs.readFileSync(path.join(miniprogram, 'pages/life-scene/life-scene.js'), 'utf8');
const chatTemplate = fs.readFileSync(path.join(miniprogram, 'pages/chat/chat.wxml'), 'utf8');
const chatLogic = fs.readFileSync(path.join(miniprogram, 'pages/chat/chat.js'), 'utf8');
const postHatchService = fs.readFileSync(path.join(miniprogram, 'services/post-hatch-companion.js'), 'utf8');
const petAvatarTemplate = fs.readFileSync(path.join(miniprogram, 'components/pet-avatar/pet-avatar.wxml'), 'utf8');
if (lifeScenes.HOME_STATES.length !== 8) errors.push(`居家小状态应为 8 个，实际为 ${lifeScenes.HOME_STATES.length}`);
if (lifeScenes.AWAY_STATES.length !== 10) errors.push(`旅行、打工、上学小状态应覆盖 10 个，实际为 ${lifeScenes.AWAY_STATES.length}`);
if (lifeScenes.STORY_LINE.length !== 21) errors.push(`demo 5 小时故事线应为 21 段，实际为 ${lifeScenes.STORY_LINE.length}`);
const majors = new Set(lifeScenes.STORY_LINE.map(item => item.major));
for (const major of ['home', 'travel', 'work', 'school']) if (!majors.has(major)) errors.push(`故事线缺少大场景：${major}`);
for (const state of lifeScenes.HOME_STATES) {
  if (!state.action || !state.action.id) errors.push(`居家状态「${state.label}」缺少唯一原生动作`);
  if (!Number.isInteger(state.screen) || state.screen < 0 || state.screen > 2) errors.push(`居家状态「${state.label}」屏幕索引无效`);
}
const legacySceneIds = new Set(['grass', 'snow', 'room', 'sea', 'desk', 'rooftop']);
for (const state of lifeScenes.STORY_LINE) if (legacySceneIds.has(state.key) || legacySceneIds.has(state.major)) errors.push(`故事线仍包含旧六场景：${state.key}`);
const expectedActions = {
  sleep: 'lamp_off', lazy: 'pull_blanket', stare: 'tap_pet', drawing: 'turn_paper',
  reading: 'turn_book_page', gaming: 'tap_screen', music: 'listen_together', window: 'view_daily_window'
};
for (const [key, actionId] of Object.entries(expectedActions)) {
  const state = lifeScenes.resolveDefinition('home', key);
  if (!state || state.action.id !== actionId || state.canTalk !== true) errors.push(`居家小场景 ${key} 必须保留固定动作并开放对话`);
}
if (lifeScenes.resolveDefinition('home', 'tea')) errors.push('已删除的 tea 居家状态不得重新进入运行时');
if (!lifeSceneTemplate.includes('world-panel--living') || !lifeSceneTemplate.includes('world-panel--desk') || !lifeSceneTemplate.includes('world-panel--decor')) errors.push('破壳后完整场景必须保留左起居、中桌面、右布置三屏');
if (!chatTemplate.includes('class="conversation"') || !chatLogic.includes('postHatch.sendSceneMessage')) errors.push('破壳后居家状态必须使用完整对话页');
if (/memory-entry|memory-rail|state-pill|scene-copy/.test(lifeSceneTemplate)) errors.push('破壳后全屏场景不得恢复旧回忆条、常驻心情或状态卡');
if (/demo-scene-badge|>DEMO</.test(lifeSceneTemplate)) errors.push('破壳后正式页面不得显示 DEMO 调试标识');
if (/bed-placeholder|bed-pillow|bed-blanket|lamp-placeholder|decor-placeholder|这里留着一块安静的空地/.test(lifeSceneTemplate)) errors.push('破壳后三屏不得叠加临时床铺、灯具或安静空地占位层');
if (/sceneCharacterImage|scene-character__pose-image|scene-character__floor-shadow|class="panel-tone"|class="scene-prop/.test(`${lifeSceneLogic}\n${lifeSceneTemplate}`)) errors.push('破壳后角色与动作道具必须烘焙进正式全景，不得叠加透明角色、接触阴影、CSS 道具或色调层');
if (!lifeSceneLogic.includes('assets.resolveActionPanorama') || !lifeSceneTemplate.includes('class="scene-character-hotspot') || !lifeSceneTemplate.includes('bindtap="onCharacterTap"')) errors.push('破壳后必须从正式动作全景取图，并保留不改变画面的角色互动热区');
if (!petAvatarTemplate.includes("petType === '玉兔' || petType === 'YT'") || /wx:else\s+class="koi"/.test(petAvatarTemplate)) errors.push('玉兔代码 YT 不得错误落入锦鲤兜底渲染');
if (!lifeSceneTemplate.includes('wx:if="{{currentState.atHome}}" class="scene-context-entry"') || !lifeSceneTemplate.includes('class="scene-action-dock"') || !lifeSceneTemplate.includes('contextActionIcon') || !lifeSceneTemplate.includes('mySettingsIcon') || !lifeSceneTemplate.includes('aria-label="打开我的和设置"') || !lifeSceneLogic.includes('/pages/chat/chat?state_key=') || !lifeSceneLogic.includes('scene_chat_button') || !lifeSceneLogic.includes('statusBubbleFor')) errors.push('破壳后必须使用居家左下对话入口和右下我的/设置，居家入口直达完整对话页');
if (/toolboxVisible|onToggleToolbox|onToolboxItemTap|data-target="(?:card|postcards|keepsakes)"|scene-action-unread-dot/.test(`${lifeSceneLogic}\n${lifeSceneTemplate}`)) errors.push('V3.6 / V3.7 不得暴露百宝箱弹层、复杂内容入口或未读提示');
if (!lifeSceneLogic.includes('onContextActionTap') || !lifeSceneLogic.includes('openChatPage(current)') || !lifeSceneLogic.includes("onOpenMySettings() {\n    wx.switchTab({ url: '/pages/my/my' });")) errors.push('居家对话与右下我的/设置必须直接打开目标页面');
const cloudApiSource = fs.readFileSync(path.join(miniprogram, 'services/cloud-api.js'), 'utf8');
if (/sendLetter|sendPostHatchLetter|onSendLetter|onLetterInput|scene-composer--letter|composer-send--paper-plane|write_letter|scene_letter_button/.test(`${lifeSceneLogic}\n${lifeSceneTemplate}\n${postHatchService}\n${cloudApiSource}`)) errors.push('写信界面、事件、服务或云接口未完全移除');
if (/scene-talk-nudge|home-locator-focus|onOpenTalkComposer|composerVisible && currentState\.atHome/.test(`${lifeSceneTemplate}\n${lifeSceneLogic}`)) errors.push('居家入口不得恢复聚焦光圈、三点提示或场景内对话弹层');
if (!lifeSceneTemplate.includes('bindtap="onCharacterTap"') || !lifeSceneLogic.includes('今日心情 · ${mood.mood}')) errors.push('今日心情必须改为点击蛋宝宝后出现');
if (/画一件东西/.test(lifeSceneTemplate)) errors.push('破壳后运行时不得混入未确认的 AI 布置入口');
if (!lifeSceneTemplate.includes('magic-enabled="{{magicWindowEnabled}}"') || lifeSceneTemplate.includes('magic-enabled="{{true}}"') || lifeSceneLogic.includes('TOKYO_MAGIC_WINDOW_PREVIEW')) errors.push('魔法窗必须受正式素材配置门控，不得硬编码预览入口');
if (/getDecorationState|createDecoration|moveDecoration|remaining_wishes/.test(postHatchService)) errors.push('破壳后服务不得建立装饰额度或装饰物库');
for (const assetDoc of [
  'assets/scenes/lifecycle/README.md',
  'assets/scenes/lifecycle/pre-hatch/30-character/egg/README.md',
  'assets/scenes/lifecycle/post-hatch/10-background/left-living/README.md',
  'assets/scenes/lifecycle/post-hatch/10-background/center-desk/README.md',
  'assets/scenes/lifecycle/post-hatch/10-background/right-decor/README.md',
  'assets/scenes/lifecycle/post-hatch/10-background/THREE_PANEL_SCENE_SET_SPEC.md',
  'assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/README.md',
  'assets/scenes/lifecycle/post-hatch/30-character/boon-koi/README.md',
  'assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/README.md'
]) if (!fs.existsSync(path.join(miniprogram, assetDoc))) errors.push(`缺少分层素材目录：${assetDoc}`);

if (errors.length) {
  console.error(`项目校验失败（${errors.length} 项）：`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`项目校验通过：${pages.length} 个页面，工程结构与关键 PRD 约束正常。`);
