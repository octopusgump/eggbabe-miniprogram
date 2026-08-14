const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
function loadPage(relative) {
  let definition;
  global.Page = page => { definition = page; };
  const modulePath = path.join(root, relative);
  delete require.cache[require.resolve(modulePath)];
  require(modulePath);
  return definition;
}
function pageContext(page, data) {
  return Object.assign({}, page, {
    data: Object.assign({}, page.data, data),
    setData(patch) { Object.assign(this.data, patch); }
  });
}

const homeLogic = read('pages/home/home.js');
const homeTemplate = read('pages/home/home.wxml');
assert.equal(homeLogic.includes("this.showDoodleReturnNotice('生活空间没有打开，请重试', 'warning')"), true, '首页生活空间跳转失败必须复用标准系统提示');
assert.equal(homeLogic.includes("wx.showToast({ title: '生活空间没有打开，请重试'"), false, '首页生活空间跳转失败不得重复显示系统 Toast');
assert.equal(homeTemplate.includes('tone="{{doodleReturnNoticeTone}}"'), true, '首页共享提示锚点必须支持 warning 外观');

const welcomeLogic = read('pages/welcome/welcome.js');
const welcomeTemplate = read('pages/welcome/welcome.wxml');
assert.equal(json('pages/welcome/welcome.json').usingComponents['inline-notice'], '../../components/inline-notice/inline-notice', '欢迎页必须登记标准系统提示组件');
assert.equal(welcomeLogic.includes("agreementError: '请先阅读并同意隐私政策'"), true, '隐私协议未勾选必须显示字段错误');
assert.equal(welcomeLogic.includes("this.showSystemNotice('账号服务尚未接入，请稍后再试', 'warning')"), true, '欢迎页账户服务失败必须使用 warning 系统提示');
assert.equal(welcomeTemplate.includes('agreement--error') && welcomeTemplate.includes('aria-role="alert"'), true, '欢迎页字段错误必须紧邻隐私协议控件并可被辅助功能读取');

['lesson', 'wish'].forEach(page => {
  const logic = read(`pages/${page}/${page}.js`);
  const template = read(`pages/${page}/${page}.wxml`);
  const styles = read(`pages/${page}/${page}.wxss`);
  assert.equal(logic.includes('selectionError'), true, `${page} 未选择必须存为字段错误`);
  assert.equal(logic.includes('wx.showToast'), false, `${page} 未选择不得显示全局系统 Toast`);
  assert.equal(template.includes('class="form-error"') && template.includes('disabled="{{submitting}}"'), true, `${page} 必须允许提交按钮触发表单错误`);
  assert.equal(styles.includes('.options--error .option'), true, `${page} 选项区域必须有错误状态外观`);

  const definition = loadPage(`pages/${page}/${page}.js`);
  const context = pageContext(definition);
  definition.onSubmit.call(context);
  assert.equal(context.data.selectionError, page === 'lesson' ? '先选一件小事吧' : '先选一个愿望吧', `${page} 点击提交但未选择时必须显示就近字段错误`);
  definition.onSelect.call(context, { currentTarget: { dataset: { id: 'selected-option' } } });
  assert.equal(context.data.selectionError, '', `${page} 选中选项后必须清除字段错误`);
});

const helpLogic = read('pages/help/help.js');
const helpTemplate = read('pages/help/help.wxml');
assert.equal(json('pages/help/help.json').usingComponents['inline-notice'], '../../components/inline-notice/inline-notice', '帮助页必须登记标准系统提示组件');
assert.equal(helpLogic.includes("this.showSystemNotice('邮箱已复制', 'info')"), true, '复制邮箱成功必须使用标准系统提示');
assert.equal(helpTemplate.includes('text="{{systemNoticeText}}"'), true, '帮助页必须渲染系统提示锚点');

const cardLogic = read('pages/collection-card/collection-card.js');
assert.equal(json('pages/collection-card/collection-card.json').usingComponents['inline-notice'], '../../components/inline-notice/inline-notice', '原生收藏卡必须登记标准系统提示组件');
assert.equal(cardLogic.includes("this.showSystemNotice('收藏卡图片生成失败，请重试', 'warning')"), true, '原生收藏卡生成失败必须使用 warning 系统提示');
assert.equal(cardLogic.includes("wx.showToast({ title: '收藏卡已保存', icon: 'success' })"), true, '微信相册保存成功必须保留系统接口反馈');
assert.equal(cardLogic.includes("wx.showToast({ title: denied ? '请允许保存到相册' : '保存图片失败，请重试', icon: 'none' })"), true, '微信相册权限与保存失败必须保留系统接口反馈');

const h5CardLogic = read('pages/h5-card/h5-card.js');
assert.equal(h5CardLogic.includes("wx.showToast({ title: '收藏卡已保存', icon: 'success' })"), true, 'H5 web-view 收藏卡保存成功必须保留系统接口反馈');
assert.equal(h5CardLogic.includes("wx.showToast({ title: '请允许保存到相册', icon: 'none' })"), true, 'H5 web-view 相册权限提示必须保留系统接口反馈');

console.log('首页至收藏卡六项提示层语义边界校验通过。');
