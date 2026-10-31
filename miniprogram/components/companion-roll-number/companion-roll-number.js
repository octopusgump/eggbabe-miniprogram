const { rollDurationMs, rollFrameValue } = require('../../utils/companion-star-roll');

Component({
  properties: {
    value: { type: Number, value: -1 },
    reducedMotion: { type: Boolean, value: false }
  },

  data: {
    shown: -1,
    rolling: false
  },

  observers: {
    'value, reducedMotion'(value) {
      this.onTargetValue(value);
    }
  },

  lifetimes: {
    detached() {
      this.clearRollTimer();
    }
  },

  methods: {
    clearRollTimer() {
      if (this._rollTimer) {
        clearTimeout(this._rollTimer);
        this._rollTimer = null;
      }
    },

    onTargetValue(value) {
      const target = Number(value);
      const prev = Number(this.data.shown);
      if (!Number.isFinite(target) || target < 0) {
        this.clearRollTimer();
        this.setData({ shown: -1, rolling: false });
        return;
      }
      if (prev < 0) {
        this.clearRollTimer();
        this.setData({ shown: target, rolling: false });
        return;
      }
      if (prev === target) return;
      this.startRoll(prev, target);
    },

    startRoll(from, to) {
      this.clearRollTimer();
      const reducedMotion = Boolean(this.properties.reducedMotion);
      const duration = rollDurationMs(from, to, reducedMotion);
      if (duration <= 0) {
        this.setData({ shown: to, rolling: false });
        this.triggerEvent('complete', { from, to });
        return;
      }
      const startedAt = Date.now();
      this.setData({ rolling: true });
      const tick = () => {
        const elapsed = Date.now() - startedAt;
        const progress = elapsed / duration;
        const frame = rollFrameValue(from, to, progress);
        if (progress >= 1) {
          this.setData({ shown: to, rolling: false });
          this.triggerEvent('complete', { from, to });
          return;
        }
        this.setData({ shown: frame });
        this._rollTimer = setTimeout(tick, 32);
      };
      tick();
    }
  }
});
