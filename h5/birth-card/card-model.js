(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EggbabeCardModel = api;
}(typeof self !== 'undefined' ? self : this, function () {
  const PROTOTYPES = { '锦鲤': 'KOI', KOI: 'KOI', '玉兔': 'YT', YT: 'YT', RABBIT: 'YT' };
  const GENDERS = { '♂': 'MALE', MALE: 'MALE', male: 'MALE', '男': 'MALE', '♀': 'FEMALE', FEMALE: 'FEMALE', female: 'FEMALE', '女': 'FEMALE' };

  function validDateParts(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return { year, month, day };
  }

  function isValidCardCode(value) {
    return /^EGG-[A-Z]+-\d{8}-\d{6}$/.test(String(value || ''));
  }

  function normalizeCard(source) {
    const input = source || {};
    const cardType = input.card_type === 'collectible' || input.set_code ? 'collectible' : 'birth';
    const prototype = PROTOTYPES[input.prototype] || String(input.prototype || '').toUpperCase();
    const birthday = String(input.birthday || '');
    const gender = GENDERS[input.gender] || String(input.gender || '').toUpperCase();
    const code = String(input.code || input.serial || '');
    const constellation = String(input.constellation || input.zodiac || '');
    const required = [input.card_id || input.id, input.mode, prototype, birthday, constellation, input.mbti, code];
    const birthRequired = [input.style, input.gender, input.blood_type || input.bloodType];
    const collectibleRequired = [input.set_code, input.set_name, input.collector_label, input.card_definition_id, input.treatment, input.hero_asset_id];
    const invalidEnum = !['live', 'demo'].includes(input.mode) || !['YT', 'KOI'].includes(prototype) || (cardType === 'birth' && !['MALE', 'FEMALE'].includes(gender));
    const invalidCollectible = cardType === 'collectible' && (!/^\d{3}\/\d{3}$/.test(String(input.collector_label || '')) || input.treatment !== 'BASE');
    if (required.some(value => !value) || (cardType === 'birth' ? birthRequired : collectibleRequired).some(value => !value) || invalidEnum || invalidCollectible || !validDateParts(birthday) || !isValidCardCode(code)) throw new Error('INVALID_CARD');
    return {
      cardId: String(input.card_id || input.id),
      cardType,
      mode: input.mode,
      prototype,
      prototypeLabel: prototype === 'KOI' ? '锦鲤' : '玉兔',
      style: String(input.style || ''),
      name: String(input.name || '').trim().slice(0, 10) || '未命名',
      cardTitle: String(input.card_title || '').trim().slice(0, 20),
      nameByUser: !!input.name_by_user,
      gender,
      genderSymbol: cardType === 'birth' ? (gender === 'FEMALE' ? '♀' : '♂') : '',
      signature: String(input.signature || input.personality || '').slice(0, 20),
      birthday,
      hatchedAt: String(input.hatched_at || ''),
      constellation,
      mbti: String(input.mbti).toUpperCase().slice(0, 4),
      bloodType: String(input.blood_type || input.bloodType || '').toUpperCase(),
      code,
      collectAttr: cardType === 'collectible' ? 'BASE' : (input.collect_attr === '限定' || input.collectible === '限定' ? '限定' : '普通'),
      incubationLevel: String(input.incubation_level || input.hatchQuality || ''),
      initialOwner: String(input.initial_owner || input.originalOwner || '蛋友'),
      figureKey: String(input.hero_asset_id || input.figure_key || `${prototype}__${input.style}`),
      bgKey: String(input.bg_key || `${prototype}__${input.style || ''}`),
      setCode: String(input.set_code || ''),
      setName: String(input.set_name || ''),
      collectorLabel: String(input.collector_label || ''),
      cardDefinitionId: String(input.card_definition_id || ''),
      treatment: String(input.treatment || ''),
      heroAssetId: String(input.hero_asset_id || ''),
      limitedBatch: input.limited_batch || null,
      miniProgramCodeUrl: String(input.mini_program_code_url || '')
    };
  }

  return { isValidCardCode, normalizeCard };
}));
