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
assert.equal(wxml.includes('magic-enabled="{{magicWindowEnabled}}"'), true, '魔法窗入口必须绑定正式素材门禁');
assert.equal(wxml.includes('magic-enabled="{{true}}"'), false, '页面不得绕过配置强制开放魔法窗');
assert.equal(wxml.includes('bindmagic="onOpenMagicWindow"'), true, '配置开放后远方微光必须能派发打开事件');
assert.equal(componentWxml.includes('daily-window__magic-entry'), true, '远方微光必须位于全屏日常窗外组件内部');
assert.equal(componentJs.includes("this.triggerEvent('magic')"), true, '远方微光必须向页面派发点击事件');
assert.equal(js.includes('TOKYO_MAGIC_WINDOW_PREVIEW'), false, '未验收东京预览不得硬编码进入正式页面');
assert.equal(js.includes('magicWindowPresentation()'), true, '魔法窗资源必须从正式配置解析');
assert.equal(/magicWindow\.destinations\.tokyo|destinations:\s*\{[^}]*tokyo/.test(js), false, '东京预览不得混入正式三景区配置');

console.log('魔法窗正式素材门禁与配置联动校验通过。');
