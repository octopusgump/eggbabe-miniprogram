const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '../..');
const wxss = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxss'), 'utf8');
const wxml = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxml'), 'utf8');

assert.equal(wxml.includes('class="system-notice-anchor"') && wxml.includes('<inline-notice'), true, '活动页轻提示必须使用标准锚点组件');
assert.match(
  wxss,
  /\.system-notice-anchor\s*\{[^}]*z-index:\s*120;[^}]*top:\s*calc\(148rpx \+ env\(safe-area-inset-top\)\);[^}]*left:\s*72rpx;[^}]*right:\s*72rpx;[^}]*justify-content:\s*center;[^}]*pointer-events:\s*none;/,
  '活动页系统提示必须位于导航下方、左右留白并居中，且不拦截点击'
);

console.log('活动页系统提示锚点校验通过。');
