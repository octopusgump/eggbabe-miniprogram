const assert = require('assert');

const originalWx = global.wx;
const originalPage = global.Page;
let page;
let resizeListener = null;
let releasedResizeListener = null;
let currentWindowHeight = 812;

global.wx = {
  getWindowInfo() { return { windowHeight: currentWindowHeight }; },
  getSystemInfoSync() { return { windowHeight: currentWindowHeight }; },
  onWindowResize(listener) { resizeListener = listener; },
  offWindowResize(listener) { releasedResizeListener = listener; }
};
global.Page = definition => { page = definition; };
delete require.cache[require.resolve('../../pages/chat/chat')];
require('../../pages/chat/chat');

const context = Object.assign({}, page, {
  data: Object.assign({}, page.data, {
    snapshot: { currentState: { key: 'reading' } },
    chatAvailable: true,
    messages: [{ id: 'opening', role: 'assistant', text: '我在看书。', status: 'sent' }]
  }),
  setData(patch, callback) {
    Object.assign(this.data, patch);
    if (callback) callback();
  }
});

try {
  page.onLoad.call(context, {});
  assert.equal(context.data.chatViewportStyle, 'height:812px;', '初始聊天页必须以完整窗口高度布局');
  assert.equal(typeof resizeListener, 'function', '聊天页必须监听窗口尺寸变化');

  page.onInputFocus.call(context);
  resizeListener({ size: { windowHeight: 476 } });
  assert.equal(context.data.chatViewportStyle, 'height:812px;', '输入框获焦后收到键盘缩小窗口事件时不得预先改变基准高度');

  page.onKeyboardHeightChange.call(context, { detail: { height: 336 } });
  assert.equal(context.data.chatViewportStyle, 'height:476px;', '键盘打开时可用聊天视口必须只缩短一次');
  assert.equal(context.data.scrollTarget, 'message-opening', '键盘首次打开时必须让最新对话保持可见');

  currentWindowHeight = 812;
  page.onKeyboardHeightChange.call(context, { detail: { height: 0 } });
  assert.equal(context.data.chatViewportStyle, 'height:812px;', '键盘收起时必须恢复完整窗口高度');

  page.onHide.call(context);
  assert.equal(context.data.keyboardHeight, 0, '页面隐藏时不得保留陈旧键盘高度');
  page.onUnload.call(context);
  assert.equal(releasedResizeListener, resizeListener, '页面卸载时必须释放窗口尺寸监听');
  console.log('聊天键盘可用视口、滚动锚点与生命周期清理校验通过。');
} finally {
  global.wx = originalWx;
  global.Page = originalPage;
}
