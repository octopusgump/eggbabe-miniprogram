const petStore = require('../../utils/pet-store');
const config = require('../../config/v2');
const stars = require('../../services/iaa-star-unlock-adapter');
const pageModel = require('../../services/companion-activities-page');

Page({
  data: {
    starBalanceIcon: '',
    starBalance: '—',
    playable: [],
    comingSoon: [],
    noticeText: '',
    noticeVisible: false,
    noticeTone: 'info'
  },

  onLoad() {
    const pet = this.currentPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      this.setData({ playable: [], comingSoon: [] });
      this.showNotice('破壳后才能打开活动。', 'warning');
      return;
    }
    stars.configureRoom(pet.id, pet);
    this.refresh();
  },

  onShow() {
    const pet = this.currentPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') return;
    stars.configureRoom(pet.id, pet);
    this.refresh();
  },

  currentPet() {
    const stored = petStore.getPet();
    if (stored && petStore.getStage(stored) === 'hatched') return stored;
    return config.localDemoEnabled ? stars.getConfiguredPet() || stored : stored;
  },

  refresh() {
    return pageModel.buildViewAsync().then(view => {
      if (!this) return;
      this.setData(view);
    });
  },

  showNotice(text, tone) {
    this.setData({ noticeText: text, noticeVisible: true, noticeTone: tone || 'info' });
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => {
      if (this) this.setData({ noticeVisible: false });
    }, 2400);
  },

  onTapRow(event) {
    const key = event.currentTarget.dataset.key;
    const section = event.currentTarget.dataset.section;
    const list = section === 'soon' ? this.data.comingSoon : this.data.playable;
    const item = list.find(row => row.key === key);
    if (!item || item.disabled) return;
    if (item.comingSoon) {
      this.showNotice('这个玩法还在准备中。', 'info');
      return;
    }
    if (!item.route) {
      this.showNotice('这个玩法还在准备中。', 'info');
      return;
    }
    wx.navigateTo({
      url: item.route,
      fail: () => this.showNotice('暂时打不开，请稍后再试。', 'warning')
    });
  },

  onUnload() {
    clearTimeout(this.noticeTimer);
  }
});
