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
  assert.equal(wxml.includes('知道了'), true, '弹窗必须提供知道了主按钮');
  assert.equal(wxml.includes('comingSoonModalLines'), true, '弹窗正文必须绑定配置化文案');
  assert.equal(logic.includes('openComingSoonModal(item)'), true, '点击想玩必须打开下期说明弹窗');
  assert.match(logic, /if \(item\.comingSoon\)[\s\S]*openComingSoonModal\(item\)/, '即将上线行必须走弹窗而非 toast');

  assert.match(
    wxss,
    /\.activities-coming-soon-overlay\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.36\)/,
    '弹窗遮罩必须使用半透明压暗列表'
  );
  assert.match(wxss, /\.activities-coming-soon-dialog\s*\{[^}]*border-radius:\s*32rpx/, '弹窗卡片必须使用 32rpx 圆角白底');

  console.log('活动页 03.03 交友下期说明弹窗校验通过。');
})();
