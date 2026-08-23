const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const logic = read('pages/settings/settings.js');
const template = read('pages/settings/settings.wxml');
const myLogic = read('pages/my/my.js');
const myTemplate = read('pages/my/my.wxml');

assert.equal(myTemplate.includes('我的收藏卡'), false, '当前版本所有环境都不得展示我的收藏卡入口');
assert.equal(myLogic.includes('onNavAlbum'), false, '我的页不得保留收藏卡导航事件');
assert.equal(template.includes('节令上新'), false, '当前版本不得展示尚未上线的节令通知');
assert.equal(logic.includes('requestSeasonalUpdates'), false, '设置页不得调用不存在的节令订阅方法');
assert.equal(logic.includes("petStore.getStage(pet) !== 'hatched'"), true, '设置页必须根据生命周期隐藏已失效的破壳提醒');
assert.equal(template.includes('wx:if="{{hatchReminderAvailable}}"'), true, '破壳提醒必须受生命周期展示条件控制');
assert.equal(template.includes('当前没有可管理的提醒'), true, '破壳后必须提供准确的通知空状态');
assert.equal(template.includes('wx:if="{{hatchReminderAvailable}}" class="hint-box"'), true, '没有可管理的提醒时不得显示本地通知设置提示');

console.log('V3.7 我的入口与破壳后设置发布范围校验通过。');
