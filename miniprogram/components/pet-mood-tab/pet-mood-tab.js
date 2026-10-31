const INTRO_DURATION_MS = 9000;
const CONTENT_REVEAL_DELAY_MS = 90;
const COLLAPSE_WIDTH_DELAY_MS = 160;
const POST_HATCH_SUMMARY_HOLD_MS = 7000;
const POST_HATCH_EXPANDED_HOLD_MS = 7000;
const POST_HATCH_COLLAPSE_MS = 460;

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
    summaryHoldReady: { type: Boolean, value: false },
    overlayLocked: { type: Boolean, value: false },
    reducedMotion: { type: Boolean, value: false },
    nameInteractive: { type: Boolean, value: false },
    todayCompanionEntry: { type: Boolean, value: false }
  },

  data: {
    expanded: false,
    contentVisible: false,
    roomCardPhase: 'minimal'
  },

  observers: {
    introReady(ready) {
      if (!this.componentAttached || isPostHatchLayout(this.properties.layout)) return;
      if (ready) this.startSessionIntroIfNeeded();
      else this.collapse();
    },
    summaryHoldReady(ready) {
      if (!this.componentAttached || !isPostHatchLayout(this.properties.layout)) return;
      if (ready && !this.properties.overlayLocked) this.startPostHatchSummaryHold();
    },
    overlayLocked(locked) {
      if (!this.componentAttached || !isPostHatchLayout(this.properties.layout)) return;
      if (locked) this.collapsePostHatchToMinimal(true);
    }
  },

  lifetimes: {
    attached() {
      this.componentAttached = true;
      if (isPostHatchLayout(this.properties.layout)) {
        if (this.properties.summaryHoldReady && !this.properties.overlayLocked) this.startPostHatchSummaryHold();
        return;
      }
      if (this.properties.introReady) this.startSessionIntroIfNeeded();
    },
    detached() {
      this.componentAttached = false;
      this.clearAutoCollapseTimer();
      this.clearPostHatchTimers();
      this.clearTransitionTimers();
    }
  },

  pageLifetimes: {
    show() {
      if (isPostHatchLayout(this.properties.layout)) {
        if (this.properties.summaryHoldReady && !this.properties.overlayLocked) this.startPostHatchSummaryHold();
        return;
      }
      if (this.properties.introReady) this.startSessionIntroIfNeeded();
    },
    hide() {
      if (isPostHatchLayout(this.properties.layout)) {
        this.collapsePostHatchToMinimal(true);
        return;
      }
      this.collapse(true);
    }
  },

  methods: {
    clearAutoCollapseTimer() {
      clearTimeout(this.autoCollapseTimer);
      this.autoCollapseTimer = null;
    },

    clearPostHatchTimers() {
      clearTimeout(this.postHatchSummaryTimer);
      clearTimeout(this.postHatchExpandedTimer);
      this.postHatchSummaryTimer = null;
      this.postHatchExpandedTimer = null;
    },

    clearTransitionTimers() {
      clearTimeout(this.contentRevealTimer);
      clearTimeout(this.widthCollapseTimer);
      this.contentRevealTimer = null;
      this.widthCollapseTimer = null;
      this.collapsePending = false;
    },

    startPostHatchSummaryHold() {
      if (!this.properties.mood || this.properties.overlayLocked) return;
      this.clearPostHatchTimers();
      this.clearTransitionTimers();
      this.collapsePending = false;
      this.setData({
        roomCardPhase: 'summary',
        expanded: false,
        contentVisible: false
      });
      this.postHatchSummaryTimer = setTimeout(() => {
        this.postHatchSummaryTimer = null;
        if (!this.componentAttached || this.properties.overlayLocked) return;
        if (this.data.roomCardPhase !== 'summary') return;
        this.collapsePostHatchToMinimal(false);
      }, POST_HATCH_SUMMARY_HOLD_MS);
    },

    collapsePostHatchToMinimal(immediate = false) {
      this.clearPostHatchTimers();
      this.clearTransitionTimers();
      this.collapsePending = false;
      if (immediate || this.properties.reducedMotion) {
        this.setData({
          roomCardPhase: 'minimal',
          expanded: false,
          contentVisible: false
        });
        return;
      }
      if (this.data.roomCardPhase === 'expanded') {
        this.collapsePending = true;
        this.setData({ contentVisible: false });
        this.widthCollapseTimer = setTimeout(() => {
          this.widthCollapseTimer = null;
          this.collapsePending = false;
          if (this.componentAttached) {
            this.setData({ roomCardPhase: 'minimal', expanded: false });
          }
        }, POST_HATCH_COLLAPSE_MS);
        return;
      }
      this.setData({
        roomCardPhase: 'minimal',
        expanded: false,
        contentVisible: false
      });
    },

    expandPostHatchCard() {
      if (!this.properties.mood || this.properties.overlayLocked) return;
      this.clearPostHatchTimers();
      this.clearTransitionTimers();
      this.collapsePending = false;
      this.setData({
        roomCardPhase: 'expanded',
        expanded: true,
        contentVisible: Boolean(this.properties.reducedMotion)
      });
      if (!this.properties.reducedMotion) {
        this.contentRevealTimer = setTimeout(() => {
          this.contentRevealTimer = null;
          if (this.componentAttached && this.data.roomCardPhase === 'expanded') {
            this.setData({ contentVisible: true });
          }
        }, CONTENT_REVEAL_DELAY_MS);
      }
      this.postHatchExpandedTimer = setTimeout(() => {
        this.postHatchExpandedTimer = null;
        if (!this.componentAttached || this.properties.overlayLocked) return;
        if (this.data.roomCardPhase !== 'expanded') return;
        this.collapsePostHatchToMinimal(false);
      }, POST_HATCH_EXPANDED_HOLD_MS);
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
      if (isPostHatchLayout(this.properties.layout)) {
        this.expandPostHatchCard();
        return;
      }
      this.clearAutoCollapseTimer();
      this.clearTransitionTimers();
      this.setData({ expanded: true, contentVisible: Boolean(this.properties.reducedMotion) });
      if (!this.properties.reducedMotion) {
        this.contentRevealTimer = setTimeout(() => {
          this.contentRevealTimer = null;
          if (this.componentAttached && this.data.expanded) this.setData({ contentVisible: true });
        }, CONTENT_REVEAL_DELAY_MS);
      }
      this.autoCollapseTimer = setTimeout(() => {
        this.autoCollapseTimer = null;
        if (this.componentAttached) this.collapse();
      }, INTRO_DURATION_MS);
    },

    collapse(immediate = false) {
      if (isPostHatchLayout(this.properties.layout)) {
        this.collapsePostHatchToMinimal(immediate);
        return;
      }
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
      if (isPostHatchLayout(this.properties.layout)) {
        if (this.data.roomCardPhase === 'expanded' && !this.collapsePending) {
          this.collapsePostHatchToMinimal(false);
        } else if (this.data.roomCardPhase === 'minimal' || this.data.roomCardPhase === 'summary') {
          this.expandPostHatchCard();
        }
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

module.exports = {
  INTRO_DURATION_MS,
  CONTENT_REVEAL_DELAY_MS,
  COLLAPSE_WIDTH_DELAY_MS,
  POST_HATCH_SUMMARY_HOLD_MS,
  POST_HATCH_EXPANDED_HOLD_MS,
  POST_HATCH_COLLAPSE_MS
};
