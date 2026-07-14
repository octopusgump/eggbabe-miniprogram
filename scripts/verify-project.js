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

for (const image of ['grass_with_egg.jpg', 'snow_with_egg.jpg', 'room_with_egg.jpg', 'sea_with_egg.jpg', 'desk_with_egg.jpg', 'rooftop_with_egg.jpg']) {
  if (!fs.existsSync(path.join(miniprogram, 'assets/scenes', image))) errors.push(`展会场景缺少图片：${image}`);
}

const petStore = require(path.join(miniprogram, 'utils/pet-store'));
const zodiacBoundaries = [
  ['2026-01-19', '摩羯座'], ['2026-01-20', '水瓶座'], ['2026-02-18', '水瓶座'], ['2026-02-19', '双鱼座'],
  ['2026-03-20', '双鱼座'], ['2026-03-21', '白羊座'], ['2026-04-19', '白羊座'], ['2026-04-20', '金牛座'],
  ['2026-05-20', '金牛座'], ['2026-05-21', '双子座'], ['2026-06-21', '双子座'], ['2026-06-22', '巨蟹座'],
  ['2026-07-22', '巨蟹座'], ['2026-07-23', '狮子座'], ['2026-08-22', '狮子座'], ['2026-08-23', '处女座'],
  ['2026-09-22', '处女座'], ['2026-09-23', '天秤座'], ['2026-10-23', '天秤座'], ['2026-10-24', '天蝎座'],
  ['2026-11-22', '天蝎座'], ['2026-11-23', '射手座'], ['2026-12-21', '射手座'], ['2026-12-22', '摩羯座']
];
for (const [date, expected] of zodiacBoundaries) {
  const actual = petStore.getZodiac(date);
  if (actual !== expected) errors.push(`星座计算错误：${date} 应为 ${expected}，实际为 ${actual}`);
}
if (petStore.getZodiac('') !== '' || petStore.getZodiac('invalid') !== '') errors.push('星座计算必须安全处理空生日和非法日期');

const exhibitionScenes = require(path.join(miniprogram, 'utils/exhibition-scenes'));
const sceneEffectStyles = fs.readFileSync(path.join(miniprogram, 'pages/exhibition-scene/exhibition-scene.wxss'), 'utf8');
const exhibitionPoints = exhibitionScenes.SCENES.flatMap(scene => (exhibitionScenes.HOTSPOTS[scene.key] || []).map(point => ({ scene: scene.label, ...point })));
if (exhibitionPoints.length !== 18) errors.push(`六个展会场景应有 18 个互动点，实际为 ${exhibitionPoints.length}`);
for (const point of exhibitionPoints) {
  const x = parseFloat(point.x);
  const y = parseFloat(point.y);
  if (x >= 70 && y <= 30) errors.push(`${point.scene}「${point.label}」位于微信胶囊右上角危险区`);
  if (x > 84 || y > 82) errors.push(`${point.scene}「${point.label}」过于靠近屏幕边缘：${point.x}, ${point.y}`);
  if (point.effect && !sceneEffectStyles.includes(`.scene-effect--${point.effect}`)) errors.push(`${point.scene}「${point.label}」缺少特效样式：${point.effect}`);
}

if (errors.length) {
  console.error(`项目校验失败（${errors.length} 项）：`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`项目校验通过：${pages.length} 个页面，工程结构与关键 PRD 约束正常。`);
