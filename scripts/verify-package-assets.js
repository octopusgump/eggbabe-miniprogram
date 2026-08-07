const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const miniprogram = path.join(root, 'miniprogram');
const project = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'));
const ignores = (project.packOptions && project.packOptions.ignore) || [];
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const errors = [];
const CDN_ENVIRONMENT_ASSET_PREFIXES = [
  'assets/scenes/lifecycle/pre-hatch/10-background/incubation-room/season-weather-full-scenes/',
  'assets/scenes/lifecycle/post-hatch/10-background/panorama-three-screen/scene-sets/',
  'assets/scenes/lifecycle/post-hatch/60-action-scenes/'
];

function normalize(value) {
  return String(value || '').replace(/^\/+/, '').replace(/\\/g, '/').replace(/\/$/, '');
}

function ignored(relativePath) {
  const target = normalize(relativePath);
  return ignores.some(entry => {
    const value = normalize(entry.value);
    if (entry.type === 'file') return target === value;
    if (entry.type === 'folder') return target === value || target.startsWith(`${value}/`);
    errors.push(`不支持的 packOptions.ignore 类型：${entry.type}`);
    return false;
  });
}

ignores.forEach(entry => {
  const target = path.join(miniprogram, normalize(entry.value));
  if (!fs.existsSync(target)) errors.push(`packOptions.ignore 指向不存在路径：${entry.value}`);
  if (entry.type === 'file' && fs.existsSync(target) && !fs.statSync(target).isFile()) errors.push(`ignore file 不是文件：${entry.value}`);
  if (entry.type === 'folder' && fs.existsSync(target) && !fs.statSync(target).isDirectory()) errors.push(`ignore folder 不是目录：${entry.value}`);
});

let totalBytes = 0;
let includedBytes = 0;
function walkFiles(directory, callback) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(absolute, callback);
    else callback(absolute);
  });
}

walkFiles(miniprogram, absolute => {
  const relative = normalize(path.relative(miniprogram, absolute));
  const bytes = fs.statSync(absolute).size;
  totalBytes += bytes;
  if (!ignored(relative)) includedBytes += bytes;
});

const runtimeAssets = new Set();
function addAsset(value) {
  const asset = String(value || '');
  if (!asset.startsWith('/assets/') || /[{}$]/.test(asset)) return;
  const relative = normalize(asset);
  const absolute = path.join(miniprogram, relative);
  if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) runtimeAssets.add(relative);
}

function collectConfig(value, visited) {
  if (typeof value === 'string') return addAsset(value);
  if (!value || typeof value !== 'object' || visited.has(value)) return;
  visited.add(value);
  if (Array.isArray(value)) value.forEach(item => collectConfig(item, visited));
  else Object.values(value).forEach(item => collectConfig(item, visited));
}

collectConfig(require('../miniprogram/config/pre-hatch-assets'), new Set());
collectConfig(require('../miniprogram/config/post-hatch-assets'), new Set());

const sourceExtensions = new Set(['.js', '.json', '.wxml', '.wxss']);
walkFiles(miniprogram, absolute => {
  if (!sourceExtensions.has(path.extname(absolute)) || absolute.includes(`${path.sep}services${path.sep}tests${path.sep}`)) return;
  const source = fs.readFileSync(absolute, 'utf8');
  const matches = source.match(/\/assets\/[A-Za-z0-9_./-]+\.(?:png|webp|jpg|jpeg|svg|woff2?)/g) || [];
  matches.forEach(addAsset);
});

runtimeAssets.forEach(asset => {
  const externalizedEnvironmentAsset = CDN_ENVIRONMENT_ASSET_PREFIXES.some(prefix => asset.startsWith(prefix));
  if (ignored(asset) && !externalizedEnvironmentAsset) errors.push(`运行时资源被 packOptions.ignore 排除：${asset}`);
  if (ignored(asset) && externalizedEnvironmentAsset) {
    const appSource = fs.readFileSync(path.join(miniprogram, 'app.js'), 'utf8');
    if (!appSource.includes('environmentCdnBase') || !appSource.includes('environment_cdn_base')) {
      errors.push(`环境大图已从包体排除，但未检测到 environment_cdn_base 运行时接入：${asset}`);
    }
  }
});

if (includedBytes > MAX_SOURCE_BYTES) {
  errors.push(`预计纳入包体的源码与资源为 ${(includedBytes / 1024 / 1024).toFixed(2)} MiB，超过 20 MiB 门禁`);
}

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`包体资源门禁通过：工作区 ${(totalBytes / 1024 / 1024).toFixed(2)} MiB，预计纳入 ${(includedBytes / 1024 / 1024).toFixed(2)} MiB，已校验 ${runtimeAssets.size} 个运行时资源。`);
