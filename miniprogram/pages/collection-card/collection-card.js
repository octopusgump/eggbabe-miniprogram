const petStore = require('../../utils/pet-store');
const config = require('../../config/v2');
const h5Bridge = require('../../services/birth-card-h5');
const sceneConfig = require('../../utils/exhibition-scenes');

const ZODIAC_SYMBOLS = { 白羊座: '♈', 金牛座: '♉', 双子座: '♊', 巨蟹座: '♋', 狮子座: '♌', 处女座: '♍', 天秤座: '♎', 天蝎座: '♏', 射手座: '♐', 摩羯座: '♑', 水瓶座: '♒', 双鱼座: '♓' };

function birthdayLabel(value) {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(String(value || ''));
  return match ? `${Number(match[1])}月${Number(match[2])}日` : String(value || '');
}

function loadCanvasImage(src) {
  if (!src) return Promise.reject(new Error('IMAGE_REQUIRED'));
  return new Promise((resolve, reject) => wx.getImageInfo({ src, success: resolve, fail: reject }));
}

function drawContain(context, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const targetWidth = image.width * scale;
  const targetHeight = image.height * scale;
  context.drawImage(image.path, x + (width - targetWidth) / 2, y + (height - targetHeight) / 2, targetWidth, targetHeight);
}

function drawCover(context, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  context.drawImage(image.path, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
}

Page({
  data: { card: null, pet: null, illustration: '', birthdayLabel: '', zodiacSymbol: '', isNew: false, redirectingToH5: false, posterReady: false, posterUnavailableReason: '' },

  onLoad(query) {
    const pet = petStore.getPet();
    if (!pet || !pet.collectionCard) {
      wx.showToast({ title: '还没有收藏卡', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    if (query.native !== '1' && h5Bridge.isValidH5BaseUrl(config.birthCardH5Url)) {
      this.setData({ redirectingToH5: true });
      wx.redirectTo({ url: '/pages/h5-card/h5-card?view=card' });
      return;
    }
    const card = pet.collectionCard;
    const illustration = ((sceneConfig.getCardSetForCharacter(card.prototype) || {}).cards || []).find(item => item.heroAssetId === card.illustration_id);
    this.setData({ pet, card, illustration: illustration ? illustration.image : '', birthdayLabel: birthdayLabel(card.birthday), zodiacSymbol: ZODIAC_SYMBOLS[card.zodiac] || '', isNew: query.new === '1' });
  },

  onReady() {
    if (!this.data.redirectingToH5 && this.data.card) this.drawShareCard();
  },

  async drawShareCard() {
    const card = this.data.card;
    const miniProgramCodeUrl = card.mini_program_code_url || card.miniProgramCodeUrl || config.miniProgramCodeUrl;
    if (!miniProgramCodeUrl) {
      this.setData({ posterReady: false, posterUnavailableReason: '正式分享图需要先配置真实小程序码，当前不会生成占位码。' });
      return;
    }
    let illustrationImage;
    let miniProgramCodeImage;
    try {
      [illustrationImage, miniProgramCodeImage] = await Promise.all([
        loadCanvasImage(this.data.illustration),
        loadCanvasImage(miniProgramCodeUrl)
      ]);
    } catch (error) {
      this.setData({ posterReady: false, posterUnavailableReason: '分享图素材还未就绪，请检查插画与小程序码配置。' });
      return;
    }
    const context = wx.createCanvasContext('shareCanvas', this);
    context.setFillStyle('#FFFDF7'); context.fillRect(0, 0, 600, 1067);
    context.setTextAlign('center'); context.setFillStyle('#65705F'); context.setFontSize(12); context.fillText('eggbabe', 300, 30);
    context.setFillStyle('#EFC84B'); context.setFontSize(25); context.fillText('★', 70, 76); context.fillText('★', 530, 76);
    context.setFillStyle('#3C2D24'); context.setFontSize(42); context.fillText(card.name, 300, 88);
    context.setFillStyle('#EAF3F4'); context.fillRect(32, 112, 536, 670);
    drawCover(context, illustrationImage, 32, 112, 536, 670);
    const rows = [['人', 'MBTI', card.mbti], ['★', '星座', `${card.zodiac} ${this.data.zodiacSymbol}`], ['礼', '生日', this.data.birthdayLabel]];
    context.setStrokeStyle('#94AB61'); context.setLineWidth(2); context.strokeRect(38, 800, 524, 192);
    rows.forEach((row, index) => {
      const y = 832 + index * 64;
      if (index) { context.beginPath(); context.moveTo(38, 800 + index * 64); context.lineTo(562, 800 + index * 64); context.stroke(); }
      context.setTextAlign('left'); context.setFillStyle('#2D251F'); context.setFontSize(18); context.fillText(`${row[0]}  ${row[1]}`, 62, y);
      context.setTextAlign('right'); context.fillText(row[2], 538, y);
    });
    context.setTextAlign('left'); context.setFillStyle('#5D675F'); context.setFontSize(15); context.fillText(card.serial, 38, 1030);
    drawContain(context, miniProgramCodeImage, 504, 998, 58, 58);
    context.draw(false, () => this.setData({ posterReady: true, posterUnavailableReason: '' }));
  },

  onAlbum() { wx.navigateTo({ url: '/pages/album/album' }); },
  onProfile() { wx.navigateTo({ url: '/pages/pet-detail/pet-detail' }); },

  onSave() {
    if (!this.data.posterReady) {
      wx.showToast({ title: this.data.posterUnavailableReason || '分享图还未就绪', icon: 'none' });
      return;
    }
    wx.canvasToTempFilePath({
      canvasId: 'shareCanvas',
      width: 600,
      height: 1067,
      destWidth: 1200,
      destHeight: 2134,
      success: ({ tempFilePath }) => {
        wx.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: () => wx.showToast({ title: '收藏卡已保存', icon: 'success' }),
          fail: () => wx.showToast({ title: '请允许保存到相册', icon: 'none' })
        });
      },
      fail: () => wx.showToast({ title: '分享图生成失败，请重试', icon: 'none' })
    }, this);
  },

  onShareAppMessage() {
    return { title: `我孵化了${this.data.card.name}，编号 ${this.data.card.serial}`, path: '/pages/welcome/welcome' };
  }
});
