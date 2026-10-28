const SIZE_VALUES = ['S', 'M', 'L'];
const TONE_VALUES = ['light', 'dark'];

Component({
  properties: {
    size: {
      type: String,
      value: 'M',
      observer(next) {
        const normalized = String(next || 'M').toUpperCase();
        if (SIZE_VALUES.includes(normalized) && normalized !== this.data.sizeClass) {
          this.setData({ sizeClass: normalized });
        }
      }
    },
    tone: {
      type: String,
      value: 'light',
      observer(next) {
        const normalized = String(next || 'light').toLowerCase();
        if (TONE_VALUES.includes(normalized) && normalized !== this.data.toneClass) {
          this.setData({ toneClass: normalized });
        }
      }
    },
    reducedMotion: { type: Boolean, value: false },
    ariaHidden: { type: Boolean, value: true },
    label: { type: String, value: '加载中' }
  },

  data: {
    sizeClass: 'M',
    toneClass: 'light'
  },

  lifetimes: {
    attached() {
      const size = String(this.properties.size || 'M').toUpperCase();
      const tone = String(this.properties.tone || 'light').toLowerCase();
      this.setData({
        sizeClass: SIZE_VALUES.includes(size) ? size : 'M',
        toneClass: TONE_VALUES.includes(tone) ? tone : 'light'
      });
    }
  }
});

module.exports = { SIZE_VALUES, TONE_VALUES };
