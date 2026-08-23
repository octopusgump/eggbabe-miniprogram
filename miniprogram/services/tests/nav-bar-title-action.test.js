const assert = require('assert');

const originalComponent = global.Component;
let definition;

try {
  global.Component = value => { definition = value; };
  delete require.cache[require.resolve('../../components/nav-bar/nav-bar')];
  require('../../components/nav-bar/nav-bar');

  assert.equal(definition.properties.titleInteractive.value, false, '通用导航标题默认不得响应点击');

  const events = [];
  const context = {
    properties: { titleInteractive: false },
    triggerEvent(name) { events.push(name); }
  };
  definition.methods.onTitleTap.call(context);
  assert.deepEqual(events, [], '未显式开启时点击标题不得触发菜单事件');

  context.properties.titleInteractive = true;
  definition.methods.onTitleTap.call(context);
  assert.deepEqual(events, ['titletap'], '显式开启后点击标题必须触发 titletap');

  console.log('导航栏标题操作启用边界校验通过。');
} finally {
  global.Component = originalComponent;
}
