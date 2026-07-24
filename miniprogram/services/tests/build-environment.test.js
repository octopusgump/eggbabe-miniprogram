const assert = require('assert');
const environment = require('../../config/build-environment');

assert.equal(environment.resolvePolicy('develop').mode, 'demo', '开发版必须进入隔离 demo');
assert.equal(environment.resolvePolicy('develop').localDemoEnabled, true, '开发版必须允许本地验收数据');
assert.equal(environment.resolvePolicy('trial').mode, 'live', '体验版必须保持 live');
assert.equal(environment.resolvePolicy('trial').localDemoEnabled, false, '体验版不得启用本地 demo');
assert.equal(environment.resolvePolicy('release').mode, 'live', '正式版必须保持 live');
assert.equal(environment.resolvePolicy('release').localDemoEnabled, false, '正式版不得启用本地 demo');
assert.equal(environment.resolvePolicy('unknown').mode, 'live', '未知环境必须安全回退 live');

console.log('构建环境隔离校验通过。');
