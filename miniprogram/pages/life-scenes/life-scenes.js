const petStore = require('../../utils/pet-store');
const postHatch = require('../../services/post-hatch-companion');

const SECTIONS = ['keepsakes', 'postcards', 'card'];

Page({
  data: { pet: null, loading: true, error: '', section: 'keepsakes', keepsakes: [], postcards: [], cardRecommendation: null },
  onLoad(query) {
    const section = SECTIONS.includes(query.section) ? query.section : 'keepsakes';
    this.setData({ section });
  },
  onShow() {
    this.pageActive = true;
    const pet = petStore.getPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      wx.showToast({ title: '破壳后才能查看这些回忆', icon: 'none' });
      this.backTimer = setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const token = this.loadToken = (this.loadToken || 0) + 1;
    this.setData({ pet, loading: true, error: '' });
    postHatch.getMemories(pet).then(result => {
      if (!this.pageActive || token !== this.loadToken) return;
      if (!result.ok) {
        this.setData({ loading: false, error: result.message || '回忆没有加载好，请重试' });
        return;
      }
      const keepsakes = (result.keepsakes || []).map(item => Object.assign({}, item, { mark: Array.from(item.name || '物')[0] }));
      this.setData({ loading: false, error: '', keepsakes, postcards: result.postcards || [], cardRecommendation: result.cardRecommendation || null });
    }).catch(() => {
      if (this.pageActive && token === this.loadToken) this.setData({ loading: false, error: '回忆没有加载好，请重试' });
    });
  },
  onSelectSection(event) {
    const section = event.currentTarget.dataset.section;
    if (SECTIONS.includes(section)) this.setData({ section });
  },
  onRetry() { if (!this.data.loading) this.onShow(); },
  onOpenCard() {
    if (this.data.pet && this.data.pet.collectionCard) wx.navigateTo({ url: '/pages/collection-card/collection-card' });
  },
  onHide() { this.pageActive = false; },
  onUnload() {
    this.pageActive = false;
    this.loadToken = (this.loadToken || 0) + 1;
    clearTimeout(this.backTimer);
  }
});
