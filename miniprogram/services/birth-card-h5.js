const runtime = require('./runtime-context');

function prototypeCode(value) {
  return value === '锦鲤' || value === 'KOI' ? 'KOI' : 'YT';
}

function genderCode(value) {
  if (value === '♀' || value === '女' || String(value).toUpperCase() === 'FEMALE') return 'FEMALE';
  if (value === '♂' || value === '男' || String(value).toUpperCase() === 'MALE') return 'MALE';
  return '';
}

function explicitMode(value) {
  if (value === 'demo' || value === 'live') return value;
  return runtime.getMode() === 'demo' ? 'demo' : '';
}

function availableShareCode(pet, card, mode) {
  if (card && (card.share_code || card.shareCode)) return String(card.share_code || card.shareCode);
  if (mode === 'live') return '';
  const code = ((pet && pet.inviteCodes) || []).find(item => item && !item.used && item.code);
  return code ? String(code.code) : '';
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
  const mode = explicitMode(card.mode);
  if (!mode) return null;
  return {
    card_id: String(card.id || card._id || `card-${pet.id}`),
    mode,
    prototype,
    prototype_name: prototype === 'KOI' ? '锦鲤' : '玉兔',
    avatar_id: String(card.avatar_id || card.avatarId || `${prototype}_avatar_01`),
    avatar_url: String(card.avatar_url || card.avatarUrl || pet.avatarUrl || ''),
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
    share_code: availableShareCode(pet, card, mode),
    mini_program_code_url: String(card.mini_program_code_url || config.miniProgramCodeUrl || '')
  };
}

function toH5CollectibleCard(pet, sceneCard, options) {
  if (!pet || !pet.collectionCard || !sceneCard) return null;
  const identity = pet.collectionCard;
  const config = options || {};
  const mode = explicitMode(sceneCard.mode);
  if (!mode) return null;
  return {
    card_id: String(sceneCard.id || sceneCard._id || ''),
    card_type: 'collectible',
    mode,
    prototype: prototypeCode(sceneCard.character || identity.prototype || pet.prototype),
    prototype_name: prototypeCode(sceneCard.character || identity.prototype || pet.prototype) === 'KOI' ? '锦鲤' : '玉兔',
    avatar_id: String(identity.avatar_id || identity.avatarId || `${prototypeCode(sceneCard.character || identity.prototype || pet.prototype)}_avatar_01`),
    avatar_url: String(identity.avatar_url || identity.avatarUrl || pet.avatarUrl || ''),
    name: String(identity.name || pet.name || sceneCard.name || ''),
    card_title: String(sceneCard.name || ''),
    birthday: String(identity.birthday || ''),
    constellation: String(identity.constellation || identity.zodiac || ''),
    gender: genderCode(identity.gender),
    mbti: String(identity.mbti || ''),
    signature: String(identity.signature || identity.personality || ''),
    blood_type: String(identity.blood_type || identity.bloodType || ''),
    code: String(sceneCard.uniqueCode || sceneCard.unique_code || ''),
    set_code: String(sceneCard.setCode || sceneCard.set_code || ''),
    set_name: String(sceneCard.setName || sceneCard.set_name || ''),
    collector_label: String(sceneCard.collectorLabel || sceneCard.collector_label || ''),
    card_definition_id: String(sceneCard.cardId || sceneCard.card_key || sceneCard.cardDefinitionId || sceneCard.card_definition_id || ''),
    treatment: String(sceneCard.treatment || 'BASE'),
    hero_asset_id: String(sceneCard.heroAssetId || sceneCard.hero_asset_id || ''),
    share_code: availableShareCode(pet, sceneCard, mode),
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
