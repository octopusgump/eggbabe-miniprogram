const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pageRoot = path.resolve(__dirname, '../../pages/deregister');
const logic = fs.readFileSync(path.join(pageRoot, 'deregister.js'), 'utf8');
const template = fs.readFileSync(path.join(pageRoot, 'deregister.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(pageRoot, 'deregister.wxss'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(pageRoot, 'deregister.json'), 'utf8'));

assert.equal(config.usingComponents['inline-notice'], '../../components/inline-notice/inline-notice', '注销页必须登记标准系统提示组件');
assert.equal(template.includes('text="{{systemNoticeText}}"') && template.includes('visible="{{systemNoticeVisible}}"'), true, '取消成功反馈必须使用标准系统提示');
assert.match(styles, /\.system-notice-anchor\s*\{[^}]*top:\s*calc\(148rpx \+ env\(safe-area-inset-top\)\);[^}]*pointer-events:\s*none/, '系统提示必须位于导航下方且不拦截操作');
assert.equal(logic.includes("wx.showToast({ title: '注销申请已提交'"), false, '提交成功后不得与固定待处理状态重复显示 Toast');
assert.equal(logic.includes("wx.showToast({ title: '注销申请已提交，可取消注销'"), false, '待注销状态不得重复弹 Toast');
assert.equal(logic.includes("this.showSystemNotice('已取消注销', 'info')"), true, '取消成功后必须显示一次标准系统提示');
assert.equal(logic.includes("this.showRequest(request);"), true, '提交成功后必须立即切换到固定待注销状态');
assert.equal(logic.includes("this.showSystemNotice('账户服务尚未接入，请稍后再试', 'warning')"), true, '注销服务未接入必须使用 warning 系统提示');
assert.equal(logic.includes("this.showSystemNotice(result.message || '提交失败，请重试', 'warning')"), true, '注销提交失败必须使用 warning 系统提示');
assert.equal(logic.includes("this.showSystemNotice(saved.message, 'warning')"), true, '注销本地写入失败必须使用 warning 系统提示');
assert.equal(logic.includes("this.showSystemNotice(result.message || '取消失败，请重试', 'warning')"), true, '取消注销失败必须使用 warning 系统提示');
assert.equal(logic.includes("wx.showToast({ title: '账户服务尚未接入，请稍后再试'"), false, '注销页当前页失败不得使用系统 Toast');
assert.equal(logic.includes("title: '再次确认'"), true, '提交注销的二次确认必须继续使用 Modal');
assert.equal(logic.includes("title: '取消注销'"), true, '取消注销的二次确认必须继续使用 Modal');

console.log('注销固定状态与短暂系统反馈去重校验通过。');
