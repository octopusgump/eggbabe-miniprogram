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
    const prototype = PROTOTYPES[input.prototype] || String(input.prototype || '').toUpperCase();
    const birthday = String(input.birthday || '');
    const gender = GENDERS[input.gender] || String(input.gender || '').toUpperCase();
    const code = String(input.code || input.serial || '');
    const constellation = String(input.constellation || input.zodiac || '');
    const required = [input.card_id || input.id, input.mode, prototype, input.style, birthday, constellation, input.mbti, input.blood_type || input.bloodType, code];
    const invalidEnum = !['live', 'demo'].includes(input.mode) || !['YT', 'KOI'].includes(prototype) || !['MALE', 'FEMALE'].includes(gender);
    if (required.some(value => !value) || invalidEnum || !validDateParts(birthday) || !isValidCardCode(code)) throw new Error('INVALID_CARD');
    return {
      cardId: String(input.card_id || input.id),
      mode: input.mode,
      prototype,
      prototypeLabel: prototype === 'KOI' ? '锦鲤' : '玉兔',
      style: String(input.style),
      name: String(input.name || '').trim().slice(0, 10) || '未命名',
      nameByUser: !!input.name_by_user,
      gender,
      genderSymbol: gender === 'FEMALE' ? '♀' : '♂',
      signature: String(input.signature || input.personality || '').slice(0, 20),
      birthday,
      hatchedAt: String(input.hatched_at || ''),
      constellation,
      mbti: String(input.mbti).toUpperCase().slice(0, 4),
      bloodType: String(input.blood_type || input.bloodType).toUpperCase(),
      code,
      collectAttr: input.collect_attr === '限定' || input.collectible === '限定' ? '限定' : '普通',
      incubationLevel: String(input.incubation_level || input.hatchQuality || ''),
      initialOwner: String(input.initial_owner || input.originalOwner || '蛋友'),
      figureKey: String(input.figure_key || `${prototype}__${input.style}`),
      bgKey: String(input.bg_key || `${prototype}__${input.style}`),
      limitedBatch: input.limited_batch || null,
      miniProgramCodeUrl: String(input.mini_program_code_url || '')
    };
  }

  return { isValidCardCode, normalizeCard };
}));
