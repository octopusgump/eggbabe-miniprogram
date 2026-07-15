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

function signatureClass(value) {
  const length = Array.from(String(value || '')).length;
  if (length > 60) return 'card-signature--dense';
  if (length > 32) return 'card-signature--compact';
  return '';
}

Page({
  data: { card: null, cardView: null, sceneCard: null, isCollectible: false, pet: null, illustration: '', birthdayLabel: '', genderLabel: '', zodiacSymbol: '', signatureClass: '', isNew: false },

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

  onAlbum() {
    if (this.data.isCollectible) {
      wx.navigateBack();
      return;
    }
    wx.navigateTo({ url: '/pages/album/album' });
  },
  onShareAppMessage() {
    const sceneCard = this.data.sceneCard;
    return {
      title: sceneCard ? `我遇见了「${sceneCard.name}」收藏卡` : `我孵化了${this.data.card.name}，编号 ${this.data.card.serial}`,
      path: '/pages/welcome/welcome'
    };
  }
});
