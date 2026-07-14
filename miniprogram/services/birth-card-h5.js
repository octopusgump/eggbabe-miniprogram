const runtime = require('./runtime-context');

function prototypeCode(value) {
  return value === '锦鲤' || value === 'KOI' ? 'KOI' : 'YT';
}

function genderCode(value) {
  return value === '♀' || String(value).toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE';
}

function toIsoString(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function toH5Card(pet, options) {
  if (!pet || !pet.collectionCard) return null;
  const card = pet.collectionCard;
  const config = options || {};
  const prototype = prototypeCode(card.prototype || pet.prototype);
  return {
    card_id: String(card.id || card._id || `card-${pet.id}`),
    mode: card.mode === 'demo' || card.mode === 'live' ? card.mode : runtime.getMode(),
    prototype,
    style: String(card.style || ''),
    name: String(card.name || ''),
    name_by_user: card.name_by_user === undefined ? !!pet.name : !!card.name_by_user,
    gender: genderCode(card.gender),
    signature: String(card.signature || card.personality || ''),
    birthday: String(card.birthday || ''),
    hatched_at: toIsoString(card.hatched_at || pet.hatchAt),
    constellation: String(card.constellation || card.zodiac || ''),
    mbti: String(card.mbti || ''),
    blood_type: String(card.blood_type || card.bloodType || ''),
    code: String(card.code || card.serial || ''),
    collect_attr: card.collect_attr || card.collectible || '普通',
    incubation_level: card.incubation_level || card.hatchQuality || '',
    initial_owner: card.initial_owner || card.originalOwner || '蛋友',
    illustration_id: String(card.illustration_id || ''),
    illustration_context: card.illustration_context || null,
    figure_key: String(card.illustration_id || card.figure_key || `${prototype}__${card.style || ''}`),
    bg_key: String(card.bg_key || `${prototype}__${card.style || ''}`),
    limited_batch: card.limited_batch || null,
    mini_program_code_url: String(card.mini_program_code_url || config.miniProgramCodeUrl || '')
  };
}

function toH5CollectibleCard(pet, sceneCard, options) {
  if (!pet || !pet.collectionCard || !sceneCard) return null;
  const identity = pet.collectionCard;
  const config = options || {};
  return {
    card_id: String(sceneCard.id || sceneCard._id || ''),
    card_type: 'collectible',
    mode: sceneCard.mode === 'demo' || sceneCard.mode === 'live' ? sceneCard.mode : runtime.getMode(),
    prototype: prototypeCode(sceneCard.character || identity.prototype || pet.prototype),
    name: String(identity.name || pet.name || sceneCard.name || ''),
    card_title: String(sceneCard.name || ''),
    birthday: String(identity.birthday || ''),
    constellation: String(identity.constellation || identity.zodiac || ''),
    mbti: String(identity.mbti || ''),
    code: String(sceneCard.uniqueCode || sceneCard.unique_code || ''),
    set_code: String(sceneCard.setCode || sceneCard.set_code || ''),
    set_name: String(sceneCard.setName || sceneCard.set_name || ''),
    collector_label: String(sceneCard.collectorLabel || sceneCard.collector_label || ''),
    card_definition_id: String(sceneCard.cardId || sceneCard.card_key || sceneCard.cardDefinitionId || sceneCard.card_definition_id || ''),
    treatment: String(sceneCard.treatment || 'BASE'),
    hero_asset_id: String(sceneCard.heroAssetId || sceneCard.hero_asset_id || ''),
    mini_program_code_url: String(sceneCard.mini_program_code_url || config.miniProgramCodeUrl || '')
  };
}

function isValidH5BaseUrl(value) {
  return /^https:\/\/[^\s/?#]+(?:[/?#]|$)/i.test(String(value || ''));
}

function buildH5Url(baseUrl, view, cardData, apiBase) {
  if (!isValidH5BaseUrl(baseUrl) || !cardData) return '';
  if (cardData.mode === 'live' && !isValidH5BaseUrl(apiBase)) return '';
  const query = [
    `card_id=${encodeURIComponent(cardData.card_id)}`,
    `mode=${encodeURIComponent(cardData.mode)}`,
    `view=${view === 'profile' ? 'profile' : 'card'}`
  ];
  if (cardData.mode === 'demo') query.push(`card_data=${encodeURIComponent(JSON.stringify(cardData))}`);
  return `${String(baseUrl).replace(/[?&]$/, '')}${String(baseUrl).includes('?') ? '&' : '?'}${query.join('&')}`;
}

module.exports = { toH5Card, toH5CollectibleCard, isValidH5BaseUrl, buildH5Url };
