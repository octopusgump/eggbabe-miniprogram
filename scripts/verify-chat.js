const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const checks = [
  'miniprogram/services/tests/cloud-api.test.js',
  'miniprogram/services/tests/chat-input-validation.test.js',
  'miniprogram/services/tests/chat-history.test.js',
  'miniprogram/services/tests/chat-message-id.test.js',
  'miniprogram/services/tests/chat-page-presentation.test.js',
  'miniprogram/services/tests/chat-keyboard-layout.test.js',
  'miniprogram/services/tests/chat-request-lifecycle.test.js',
  'miniprogram/services/tests/chat-retry.test.js',
  'miniprogram/services/tests/chat-error-routing.test.js',
  'miniprogram/services/tests/chat-privacy-storage.test.js',
  'miniprogram/services/tests/build-environment.test.js',
  'miniprogram/services/tests/demo-network-isolation.test.js',
  'miniprogram/services/tests/release-gate.test.js',
  'scripts/verify-v211.js',
  'scripts/verify-v2.js',
  'scripts/verify-project.js'
];

checks.forEach(file => execFileSync(process.execPath, [file], { cwd: root, stdio: 'inherit' }));
console.log(`聊天专项回归门禁通过：${checks.length} 项。`);
