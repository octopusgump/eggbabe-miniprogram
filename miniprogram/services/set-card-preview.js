const sceneConfig = require('../utils/exhibition-scenes');
const time = require('./time-service');

function timestamp(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function latestCopy(cardId, copies) {
  return (copies || [])
    .filter(copy => (copy.cardId || copy.card_key || copy.templateId || copy.template_id) === cardId)
    .sort((left, right) => timestamp(right.obtainedAt || right.obtained_at) - timestamp(left.obtainedAt || left.obtained_at))[0] || null;
}

function buildPreviewCards(pet, copies) {
  if (!pet || !pet.collectionCard) return [];
  const set = sceneConfig.getCardSetForCharacter(pet.prototype);
  if (!set) return [];
  const identity = pet.collectionCard;
  const birthday = String(identity.birthday || time.beijingDateKey());
  return set.cards.map(definition => {
    const copy = latestCopy(definition.cardId, copies);
    return {
      cardId: definition.cardId,
      cardTitle: definition.name,
      image: definition.image,
      name: String(identity.name || pet.name || '未命名'),
      birthday,
      constellation: String(identity.constellation || identity.zodiac || ''),
      mbti: String(identity.mbti || ''),
      setCode: set.setCode,
      setName: set.setName,
      collectorLabel: definition.collectorLabel,
      uniqueCode: copy ? String(copy.uniqueCode || copy.unique_code || '') : '暂无副本编号',
      owned: Boolean(copy),
      copyId: copy ? String(copy.id || copy._id || '') : '',
      statusLabel: copy ? '已获得 · 展会副本' : '展会预览 · 尚未获得'
    };
  });
}

module.exports = { buildPreviewCards };
