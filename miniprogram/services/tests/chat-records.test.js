const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const app = JSON.parse(read('app.json'));
const myLogic = read('pages/my/my.js');
const myTemplate = read('pages/my/my.wxml');
const pageLogic = read('pages/chat-records/chat-records.js');
const pageTemplate = read('pages/chat-records/chat-records.wxml');
const serviceSource = read('services/chat-records.js');

assert.equal(app.pages.includes('pages/chat-records/chat-records'), true, '对话记录页面必须注册');
assert.equal(app.pages.includes('pages/account/account'), false, '旧账号页面不得继续注册');
assert.equal(app.pages.includes('pages/deregister/deregister'), false, '旧注销页面不得继续注册');
for (const oldPage of ['pages/account/account.js', 'pages/account/account.wxml', 'pages/deregister/deregister.js', 'pages/deregister/deregister.wxml']) {
  assert.equal(fs.existsSync(path.join(root, oldPage)), false, `旧功能文件必须删除：${oldPage}`);
}
assert.equal(myTemplate.includes('label="对话记录"') && myLogic.includes("'/pages/chat-records/chat-records'"), true, '我的页必须显示对话记录并进入新页面');
for (const removedFeature of ['label="账号"', '退出登录', '清除本地数据', '注销账号', 'onNavAccount']) {
  assert.equal(`${myTemplate}\n${myLogic}\n${pageTemplate}\n${pageLogic}`.includes(removedFeature), false, `新页面不得保留旧账号功能：${removedFeature}`);
}
for (const copy of ['导出聊天记录', '发送到指定邮箱', '导出并发送到邮箱', '删除聊天记录', '删除全部聊天记录', '删除后无法恢复']) {
  assert.equal(pageTemplate.includes(copy), true, `对话记录页面必须包含：${copy}`);
}
assert.equal(pageTemplate.includes('bindinput="onEmailInput"') && pageTemplate.includes('disabled="{{exporting || deleting}}"'), true, '邮箱必须可编辑且提交期间必须锁定操作');
assert.equal(pageLogic.includes('if (this.data.exporting || this.data.deleting || this.exportRequestActive) return;'), true, '导出必须阻止重复提交');
assert.equal(pageLogic.includes("title: '删除全部聊天记录？'") && pageLogic.includes('当前账号下全部蛋宝宝的聊天记录'), true, '账号级删除必须二次确认并说明范围');
assert.equal(pageLogic.includes('if (result.confirm) this.performDelete()') && pageLogic.includes('this.deleteRequestActive'), true, '未确认时不得删除且删除请求必须防重复');
assert.equal(serviceSource.includes("ACCOUNT_CHAT_SCOPE = 'ACCOUNT_ALL_CONVERSATIONS'") && serviceSource.includes('runtime.getMode() !== \'live\''), true, '服务层必须固定账号级范围且非正式环境不得假成功');
assert.equal(serviceSource.includes('result.deleted === true') && serviceSource.includes('CHAT_DELETE_CONFIRMATION_MISSING'), true, '服务端未明确确认删除时不得显示成功');

const runtime = require('../runtime-context');
const cloudApi = require('../cloud-api');
const chatRecords = require('../chat-records');

(async () => {
  assert.equal(chatRecords.normalizeEmail('  USER@Example.COM '), 'user@example.com', '邮箱必须去除空格并归一化');
  assert.equal(chatRecords.validateEmail('bad-address'), false, '无效邮箱必须被拒绝');
  assert.equal(chatRecords.validateEmail('user@example.com'), true, '有效邮箱必须通过校验');

  runtime.setMode('live');
  cloudApi.requestChatHistoryExport = payload => Promise.resolve({ ok: true, export_request_id: payload.email === 'user@example.com' ? 'export-1' : '' });
  let exportResult = await chatRecords.requestExport('USER@example.com');
  assert.equal(exportResult.ok && exportResult.exportRequestId === 'export-1', true, '服务端返回申请编号后才能确认导出成功');
  cloudApi.requestChatHistoryExport = () => Promise.resolve({ ok: true });
  exportResult = await chatRecords.requestExport('user@example.com');
  assert.equal(exportResult.code, 'CHAT_EXPORT_CONFIRMATION_MISSING', '缺少导出申请编号不得假成功');

  cloudApi.deleteAllChatHistory = () => Promise.resolve({ ok: true, status: 'PENDING' });
  let deleteResult = await chatRecords.deleteAll();
  assert.equal(deleteResult.code, 'CHAT_DELETE_CONFIRMATION_MISSING', '仅受理但未删除时不得显示删除成功');
  cloudApi.deleteAllChatHistory = () => Promise.resolve({ ok: true, deleted: true, deletion_receipt: 'delete-1' });
  deleteResult = await chatRecords.deleteAll();
  assert.equal(deleteResult.ok && deleteResult.deletionReceipt === 'delete-1', true, '服务端明确确认后才可显示删除成功');

  console.log('对话记录页面、导出与真实删除边界校验通过。');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
