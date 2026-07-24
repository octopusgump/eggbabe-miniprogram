const environment = require('./build-environment');
const policy = environment.currentPolicy();

module.exports = {
  version: '2.28.0-ordinary',
  buildTarget: policy.buildTarget,
  envVersion: policy.envVersion,
  localDemoEnabled: policy.localDemoEnabled,
  defaultMode: policy.mode,
  backendEnabled: false,
  apiBase: '',
  timezone: 'Asia/Shanghai',
  // 上线 H5 后填写已加入微信小程序“业务域名”的 HTTPS 地址。
  birthCardH5Url: '',
  birthCardApiBase: '',
  miniProgramCodeUrl: '',
  customerService: { corpId: '', url: '' },
  subscriptionTemplateIds: { hatchDay: '', hatchSoon: '' }
};
