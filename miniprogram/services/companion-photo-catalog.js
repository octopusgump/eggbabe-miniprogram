// 仅 approved 且具有运行图片的内容开放；候选图片不接入正式映射。
// 2026首组窗口核对自香港天文台年历；后续年份未录入则不开放节气照片。
const PHOTOS = [
  {
    "id": "jade-rabbit-outing-v01",
    "pet": "jade-rabbit",
    "kind": "outing",
    "approved": true,
    "image": "/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/jade-rabbit_outing_v01.webp",
    "title": "出门前的小留影",
    "line": "出门前拍的，给你留一张。"
  },
  {
    "id": "jade-rabbit-afternoon-v01",
    "pet": "jade-rabbit",
    "kind": "exchange",
    "approved": true,
    "image": "/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/jade-rabbit_afternoon_v01.webp",
    "title": "窗边午后",
    "line": "午后的光刚好，给你留一张我的照片。"
  },
  {
    "id": "boon-koi-outing-v01",
    "pet": "boon-koi",
    "kind": "outing",
    "approved": true,
    "image": "/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/boon-koi_outing_v01.webp",
    "title": "出门前的小留影",
    "line": "出门前拍的，给你留一张。"
  },
  {
    "id": "boon-koi-afternoon-v01",
    "pet": "boon-koi",
    "kind": "exchange",
    "approved": true,
    "image": "/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/boon-koi_afternoon_v01.webp",
    "title": "窗边午后",
    "line": "午后的光刚好，给你留一张我的照片。"
  },
  {
    "id": "solar-chushu-shared-v01",
    "kind": "solar",
    "approved": true,
    "image": "/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/eggbabe_solar_term_chushu_shared_v01.webp",
    "title": "池畔的晚光",
    "line": "水面上，冒出几个小泡泡。",
    "windows": [
      {
        "start": "2026-08-23",
        "end": "2026-09-07"
      }
    ]
  },
  {
    "id": "solar-bailu-shared-v01",
    "kind": "solar",
    "approved": true,
    "image": "/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/eggbabe_solar_term_bailu_shared_v01.webp",
    "title": "叶尖的水珠",
    "line": "叶尖挂着一颗亮亮的水珠。",
    "windows": [
      {
        "start": "2026-09-07",
        "end": "2026-09-23"
      }
    ]
  },
  {
    "id": "solar-qiufen-shared-v01",
    "kind": "solar",
    "approved": true,
    "image": "/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/eggbabe_solar_term_qiufen_shared_v01.webp",
    "title": "落叶旁的小径",
    "line": "落叶旁，还有几个小脚印。",
    "windows": [
      {
        "start": "2026-09-23",
        "end": "2026-10-08"
      }
    ]
  }
];
function petKey(pet) { return pet && /锦鲤|KOI|BOON-KOI/i.test(String(pet.prototype || '')) ? 'boon-koi' : 'jade-rabbit'; }
function eligiblePhotos(pet, date) {
  return PHOTOS.filter(item => item.approved && item.image && (!item.pet || item.pet === petKey(pet)) &&
    (item.kind !== 'solar' || (item.windows || []).some(window => date >= window.start && date < window.end)));
}
module.exports = { PHOTOS, petKey, eligiblePhotos };
