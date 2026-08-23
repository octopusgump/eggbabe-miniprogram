const compliance = require('../../services/compliance-service');
const { AGE_RANGES } = require('../../config/compliance');

Page({
  data: { ageRangeLabel: '未设置', ageRangeLoading: false },

  onShow() {
    this.loadAgeRange();
  },

  loadAgeRange() {
    if (this.data.ageRangeLoading) return;
    this.setData({ ageRangeLoading: true });
    compliance.getAgeRange().then(result => {
      if (!result || !result.ok) {
        this.setData({ ageRangeLoading: false, ageRangeLabel: '读取失败，点击重试' });
        return;
      }
      const value = compliance.normalizeAgeRange(result.ageRange);
      const option = AGE_RANGES.find(item => item.value === value);
      this.setData({ ageRangeLoading: false, ageRangeLabel: option ? option.label : '未设置' });
    }).catch(() => this.setData({ ageRangeLoading: false, ageRangeLabel: '读取失败，点击重试' }));
  },

  onAgeRange() { wx.navigateTo({ url: '/pages/age-range/age-range?source=settings' }); },
  onFeedback() { wx.navigateTo({ url: '/pages/feedback/feedback' }); },
  onPolicy(event) {
    const type = String(event.currentTarget.dataset.type || '');
    const policyRoutes = {
      service: '/pages/terms/terms',
      privacy: '/pages/privacy/privacy'
    };
    const url = policyRoutes[type] || `/pages/policy/policy?type=${type}`;
    wx.navigateTo({ url });
  }
});
