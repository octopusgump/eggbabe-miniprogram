const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const app = JSON.parse(read('app.json'));
const complianceConfig = require('../../config/compliance');

assert.deepEqual(complianceConfig.AGE_RANGES, [
  { label: '14 周岁及以下', value: 'AGE_0_14' },
  { label: '15-35 周岁', value: 'AGE_15_35' },
  { label: '36-60 周岁', value: 'AGE_36_60' },
  { label: '60 周岁以上', value: 'AGE_61_PLUS' }
], '年龄文案与四个保存值必须逐项匹配 PRD');
assert.equal(complianceConfig.HEALTH_REMINDER_MESSAGE_COUNT, 300, '健康提醒阈值必须为 300 条消息');

for (const page of ['pages/age-range/age-range', 'pages/feedback/feedback', 'pages/policy/policy']) {
  assert.equal(app.pages.includes(page), true, `${page} 必须注册`);
}

const ageLogic = read('pages/age-range/age-range.js');
const ageTemplate = read('pages/age-range/age-range.wxml');
assert.equal(ageTemplate.includes('依据相关规定，请选择您的年龄区间：'), true, '年龄页必须使用指定引导语');
for (const label of complianceConfig.AGE_RANGES.map(item => item.label)) assert.equal(ageTemplate.includes('{{item.label}}'), true, '年龄页必须从锁定配置渲染四档文案');
assert.equal(ageLogic.includes("source === 'settings'") && ageLogic.includes('confirmed: previous') && ageLogic.includes('saving: true'), true, '设置页修改失败必须保留旧值，保存中必须锁定提交');
assert.equal(ageLogic.includes('SAVE_SUCCESS_RETURN_DELAY_MS = 900') && ageLogic.includes("url: '/pages/settings/settings'"), true, '设置页年龄保存成功后必须短暂停留并自动返回设置页');
assert.equal(ageTemplate.includes('class="save-success-toast"') && ageTemplate.includes('class="save-success-toast__icon"'), true, '年龄保存成功必须使用与当前轻提示一致的浅色提示条');
assert.equal(ageLogic.includes("wx.showToast({ title: '已保存'"), false, '年龄保存不得继续显示不一致的原生深色成功 Toast');

const service = read('services/compliance-service.js');
assert.equal(service.includes("source: 'SELF_DECLARED'") && service.includes('cloudApi().saveAgeRange'), true, '年龄必须通过账号服务适配层保存并声明自行选择来源');
assert.equal(service.includes('VALID_AGE_VALUES.has') && service.includes("return VALID_AGE_VALUES.has(normalized) ? normalized : ''"), true, '空值或未知年龄枚举必须归一为未设置');
assert.equal(service.includes("manageDeletion('CLEAR_CHAT_HISTORY'") || service.includes('clearChatHistory'), false, '已取消清空聊天记录功能后不得保留删除适配入口');

const settings = `${read('pages/settings/settings.js')}\n${read('pages/settings/settings.wxml')}`;
for (const label of ['用户服务协议', '隐私政策', '用户反馈', '年龄区间']) {
  assert.equal(settings.includes(label), true, `设置页必须展示 ${label}`);
}
const policy = `${read('pages/policy/policy.js')}\n${read('pages/policy/policy.wxml')}`;
assert.equal(policy.includes('版本号：') && policy.includes('生效日期：'), true, '协议页必须显示版本号和生效日期');
assert.equal(policy.includes('onWebviewError') && policy.includes('onRetry'), true, '协议 WebView 加载失败必须提供重试');

const terms = `${read('pages/terms/terms.js')}\n${read('pages/terms/terms.wxml')}`;
assert.equal(read('app.json').includes('pages/terms/terms'), true, '用户服务协议原生页面必须注册到小程序');
assert.equal(settings.includes("service: '/pages/terms/terms'"), true, '设置页用户服务协议必须直接进入原生正文');
assert.equal(settings.includes("privacy: '/pages/privacy/privacy'"), true, '设置页隐私政策必须直接进入现有原生正文');
for (const heading of ['微信小程序服务', 'AI 身份与生成内容标识', '年龄与特殊群体保护', '交互数据与模型训练', '健康使用与紧急风险', '退出、暂停与终止', '申诉、投诉与举报']) {
  assert.equal(terms.includes(heading), true, `用户服务协议必须包含新增章节：${heading}`);
}
assert.equal(terms.includes(['儿童', '个人信息', '保护规则'].join('')), false, '用户服务协议不得保留已取消的独立儿童政策章节或引用');
assert.equal(terms.includes('产品初稿') && terms.includes('尚未经法律审核'), true, '用户服务协议必须明确显示当前法律审核状态');

const feedback = `${read('pages/feedback/feedback.js')}\n${read('pages/feedback/feedback.wxml')}`;
assert.equal(complianceConfig.FEEDBACK_TYPES.length, 9, '反馈必须包含 PRD 的九种诉求类型');
assert.equal(feedback.includes('maxlength="500"') && feedback.includes('messageId') && feedback.includes('我已阅读') && feedback.includes('提交中') && feedback.includes('受理编号'), true, '反馈页必须覆盖描述、同意、消息关联、提交态和受理编号');
assert.equal(feedback.includes('description: this.data.description.trim()') && feedback.includes('if (this.data.submitting || this.submissionInFlight) return;') && feedback.includes("if (!this.data.canSubmit)"), true, '反馈必填项和重复提交必须被阻止');
assert.equal(feedback.includes('已自动关联本条 AI 回复，并预选违规对话类型；提交时将一并发送。') && feedback.includes('已关联被举报消息：{{messageId}}') === false, true, '举报反馈只显示清晰的关联状态，不得向用户暴露原始消息 ID');

const help = `${read('pages/help/help.js')}\n${read('pages/help/help.wxml')}`;
assert.equal(help.includes('getComplianceConfig') && help.includes('客服邮箱') && help.includes('{{supportEmail}}'), true, '帮助中心必须展示统一客服邮箱，并继续从远程配置读取现实求助信息');
assert.equal(help.includes('客服电话与服务时间') || help.includes('support.serviceHours'), false, '帮助中心不得继续展示客服电话或服务时间');
for (const field of ['psychologicalHotline', 'police', 'medicalEmergency']) assert.equal(help.includes(field), true, `帮助中心必须渲染 ${field}`);

const chat = `${read('pages/chat/chat.js')}\n${read('pages/chat/chat.wxml')}\n${read('pages/chat/chat.wxss')}\n${read('services/chat-compliance.js')}`;
const chatTemplate = read('pages/chat/chat.wxml');
const navBar = `${read('components/nav-bar/nav-bar.js')}\n${read('components/nav-bar/nav-bar.wxml')}\n${read('components/nav-bar/nav-bar.wxss')}`;
for (const text of ['AI 虚拟宠物 · 内容由 AI 生成', '温馨提示：蛋宝宝是 AI 虚拟宠物，不是真人。', '长时间 AI 陪伴易产生依赖，请多参与线下户外活动。', '我知道了']) {
  assert.equal(chat.includes(text), true, `聊天页必须包含：${text}`);
}
for (const removedFeature of ["['复制', '举报']", '退出对话', '清空聊天记录', 'onChatMenu', 'onExitConversation', 'clearChatHistory']) {
  assert.equal(chat.includes(removedFeature), false, `聊天页不得保留已取消功能：${removedFeature}`);
}
assert.equal(chatTemplate.includes('data-message-id="{{item.id}}" bindlongpress="onMessageLongPress"') && chat.includes("itemList: ['复制']") && chat.includes('clipboardTextForMessage(target)'), true, '长按单条消息必须只提供复制操作并通过统一规则生成剪贴板内容');
assert.equal(chat.includes("const AI_COPY_ATTRIBUTION = '——以上内容由 AI 生成（蛋宝宝 eggbabe）'") && chat.includes("source.role === 'assistant' ? `${text}\\n\\n${AI_COPY_ATTRIBUTION}` : text"), true, '只有 AI 回复必须追加锁定的 AI 生成标识，用户消息必须保持原文');
assert.equal(chat.includes('recordSuccessfulConversationMessages(2)') && chat.includes('advanceSuccessfulMessageCount'), true, '仅成功确认的一问一答分别计数');
assert.equal(chat.includes('class="health-mask" catchtap="noop"') && chat.includes('healthReminderShown'), true, '健康提醒遮罩不得关闭且同一会话只显示一次');
assert.equal(chatTemplate.includes('title-interactive="{{true}}"') || chatTemplate.includes('bind:titletap="onChatMenu"'), false, '对话页标题必须保持静态，不得唤起旧菜单');
assert.equal(chatTemplate.includes('class="chat-menu"') || chatTemplate.includes('<text>•••</text>'), false, '聊天页不得在微信胶囊附近重复放置自定义省略号菜单');
assert.equal(navBar.includes('titleInteractive') && navBar.includes("triggerEvent('titletap')") && navBar.includes('class="nav-title-chevron"'), true, '通用导航栏必须提供默认关闭的可访问标题操作能力');
assert.equal(chat.includes('ensureAgeBeforeConversation') && chat.includes('/pages/age-range/age-range?source=chat'), true, '进入 AI 对话前必须经过年龄门禁');
assert.equal(chatTemplate.indexOf('class="message-date"') < chatTemplate.indexOf('class="ai-content-timeline-label"'), true, 'AI 标识必须显示在每日时间戳下方');
assert.equal(chatTemplate.includes('wx:if="{{item.dateDisplayLabel}}" class="ai-content-timeline-label"'), true, 'AI 标识必须随每日时间戳显示一次');
assert.equal(chatTemplate.slice(chatTemplate.indexOf('class="composer"')).includes('ai-content-timeline-label'), false, '输入框区域不得重复显示 AI 标识');

const mood = read('components/pet-mood-tab/pet-mood-tab.wxml');
assert.equal(mood.includes('内容由 AI 生成'), true, '每日状态文字下方必须显示 AI 标识');

console.log('合规功能两阶段 MVP 第一阶段静态验收通过。');
