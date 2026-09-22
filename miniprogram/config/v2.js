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
  // 收藏卡现已从“我的”正式开放；明信片、纪念物和旅途回放仍只保留
  // develop 验收代码，trial / release 不开放。
  deferredContentEnabled: false,
  deferredContentDeveloperPreviewEnabled: true,
  // 每日陪伴主循环（今日陪伴、陪伴星星、明日钩子）是正式用户功能：develop / trial / release
  // 一致开放。内容来自 COO 已确认的本地静态 fixture，不代表 CTO 服务端已经接入。
  // fixture 切换、测试器、开发验收页等调试能力仍只由 localDemoEnabled 控制。
  todayCompanionEnabled: true,
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
