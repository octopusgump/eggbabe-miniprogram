const preHatchAssets = require('../../config/pre-hatch-assets').PRE_HATCH;

const dayAssets = preHatchAssets.rotationSample.warmDayV2;
const nightAssets = preHatchAssets.rotationSample.clearNightV2;
const DAY_ORIENTATIONS = [
  { key: 'left45', label: '左 45°', image: dayAssets.egg.left45 },
  { key: 'front', label: '正面', image: dayAssets.egg.front },
  { key: 'right45', label: '右 45°', image: dayAssets.egg.right45 }
];
const NIGHT_ORIENTATIONS = [
  { key: 'right45', label: '右 45° · 夜晚', image: nightAssets.egg.right45 }
];
const LIGHTING_MODES = {
  day: {
    background: preHatchAssets.fullScenes.spring.clearDay,
    nest: dayAssets.nestPad,
    eggShadow: '',
    orientations: DAY_ORIENTATIONS,
    tag: '暖日间',
    canRotate: true
  },
  night: {
    background: nightAssets.background,
    nest: nightAssets.nestPad,
    eggShadow: nightAssets.egg.contactShadow,
    orientations: NIGHT_ORIENTATIONS,
    tag: '春季晴夜',
    canRotate: false
  }
};

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject
    });
  });
}

Page({
  data: {
    lightingMode: 'day',
    lightingTag: LIGHTING_MODES.day.tag,
    backgroundImage: LIGHTING_MODES.day.background,
    previousBackground: '',
    nestImage: LIGHTING_MODES.day.nest,
    eggShadowImage: LIGHTING_MODES.day.eggShadow,
    currentIndex: 2,
    currentImage: DAY_ORIENTATIONS[2].image,
    currentLabel: DAY_ORIENTATIONS[2].label,
    canRotate: true,
    previousImage: '',
    transitionDirection: '',
    rotating: false,
    switchingMode: false,
    loading: true,
    error: ''
  },

  onLoad() {
    this.dayIndex = 2;
    this.preloadSample();
  },

  onUnload() {
    if (this.rotationTimer) clearTimeout(this.rotationTimer);
    if (this.modeTimer) clearTimeout(this.modeTimer);
    this.rotationTimer = null;
    this.modeTimer = null;
  },

  preloadSample() {
    const sources = Array.from(new Set([
      LIGHTING_MODES.day.background,
      LIGHTING_MODES.night.background,
      LIGHTING_MODES.day.nest,
      LIGHTING_MODES.night.nest,
      LIGHTING_MODES.night.eggShadow,
      ...DAY_ORIENTATIONS.map(item => item.image),
      ...NIGHT_ORIENTATIONS.map(item => item.image)
    ].filter(Boolean)));
    this.setData({ loading: true, error: '' });
    Promise.all(sources.map(preloadImage)).then(() => {
      this.setData({ loading: false, error: '' });
    }).catch(() => {
      this.setData({
        loading: false,
        error: '小样图片没有完整加载，请重新试一次。'
      });
    });
  },

  rotateBy(step) {
    if (this.data.loading || this.data.error || this.data.rotating || this.data.switchingMode) return;
    if (!this.data.canRotate) {
      try {
        if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
      } catch (error) {}
      return;
    }
    const nextIndex = Math.max(0, Math.min(DAY_ORIENTATIONS.length - 1, this.data.currentIndex + step));
    if (nextIndex === this.data.currentIndex) {
      try {
        if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
      } catch (error) {}
      return;
    }
    const next = DAY_ORIENTATIONS[nextIndex];
    this.dayIndex = nextIndex;
    if (this.rotationTimer) clearTimeout(this.rotationTimer);
    this.setData({
      previousImage: this.data.currentImage,
      currentIndex: nextIndex,
      currentImage: next.image,
      currentLabel: next.label,
      transitionDirection: step < 0 ? 'left' : 'right',
      rotating: true
    });
    this.rotationTimer = setTimeout(() => {
      this.rotationTimer = null;
      this.setData({ previousImage: '', transitionDirection: '', rotating: false });
    }, 240);
  },

  switchLightingMode(event) {
    const nextMode = event.currentTarget.dataset.mode;
    if (!LIGHTING_MODES[nextMode]
      || nextMode === this.data.lightingMode
      || this.data.loading
      || this.data.error
      || this.data.rotating
      || this.data.switchingMode) return;

    const next = LIGHTING_MODES[nextMode];
    const nextIndex = nextMode === 'day' ? this.dayIndex : 0;
    const nextOrientation = next.orientations[nextIndex];
    if (this.modeTimer) clearTimeout(this.modeTimer);
    this.setData({
      lightingMode: nextMode,
      lightingTag: next.tag,
      previousBackground: this.data.backgroundImage,
      backgroundImage: next.background,
      nestImage: next.nest,
      eggShadowImage: next.eggShadow,
      previousImage: this.data.currentImage,
      currentIndex: nextIndex,
      currentImage: nextOrientation.image,
      currentLabel: nextOrientation.label,
      canRotate: next.canRotate,
      transitionDirection: 'mode',
      rotating: true,
      switchingMode: true
    });
    this.modeTimer = setTimeout(() => {
      this.modeTimer = null;
      this.setData({
        previousBackground: '',
        previousImage: '',
        transitionDirection: '',
        rotating: false,
        switchingMode: false
      });
    }, 360);
  },

  onRotateLeft() {
    this.rotateBy(-1);
  },

  onRotateRight() {
    this.rotateBy(1);
  },

  onRetry() {
    this.preloadSample();
  },

  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
