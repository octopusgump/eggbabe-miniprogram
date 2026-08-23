const compliance = require('../../services/compliance-service');

const POLICY_TYPES = new Set(['service', 'privacy']);

Page({
  data: {
    type: 'privacy',
    title: '隐私政策',
    version: '',
    effectiveDate: '',
    url: '',
    loading: true,
    error: '',
    webviewVisible: false
  },

  onLoad(query) {
    const type = POLICY_TYPES.has(String(query && query.type || '')) ? query.type : 'privacy';
    this.setData({ type });
    this.loadPolicy();
  },

  loadPolicy() {
    if (this.loadingPolicy) return;
    this.loadingPolicy = true;
    this.setData({ loading: true, error: '', webviewVisible: false });
    compliance.getComplianceConfig().then(result => {
      this.loadingPolicy = false;
      const policy = result && result.config && result.config.policies && result.config.policies[this.data.type];
      const url = String(policy && policy.url || '');
      const validUrl = /^https:\/\//i.test(url);
      this.setData({
        loading: false,
        title: String(policy && policy.title || this.data.title),
        version: String(policy && policy.version || ''),
        effectiveDate: String(policy && (policy.effectiveDate || policy.effective_date) || ''),
        url: validUrl ? url : '',
        error: !result || !result.ok
          ? result && result.message || '协议配置没有加载好，请重试'
          : (!validUrl || !policy.version || !(policy.effectiveDate || policy.effective_date) ? '协议正文或版本信息尚未配置，请重试' : '')
      });
    }).catch(() => {
      this.loadingPolicy = false;
      this.setData({ loading: false, error: '协议配置没有加载好，请重试' });
    });
  },

  onOpenDocument() {
    if (!this.data.url || this.data.error) return;
    this.setData({ webviewVisible: true });
  },

  onWebviewError() {
    this.setData({ webviewVisible: false, error: '协议页面加载失败，请重试' });
  },

  onRetry() { this.loadPolicy(); }
});
