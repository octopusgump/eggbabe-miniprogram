const config = require('../config/v2');

function deferredContentAvailable() {
  return Boolean(
    config.deferredContentEnabled
    || (config.localDemoEnabled && config.deferredContentDeveloperPreviewEnabled)
  );
}

function guardDeferredContent() {
  if (deferredContentAvailable()) return true;
  wx.switchTab({ url: '/pages/my/my' });
  return false;
}

module.exports = { deferredContentAvailable, guardDeferredContent };
