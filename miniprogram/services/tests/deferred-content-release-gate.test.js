const assert = require('assert');
const fs = require('fs');
const path = require('path');

const config = require('../../config/v2');
const releaseSurface = require('../../utils/release-surface');

const original = {
  deferredContentEnabled: config.deferredContentEnabled,
  deferredContentDeveloperPreviewEnabled: config.deferredContentDeveloperPreviewEnabled,
  localDemoEnabled: config.localDemoEnabled
};
const routes = [];
global.wx = { switchTab: options => routes.push(options.url) };

config.deferredContentEnabled = false;
config.deferredContentDeveloperPreviewEnabled = true;
config.localDemoEnabled = false;
assert.equal(releaseSurface.deferredContentAvailable(), false, 'V3.6 / V3.7 trial 与 release 必须关闭复杂内容');
assert.equal(releaseSurface.guardDeferredContent(), false, '正式版旧路径必须被页面级门禁拦截');
assert.equal(routes.pop(), '/pages/my/my', '正式版旧路径必须回到我的/设置');

config.localDemoEnabled = true;
assert.equal(releaseSurface.deferredContentAvailable(), true, 'develop 环境必须保留复杂内容验收能力');

Object.assign(config, original);

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
['pages/album/album.js', 'pages/collection-card/collection-card.js', 'pages/h5-card/h5-card.js', 'pages/life-scenes/life-scenes.js', 'pages/journey-scene/journey-scene.js'].forEach(relative => {
  assert.equal(read(relative).includes('guardDeferredContent()'), true, `${relative} 必须阻止正式版旧路径绕过入口`);
});
assert.equal(read('pages/my/my.wxml').includes('wx:if="{{deferredContentAvailable}}" label="我的收藏卡"'), true, '正式版我的页不得展示收藏卡入口');
assert.equal(/pages\/(?:collection-card|life-scenes|journey-scene)/.test(read('pages/life-scene/life-scene.js')), false, '生活场景不得导航到停用内容');
assert.equal(/redirectTo\(\{ url: '\/pages\/collection-card/.test(read('pages/hatch/hatch.js')), false, '破壳完成后不得自动打开收藏卡');
assert.equal((read('pages/hatch/hatch.js').match(/switchTab\(\{ url: '\/pages\/home\/home' \}\)/g) || []).length >= 2, true, '已有破壳结果与新破壳结果都必须回到主流程');

console.log('V3.6 / V3.7 复杂内容保留代码但正式用户不可触达校验通过。');
