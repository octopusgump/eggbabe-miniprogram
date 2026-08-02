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
if (pages.includes('pages/chat/chat')) errors.push('V3.6 禁止注册独立聊天页面');
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
  ['custom-tab-bar/index.wxss', /\.tab-item\s*\{[^}]*width:\s*112rpx;[^}]*height:\s*112rpx;[^}]*border-radius:\s*50%;/s, '底部独立导航入口必须为 112rpx 圆形'],
  ['pages/home/home.wxss', /\.companion-primary-dock\s*\{[^}]*width:\s*112rpx;[^}]*height:\s*224rpx;[^}]*border-radius:\s*56rpx;/s, '首页许愿池与早教班必须组成等宽双功能胶囊'],
  ['pages/home/home.wxss', /\.draw-icon-button\s*\{[^}]*width:\s*112rpx;[^}]*height:\s*112rpx;[^}]*border-radius:\s*50%;/s, '首页画画必须为与功能胶囊等宽的独立圆形入口'],
  ['pages/doodle/doodle.wxss', /\.figma-toolbar\s*\{[^}]*width:\s*560rpx;[^}]*height:\s*112rpx;[^}]*grid-template-columns:\s*repeat\(5,\s*112rpx\);[^}]*border-radius:\s*56rpx;/s, '绘画工具必须组成五等分胶囊'],
  ['pages/chat/chat.wxss', /\.composer__send\s*\{[^}]*width:\s*112rpx;[^}]*height:\s*112rpx;[^}]*border-radius:\s*50%;/s, '聊天发送必须为 112rpx 圆形按钮'],
  ['pages/life-scene/life-scene.wxss', /\.composer-send\s*\{[^}]*width:112rpx;[^}]*height:112rpx;[^}]*border-radius:50%;/s, '生活场景发送必须为 112rpx 圆形按钮'],
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
if (lifeScenes.HOME_STATES.length !== 7) errors.push(`居家小状态应为 7 个，实际为 ${lifeScenes.HOME_STATES.length}`);
if (lifeScenes.AWAY_STATES.length !== 10) errors.push(`旅行、打工、上学小状态应覆盖 10 个，实际为 ${lifeScenes.AWAY_STATES.length}`);
if (lifeScenes.STORY_LINE.length !== 19) errors.push(`demo 5 小时故事线应为 19 段，实际为 ${lifeScenes.STORY_LINE.length}`);
const majors = new Set(lifeScenes.STORY_LINE.map(item => item.major));
for (const major of ['home', 'travel', 'work', 'school']) if (!majors.has(major)) errors.push(`故事线缺少大场景：${major}`);
for (const state of lifeScenes.HOME_STATES) {
  if (!state.action || !state.action.id) errors.push(`居家状态「${state.label}」缺少唯一原生动作`);
  if (!Number.isInteger(state.screen) || state.screen < 0 || state.screen > 2) errors.push(`居家状态「${state.label}」屏幕索引无效`);
}
const legacySceneIds = new Set(['grass', 'snow', 'room', 'sea', 'desk', 'rooftop']);
for (const state of lifeScenes.STORY_LINE) if (legacySceneIds.has(state.key) || legacySceneIds.has(state.major)) errors.push(`故事线仍包含旧六场景：${state.key}`);
const expectedActions = {
  sleep: ['lamp_off', false], lazy: ['pull_blanket', false], stare: ['tap_pet', true],
  tea: ['push_cup', true], drawing: ['turn_paper', true], gaming: ['tap_screen', false], window: ['view_daily_window', true]
};
for (const [key, expected] of Object.entries(expectedActions)) {
  const state = lifeScenes.resolveDefinition('home', key);
  if (!state || state.action.id !== expected[0] || state.canTalk !== expected[1]) errors.push(`小场景 ${key} 未使用固定动作与说话映射`);
}
if (!lifeSceneTemplate.includes('world-panel--living') || !lifeSceneTemplate.includes('world-panel--desk') || !lifeSceneTemplate.includes('world-panel--decor')) errors.push('破壳后完整场景必须保留左起居、中桌面、右布置三屏');
if (!lifeSceneTemplate.includes('给远方的 ta 写一句') || !lifeSceneTemplate.includes('currentState.canTalk')) errors.push('破壳后场景必须包含外出来信和场景内条件对话');
if (!lifeSceneTemplate.includes('class="memory-entry"') || /memory-rail|state-pill|scene-copy/.test(lifeSceneTemplate)) errors.push('破壳后全屏场景必须只保留一个“看看回忆”入口，且不得常驻心情或状态卡');
if (!lifeSceneTemplate.includes('bindtap="onCharacterTap"') || !lifeSceneLogic.includes('今日心情 · ${mood.mood}')) errors.push('今日心情必须改为点击蛋宝宝后出现');
if (/画一件东西/.test(lifeSceneTemplate)) errors.push('破壳后运行时不得混入未确认的 AI 布置入口');
const hasTokyoPreview = /东京|magicWindowVisible|onOpenMagicWindow/.test(`${lifeSceneTemplate}\n${lifeSceneLogic}`);
if (hasTokyoPreview && !(
  lifeSceneTemplate.includes('magic-enabled="{{true}}"')
  && lifeSceneTemplate.includes('bindmagic="onOpenMagicWindow"')
  && lifeSceneLogic.includes('TOKYO_MAGIC_WINDOW_PREVIEW')
  && lifeSceneLogic.includes('magic_window_tokyo_koi_walk_standard_v02.webp')
)) errors.push('东京魔法窗只能作为显式独立预览接入，并必须使用标准锦鲤 v02');
const postHatchService = fs.readFileSync(path.join(miniprogram, 'services/post-hatch-companion.js'), 'utf8');
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
