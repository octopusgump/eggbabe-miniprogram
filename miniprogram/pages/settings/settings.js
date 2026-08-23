const storage = require('../../services/storage-migration');
const subscriptionMessages = require('../../services/subscription-messages');
const petStore = require('../../utils/pet-store');
const compliance = require('../../services/compliance-service');
const { AGE_RANGES } = require('../../config/compliance');
const STORAGE_KEY = 'eggbabe_notification_preferences_v1';
const DEFAULTS = { hatch: true };

Page({
  data: { notifs: DEFAULTS, hatchReminderAvailable: false, ageRangeLabel: '未设置', ageRangeLoading: false },

  onLoad() {
    const pet = petStore.getPet();
    const saved = storage.read(STORAGE_KEY, {});
    this.setData({
      notifs: { hatch: typeof saved.hatch === 'boolean' ? saved.hatch : DEFAULTS.hatch },
      hatchReminderAvailable: !pet || petStore.getStage(pet) !== 'hatched'
    });
  },

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

  update(key, value) {
    this.setData({ [`notifs.${key}`]: value }, () => storage.set(STORAGE_KEY, this.data.notifs));
  },

  onToggleHatch(e) {
    if (!this.data.hatchReminderAvailable) return;
    const enabled = e.detail.value;
    this.update('hatch', enabled);
    if (enabled) subscriptionMessages.requestHatchReminders();
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
