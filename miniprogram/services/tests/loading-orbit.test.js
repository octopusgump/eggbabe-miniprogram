const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const componentRoot = path.join(root, 'components/loading-orbit');
const template = fs.readFileSync(path.join(componentRoot, 'loading-orbit.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(componentRoot, 'loading-orbit.wxss'), 'utf8');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));

assert.equal(app.usingComponents['loading-orbit'], '/components/loading-orbit/loading-orbit', 'Loading / Orbit 必须在 app.json 全局注册');

assert.equal(template.includes('loading-orbit__track') && template.includes('loading-orbit__spinner') && template.includes('loading-orbit__dot'), true, '组件必须用轨道、旋转层与点三层结构绘制绕轨动效');
assert.equal(template.includes('loading-orbit--reduced'), true, '组件必须支持减少动态时的静态退化 class');

assert.match(styles, /\.loading-orbit--S\s*\{[^}]*width:\s*60rpx/s, 'S 号外框必须为 30px → 60rpx');
assert.match(styles, /\.loading-orbit--M\s*\{[^}]*width:\s*96rpx/s, 'M 号外框必须为 48px → 96rpx');
assert.match(styles, /\.loading-orbit--L\s*\{[^}]*width:\s*168rpx/s, 'L 号外框必须为 84px → 168rpx');
assert.match(styles, /\.loading-orbit--S \.loading-orbit__track,\s*\n\.loading-orbit--S \.loading-orbit__spinner[\s\S]*width:\s*48rpx/s, 'S 号轨道直径必须为 24px → 48rpx');
assert.match(styles, /\.loading-orbit--S \.loading-orbit__track\s*\{[^}]*border-width:\s*4rpx/s, 'S 号线宽必须为 2px → 4rpx');
assert.match(styles, /\.loading-orbit--M \.loading-orbit__dot[^}]*width:\s*16rpx/, 'M 号点径必须为 8px → 16rpx');
assert.match(styles, /\.loading-orbit--light \.loading-orbit__track[^}]*#E5E3DF/, '浅色轨道必须使用 Border/Default');
assert.match(styles, /\.loading-orbit--light \.loading-orbit__dot[^}]*#9DB65B/, '浅色点必须使用 Brand/Leaf');
assert.match(styles, /animation:\s*loading-orbit-spin\s+1\.1s\s+linear\s+infinite/, '绕轨动画必须为 1.1s linear 无限循环');
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.loading-orbit__spinner[\s\S]*animation:\s*none/, '系统减少动态时必须停在 12 点静帧');
assert.match(styles, /\.loading-orbit--reduced \.loading-orbit__spinner[\s\S]*animation:\s*none/, '页面传入 reducedMotion 时必须停止旋转');

const chatWxml = fs.readFileSync(path.join(root, 'pages/chat/chat.wxml'), 'utf8');
const journeyWxml = fs.readFileSync(path.join(root, 'pages/journey-scene/journey-scene.wxml'), 'utf8');
const lifeSceneWxml = fs.readFileSync(path.join(root, 'pages/life-scene/life-scene.wxml'), 'utf8');
const wishWxml = fs.readFileSync(path.join(root, 'pages/wish/wish.wxml'), 'utf8');

assert.equal(chatWxml.includes('<loading-orbit size="M"'), true, '聊天页必须使用 M 号 Loading / Orbit');
assert.equal(journeyWxml.includes('<loading-orbit size="L" tone="dark"'), true, '旅程页必须使用 L 号深色 Loading / Orbit');
assert.equal(lifeSceneWxml.includes('<loading-orbit size="S"'), true, '房间页必须使用 S 号 Loading / Orbit');
assert.equal(wishWxml.includes('<loading-orbit size="M"'), true, '愿望池必须使用 M 号 Loading / Orbit');

console.log('Loading / Orbit 组件规格与主要接入点校验通过。');
