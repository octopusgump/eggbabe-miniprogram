/**
 * 陪伴日记详情 · 前端适配层（Sample）
 *
 * 正式接入时在此替换为 wx.request / 云函数，页面只消费 getDiaryDetail 返回的合同字段。
 *
 * @typedef {Object} CompanionDiaryDetail
 * @property {string} id 日记条目 id
 * @property {string} imageUrl 头图 URL（CDN 或本地静态）
 * @property {string} salutation 称呼行，默认「亲爱的主人，」
 * @property {string} body 正文（可多段，前端按 \n\n 分段）
 * @property {string} signOff 落款，如「啾咪，兔小乖」
 * @property {string} shareCardTitle 分享卡标题（可与正文摘要不同）
 * @property {string} shareFooterName 分享卡左下角昵称
 * @property {string} shareQrHint 分享卡二维码占位说明（Sample 不渲染真码）
 */

const companionPetImage = require('../utils/companion-pet-image');

const DETAIL_FIELD_KEYS = Object.freeze([
  'id',
  'imageUrl',
  'salutation',
  'body',
  'signOff',
  'shareCardTitle',
  'shareFooterName',
  'shareQrHint'
]);

const SAMPLE_BODY =
  '几日不见甚是想念！在与主人分别的这些日子里，兔小乖有在认真生活——晒太阳、闻花香，也把想对你说的话都记在了这一页里。\n\n等你在房间点开百宝箱里的「日记」，就会读到这一篇。正式服务接入后，这里会由服务端按日期与宠物推送最新一篇。';

function sampleHeroImageUrl(pet) {
  const folder = companionPetImage.resolveCompanionPetCharacterFolder(pet);
  return `/assets/scenes/lifecycle/post-hatch/60-action-scenes/${folder}/home-bedroom/home_bedroom_window_day_v01.webp`;
}

function buildSampleDetail(pet) {
  const name = (pet && (pet.name || pet.nickname)) || '兔小乖';
  const body = SAMPLE_BODY.replace(/兔小乖/g, name);
  return {
    id: 'sample-diary-entry-v1',
    imageUrl: sampleHeroImageUrl(pet),
    salutation: '亲爱的主人，',
    body,
    signOff: `啾咪，${name}`,
    shareCardTitle: '来自蛋宝宝的日记',
    shareFooterName: (pet && (pet.name || pet.nickname)) || 'eggbabe',
    shareQrHint: '正式版将展示小程序码'
  };
}

/**
 * @param {{ pet?: object, entry?: string, date?: string }} options
 * @returns {Promise<{ ok: boolean, data?: CompanionDiaryDetail, error?: { code: string, message: string } }>}
 */
function getDiaryDetail(options) {
  const input = options || {};
  const pet = input.pet;
  if (!pet || !pet.id) {
    return Promise.resolve({
      ok: false,
      error: { code: 'NO_PET', message: '还没有准备好日记，请先完成破壳。' }
    });
  }
  // TODO(server): GET /companion/diary/latest?petId=&entry=&date=
  void input.entry;
  void input.date;
  return Promise.resolve({ ok: true, data: buildSampleDetail(pet) });
}

module.exports = {
  DETAIL_FIELD_KEYS,
  getDiaryDetail
};
