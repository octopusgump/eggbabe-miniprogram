const environment = require('./build-environment');
const policy = environment.currentPolicy();
// 由发布负责人填写已通过微信小程序合法域名审核的服务地址；develop 永远不访问正式服务。
const API_BASES = { trial: '', release: '' };
const apiBase = policy.localDemoEnabled ? '' : API_BASES[policy.envVersion] || '';

module.exports = {
  version: '3.7.0-ordinary',
  buildTarget: policy.buildTarget,
  envVersion: policy.envVersion,
  localDemoEnabled: policy.localDemoEnabled,
  defaultMode: policy.mode,
  backendEnabled: policy.mode === 'live' && Boolean(apiBase),
  // V3.6 / V3.7 正式版只上线对话与我的/设置。已完成的收藏卡、明信片、
  // 纪念物和旅途回放代码保留供 develop 验收，trial / release 不开放。
  deferredContentEnabled: false,
  deferredContentDeveloperPreviewEnabled: true,
  apiBase,
  apiBases: Object.assign({}, API_BASES),
  requestTimeoutMs: 15000,
  chatRequestTimeoutMs: 10000,
  timezone: 'Asia/Shanghai',
  // 上线 H5 后填写已加入微信小程序“业务域名”的 HTTPS 地址。
  birthCardH5Url: '',
  birthCardApiBase: '',
  miniProgramCodeUrl: '',
  subscriptionTemplateIds: { hatchDay: '', hatchSoon: '' }
};
