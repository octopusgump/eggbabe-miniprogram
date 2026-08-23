const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const logic = read('pages/settings/settings.js');
const template = read('pages/settings/settings.wxml');
const config = read('pages/settings/settings.json');
const myLogic = read('pages/my/my.js');
const myTemplate = read('pages/my/my.wxml');

assert.equal(myTemplate.includes('我的卡册'), false, '我的页不得恢复旧名称“我的卡册”');
assert.equal(myTemplate.includes('label="我的收藏卡"') && myLogic.includes("'/pages/album/album'") && myLogic.includes('onNavAlbum'), true, '我的页最上方必须提供“我的收藏卡”入口');
assert.equal(myTemplate.includes('隐私协议'), false, '隐私政策统一收进系统设置，我的页不得保留重复入口');
assert.equal(myLogic.includes('onNavPrivacy'), false, '我的页不得保留重复的隐私政策导航事件');
assert.equal(myTemplate.includes('蛋宝宝与记录') || myTemplate.includes('设置与支持') || myTemplate.includes('section-label'), false, '我的页不得保留分类标题');
const menuLabels = ['我的收藏卡', '我的激活码', '对话记录', '系统设置', '帮助中心'];
const menuLabelIndices = menuLabels.map(label => myTemplate.indexOf(`label="${label}"`));
assert.equal(menuLabelIndices.every(index => index >= 0), true, '五个入口必须全部显示');
assert.deepEqual(menuLabelIndices, menuLabelIndices.slice().sort((a, b) => a - b), '五个入口必须按指定顺序纵向排列');
assert.equal((myTemplate.match(/class="menu-panel"/g) || []).length, 1, '五个入口必须收进同一张连续卡片');
assert.equal(myTemplate.includes('menu-waterfall') || myTemplate.includes('menu-card'), false, '入口之间不得保留独立卡片间隙');
assert.equal((myTemplate.match(/show-border="\{\{false\}\}"/g) || []).length, 1, '只有最后一行不显示分隔线');
assert.equal(myLogic.includes("'/pages/chat-records/chat-records'") && myLogic.includes('onNavChatRecords'), true, '对话记录入口必须进入独立页面');
for (const removedAccountFeature of ['label="账号"', 'onNavAccount', '退出登录', '清除本地数据', '注销账号']) {
  assert.equal(`${myLogic}\n${myTemplate}`.includes(removedAccountFeature), false, `我的页不得恢复旧账号功能：${removedAccountFeature}`);
}
assert.equal(template.includes('节令上新'), false, '当前版本不得展示尚未上线的节令通知');
assert.equal(logic.includes('requestSeasonalUpdates'), false, '设置页不得调用不存在的节令订阅方法');
for (const removedNotificationSetting of ['通知设置', '破壳提醒', '当前没有可管理的提醒', 'hatchReminderAvailable', 'onToggleHatch', 'subscriptionMessages', 'eggbabe_notification_preferences_v1']) {
  assert.equal(`${logic}\n${template}\n${config}`.includes(removedNotificationSetting), false, `设置页不得保留通知设置代码：${removedNotificationSetting}`);
}
assert.equal(config.includes('switch-row'), false, '设置页移除通知设置后不得继续注册开关组件');
assert.equal(template.indexOf('个人信息') < template.indexOf('年龄区间'), true, '年龄区间必须归入个人信息');
assert.equal(template.indexOf('帮助与支持') < template.indexOf('用户反馈'), true, '用户反馈必须归入帮助与支持');
assert.equal(template.indexOf('协议与政策') < template.indexOf('用户服务协议') && template.indexOf('用户服务协议') < template.indexOf('隐私政策'), true, '协议入口必须集中在系统设置并保持明确顺序');

console.log('V3.7 我的入口与破壳后设置发布范围校验通过。');
