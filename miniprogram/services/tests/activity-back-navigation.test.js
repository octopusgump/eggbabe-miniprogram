const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const navStyles = fs.readFileSync(path.join(root, 'components/nav-bar/nav-bar.wxss'), 'utf8');
const activitiesWxml = fs.readFileSync(path.join(root, 'pages/iaa-activities/iaa-activities.wxml'), 'utf8');
const listenLogic = fs.readFileSync(path.join(root, 'pages/listen/listen.js'), 'utf8');
const doodleWxml = fs.readFileSync(path.join(root, 'pages/doodle/doodle.wxml'), 'utf8');

assert.match(navStyles, /\.navbar-root\s*\{[^}]*z-index:\s*200;/, '自定义导航栏必须高于页面内容，避免返回被 scroll 或浮层挡住');
assert.equal(activitiesWxml.includes('fallback-url="/pages/life-scene/life-scene"'), true, '活动列表返回失败时必须能回到房间');
assert.match(listenLogic, /navigateBack\([\s\S]*fail:/, '听你说返回失败时必须提供降级跳转');
assert.match(doodleWxml, /<root-portal[\s\S]*catchtap="onBack"/, '一起画返回必须使用 root-portal + cover-view catchtap');

console.log('活动相关页面返回导航校验通过。');
