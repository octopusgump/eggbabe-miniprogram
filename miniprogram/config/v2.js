module.exports = {
  version: '2.26.0-preview',
  backendEnabled: false,
  localActivationCode: 'FUHUAQIAN',
  localHatchedActivationCode: 'FUHUAHOU',
  apiBase: '',
  timezone: 'Asia/Shanghai',
  sceneCardDailyLimit: 2,
  sceneCardDropRate: 0.18,
  localPreviewFallback: true,
  v2EconomyEnabled: true,
  // 上线 H5 后填写已加入微信小程序“业务域名”的 HTTPS 地址。
  birthCardH5Url: '',
  birthCardApiBase: '',
  miniProgramCodeUrl: '',
  // 仅用于前端预览。正式环境由 CTO 在 bootstrap 数据中下发同结构表现数据。
  incubationEnvironmentPreview: { season: 'summer', weather: 'sunny', period: 'day', backgroundImage: '' },
  ecommerce: { taobaoCopyText: '', xiaohongshuCopyText: '' },
  customerService: { corpId: '', url: '' },
  subscriptionTemplateIds: { hatchDay: '', hatchSoon: '', seasonal: '' }
};
