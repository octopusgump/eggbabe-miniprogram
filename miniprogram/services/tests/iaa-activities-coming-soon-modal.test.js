const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '../..');
const wxml = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.wxss'), 'utf8');
const logic = fs.readFileSync(path.join(miniprogramRoot, 'pages/iaa-activities/iaa-activities.js'), 'utf8');
const pageModel = require('../companion-activities-page');

(async () => {
  const view = await pageModel.buildViewAsync();
  const friend = view.comingSoon.find(row => row.key === 'friend');
  assert.equal(friend.phaseTag, '下期');
  assert.deepEqual(friend.modalLines, [
    '交友玩法还在准备中，下期就和你见面～',
    '上线后会在这里第一时间亮起来。'
  ]);

  assert.equal(wxml.includes('activities-coming-soon-overlay'), true, '即将上线玩法必须使用居中弹窗');
  assert.equal(wxml.includes('activities-coming-soon-tag'), true, '弹窗必须展示下期标签');
  assert.equal(wxml.includes('activities-coming-soon-btn'), true, '弹窗主按钮必须使用与列表 CTA 同字重的胶囊按钮');
  assert.equal(wxml.includes('app-button'), false, '弹窗不得复用全局大按钮组件以免字号与高度偏离 Figma');
  assert.equal(wxml.includes('activities-coming-soon-icon-wrap'), false, '弹窗图标不得再套额外米色底框，应直接展示 80 资源');
  assert.equal(logic.includes('openComingSoonModal(item)'), true, '点击想玩必须打开下期说明弹窗');
  assert.match(logic, /onTapComingSoonCta[\s\S]*openComingSoonModal\(item\)/, '想玩按钮必须打开弹窗');

  assert.match(
    wxss,
    /\.activities-coming-soon-overlay\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.32\)/,
    '弹窗遮罩必须使用 Figma 03.03 的 32% 压暗'
  );
  assert.match(wxss, /\.activities-coming-soon-dialog\s*\{[^}]*width:\s*622rpx/, '弹窗宽度必须按 375 画布约 311px 换算为 622rpx');
  assert.match(wxss, /\.activities-coming-soon-icon\s*\{[^}]*width:\s*136rpx/, '弹窗图标展示尺寸必须为 136rpx');
  assert.match(wxss, /\.activities-coming-soon-btn\s*\{[^}]*height:\s*88rpx;[^}]*font-size:\s*28rpx/, '知道了按钮必须为 88rpx 高、28rpx 常规字重');

  console.log('活动页 03.03 交友下期说明弹窗校验通过。');
})();
