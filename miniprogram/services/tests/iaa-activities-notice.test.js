const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '../..');
const wxss = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxss'), 'utf8');
const wxml = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxml'), 'utf8');

assert.equal(wxml.includes('class="system-notice-anchor"') && wxml.includes('<inline-notice'), true, '活动页轻提示必须使用标准锚点组件');
assert.match(
  wxss,
  /\.system-notice-anchor\s*\{[^}]*z-index:\s*220;[^}]*top:\s*calc\(env\(safe-area-inset-top\) \+ 112rpx \+ 20rpx\);[^}]*left:\s*72rpx;[^}]*right:\s*72rpx;[^}]*justify-content:\s*center;[^}]*pointer-events:\s*none;/,
  '活动页系统提示必须位于导航下方、高于 nav-bar 层级，且不拦截点击'
);
const navStyles = fs.readFileSync(path.join(miniprogramRoot, 'components/nav-bar/nav-bar.wxss'), 'utf8');
assert.match(navStyles, /z-index:\s*200/, 'nav-bar 为 200 时 toast 须更高以免被盖住');

console.log('活动页系统提示锚点校验通过。');
