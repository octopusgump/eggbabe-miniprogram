const {
  DEFAULT_DURATION,
  clampDuration,
  normalizeTier,
  createRewardRevealTimeline
} = require('../../utils/reward-reveal-timeline');

const TIER_COPY = {
  DAILY: { eyebrow: '今天的小发现', mark: '✦', collect: '收下这一刻' },
  SPECIAL: { eyebrow: '悄悄准备的惊喜', mark: '✷', collect: '轻轻收下' },
  RARE: { eyebrow: '少见的一刻', mark: '✧', collect: '收藏这一刻' },
  MEMORY: { eyebrow: '完整纪念', mark: '·', collect: '记住这一刻' }
};

function systemReducedMotion() {
  try {
    const setting = wx.getSystemSetting
      ? wx.getSystemSetting()
      : (wx.getSystemInfoSync ? wx.getSystemInfoSync() : {});
    return Boolean(setting.reducedMotion || setting.enableReduceMotion);
  } catch (error) {
    return false;
  }
}

Component({
  properties: {
    visible: { type: Boolean, value: false },
    tier: { type: String, value: 'DAILY' },
    title: { type: String, value: '' },
    memory: { type: String, value: '' },
    image: { type: String, value: '' },
    sceneImage: { type: String, value: '' },
    dateLabel: { type: String, value: '' },
    duration: { type: Number, value: DEFAULT_DURATION },
    soundEnabled: { type: Boolean, value: false },
    hapticEnabled: { type: Boolean, value: false }
  },

  data: {
    rendered: false,
    phase: 'idle',
    normalizedTier: 'DAILY',
    tierCopy: TIER_COPY.DAILY,
    resolvedDuration: DEFAULT_DURATION,
    reducedMotion: false
  },

  observers: {
    visible(value) {
      if (!this.componentReady) return;
      if (value) this.open();
      else this.close();
    },
    tier(value) {
      if (!this.componentReady || this.properties.visible) return;
      this.applyTier(value);
    }
  },

  lifetimes: {
    ready() {
      this.componentReady = true;
      this.applyTier(this.properties.tier);
      if (this.properties.visible) this.open();
    },
    detached() {
      this.componentReady = false;
      this.clearTimeline();
      clearTimeout(this.closeTimer);
    }
  },

  methods: {
    noop() {},

    applyTier(value) {
      const normalizedTier = normalizeTier(value);
      this.setData({ normalizedTier, tierCopy: TIER_COPY[normalizedTier] });
    },

    open() {
      this.clearTimeline();
      clearTimeout(this.closeTimer);
      const normalizedTier = normalizeTier(this.properties.tier);
      const resolvedDuration = clampDuration(this.properties.duration);
      const reducedMotion = systemReducedMotion();
      this.setData({
        rendered: true,
        phase: 'discover',
        normalizedTier,
        tierCopy: TIER_COPY[normalizedTier],
        resolvedDuration,
        reducedMotion
      }, () => {
        if (!this.componentReady || !this.properties.visible) return;
        this.timeline = createRewardRevealTimeline({
          duration: resolvedDuration,
          onPhase: (phase, timing) => {
            if (!this.componentReady || !this.properties.visible) return;
            this.setData({ phase });
            this.triggerEvent('phasechange', { phase, tier: normalizedTier, timing });
            if (phase === 'ready') this.triggerEvent('ready', { tier: normalizedTier, duration: resolvedDuration });
          }
        });
        this.timeline.start();
        this.triggerEvent('start', { tier: normalizedTier, duration: resolvedDuration });
      });
    },

    clearTimeline() {
      if (this.timeline) this.timeline.clear();
      this.timeline = null;
    },

    close() {
      this.clearTimeline();
      clearTimeout(this.closeTimer);
      if (!this.data.rendered) return;
      this.setData({ phase: 'exiting' });
      this.closeTimer = setTimeout(() => {
        if (!this.componentReady || this.properties.visible) return;
        this.setData({ rendered: false, phase: 'idle' });
        this.triggerEvent('closed', { tier: this.data.normalizedTier });
      }, this.data.reducedMotion ? 20 : 180);
    },

    onCollect() {
      if (!this.properties.visible || this.data.phase !== 'ready') return;
      this.triggerEvent('collect', {
        tier: this.data.normalizedTier,
        title: this.properties.title,
        source: 'local-fixture'
      });
    }
  }
});
