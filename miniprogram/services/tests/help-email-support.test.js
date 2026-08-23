const assert = require('assert');
const fs = require('fs');
const path = require('path');

let copied = '';
let modal = null;
let copyShouldFail = false;

global.wx = {
  setClipboardData(options) {
    copied = options.data;
    if (copyShouldFail) options.fail({ errMsg: 'setClipboardData:fail test' });
    else options.success();
  },
  showModal(options) { modal = options; }
};
global.Page = definition => { global.helpPage = definition; };

require('../../pages/help/help');
const helpContext = Object.assign({}, global.helpPage, {
  data: Object.assign({}, global.helpPage.data),
  setData(patch) { Object.assign(this.data, patch); }
});

global.helpPage.onCopySupportEmail.call(helpContext);
assert.equal(copied, 'hello@eggbabe.com', '邮件支持入口必须复制正式支持邮箱');
assert.equal(helpContext.data.systemNoticeText, '邮箱已复制', '复制成功必须给出明确反馈');
assert.equal(helpContext.data.systemNoticeTone, 'info', '复制成功必须是标准 info 系统提示');

copyShouldFail = true;
global.helpPage.onCopySupportEmail.call(helpContext);
assert.equal(modal.title, '邮件支持', '复制失败必须显示邮件支持兜底弹窗');
assert.equal(modal.content, 'hello@eggbabe.com', '兜底弹窗必须显示完整邮箱');

const helpSource = fs.readFileSync(path.join(__dirname, '../../pages/help/help.js'), 'utf8');
const helpTemplate = fs.readFileSync(path.join(__dirname, '../../pages/help/help.wxml'), 'utf8');
const privacyTemplate = fs.readFileSync(path.join(__dirname, '../../pages/privacy/privacy.wxml'), 'utf8');
assert.equal(helpSource.includes('openCustomerServiceChat'), false, '当前版本不得保留企业微信客服调用');
assert.equal(helpSource.includes('客服参数待运营配置'), false, '当前版本不得向用户暴露内部客服配置提示');
assert.equal(helpTemplate.includes('hello@eggbabe.com'), false, '邮箱地址应由页面数据单一来源渲染');
assert.equal(helpTemplate.includes('{{supportEmail}}'), true, '帮助中心必须展示邮件支持地址');
assert.equal(helpTemplate.includes('inline-notice'), true, '复制成功必须显示标准系统提示');
assert.equal(privacyTemplate.includes('hello@eggbabe.com'), true, '隐私政策必须提供真实联系邮箱');

console.log('企业微信客服移除、邮件支持复制与隐私联系渠道校验通过。');
