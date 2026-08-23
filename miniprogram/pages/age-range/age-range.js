const compliance = require('../../services/compliance-service');
const { AGE_RANGES } = require('../../config/compliance');
const SAVE_SUCCESS_RETURN_DELAY_MS = 900;

Page({
  data: {
    options: AGE_RANGES,
    selected: '',
    confirmed: '',
    loading: true,
    saving: false,
    leaving: false,
    saveSuccessVisible: false,
    loadError: '',
    saveError: '',
    source: 'chat'
  },

  onLoad(query) {
    this.setData({ source: query && query.source === 'settings' ? 'settings' : 'chat' });
    this.loadAgeRange();
  },

  loadAgeRange() {
    if (this.data.loading && this.ageRequestStarted) return;
    this.ageRequestStarted = true;
    this.setData({ loading: true, loadError: '' });
    compliance.getAgeRange().then(result => {
      this.ageRequestStarted = false;
      if (!result || !result.ok) {
        this.setData({ loading: false, loadError: result && result.message || '年龄区间没有加载好，请重试' });
        return;
      }
      const confirmed = compliance.normalizeAgeRange(result.ageRange);
      this.setData({ loading: false, confirmed, selected: confirmed, loadError: '' });
    }).catch(() => {
      this.ageRequestStarted = false;
      this.setData({ loading: false, loadError: '年龄区间没有加载好，请重试' });
    });
  },

  onSelect(event) {
    if (this.data.saving || this.data.leaving || (this.data.source === 'settings' && this.data.loadError)) return;
    const selected = compliance.normalizeAgeRange(event.currentTarget.dataset.value);
    if (selected) this.setData({ selected, saveError: '' });
  },

  onConfirm() {
    if (this.data.saving || this.data.leaving || !this.data.selected || (this.data.source === 'settings' && this.data.loadError)) return;
    const previous = this.data.confirmed;
    this.setData({ saving: true, saveError: '' });
    compliance.saveAgeRange(this.data.selected).then(result => {
      if (!result || !result.ok) {
        this.setData({ saving: false, confirmed: previous, selected: this.data.source === 'settings' ? previous : this.data.selected, saveError: result && result.message || '保存失败，请重试' });
        return;
      }
      const confirmed = compliance.normalizeAgeRange(result.ageRange);
      if (!confirmed) {
        this.setData({ saving: false, confirmed: previous, saveError: '保存失败，请重试' });
        return;
      }
      const returningToSettings = this.data.source === 'settings';
      this.setData({ saving: false, leaving: returningToSettings, saveSuccessVisible: returningToSettings, confirmed, selected: confirmed, saveError: '' });
      if (this.data.source === 'chat') {
        wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/chat/chat' }) });
        return;
      }
      this.returnTimer = setTimeout(() => {
        this.returnTimer = null;
        wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/settings/settings' }) });
      }, SAVE_SUCCESS_RETURN_DELAY_MS);
    }).catch(() => this.setData({ saving: false, confirmed: previous, selected: this.data.source === 'settings' ? previous : this.data.selected, saveError: '保存失败，请重试' }));
  },

  onRetryLoad() { this.loadAgeRange(); },

  onUnload() {
    clearTimeout(this.returnTimer);
    this.returnTimer = null;
  }
});
