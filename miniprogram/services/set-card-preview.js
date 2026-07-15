const sceneConfig = require('../utils/exhibition-scenes');
const time = require('./time-service');
const CONSTELLATION_SYMBOLS = { '白羊座': '♈', '金牛座': '♉', '双子座': '♊', '巨蟹座': '♋', '狮子座': '♌', '处女座': '♍', '天秤座': '♎', '天蝎座': '♏', '射手座': '♐', '摩羯座': '♑', '水瓶座': '♒', '双鱼座': '♓' };

function formatBirthday(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  return match ? `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日` : String(value || '');
}

function formatConstellation(value) {
  const name = String(value || '');
  return CONSTELLATION_SYMBOLS[name] ? `${name} ${CONSTELLATION_SYMBOLS[name]}` : name;
}

function buildPreviewCards(pet) {
  if (!pet || !pet.collectionCard) return [];
  const set = sceneConfig.getCardSetForCharacter(pet.prototype);
  if (!set) return [];
  const identity = pet.collectionCard;
  const birthday = String(identity.birthday || time.beijingDateKey());
  return set.cards.map(definition => ({
      cardId: definition.cardId,
      cardTitle: definition.name,
      image: definition.image,
      prototype: pet.prototype,
      prototypeLabel: pet.prototype,
      name: String(identity.name || pet.name || '未命名'),
      birthday,
      birthdayLabel: formatBirthday(birthday),
      constellation: String(identity.constellation || identity.zodiac || ''),
      constellationLabel: formatConstellation(identity.constellation || identity.zodiac || ''),
      mbti: String(identity.mbti || ''),
      genderSymbol: identity.gender === 'FEMALE' || identity.gender === '♀' ? '♀' : '♂',
      bloodType: String(identity.blood_type || identity.bloodType || ''),
      signature: String(identity.signature || identity.personality || '').slice(0, 20),
      setCode: set.setCode,
      setName: set.setName,
      collectorLabel: definition.collectorLabel
    }));
}

module.exports = { buildPreviewCards, formatBirthday, formatConstellation };
