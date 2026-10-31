const INTRO_DURATION_MS = 9000;
const CONTENT_REVEAL_DELAY_MS = 90;
const COLLAPSE_WIDTH_DELAY_MS = 160;

function appGlobalData() {
  try {
    const app = typeof getApp === 'function' ? getApp() : null;
    return app && app.globalData ? app.globalData : null;
  } catch (error) {
    return null;
  }
}

function isPostHatchLayout(layout) {
  return layout === 'post-hatch';
}

Component({
  properties: {
    layout: { type: String, value: 'default' },
    petName: { type: String, value: '还没有名字' },
    mood: { type: Object, value: null },
    starBalance: { type: Number, value: -1 },
    starRollValue: { type: Number, value: -1 },
    starGainLabel: { type: String, value: '' },
    companionDays: { type: Number, value: 0 },
    starClaimed: { type: Boolean, value: false },
    starProgressText: { type: String, value: '' },
    starAwardVisible: { type: Boolean, value: false },
    introReady: { type: Boolean, value: false },
    overlayLocked: { type: Boolean, value: false },
    reducedMotion: { type: Boolean, value: false },
    nameInteractive: { type: Boolean, value: false },
    todayCompanionEntry: { type: Boolean, value: false }
  },

  data: {
    expanded: false,
    contentVisible: false
  },

  observers: {
    introReady(ready) {
      if (!this.componentAttached || isPostHatchLayout(this.properties.layout)) return;
      if (ready) this.startSessionIntroIfNeeded();
      else this.collapse();
    },
    overlayLocked(locked) {
      if (!this.componentAttached || !isPostHatchLayout(this.properties.layout)) return;
      if (locked) this.collapse(true);
    }
  },

  lifetimes: {
    attached() {
      this.componentAttached = true;
      if (isPostHatchLayout(this.properties.layout)) return;
      if (this.properties.introReady) this.startSessionIntroIfNeeded();
    },
    detached() {
      this.componentAttached = false;
      this.clearAutoCollapseTimer();
      this.clearTransitionTimers();
    }
  },

  pageLifetimes: {
    show() {
      if (isPostHatchLayout(this.properties.layout)) return;
      if (this.properties.introReady) this.startSessionIntroIfNeeded();
    },
    hide() {
      this.collapse(true);
    }
  },

  methods: {
    clearAutoCollapseTimer() {
      clearTimeout(this.autoCollapseTimer);
      this.autoCollapseTimer = null;
    },

    clearTransitionTimers() {
      clearTimeout(this.contentRevealTimer);
      clearTimeout(this.widthCollapseTimer);
      this.contentRevealTimer = null;
      this.widthCollapseTimer = null;
      this.collapsePending = false;
    },

    startSessionIntroIfNeeded() {
      if (isPostHatchLayout(this.properties.layout)) return;
      if (!this.properties.mood || !this.properties.introReady) return;
      const globalData = appGlobalData();
      if (globalData && globalData.dailyMoodIntroShown) {
        if (this.data.expanded) this.collapse();
        return;
      }
      if (globalData) globalData.dailyMoodIntroShown = true;
      if (this.sessionIntroStarted) return;
      this.sessionIntroStarted = true;
      this.reveal();
    },

    reveal() {
      if (!this.properties.mood) return;
      this.clearAutoCollapseTimer();
      this.clearTransitionTimers();
      this.setData({ expanded: true, contentVisible: Boolean(this.properties.reducedMotion) });
      if (!this.properties.reducedMotion) {
        this.contentRevealTimer = setTimeout(() => {
          this.contentRevealTimer = null;
          if (this.componentAttached && this.data.expanded) this.setData({ contentVisible: true });
        }, CONTENT_REVEAL_DELAY_MS);
      }
      if (isPostHatchLayout(this.properties.layout)) return;
      this.autoCollapseTimer = setTimeout(() => {
        this.autoCollapseTimer = null;
        if (this.componentAttached) this.collapse();
      }, INTRO_DURATION_MS);
    },

    collapse(immediate = false) {
      this.clearAutoCollapseTimer();
      this.clearTransitionTimers();
      if (!this.data.expanded && !this.data.contentVisible) return;
      if (immediate || this.properties.reducedMotion) {
        this.setData({ expanded: false, contentVisible: false });
        return;
      }
      this.collapsePending = true;
      this.setData({ contentVisible: false });
      this.widthCollapseTimer = setTimeout(() => {
        this.widthCollapseTimer = null;
        this.collapsePending = false;
        if (this.componentAttached) this.setData({ expanded: false });
      }, COLLAPSE_WIDTH_DELAY_MS);
    },

    onToggle() {
      if (this.properties.todayCompanionEntry) {
        this.triggerEvent('todaycompaniontap');
        return;
      }
      if (this.data.expanded && !this.collapsePending) this.collapse();
      else this.reveal();
    },

    onNameTap() {
      if (!this.properties.nameInteractive) return;
      this.triggerEvent('nametap');
    }
  }
});

module.exports = { INTRO_DURATION_MS, CONTENT_REVEAL_DELAY_MS, COLLAPSE_WIDTH_DELAY_MS };
