const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '../..');
const wxml = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxss'), 'utf8');
const logic = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.js'), 'utf8');

assert.equal(wxml.includes('onTapComingSoonWish') && wxml.includes('onTapComingSoonCta'), true, '即将上线必须拆分白区与想玩按钮');
assert.equal(wxml.includes('activities-row__wish') && wxml.includes('activities-wish-cover-burst__plus">+1'), true, '白区点击必须播放 +1 浮层');
assert.equal(wxml.includes('catchtouchstart="onWishTouchStart"'), true, '须记录 touchstart 视口坐标');
assert.match(wxml, /<root-portal[\s\S]*activities-wish-cover-layer[\s\S]*activities-wish-cover-burst/, '+1 须通过 root-portal + cover-view 浮在 scroll-view 上');
assert.equal(wxml.includes('animation="{{item.anim}}"'), true, '+1 须用 wx.createAnimation 驱动 cover-view');
assert.equal(wxml.includes('bindtap="onTapRow"') && wxml.includes('data-section="soon"'), false, '即将上线行不得整行绑定单一 tap');
assert.equal(logic.includes('playWishPlusOne') && logic.includes('wishBursts'), true, '必须支持可叠加的 +1 实例');
assert.match(logic, /onTapComingSoonCta[\s\S]*openComingSoonModal\(item\)/, '想玩按钮才打开下期说明弹窗');
assert.match(logic, /onWishTouchStart\(event\)[\s\S]*clientX:\s*touch\.clientX/, 'touchstart 须缓存 clientX/Y');
assert.match(logic, /playWishPlusOne\(key, touch\.clientX, touch\.clientY\)/, '白区点击须用视口坐标触发 +1');
assert.match(logic, /runWishBurstAnimation\(id\)/, '须用 wx.createAnimation 播放 +1');
assert.match(logic, /this\.setData\(\{ \.\.\.view, wishBursts, wishPressKey \}\)/, 'refresh 须保留进行中的 +1');

assert.match(wxss, /\.activities-row--wish-shake[\s\S]*activities-row-wish-shake/, '点击时整行 tab 轻微晃动，不用绿色底');
assert.match(wxss, /\.activities-wish-cover-layer[\s\S]*z-index:\s*10000/, '+1 cover 层须高于 scroll-view');
assert.equal(wxml.includes('item.clientX}}px; top: {{item.clientY}}px'), true, '+1 浮层须锚定在点击位置');
assert.equal(wxml.includes('activities-wish-cover-burst__spark--1">✦'), true, '+1 须带 Figma 03.04 星光 ✦ 点缀');

console.log('活动页 03.04 想玩 +1 关帧校验通过。');
