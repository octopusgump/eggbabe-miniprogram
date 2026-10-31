const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '../..');
const wxml = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxss'), 'utf8');
const logic = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.js'), 'utf8');

assert.equal(wxml.includes('onTapComingSoonWish') && wxml.includes('onTapComingSoonCta'), true, '即将上线必须拆分白区与想玩按钮');
assert.equal(wxml.includes('activities-row__wish') && wxml.includes('activities-wish-float__plus">+1'), true, '白区点击必须播放 +1 浮层');
assert.equal(wxml.includes('bindtap="onTapRow"') && wxml.includes('data-section="soon"'), false, '即将上线行不得整行绑定单一 tap');
assert.equal(logic.includes('playWishPlusOne') && logic.includes('wishBursts'), true, '必须支持可叠加的 +1 实例');
assert.match(logic, /onTapComingSoonCta[\s\S]*openComingSoonModal\(item\)/, '想玩按钮才打开下期说明弹窗');
assert.match(logic, /onTapComingSoonWish\(event\)\s*\{[\s\S]*playWishPlusOne\(key\)/, '白区点击必须触发 +1 动画');

assert.match(wxss, /\.activities-row__wish--active\s*\{[^}]*background:\s*#E6EED0/, '按下时白区必须变为浅绿底');
assert.match(wxss, /\.activities-wish-float\s*\{[^}]*animation:\s*activities-wish-float 800ms/, '+1 上浮动画总时长约 800ms');
assert.match(wxss, /@keyframes activities-wish-plus-flash/, '+1 上浮过程中必须闪烁');

console.log('活动页 03.04 想玩 +1 关帧校验通过。');
