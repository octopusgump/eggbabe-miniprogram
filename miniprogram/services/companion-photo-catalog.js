// 仅 approved 且具有运行图片的内容开放；候选图片不接入正式映射。
const PHOTOS = [];
function petKey(pet) { return pet && /锦鲤|KOI|BOON-KOI/i.test(String(pet.prototype || '')) ? 'boon-koi' : 'jade-rabbit'; }
function eligiblePhotos(pet, date) {
  return PHOTOS.filter(item => item.approved && item.image && (!item.pet || item.pet === petKey(pet)) &&
    (item.kind !== 'solar' || (item.windows || []).some(window => date >= window.start && date < window.end)));
}
module.exports = { PHOTOS, petKey, eligiblePhotos };
