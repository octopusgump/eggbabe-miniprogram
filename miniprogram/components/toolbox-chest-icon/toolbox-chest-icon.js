const chestAnim = require('../../utils/chest-anim');

Component({
  properties: {
    menuOpen: { type: Boolean, value: false },
    reducedMotion: { type: Boolean, value: false }
  },

  data: {
    frameSrcs: chestAnim.CHEST_FRAME_SRCS,
    activeFrame: 0,
    scaleClass: '',
    animating: false
  },

  lifetimes: {
    detached() {
      this.cancelChestSequence();
    }
  },

  observers: {
    menuOpen(nextOpen, prevOpen) {
      if (prevOpen === undefined) {
        this.setData({ activeFrame: nextOpen ? 3 : 0 });
        return;
      }
      if (nextOpen === prevOpen) return;
      this.playForMenuOpen(Boolean(nextOpen));
    }
  },

  methods: {
    cancelChestSequence() {
      if (this._chestRunner && this._chestRunner.cancel) this._chestRunner.cancel();
      this._chestRunner = null;
      if (this._scaleResetTimer) {
        clearTimeout(this._scaleResetTimer);
        this._scaleResetTimer = null;
      }
    },

    setAnimating(animating) {
      if (this.data.animating === animating) return;
      this.setData({ animating });
      this.triggerEvent('animatingchange', { animating });
    },

    applyTerminalFrame(open) {
      this.cancelChestSequence();
      this.setData({ activeFrame: open ? 3 : 0, scaleClass: '' });
      this.setAnimating(false);
    },

    playForMenuOpen(open) {
      if (this.data.animating) return;
      const direction = open ? 'open' : 'close';
      const duration = open ? chestAnim.OPEN_DURATION_MS : chestAnim.CLOSE_DURATION_MS;
      const scaleClass = open ? 'toolbox-chest--pop-open' : 'toolbox-chest--pop-close';

      if (this.properties.reducedMotion) {
        this.applyTerminalFrame(open);
        return;
      }

      this.cancelChestSequence();
      this.setData({ scaleClass });
      this.setAnimating(true);

      this._chestRunner = chestAnim.runChestFrameSequence({
        direction,
        reducedMotion: false,
        onFrame: frameIndex => {
          if (this.data.activeFrame !== frameIndex) this.setData({ activeFrame: frameIndex });
        },
        onComplete: () => {
          this._chestRunner = null;
          this.setAnimating(false);
          this._scaleResetTimer = setTimeout(() => {
            this._scaleResetTimer = null;
            this.setData({ scaleClass: '' });
          }, duration);
        }
      });
    }
  }
});
