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
    figure_key: String(card.figure_key || `${prototype}__${card.style || ''}`),
    bg_key: String(card.bg_key || `${prototype}__${card.style || ''}`),
    limited_batch: card.limited_batch || null,
    mini_program_code_url: String(card.mini_program_code_url || config.miniProgramCodeUrl || '')
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

module.exports = { toH5Card, isValidH5BaseUrl, buildH5Url };
