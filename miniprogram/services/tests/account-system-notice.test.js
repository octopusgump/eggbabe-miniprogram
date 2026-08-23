const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pageRoot = path.resolve(__dirname, '../../pages/account');
const logic = fs.readFileSync(path.join(pageRoot, 'account.js'), 'utf8');
const template = fs.readFileSync(path.join(pageRoot, 'account.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(pageRoot, 'account.wxss'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(pageRoot, 'account.json'), 'utf8'));

assert.equal(config.usingComponents['inline-notice'], '../../components/inline-notice/inline-notice', '账户页必须登记标准系统提示组件');
assert.equal(template.includes('text="{{systemNoticeText}}"') && template.includes('tone="{{systemNoticeTone}}"') && template.includes('visible="{{systemNoticeVisible}}"'), true, '账户页的可停留失败结果必须使用标准系统提示');
assert.match(styles, /\.system-notice-anchor\s*\{[^}]*z-index:\s*120;[^}]*top:\s*calc\(148rpx \+ env\(safe-area-inset-top\)\);[^}]*pointer-events:\s*none;/, '账户页系统提示必须位于导航下方且不拦截操作');
assert.equal(logic.includes("this.showSystemNotice(result.message, 'warning')"), true, '本地数据清理失败必须使用 warning 系统提示');
assert.equal(logic.includes("this.showSystemNotice('页面暂时没有打开，请重试', 'warning')"), true, '重启欢迎页失败必须使用 warning 系统提示');
assert.equal(logic.includes("title: '退出登录'"), true, '退出登录的二次确认必须继续使用 Modal');
assert.equal(logic.includes("title: '清除本地数据？'"), true, '开发数据清除的二次确认必须继续使用 Modal');
console.log('账户页系统提示与二次确认语义边界通过。');
