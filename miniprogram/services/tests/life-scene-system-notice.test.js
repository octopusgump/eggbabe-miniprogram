const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pageRoot = path.resolve(__dirname, '../../pages/life-scene');
const logic = fs.readFileSync(path.join(pageRoot, 'life-scene.js'), 'utf8');
const template = fs.readFileSync(path.join(pageRoot, 'life-scene.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(pageRoot, 'life-scene.wxss'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(pageRoot, 'life-scene.json'), 'utf8'));

assert.equal(config.usingComponents['scene-feedback-stack'], '../../components/scene-feedback-stack/scene-feedback-stack', '生活空间必须登记共享双层反馈组件');
assert.equal(template.includes('<scene-feedback-stack') && template.includes('system-behind="{{sceneFeedbackSystemBehind}}"'), true, '对白与系统提示必须共用同一视口反馈区');
assert.match(styles, /\.stage-tester\{[^}]*z-index:92;/, '开发验收按钮层级基线必须明确');
assert.equal(logic.includes('showSystemNotice(text, tone)'), true, '生活空间必须通过独立方法显示系统提示');
assert.equal(logic.includes('createSceneFeedbackController(this'), true, '生活空间必须使用共享的对白优先队列控制器');
assert.equal(logic.includes("this.showSystemNotice(result.message || '这次没有回应，请重试', 'warning')"), true, '动作业务失败必须是 warning 系统提示');
assert.equal(logic.includes("this.showSystemNotice('这次没有回应，请重试', 'warning')"), true, '动作异常必须是 warning 系统提示');
assert.equal(logic.includes("this.showSystemNotice('此刻没有说话入口。', 'warning')"), true, '聊天不可用必须是 warning 系统提示');
assert.equal(logic.includes("this.showSystemNotice('对话页面没有打开，请重试', 'warning')"), true, '导航失败必须是 warning 系统提示');
assert.equal(logic.includes("this.showFeedback('我暖起来了。')"), true, '角色成功反馈必须继续使用白底黑字对白');
assert.equal(logic.includes('this.showFeedback(feedbackOverride || result.feedback || current.action.feedback)'), true, '角色动作成功反馈必须继续使用白底黑字对白');
assert.equal(logic.includes("this.showFeedback(result.message || '这次没有回应，请重试')"), false, '动作失败不得再借角色对白表达');
assert.equal(logic.includes("this.showFeedback('此刻没有说话入口。')"), false, '聊天不可用不得再借角色对白表达');
assert.equal(logic.includes("this.showFeedback('对话页面没有打开，请重试')"), false, '导航失败不得再借角色对白表达');

assert.equal(/systemNoticeText|system-notice-anchor|scene-status-bubble|feedback-bubble/.test(`${logic}\n${template}\n${styles}`), false, '生活空间不得保留旧的多锚点反馈实现');

console.log('生活空间双层反馈语义与统一视口接入校验通过。');
