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
      const { wishBursts, wishPressKey } = this.data;
      this.setData({ ...view, wishBursts, wishPressKey });
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
    if (item.key === 'drawing') {
      stars.beginCompanionPropDrawing('activity').then(result => {
        if (!result.ok) {
          this.showNotice(result.error && result.error.message || '星星还不够，先去赚一点吧。', 'warning');
          return;
        }
        this.refresh();
        wx.navigateTo({
          url: item.route,
          fail: () => this.showNotice('暂时打不开，请稍后再试。', 'warning')
        });
      });
      return;
    }
    wx.navigateTo({
      url: item.route,
      fail: () => this.showNotice('暂时打不开，请稍后再试。', 'warning')
    });
  },

  findComingSoonRow(key) {
    const target = String(key || '');
    return (this.data.comingSoon || []).find(row => String(row.key) === target);
  },

  onWishTouchStart(event) {
    this.wishTouchMoved = false;
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    this.lastWishTouch = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      key: event.currentTarget.dataset.key
    };
  },

  onWishTouchMove() {
    this.wishTouchMoved = true;
  },

  onWishTouchEnd(event) {
    if (this.wishTouchMoved) return;
    const key = event.currentTarget.dataset.key;
    this.fireWishFeedback(key, event);
  },

  fireWishFeedback(key, event) {
    if (!this.findComingSoonRow(key)) return;
    const now = Date.now();
    if (
      this.lastWishFeedbackKey === key
      && this.lastWishFeedbackAt
      && now - this.lastWishFeedbackAt < 320
    ) {
      return;
    }
    this.lastWishFeedbackKey = key;
    this.lastWishFeedbackAt = now;
    this.pulseWishRowShake(key);
    const detailX = Number(event && event.detail && event.detail.x);
    const detailY = Number(event && event.detail && event.detail.y);
    let originX = Number.isFinite(detailX) ? detailX : 0;
    let originY = Number.isFinite(detailY) ? detailY : 0;
    if (!Number.isFinite(detailX) || !Number.isFinite(detailY)) {
      const cached = this.lastWishTouch;
      if (cached && String(cached.key) === String(key) && Number.isFinite(cached.clientX)) {
        const query = wx.createSelectorQuery().in(this);
        query.select(`#wish-area-${key}`).boundingClientRect();
        query.exec(rects => {
          if (!this) return;
          const wishRect = rects && rects[0];
          if (!wishRect) {
            this.playWishPlusOne(key, 120, 40);
            return;
          }
          this.playWishPlusOne(
            key,
            cached.clientX - wishRect.left,
            cached.clientY - wishRect.top
          );
        });
        return;
      }
      originX = 120;
      originY = 40;
    }
    this.playWishPlusOne(key, originX, originY);
  },

  pulseWishRowShake(key) {
    const apply = () => this.setData({ wishPressKey: key });
    if (this.data.wishPressKey === key) {
      this.setData({ wishPressKey: '' }, apply);
    } else {
      apply();
    }
    clearTimeout(this.wishPressTimers[key]);
    this.wishPressTimers[key] = setTimeout(() => {
      if (this.data.wishPressKey === key) this.setData({ wishPressKey: '' });
    }, 280);
  },

  onTapComingSoonWish(event) {
    this.fireWishFeedback(event.currentTarget.dataset.key, event);
  },

  onTapComingSoonCta(event) {
    const key = event.currentTarget.dataset.key;
    const item = this.findComingSoonRow(key);
    if (!item) return;
    this.openComingSoonModal(item);
  },

  playWishPlusOne(key, originX, originY) {
    this.wishBurstSeq = (this.wishBurstSeq || 0) + 1;
    const id = `wish-${Date.now()}-${this.wishBurstSeq}`;
    const burst = {
      id,
      key,
      originX: Number.isFinite(originX) ? originX : 0,
      originY: Number.isFinite(originY) ? originY : 0
    };
    this.setData({
      wishBursts: (this.data.wishBursts || []).concat(burst)
    });
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
