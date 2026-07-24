function prototypeCode(value) {
  return value === '锦鲤' || value === 'KOI' ? 'KOI' : 'YT';
}

function toH5Card(pet) {
  if (!pet || !pet.collectionCard) return null;
  const card = pet.collectionCard;
  if (card.mode !== 'live') return null;
  const prototype = prototypeCode(card.prototype || pet.prototype);
  const result = {
    card_id: String(card.card_id || card.id || card._id || ''),
    egg_id: String(card.egg_id || pet.id || ''),
    mode: 'live',
    prototype,
    prototype_name: prototype === 'KOI' ? '锦鲤' : '玉兔',
    style: String(card.style || pet.style || ''),
    display_name: String(card.display_name || card.name || pet.name || '我的蛋宝宝'),
    hatched_at: String(card.hatched_at || pet.hatchAt || ''),
    identity_code: String(card.identity_code || card.code || card.serial || ''),
    source_batch: String(card.source_batch || ''),
    illustration_key: String(card.illustration_key || ''),
    illustration_url: String(card.illustration_url || ''),
    mini_program_code_url: String(card.mini_program_code_url || '')
  };
  const required = [result.card_id, result.egg_id, result.style, result.hatched_at, result.identity_code, result.illustration_key, result.illustration_url];
  if (required.some(value => !value) || !/^https:\/\//i.test(result.illustration_url)) return null;
  return result;
}

function isValidH5BaseUrl(value) {
  return /^https:\/\/[^\s/?#]+(?:[/?#]|$)/i.test(String(value || ''));
}

function buildH5Url(baseUrl, cardData, apiBase) {
  if (!isValidH5BaseUrl(baseUrl) || !cardData || cardData.mode !== 'live') return '';
  if (!isValidH5BaseUrl(apiBase)) return '';
  return `${String(baseUrl).replace(/[?&]$/, '')}${String(baseUrl).includes('?') ? '&' : '?'}card_id=${encodeURIComponent(cardData.card_id)}&mode=live`;
}

module.exports = { toH5Card, isValidH5BaseUrl, buildH5Url };
