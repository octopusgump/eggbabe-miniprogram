const petStore = require('../../utils/pet-store');
const config = require('../../config/v2');
const h5Bridge = require('../../services/birth-card-h5');
const sceneConfig = require('../../utils/life-scenes');
const sceneCardStore = require('../../services/scene-card-store');
const analytics = require('../../services/analytics');

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

function drawCover(context, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  context.drawImage(image.path, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
}

function fillEllipse(context, x, y, radiusX, radiusY, color) {
  context.save();
  context.beginPath();
  context.translate(x, y);
  context.scale(radiusX, radiusY);
  context.arc(0, 0, 1, 0, Math.PI * 2);
  context.setFillStyle(color);
  context.fill();
  context.restore();
}

function drawPetAvatar(context, prototype, x, y, width, height) {
  fillEllipse(context, x + width / 2, y + height / 2, width / 2, height / 2, '#F4F7EC');
  if (prototype === '锦鲤') {
    fillEllipse(context, x + width * .73, y + height * .53, width * .24, height * .25, '#F4B9AE');
    fillEllipse(context, x + width * .48, y + height * .5, width * .34, height * .27, '#FFF9E4');
    fillEllipse(context, x + width * .5, y + height * .32, width * .12, height * .11, '#E77E72');
    fillEllipse(context, x + width * .62, y + height * .62, width * .1, height * .09, '#E77E72');
    fillEllipse(context, x + width * .32, y + height * .43, width * .025, height * .03, '#002900');
    fillEllipse(context, x + width * .5, y + height * .76, width * .14, height * .08, '#EDE78E');
    return;
  }
  fillEllipse(context, x + width * .36, y + height * .3, width * .12, height * .28, '#FFF9E4');
  fillEllipse(context, x + width * .64, y + height * .3, width * .12, height * .28, '#FFF9E4');
  fillEllipse(context, x + width * .36, y + height * .29, width * .045, height * .18, '#F4B9AE');
  fillEllipse(context, x + width * .64, y + height * .29, width * .045, height * .18, '#F4B9AE');
  fillEllipse(context, x + width * .5, y + height * .58, width * .34, height * .32, '#FFF9E4');
  fillEllipse(context, x + width * .4, y + height * .54, width * .025, height * .035, '#002900');
  fillEllipse(context, x + width * .6, y + height * .54, width * .025, height * .035, '#002900');
  fillEllipse(context, x + width * .5, y + height * .63, width * .035, height * .025, '#D8908B');
  fillEllipse(context, x + width * .34, y + height * .65, width * .06, height * .025, 'rgba(244,185,174,.45)');
  fillEllipse(context, x + width * .66, y + height * .65, width * .06, height * .025, 'rgba(244,185,174,.45)');
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

function fitCanvasText(context, value, maxWidth, maxHeight) {
  let fontSize = 18;
  let lineHeight = 24;
  let lines = [];
  do {
    context.setFontSize(fontSize);
    lineHeight = Math.round(fontSize * 1.35);
    lines = wrapCanvasText(context, value, maxWidth, fontSize);
    if (lines.length * lineHeight <= maxHeight || fontSize <= 13) break;
    fontSize -= 1;
  } while (fontSize >= 13);
  return { fontSize, lineHeight, lines };
}

function signatureClass(value) {
  const length = Array.from(String(value || '')).length;
  if (length > 60) return 'card-signature--dense';
  if (length > 32) return 'card-signature--compact';
  return '';
}

Page({
  data: { card: null, cardView: null, sceneCard: null, isCollectible: false, pet: null, illustration: '', birthdayLabel: '', genderLabel: '', zodiacSymbol: '', signatureClass: '', isNew: false, posterReady: false, savingImage: false, posterError: '' },

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
      wx.redirectTo({ url: sceneCard ? `/pages/h5-card/h5-card?sceneCardId=${encodeURIComponent(sceneCard.id)}` : '/pages/h5-card/h5-card' });
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

  drawCardPoster(done) {
    loadCanvasImage(this.data.illustration).then(illustrationImage => {
      const context = wx.createCanvasContext('cardPosterCanvas', this);
      const cardView = this.data.cardView;
      const sceneCard = this.data.sceneCard;
      context.setFillStyle('#FFFDF7');
      context.fillRect(0, 0, 600, 1067);
      drawPetAvatar(context, cardView.prototype_name, 40, 20, 64, 76);
      context.setTextAlign('center');
      context.setFillStyle('#3C2D24');
      context.setFontSize(38);
      context.fillText(cardView.name, 300, 58, 330);
      context.setFillStyle('#667168');
      context.setFontSize(14);
      context.fillText(`${sceneCard.setName} · ${sceneCard.name}`, 300, 88, 360);
      context.setFillStyle('#F0F2E8');
      context.fillRect(500, 33, 72, 38);
      context.setFillStyle('#65705F');
      context.setFontSize(15);
      context.fillText(sceneCard.collectorLabel, 536, 58, 66);
      context.setFillStyle('#F3F1E8');
      context.fillRect(52, 112, 496, 620);
      drawCover(context, illustrationImage, 52, 112, 496, 620);
      const cells = [
        ['类型', cardView.prototype_name], ['生日', this.data.birthdayLabel],
        ['星座', `${cardView.constellation} ${this.data.zodiacSymbol}`], ['性别', this.data.genderLabel],
        ['血型', `${cardView.blood_type} 型`], ['MBTI', cardView.mbti]
      ];
      const cellWidth = 263;
      cells.forEach((cell, index) => {
        const x = 32 + (index % 2) * 273;
        const y = 758 + Math.floor(index / 2) * 54;
        context.setFillStyle('#F6F6F0');
        context.fillRect(x, y, cellWidth, 46);
        context.setTextAlign('left');
        context.setFillStyle('#7A807A');
        context.setFontSize(17);
        context.fillText(cell[0], x + 12, y + 30);
        context.setTextAlign('right');
        context.setFillStyle('#2D251F');
        context.setFontSize(18);
        context.fillText(cell[1], x + cellWidth - 12, y + 30, cellWidth - 88);
      });
      context.setFillStyle('#536057');
      context.setTextAlign('center');
      const signature = fitCanvasText(context, `“${cardView.signature}”`, 520, 90);
      const signatureTop = 932 + (90 - signature.lines.length * signature.lineHeight) / 2 + signature.fontSize;
      signature.lines.forEach((line, index) => context.fillText(line, 300, signatureTop + index * signature.lineHeight));
      context.draw(false, () => {
        this.setData({ posterReady: true, posterError: '' });
        if (done) done(true);
      });
    }).catch(() => {
      this.setData({ posterReady: false, posterError: '收藏卡图片还未加载完成，请稍后重试' });
      if (done) done(false);
    });
  },

  onSaveImage() {
    if (this.data.savingImage) return;
    this.setData({ savingImage: true });
    if (!this.data.posterReady) {
      this.drawCardPoster(ready => {
        if (ready) this.exportCardPoster();
        else {
          this.setData({ savingImage: false });
          wx.showToast({ title: this.data.posterError || '收藏卡图片生成失败，请重试', icon: 'none' });
        }
      });
      return;
    }
    this.exportCardPoster();
  },

  exportCardPoster() {
    wx.canvasToTempFilePath({
      canvasId: 'cardPosterCanvas',
      width: 600,
      height: 1067,
      destWidth: 1200,
      destHeight: 2134,
      success: ({ tempFilePath }) => wx.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => {
          analytics.track('card_save', { card_id: this.data.sceneCard.id, source: 'native_fallback' });
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
  },

  handleAlbumSaveFailure(error) {
    const denied = /auth deny|authorize no response|permission/i.test(String(error && error.errMsg || ''));
    if (!denied || !wx.showModal || !wx.openSetting) {
      wx.showToast({ title: denied ? '请允许保存到相册' : '保存图片失败，请重试', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '需要相册权限',
      content: '请在设置中允许保存到相册，然后再次点击保存图片。',
      confirmText: '去设置',
      success: result => {
        if (!result.confirm) return;
        wx.openSetting({
          success: setting => wx.showToast({
            title: setting.authSetting && setting.authSetting['scope.writePhotosAlbum'] ? '权限已开启，请再次保存' : '仍未获得相册权限',
            icon: 'none'
          })
        });
      }
    });
  },

  onShareAppMessage() {
    const sceneCard = this.data.sceneCard;
    return {
      title: sceneCard ? `我遇见了「${sceneCard.name}」收藏卡` : `我孵化了${this.data.card.name}，编号 ${this.data.card.serial}`,
      path: '/pages/welcome/welcome'
    };
  }
});
