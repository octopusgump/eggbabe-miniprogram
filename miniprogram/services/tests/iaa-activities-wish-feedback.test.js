const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '../..');
const wxml = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxss'), 'utf8');
const logic = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.js'), 'utf8');

assert.equal(wxml.includes('onTapComingSoonWish') && wxml.includes('onTapComingSoonCta'), true, '即将上线必须拆分白区与想玩按钮');
assert.equal(wxml.includes('activities-wish-float__plus">+1'), true, '白区点击必须播放 +1 浮层');
assert.equal(wxml.includes('catchtouchstart="onWishTouchStart"'), true, '须记录 touchstart 视口坐标');
assert.equal(wxml.includes('root-portal') || wxml.includes('cover-view'), false, '+1 须用行内 view 渲染，不用 cover-view');
assert.equal(wxml.includes('bindtap="onTapRow"') && wxml.includes('data-section="soon"'), false, '即将上线行不得整行绑定单一 tap');
assert.equal(logic.includes('playWishPlusOne') && logic.includes('wishBursts'), true, '必须支持可叠加的 +1 实例');
assert.match(logic, /resolveWishBurstOrigin\(key/, '须把触点换算为行内坐标');
assert.match(logic, /originX:\s*Number\.isFinite\(originX\)/, '+1 实例须记录行内 origin');
assert.match(logic, /this\.setData\(\{ \.\.\.view, wishBursts, wishPressKey \}\)/, 'refresh 须保留进行中的 +1');

assert.match(wxss, /\.activities-wish-float[\s\S]*position:\s*absolute/, '+1 须锚定在 coming-soon 行内');
assert.match(wxss, /@keyframes activities-wish-float-motion[\s\S]*translateY\(-280rpx\)/, '须保留 03.04 上浮关帧');
assert.equal(wxml.includes('burst.originX}}px; top: {{burst.originY}}px'), true, '+1 须锚定在点击位置');

console.log('活动页 03.04 想玩 +1 关帧校验通过。');
