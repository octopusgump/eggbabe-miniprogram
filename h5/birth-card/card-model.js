(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EggbabeCardModel = api;
}(typeof self !== 'undefined' ? self : this, function () {
  const PROTOTYPES = { '锦鲤': 'KOI', KOI: 'KOI', '玉兔': 'YT', YT: 'YT' };

  function formatDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
    return match ? `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日` : '';
  }

  function normalizeCard(source) {
    const input = source || {};
    const prototype = PROTOTYPES[input.prototype] || '';
    const card = {
      cardId: String(input.card_id || input.id || ''),
      eggId: String(input.egg_id || ''),
      mode: String(input.mode || ''),
      prototype,
      prototypeLabel: prototype === 'KOI' ? '锦鲤' : '玉兔',
      style: String(input.style || ''),
      displayName: String(input.display_name || '我的蛋宝宝'),
      hatchedAt: String(input.hatched_at || ''),
      hatchedAtLabel: formatDate(input.hatched_at),
      identityCode: String(input.identity_code || ''),
      sourceBatch: String(input.source_batch || ''),
      illustrationKey: String(input.illustration_key || ''),
      illustrationUrl: String(input.illustration_url || ''),
      miniProgramCodeUrl: String(input.mini_program_code_url || '')
    };
    const required = [card.cardId, card.eggId, card.style, card.hatchedAtLabel, card.identityCode, card.illustrationKey, card.illustrationUrl];
    if (card.illustrationUrl && !/^https:\/\//i.test(card.illustrationUrl)) throw new Error('INVALID_CARD');
    if (card.mode !== 'live' || !prototype || required.some(value => !value)) throw new Error('INVALID_CARD');
    return card;
  }

  return { formatDate, normalizeCard };
}));
