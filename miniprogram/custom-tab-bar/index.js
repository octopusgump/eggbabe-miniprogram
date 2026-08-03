const PROFILE_HINT_STORAGE_KEY = 'eggbabe_profile_icon_hint_seen_v1';

function hasSeenProfileHint() {
  try {
    return Boolean(wx.getStorageSync(PROFILE_HINT_STORAGE_KEY));
  } catch (error) {
    return false;
  }
}

function markProfileHintSeen() {
  try {
    wx.setStorageSync(PROFILE_HINT_STORAGE_KEY, true);
  } catch (error) {}
}

Component({
  data: {
    selected: 0,
    hidden: false,
    elevated: false,
    tabHintIndex: -1,
    tabHintVisible: false,
    items: [
      {
        pagePath: '/pages/home/home',
        text: '蛋宝宝',
        iconPath: '/assets/tab/egg.png',
        selectedIconPath: '/assets/tab/egg-active.png'
      },
      {
        pagePath: '/pages/my/my',
        text: '我的',
        iconPath: '/assets/ui/3d-actions/runtime/ui_3d_profile_wood_plaque_96_v05.png',
        selectedIconPath: '/assets/ui/3d-actions/runtime/ui_3d_profile_wood_plaque_96_v05.png'
      }
    ]
  },

  lifetimes: {
    attached() {
      this.tabAttached = true;
      if (this.tabPageActive) this.scheduleProfileFirstHint();
    },

    detached() {
      this.tabAttached = false;
      this.tabPageActive = false;
      this.clearHintTimers();
    }
  },

  pageLifetimes: {
    show() {
      this.tabPageActive = true;
      this.scheduleProfileFirstHint();
    },

    hide() {
      this.tabPageActive = false;
      this.clearHintTimers();
    }
  },

  observers: {
    'hidden, selected'(hidden, selected) {
      if (hidden || selected === 1) this.clearHintTimers();
    }
  },

  methods: {
    clearHintTimers() {
      clearTimeout(this.profileFirstHintTimer);
      clearTimeout(this.tabHintRevealTimer);
      clearTimeout(this.tabHintTimer);
      clearTimeout(this.tabHintClearTimer);
      clearTimeout(this.pendingSwitchTimer);
      clearTimeout(this.pendingSwitchWatchdog);
      this.profileFirstHintTimer = null;
      this.tabHintRevealTimer = null;
      this.tabHintTimer = null;
      this.tabHintClearTimer = null;
      this.pendingSwitchTimer = null;
      this.pendingSwitchWatchdog = null;
      this.tabLongPressIndex = -1;
      this.tabLongPressTapIndex = -1;
      this.tabGestureIndex = -1;
      this.tabSwitchPending = false;
      this.tabSwitchStarted = false;
      this.tabHintRequestToken = (this.tabHintRequestToken || 0) + 1;
      this.tabSwitchToken = (this.tabSwitchToken || 0) + 1;
      if (this.tabAttached && (this.data.tabHintIndex !== -1 || this.data.tabHintVisible)) {
        this.setData({ tabHintIndex: -1, tabHintVisible: false });
      }
    },

    scheduleProfileFirstHint() {
      clearTimeout(this.profileFirstHintTimer);
      this.profileFirstHintTimer = null;
      if (!this.tabAttached || !this.tabPageActive || this.data.hidden || this.data.selected === 1 || hasSeenProfileHint()) return;
      this.profileFirstHintTimer = setTimeout(() => {
        this.profileFirstHintTimer = null;
        if (!this.tabAttached || !this.tabPageActive || this.data.hidden || this.data.selected === 1) return;
        this.showTabHint(1, 2400, { markSeen: true, keepFirstHintTimer: true });
      }, 420);
    },

    cancelProfileFirstHint() {
      clearTimeout(this.profileFirstHintTimer);
      this.profileFirstHintTimer = null;
    },

    clearTabHintTransitionTimers() {
      clearTimeout(this.tabHintRevealTimer);
      clearTimeout(this.tabHintTimer);
      clearTimeout(this.tabHintClearTimer);
      this.tabHintRevealTimer = null;
      this.tabHintTimer = null;
      this.tabHintClearTimer = null;
      this.tabHintRequestToken = (this.tabHintRequestToken || 0) + 1;
    },

    showTabHint(index, duration = 1800, options = {}) {
      if (!options.keepFirstHintTimer) this.cancelProfileFirstHint();
      this.clearTabHintTransitionTimers();
      const requestToken = this.tabHintRequestToken;
      this.setData({ tabHintIndex: index, tabHintVisible: false }, () => {
        if (!this.tabAttached || !this.tabPageActive || this.data.hidden || this.data.selected === 1 || requestToken !== this.tabHintRequestToken) return;
        this.tabHintRevealTimer = setTimeout(() => {
          this.tabHintRevealTimer = null;
          if (!this.tabAttached || !this.tabPageActive || this.data.hidden || this.data.selected === 1 || requestToken !== this.tabHintRequestToken) return;
          this.setData({ tabHintVisible: true });
          if (options.markSeen) markProfileHintSeen();
          this.tabHintTimer = setTimeout(() => {
            this.tabHintTimer = null;
            if (!this.tabAttached || !this.tabPageActive || requestToken !== this.tabHintRequestToken) return;
            this.setData({ tabHintVisible: false });
            this.tabHintClearTimer = setTimeout(() => {
              this.tabHintClearTimer = null;
              if (this.tabAttached && this.tabPageActive && requestToken === this.tabHintRequestToken && !this.data.tabHintVisible) this.setData({ tabHintIndex: -1 });
            }, 180);
          }, duration);
        }, 20);
      });
    },

    onTouchStart(event) {
      const index = Number(event.currentTarget.dataset.index);
      this.tabGestureIndex = index;
      this.tabLongPressIndex = -1;
      this.tabLongPressTapIndex = -1;
    },

    onTouchEnd(event) {
      const index = Number(event.currentTarget.dataset.index);
      if (this.tabGestureIndex === index && this.tabLongPressIndex === index) {
        this.tabLongPressTapIndex = index;
      }
      this.tabGestureIndex = -1;
    },

    onTouchCancel() {
      this.tabGestureIndex = -1;
      this.tabLongPressIndex = -1;
      this.tabLongPressTapIndex = -1;
    },

    onLongPress(event) {
      const index = Number(event.currentTarget.dataset.index);
      const item = this.data.items[index];
      if (!item || item.text !== '我的') return;
      this.cancelProfileFirstHint();
      this.tabLongPressIndex = index;
      this.showTabHint(index);
    },

    releaseSwitch(token, message) {
      if (token !== this.tabSwitchToken) return;
      clearTimeout(this.pendingSwitchTimer);
      clearTimeout(this.pendingSwitchWatchdog);
      this.pendingSwitchTimer = null;
      this.pendingSwitchWatchdog = null;
      this.tabSwitchPending = false;
      this.tabSwitchStarted = false;
      this.tabSwitchToken = (this.tabSwitchToken || 0) + 1;
      if (message && wx.showToast) wx.showToast({ title: message, icon: 'none' });
    },

    startSwitch(item) {
      if (this.tabSwitchPending) return;
      this.tabSwitchPending = true;
      this.tabSwitchStarted = false;
      const token = this.tabSwitchToken = (this.tabSwitchToken || 0) + 1;
      this.pendingSwitchTimer = setTimeout(() => {
        this.pendingSwitchTimer = null;
        if (!this.tabAttached || !this.tabPageActive || this.data.hidden || token !== this.tabSwitchToken || !this.tabSwitchPending) return;
        this.pendingSwitchWatchdog = setTimeout(() => {
          if (token !== this.tabSwitchToken || !this.tabSwitchPending) return;
          this.releaseSwitch(token, this.tabSwitchStarted ? '' : '页面暂时没有打开，请再试一次。');
        }, 1800);
        wx.switchTab({
          url: item.pagePath,
          success: () => {
            if (token === this.tabSwitchToken) this.tabSwitchStarted = true;
          },
          fail: () => this.releaseSwitch(token, '页面暂时没有打开，请再试一次。'),
          complete: () => {
            if (token === this.tabSwitchToken && !this.tabSwitchStarted) {
              this.releaseSwitch(token, '页面暂时没有打开，请再试一次。');
            }
          }
        });
      }, 520);
    },

    onSwitch(event) {
      const index = Number(event.currentTarget.dataset.index);
      const item = this.data.items[index];
      if (!item || index === this.data.selected) return;
      if (this.tabLongPressIndex === index || this.tabLongPressTapIndex === index) {
        this.tabLongPressIndex = -1;
        this.tabLongPressTapIndex = -1;
        return;
      }
      if (this.tabSwitchPending) return;
      this.cancelProfileFirstHint();
      if (item.text !== '我的') {
        wx.switchTab({ url: item.pagePath });
        return;
      }
      this.showTabHint(index);
      this.startSwitch(item);
    }
  }
});
