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
    wx.navigateTo({
      url: item.route,
      fail: () => this.showNotice('暂时打不开，请稍后再试。', 'warning')
    });
  },

  onWishTouchStart(event) {
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    this.lastWishTouch = {
      clientX: touch.clientX,
      clientY: touch.clientY
    };
  },

  resolveWishBurstOrigin(key, clientX, clientY, callback) {
    const query = wx.createSelectorQuery().in(this);
    query.select(`#wish-row-${key}`).boundingClientRect();
    query.exec(rects => {
      if (!this) return;
      const rowRect = rects && rects[0];
      let originX = Number.isFinite(clientX) ? clientX : 0;
      let originY = Number.isFinite(clientY) ? clientY : 0;
      if (rowRect && Number.isFinite(clientX) && Number.isFinite(clientY)) {
        originX = clientX - rowRect.left;
        originY = clientY - rowRect.top;
      } else if (rowRect) {
        originX = rowRect.width * 0.45;
        originY = rowRect.height * 0.35;
      }
      callback(originX, originY);
    });
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
    }, 420);
  },

  onTapComingSoonWish(event) {
    const key = event.currentTarget.dataset.key;
    const item = this.data.comingSoon.find(row => row.key === key);
    if (!item || !item.comingSoon) return;
    this.pulseWishRowShake(key);
    const fromTap = event.changedTouches && event.changedTouches[0];
    const cached = this.lastWishTouch;
    const touch = fromTap || (cached && { clientX: cached.clientX, clientY: cached.clientY });
    if (touch && Number.isFinite(touch.clientX) && Number.isFinite(touch.clientY)) {
      this.resolveWishBurstOrigin(key, touch.clientX, touch.clientY, (originX, originY) => {
        this.playWishPlusOne(key, originX, originY);
      });
      return;
    }
    const localX = Number(event.detail && event.detail.x);
    const localY = Number(event.detail && event.detail.y);
    const query = wx.createSelectorQuery().in(this);
    query.select(`#wish-area-${key}`).boundingClientRect();
    query.select(`#wish-row-${key}`).boundingClientRect();
    query.exec(rects => {
      if (!this) return;
      const wishRect = rects && rects[0];
      const rowRect = rects && rects[1];
      let originX = 0;
      let originY = 0;
      if (wishRect && rowRect) {
        const x = Number.isFinite(localX) ? localX : wishRect.width / 2;
        const y = Number.isFinite(localY) ? localY : wishRect.height / 2;
        originX = wishRect.left - rowRect.left + x;
        originY = wishRect.top - rowRect.top + y;
      }
      this.playWishPlusOne(key, originX, originY);
    });
  },

  onTapComingSoonCta(event) {
    const key = event.currentTarget.dataset.key;
    const item = this.data.comingSoon.find(row => row.key === key);
    if (!item || !item.comingSoon) return;
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
      wishBursts: this.data.wishBursts.concat(burst)
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
