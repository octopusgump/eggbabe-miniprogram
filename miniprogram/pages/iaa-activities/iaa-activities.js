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
    noticeTone: 'info',
    comingSoonModalVisible: false,
    comingSoonModalTitle: '',
    comingSoonModalIcon: '',
    comingSoonModalTag: '下期',
    comingSoonModalLines: [],
    wishBursts: [],
    wishPressKey: ''
  },

  onLoad() {
    this.wishBurstSeq = 0;
    this.wishPressTimers = {};
    this.wishBurstTimers = [];
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
    if (item.comingSoon) return;
    if (!item.route) {
      this.showNotice('这个玩法还在准备中。', 'info');
      return;
    }
    wx.navigateTo({
      url: item.route,
      fail: () => this.showNotice('暂时打不开，请稍后再试。', 'warning')
    });
  },

  onTapComingSoonWish(event) {
    const key = event.currentTarget.dataset.key;
    const item = this.data.comingSoon.find(row => row.key === key);
    if (!item || !item.comingSoon) return;
    this.playWishPlusOne(key);
  },

  onTapComingSoonCta(event) {
    const key = event.currentTarget.dataset.key;
    const item = this.data.comingSoon.find(row => row.key === key);
    if (!item || !item.comingSoon) return;
    this.openComingSoonModal(item);
  },

  playWishPlusOne(key) {
    this.wishBurstSeq = (this.wishBurstSeq || 0) + 1;
    const id = `wish-${Date.now()}-${this.wishBurstSeq}`;
    this.setData({
      wishBursts: this.data.wishBursts.concat({ id, key }),
      wishPressKey: key
    });
    clearTimeout(this.wishPressTimers[key]);
    this.wishPressTimers[key] = setTimeout(() => {
      if (this.data.wishPressKey === key) this.setData({ wishPressKey: '' });
    }, 800);
    const burstTimer = setTimeout(() => {
      if (!this) return;
      this.setData({ wishBursts: this.data.wishBursts.filter(burst => burst.id !== id) });
    }, 820);
    this.wishBurstTimers.push(burstTimer);
  },

  openComingSoonModal(item) {
    const lines = Array.isArray(item.modalLines) && item.modalLines.length
      ? item.modalLines
      : [`${item.title}玩法还在准备中，下期就和你见面～`, '上线后会在这里第一时间亮起来。'];
    this.setData({
      comingSoonModalVisible: true,
      comingSoonModalTitle: item.title,
      comingSoonModalIcon: item.icon,
      comingSoonModalTag: item.phaseTag || '下期',
      comingSoonModalLines: lines
    });
  },

  onCloseComingSoonModal() {
    this.setData({ comingSoonModalVisible: false });
  },

  onComingSoonOverlayTap() {
    this.onCloseComingSoonModal();
  },

  onComingSoonDialogTap() {},

  onUnload() {
    clearTimeout(this.noticeTimer);
    Object.keys(this.wishPressTimers || {}).forEach(timerKey => clearTimeout(this.wishPressTimers[timerKey]));
    (this.wishBurstTimers || []).forEach(timer => clearTimeout(timer));
  }
});
