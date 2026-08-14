const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pageRoot = path.resolve(__dirname, '../../pages/profile');
const logic = fs.readFileSync(path.join(pageRoot, 'profile.js'), 'utf8');
const template = fs.readFileSync(path.join(pageRoot, 'profile.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(pageRoot, 'profile.wxss'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(pageRoot, 'profile.json'), 'utf8'));

assert.equal(config.usingComponents['inline-notice'], '../../components/inline-notice/inline-notice', '个人资料页必须登记标准系统提示组件');
assert.equal(template.includes('text="{{systemNoticeText}}"') && template.includes('tone="{{systemNoticeTone}}"') && template.includes('visible="{{systemNoticeVisible}}"'), true, '资料保存结果必须使用标准系统提示');
assert.match(styles, /\.system-notice-anchor\s*\{[^}]*z-index:\s*120;[^}]*top:\s*calc\(148rpx \+ env\(safe-area-inset-top\)\);[^}]*pointer-events:\s*none;/, '系统提示必须位于导航下方，且不拦截页面操作');
assert.equal(logic.includes("this.showSystemNotice('头像已更新', 'info')"), true, '头像保存成功必须使用标准系统提示');
assert.equal(logic.includes("this.showSystemNotice('昵称已更新', 'info')"), true, '昵称保存成功必须使用标准系统提示');
assert.equal(logic.includes("this.showSystemNotice(result.message || '头像上传失败，请重试', 'warning')"), true, '头像上传失败必须使用 warning 系统提示');
assert.equal(logic.includes("this.showSystemNotice(response.message || '昵称保存失败，请重试', 'warning')"), true, '昵称保存失败必须使用 warning 系统提示');
assert.equal(logic.includes("wx.showToast({ title: '昵称含有不适合的内容，请换一个', icon: 'none' })"), true, '微信原生昵称输入框内的校验必须保留系统提示，不能伪装成页面全局反馈');
console.log('个人资料页系统提示与原生昵称输入校验边界通过。');
