const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pageRoot = path.resolve(__dirname, '../../pages/hatch');
const logic = fs.readFileSync(path.join(pageRoot, 'hatch.js'), 'utf8');
const template = fs.readFileSync(path.join(pageRoot, 'hatch.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(pageRoot, 'hatch.wxss'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(pageRoot, 'hatch.json'), 'utf8'));

assert.equal(config.usingComponents['inline-notice'], '../../components/inline-notice/inline-notice', '孵化页必须登记标准系统提示组件');
assert.equal(template.includes('text="{{systemNoticeText}}"') && template.includes('tone="{{systemNoticeTone}}"') && template.includes('visible="{{systemNoticeVisible}}"'), true, '可停留的孵化操作结果必须使用标准系统提示');
assert.match(styles, /\.system-notice-anchor\s*\{[^}]*z-index:\s*120;[^}]*top:\s*calc\(164rpx \+ env\(safe-area-inset-top\)\);[^}]*pointer-events:\s*none;/, '孵化页系统提示必须位于胶囊下方且不拦截操作');
assert.equal(logic.includes("this.showSystemNotice(reviewResult.message || '回顾状态没有保存，请重试', 'warning')"), true, '回顾保存失败必须使用 warning 系统提示');
assert.equal(logic.includes("this.showSystemNotice('破壳准备还没有全部完成', 'warning')"), true, '破壳条件不完整必须使用 warning 系统提示');
assert.equal(logic.includes("wx.showToast({ title: '还没到破壳时间', icon: 'none' })"), true, '即将离开页面的破壳拦截必须保留系统 Toast');
assert.equal(logic.includes("this.setData({ phase: 'error', resultError:"), true, '收藏卡生成失败必须保留可恢复的固定错误页');
console.log('孵化页短暂系统提示、跳转拦截与固定错误状态边界通过。');
