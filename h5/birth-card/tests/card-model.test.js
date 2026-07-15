const assert = require('assert');
const model = require('../card-model');
const assets = require('../asset-config');
const faceContract = require('../card-face-contract.json');

const normalized = model.normalizeCard({
  card_id: 'card-1', mode: 'demo', prototype: '玉兔', prototype_name: '玉兔', avatar_id: 'YT_avatar_01', style: '月白桂花款', name: '望舒',
  gender: '♀', signature: '安静地陪你等月亮。', birthday: '2026-07-13', constellation: '巨蟹座', mbti: 'INFP',
  blood_type: 'AB', code: 'EGG-RABBIT-20260713-000128', collect_attr: '普通',
  incubation_level: '完整孵化', initial_owner: '蛋友', figure_key: 'YT__月白桂花款', bg_key: 'YT__月白桂花款'
});
assert.equal(normalized.prototype, 'YT', '原型必须规范化为稳定代码');
assert.equal(normalized.gender, 'FEMALE', '性别必须规范化为稳定枚举');
assert.equal(normalized.genderSymbol, '♀', '卡面必须保留性别符号');
assert.equal(normalized.name, '望舒', 'H5 只能展示生成层下发的固定名字');
assert.equal(normalized.constellation, '巨蟹座', 'H5 必须直接展示生成层固定的星座值');
assert.equal(normalized.birthdayLabel, '2026年7月13日', '生日必须显示年月日');
assert.equal(normalized.avatarId, 'YT_avatar_01', '卡面必须保留服务端下发的头像键');
assert.equal(normalized.signature, '安静地陪你等月亮。', '卡面必须保留不超过 20 字的性情独白');
assert.equal(normalized.mode, 'demo', 'demo 标记必须保留');

const collectible = model.normalizeCard({
  card_id: 'copy-1', card_type: 'collectible', mode: 'demo', prototype: '玉兔', prototype_name: '玉兔', avatar_id: 'YT_avatar_01', name: '月团', card_title: '月下冥想',
  birthday: '2026-07-14', constellation: '巨蟹座', gender: 'FEMALE', mbti: 'INFP', signature: '安静地陪你等月亮。', blood_type: 'O', code: 'EGG-YT-20260714-000007',
  set_code: 'YT-S01', set_name: '玉兔初见·水彩日常', collector_label: '007/010',
  card_definition_id: 'yt-s01-007', treatment: 'BASE', hero_asset_id: 'YT__watercolor__meditate'
});
assert.equal(collectible.cardType, 'collectible', '套卡副本必须使用独立收藏卡模型');
assert.equal(collectible.setCode, 'YT-S01', '收藏卡必须保留套装代码');
assert.equal(collectible.cardTitle, '月下冥想', '收藏卡必须保留固定卡名');
assert.equal(collectible.collectorLabel, '007/010', '收藏卡必须保留 checklist 编号');
assert.equal(collectible.figureKey, 'YT__watercolor__meditate', '收藏卡必须映射固定完整 Hero');
assert.equal(collectible.bloodType, 'O', '所有收藏卡必须复用固定身份血型');
assert.equal(collectible.genderSymbol, '♀', '所有收藏卡必须复用固定身份性别符号');
assert.equal(collectible.birthdayLabel, faceContract.displayExamples.birthday.label, '收藏卡生日年月日格式必须服从共享卡面契约');
assert.equal(collectible.constellationLabel, faceContract.displayExamples.constellation.label, '收藏卡星座符号必须服从共享卡面契约');
assert.deepEqual(faceContract.statOrder, ['birthday', 'constellation', 'genderSymbol', 'bloodType', 'mbti', 'signature'], '共享卡面契约必须冻结九字段信息顺序');

assert.throws(() => model.normalizeCard({ card_id: 'card-2', mode: 'live' }), /INVALID_CARD/, '缺少固定卡面字段必须拒绝渲染');
assert.throws(() => model.normalizeCard(Object.assign({}, {
  card_id: 'card-3', mode: 'preview', prototype: 'FOX', avatar_id: 'FOX_avatar_01', name: '未知', style: '未知款', birthday: '2026-07-13', constellation: '巨蟹座', signature: '未知',
  gender: 'UNKNOWN', mbti: 'INFP', blood_type: 'O', code: 'EGG-FOX-20260713-000001'
})), /INVALID_CARD/, '未知模式、角色或性别不得静默转成正式卡');
assert.throws(() => model.normalizeCard({
  card_id: 'copy-invalid-gender', card_type: 'collectible', mode: 'demo', prototype: '玉兔', prototype_name: '玉兔', avatar_id: 'YT_avatar_01', name: '月团', card_title: '月下冥想',
  birthday: '2026-07-14', constellation: '巨蟹座', gender: 'UNKNOWN', mbti: 'INFP', signature: '安静地陪你等月亮。', blood_type: 'O', code: 'EGG-YT-20260714-000007',
  set_code: 'YT-S01', set_name: '玉兔初见·水彩日常', collector_label: '007/010', card_definition_id: 'yt-s01-007', treatment: 'BASE', hero_asset_id: 'YT__watercolor__meditate'
}), /INVALID_CARD/, '收藏卡也不得接受未知性别');
assert.equal(model.isValidCardCode('EGG-KOI-20260713-002150'), true, '合法孵蛋编码必须通过');
assert.equal(model.isValidCardCode('KOI-20260713-1'), false, '错误编码必须被识别');

const exact = assets.resolveAssets({ prototype: 'KOI', style: '好运红白款', limited_batch: 'summer-2026', bg_key: 'KOI__好运红白款', figure_key: 'KOI__好运红白款' }, {
  defaults: { KOI: { background: 'default-bg', figure: 'default-figure' } },
  cards: { 'KOI__好运红白款__summer-2026': { background: 'limited-bg' }, 'KOI__好运红白款': { figure: 'style-figure' } }
});
assert.equal(exact.background, 'limited-bg', '限定批次必须优先使用专属背景');
assert.equal(exact.figure, 'style-figure', '限定未配置形象时必须回退到款式形象');

console.log('H5 card model tests passed.');
