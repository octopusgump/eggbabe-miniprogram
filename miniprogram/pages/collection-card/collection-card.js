const petStore = require('../../utils/pet-store');
const config = require('../../config/v2');
const h5Bridge = require('../../services/birth-card-h5');
const sceneConfig = require('../../utils/life-scenes');
const sceneCardStore = require('../../services/scene-card-store');

const ZODIAC_SYMBOLS = { 白羊座: '♈', 金牛座: '♉', 双子座: '♊', 巨蟹座: '♋', 狮子座: '♌', 处女座: '♍', 天秤座: '♎', 天蝎座: '♏', 射手座: '♐', 摩羯座: '♑', 水瓶座: '♒', 双鱼座: '♓' };

function birthdayLabel(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  return match ? `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日` : String(value || '');
}

function genderLabel(value) {
  if (value === 'FEMALE') return '♀';
  if (value === 'MALE') return '♂';
  return value || '—';
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

function wrapCanvasText(context, value, maxWidth, fallbackCharWidth) {
  const lines = [];
  let line = '';
  Array.from(String(value || '')).forEach(character => {
    const candidate = line + character;
    const measured = context.measureText ? context.measureText(candidate).width : candidate.length * fallbackCharWidth;
    if (line && measured > maxWidth) {
      lines.push(line);
      line = character;
    } else line = candidate;
  });
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function fitCanvasText(context, value, maxWidth, maxHeight, initialSize) {
  let fontSize = initialSize;
  let lineHeight = fontSize + 5;
  let lines = [];
  do {
    context.setFontSize(fontSize);
    lineHeight = fontSize + 5;
    lines = wrapCanvasText(context, value, maxWidth, fontSize);
    if (lines.length * lineHeight <= maxHeight || fontSize <= 8) break;
    fontSize -= 1;
  } while (fontSize >= 8);
  return { fontSize, lineHeight, lines };
}

function signatureClass(value) {
  const length = Array.from(String(value || '')).length;
  if (length > 60) return 'card-signature--dense';
  if (length > 32) return 'card-signature--compact';
  return '';
}

Page({
  data: { card: null, cardView: null, sceneCard: null, isCollectible: false, pet: null, illustration: '', birthdayLabel: '', genderLabel: '', zodiacSymbol: '', signatureClass: '', isNew: false, redirectingToH5: false, posterReady: false, posterUnavailableReason: '' },

  onLoad(query) {
    const pet = petStore.getPet();
    if (!pet || !pet.collectionCard) {
      wx.showToast({ title: '还没有收藏卡', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const sceneCardId = String(query.sceneCardId || '');
    const sceneCard = sceneCardId ? sceneCardStore.list().find(item => item.id === sceneCardId) : null;
    if (sceneCardId && !sceneCard) {
      wx.showToast({ title: '没有找到这张收藏卡', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    if (query.native !== '1' && h5Bridge.isValidH5BaseUrl(config.birthCardH5Url)) {
      this.setData({ redirectingToH5: true });
      wx.redirectTo({ url: sceneCard ? `/pages/h5-card/h5-card?sceneCardId=${encodeURIComponent(sceneCard.id)}&view=card` : '/pages/h5-card/h5-card?view=card' });
      return;
    }
    const card = pet.collectionCard;
    const cardView = sceneCard ? h5Bridge.toH5CollectibleCard(pet, sceneCard, config) : h5Bridge.toH5Card(pet, config);
    const definitions = ((sceneConfig.getCardSetForCharacter(card.prototype) || {}).cards || []);
    const illustration = sceneCard
      ? definitions.find(item => item.cardId === (sceneCard.cardId || sceneCard.card_key || sceneCard.cardDefinitionId))
      : definitions.find(item => item.heroAssetId === card.illustration_id);
    this.setData({
      pet,
      card,
      cardView,
      sceneCard,
      isCollectible: !!sceneCard,
      illustration: (sceneCard && sceneCard.image) || (illustration ? illustration.image : ''),
      birthdayLabel: birthdayLabel(cardView.birthday),
      genderLabel: genderLabel(cardView.gender),
      zodiacSymbol: ZODIAC_SYMBOLS[cardView.constellation] || '',
      signatureClass: signatureClass(cardView.signature),
      isNew: query.new === '1'
    });
  },

  onReady() {
    if (!this.data.redirectingToH5 && this.data.card) this.drawShareCard();
  },

  async drawShareCard() {
    const card = this.data.card;
    const miniProgramCodeUrl = card.mini_program_code_url || card.miniProgramCodeUrl || config.miniProgramCodeUrl;
    const shareCode = this.data.cardView && this.data.cardView.share_code;
    if (!miniProgramCodeUrl) {
      this.setData({ posterReady: false, posterUnavailableReason: '正式分享图需要先配置真实小程序码，当前不会生成占位码。' });
      return;
    }
    if (!shareCode) {
      this.setData({ posterReady: false, posterUnavailableReason: '分享图需要先准备一个未使用的个人激活码。' });
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
    drawCover(context, illustrationImage, 40, 22, 64, 76);
    context.setTextAlign('center'); context.setFillStyle('#3C2D24'); context.setFontSize(38); context.fillText(card.name, 300, 64);
    context.setFillStyle('#EAF3F4'); context.fillRect(32, 112, 536, 670);
    drawCover(context, illustrationImage, 32, 112, 536, 670);
    const cells = [
      ['类型', this.data.cardView.prototype_name], ['生日', this.data.birthdayLabel],
      ['星座', `${card.zodiac} ${this.data.zodiacSymbol}`], ['性别', this.data.genderLabel],
      ['血型', `${card.bloodType} 型`], ['MBTI', card.mbti]
    ];
    const cellWidth = 263;
    cells.forEach((cell, index) => {
      const x = 32 + (index % 2) * 273;
      const y = 794 + Math.floor(index / 2) * 47;
      context.setFillStyle('#F6F6F0'); context.fillRect(x, y, cellWidth, 40);
      context.setTextAlign('left'); context.setFillStyle('#77756E'); context.setFontSize(16); context.fillText(cell[0], x + 12, y + 26);
      context.setTextAlign('right'); context.setFillStyle('#2D251F'); context.setFontSize(17); context.fillText(cell[1], x + cellWidth - 12, y + 26, cellWidth - 78);
    });
    context.setFillStyle('#536057'); context.setTextAlign('center');
    const fittedSignature = fitCanvasText(context, `“${this.data.cardView.signature}”`, 500, 54, 15);
    const signatureTop = 946 + (54 - fittedSignature.lines.length * fittedSignature.lineHeight) / 2 + fittedSignature.fontSize;
    fittedSignature.lines.forEach((line, index) => context.fillText(line, 300, signatureTop + index * fittedSignature.lineHeight));
    context.setTextAlign('left'); context.setFillStyle('#5D675F'); context.setFontSize(13); context.fillText(card.serial, 38, 1015); context.setFillStyle('#3F5A47'); context.fillText(`分享码 ${shareCode}`, 38, 1040);
    drawContain(context, miniProgramCodeImage, 504, 998, 58, 58);
    context.draw(false, () => this.setData({ posterReady: true, posterUnavailableReason: '' }));
  },

  onAlbum() {
    if (this.data.isCollectible) {
      wx.navigateBack();
      return;
    }
    wx.navigateTo({ url: '/pages/album/album' });
  },
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
    const sceneCard = this.data.sceneCard;
    return {
      title: sceneCard ? `我遇见了「${sceneCard.name}」收藏卡` : `我孵化了${this.data.card.name}，编号 ${this.data.card.serial}`,
      path: '/pages/welcome/welcome'
    };
  }
});
