const sceneConfig = require('../utils/exhibition-scenes');
const time = require('./time-service');

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
      name: String(identity.name || pet.name || '未命名'),
      birthday,
      constellation: String(identity.constellation || identity.zodiac || ''),
      mbti: String(identity.mbti || ''),
      setCode: set.setCode,
      setName: set.setName,
      collectorLabel: definition.collectorLabel
    }));
}

module.exports = { buildPreviewCards };
