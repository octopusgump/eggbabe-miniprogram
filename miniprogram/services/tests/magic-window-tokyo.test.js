const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogram = path.resolve(__dirname, '../..');
const assets = require('../../config/post-hatch-assets');
const magicWindow = assets.POST_HATCH.magicWindow;

assert.equal(magicWindow.enabled, false, '正式三景区素材未齐时不得开放魔法窗入口');
assert.deepEqual(Object.keys(magicWindow.destinations).sort(), ['beijing', 'dali', 'xishuangbanna'], '魔法窗只允许主 PRD 的三个目的地');
assert.equal(Object.values(magicWindow.destinations).every(value => value === ''), true, '草稿或占位图不得写入正式景区配置');

const wxml = fs.readFileSync(path.join(miniprogram, 'pages/life-scene/life-scene.wxml'), 'utf8');
const js = fs.readFileSync(path.join(miniprogram, 'pages/life-scene/life-scene.js'), 'utf8');
const componentWxml = fs.readFileSync(path.join(miniprogram, 'components/daily-window-detail/daily-window-detail.wxml'), 'utf8');
const componentJs = fs.readFileSync(path.join(miniprogram, 'components/daily-window-detail/daily-window-detail.js'), 'utf8');

assert.equal(wxml.includes('<daily-window-detail'), true, '停用魔法窗不得影响日常窗外详情');
assert.equal(wxml.includes('magic-enabled="{{true}}"'), true, '东京动效预览必须显式开启日常窗外入口');
assert.equal(wxml.includes('bindmagic="onOpenMagicWindow"'), true, '远方微光必须能打开东京动效预览');
assert.equal(componentWxml.includes('daily-window__magic-entry'), true, '远方微光必须位于全屏日常窗外组件内部');
assert.equal(componentJs.includes("this.triggerEvent('magic')"), true, '远方微光必须向页面派发点击事件');
assert.equal(js.includes('TOKYO_MAGIC_WINDOW_PREVIEW'), true, '东京素材只能以独立预览配置接入');
assert.equal(js.includes('magic_window_tokyo_koi_walk_standard_v02.webp'), true, '东京预览必须使用标准锦鲤 v02');
assert.equal(/magicWindow\.destinations\.tokyo|destinations:\s*\{[^}]*tokyo/.test(js), false, '东京预览不得混入正式三景区配置');

console.log('魔法窗正式素材门禁、远方入口与东京分层预览校验通过。');
