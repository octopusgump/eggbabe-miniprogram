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

const globalStyles = fs.readFileSync(path.join(miniprogram, 'app.wxss'), 'utf8');
for (const rule of ['display: flex !important', 'align-items: center !important', 'justify-content: center !important', 'line-height: normal !important']) {
  if (!globalStyles.includes(rule)) errors.push(`全局按钮居中规则缺失：${rule}`);
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

const lifeScenes = require(path.join(miniprogram, 'utils/life-scenes'));
const lifeSceneTemplate = fs.readFileSync(path.join(miniprogram, 'pages/life-scene/life-scene.wxml'), 'utf8');
if (lifeScenes.HOME_STATES.length !== 7) errors.push(`居家小状态应为 7 个，实际为 ${lifeScenes.HOME_STATES.length}`);
if (lifeScenes.AWAY_STATES.length !== 10) errors.push(`旅行、打工、上学小状态应覆盖 10 个，实际为 ${lifeScenes.AWAY_STATES.length}`);
if (lifeScenes.STORY_LINE.length !== 19) errors.push(`demo 5 小时故事线应为 19 段，实际为 ${lifeScenes.STORY_LINE.length}`);
const majors = new Set(lifeScenes.STORY_LINE.map(item => item.major));
for (const major of ['home', 'travel', 'work', 'school']) if (!majors.has(major)) errors.push(`故事线缺少大场景：${major}`);
for (const state of lifeScenes.HOME_STATES) {
  if (!state.action || !state.action.id) errors.push(`居家状态「${state.label}」缺少唯一原生动作`);
  if (!Number.isInteger(state.screen) || state.screen < 0 || state.screen > 2) errors.push(`居家状态「${state.label}」屏幕索引无效`);
}
if (!lifeSceneTemplate.includes('world-panel--living') || !lifeSceneTemplate.includes('world-panel--desk') || !lifeSceneTemplate.includes('world-panel--decor')) errors.push('破壳后完整场景必须保留左生活、中书桌、右装扮三屏');
if (!lifeSceneTemplate.includes('给远方的 ta 写一句') || !lifeSceneTemplate.includes('currentState.canTalk')) errors.push('破壳后场景必须包含外出来信和场景内条件对话');
for (const assetDoc of [
  'assets/scenes/lifecycle/README.md',
  'assets/scenes/lifecycle/pre-hatch/30-character/egg/README.md',
  'assets/scenes/lifecycle/post-hatch/10-background/left-living/README.md',
  'assets/scenes/lifecycle/post-hatch/10-background/center-desk/README.md',
  'assets/scenes/lifecycle/post-hatch/10-background/right-decor/README.md',
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
