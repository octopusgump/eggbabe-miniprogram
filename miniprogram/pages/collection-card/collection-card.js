const petStore = require('../../utils/pet-store');
const config = require('../../config/v2');
const h5Bridge = require('../../services/birth-card-h5');
const analytics = require('../../services/analytics');

function dateLabel(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  return match ? `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日` : String(value || '');
}

function drawContainedImage(context, image, x, y, width, height) {
  const sourceWidth = Number(image.width || width);
  const sourceHeight = Number(image.height || height);
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(image.path, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

Page({
  data: {
    pet: null,
    cardView: null,
    hatchedAtLabel: '',
    isNew: false,
    savingImage: false,
    posterReady: false
  },

  onLoad(query) {
    const pet = petStore.getPet();
    if (!pet || !pet.collectionCard) {
      wx.showToast({ title: '还没有收藏卡', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    if (query.native !== '1' && h5Bridge.isValidH5BaseUrl(config.birthCardH5Url)) {
      wx.redirectTo({ url: '/pages/h5-card/h5-card' });
      return;
    }
    const cardView = h5Bridge.toH5Card(pet, config);
    if (!cardView || !cardView.card_id || !cardView.identity_code || !/^https:\/\//i.test(cardView.illustration_url)) {
      wx.showToast({ title: '收藏卡数据不完整，请稍后重试', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    this.setData({
      pet,
      cardView,
      hatchedAtLabel: dateLabel(cardView.hatched_at),
      isNew: query.new === '1'
    });
  },

  loadPosterAsset(source, errorCode) {
    if (!/^https:\/\//i.test(String(source || '')) || !wx.getImageInfo) return Promise.reject(new Error(errorCode));
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: source,
        success: image => image && image.path ? resolve(image) : reject(new Error(errorCode)),
        fail: () => reject(new Error(errorCode))
      });
    });
  },

  drawCardPoster(done) {
    const card = this.data.cardView;
    Promise.all([
      this.loadPosterAsset(card.illustration_url, 'ILLUSTRATION_REQUIRED'),
      this.loadPosterAsset(card.mini_program_code_url, 'MINI_CODE_REQUIRED')
    ]).then(([illustration, miniCode]) => {
    const context = wx.createCanvasContext('cardPosterCanvas', this);
    context.setFillStyle('#FFFDF7');
    context.fillRect(0, 0, 600, 1067);
    context.setTextAlign('center');
    context.setFillStyle('#3F5A47');
    context.setFontSize(18);
    context.fillText('eggbabe', 300, 54);
    context.setFillStyle('#2D352F');
    context.setFontSize(42);
    context.fillText(card.display_name, 300, 112, 480);
    context.setFillStyle('#F4F7EC');
    context.fillRect(100, 170, 400, 470);
    drawContainedImage(context, illustration, 100, 170, 400, 470);
    context.setFillStyle('#F3F5EC');
    context.fillRect(48, 690, 504, 258);
    context.setTextAlign('left');
    context.setFillStyle('#7B827B');
    context.setFontSize(18);
    const rows = [
      ['原型', card.prototype_name],
      ['实体款式', card.style],
      ['破壳日期', this.data.hatchedAtLabel],
      ['身份编号', card.identity_code],
      ['来源批次', card.source_batch || '—']
    ];
    rows.forEach((row, index) => {
      const y = 730 + index * 44;
      context.fillText(row[0], 78, y);
      context.setTextAlign('right');
      context.setFillStyle('#2D352F');
      context.fillText(row[1] || '—', 522, y, 330);
      context.setTextAlign('left');
      context.setFillStyle('#7B827B');
    });
    drawContainedImage(context, miniCode, 252, 950, 96, 96);
    context.setTextAlign('center');
    context.setFillStyle('#768076');
    context.setFontSize(17);
    context.fillText('这是一枚实体蛋的一份身份与纪念档案', 300, 1054);
    context.draw(false, () => {
      this.setData({ posterReady: true });
      if (done) done(null);
    });
    }).catch(error => {
      if (done) done(error);
    });
  },

  onSaveImage() {
    if (this.data.savingImage) return;
    this.setData({ savingImage: true });
    const exportPoster = () => wx.canvasToTempFilePath({
      canvasId: 'cardPosterCanvas',
      width: 600,
      height: 1067,
      destWidth: 1200,
      destHeight: 2134,
      success: ({ tempFilePath }) => wx.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => {
          analytics.track('card_save', { card_id: this.data.cardView.card_id });
          wx.showToast({ title: '收藏卡已保存', icon: 'success' });
        },
        fail: error => this.handleAlbumSaveFailure(error),
        complete: () => this.setData({ savingImage: false })
      }),
      fail: () => {
        this.setData({ savingImage: false });
        wx.showToast({ title: '收藏卡图片生成失败，请重试', icon: 'none' });
      }
    }, this);
    if (this.data.posterReady) exportPoster();
    else this.drawCardPoster(error => {
      if (!error) {
        exportPoster();
        return;
      }
      this.setData({ savingImage: false });
      wx.showToast({
        title: error.message === 'MINI_CODE_REQUIRED' ? '分享图缺少小程序码，请稍后重试' : '固定插画加载失败，请稍后重试',
        icon: 'none'
      });
    });
  },

  handleAlbumSaveFailure(error) {
    const denied = /auth deny|authorize no response|permission/i.test(String(error && error.errMsg || ''));
    if (!denied || !wx.openSetting) {
      wx.showToast({ title: denied ? '请允许保存到相册' : '保存图片失败，请重试', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '需要相册权限',
      content: '请在设置中允许保存到相册，然后再次点击保存图片。',
      confirmText: '去设置',
      success: result => {
        if (result.confirm) wx.openSetting();
      }
    });
  },

  onShareAppMessage() {
    analytics.track('card_share', { card_id: this.data.cardView.card_id });
    return { title: `${this.data.cardView.display_name}的 eggbabe 收藏卡`, path: '/pages/welcome/welcome' };
  }
});
