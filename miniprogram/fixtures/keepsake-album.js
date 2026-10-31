const TOKYO_POSTCARD =
  '/assets/scenes/lifecycle/post-hatch/50-overlays/postcards/_candidates/travel-activities-v01/japan/tokyo/';

const MEET_HERO =
  '/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/jade-rabbit_outing_v01.webp';

const POSTCARD_STREET = `${TOKYO_POSTCARD}postcard_travel_tokyo_alley_morning_stretch_jade_rabbit_v02.webp`;
const POSTCARD_TERRACE = `${TOKYO_POSTCARD}postcard_travel_tokyo_alley_back_tower_jade_rabbit_v02.webp`;

const ALBUM_MODES = Object.freeze({
  READY: 'READY',
  EMPTY: 'EMPTY'
});

const MEET_DETAIL = Object.freeze({
  id: 'meet-red-wall',
  title: '红墙下',
  image: MEET_HERO,
  body:
    '那天的风有点凉，\n兔小乖非要蹲在红墙根下等你按快门。\n后来它说：这张要先放进纪念册。'
});

const POSTCARD_DETAIL = Object.freeze({
  id: 'postcard-dongdaemun',
  title: '东大门街景',
  image: POSTCARD_STREET,
  paragraphs: Object.freeze([
    '这张是在东大门街口寄出的，\n兔小乖踮着脚把它塞进邮筒，\n说要让以后的你，也看到那天的晚风。',
    '现在它安静地夹在你的明信片里——\n街景会慢慢变旧，\n可「我们一起走过」这件事不会。'
  ])
});

function cloneMeetList(mode) {
  if (mode === ALBUM_MODES.EMPTY) return [];
  return Array.from({ length: 12 }, (_, index) =>
    Object.freeze({
      id: index === 0 ? MEET_DETAIL.id : `meet-grid-${index}`,
      detailId: MEET_DETAIL.id,
      image: MEET_HERO
    })
  );
}

function clonePostcardList(mode) {
  if (mode === ALBUM_MODES.EMPTY) return [];
  return Array.from({ length: 12 }, (_, index) =>
    Object.freeze({
      id: index === 0 ? POSTCARD_DETAIL.id : `postcard-grid-${index}`,
      detailId: POSTCARD_DETAIL.id,
      image: index % 2 === 0 ? POSTCARD_STREET : POSTCARD_TERRACE
    })
  );
}

function createKeepsakeAlbumFixture(mode) {
  const normalizedMode = Object.values(ALBUM_MODES).includes(mode) ? mode : ALBUM_MODES.READY;
  return Object.freeze({
    contractVersion: 'keepsake-album-v1',
    source: 'local-fixture',
    mode: normalizedMode,
    meets: cloneMeetList(normalizedMode),
    postcards: clonePostcardList(normalizedMode)
  });
}

function getMeetDetailById(id) {
  if (!id || id === MEET_DETAIL.id || String(id).startsWith('meet-')) {
    return Object.assign({}, MEET_DETAIL);
  }
  return null;
}

function getPostcardDetailById(id) {
  if (!id || id === POSTCARD_DETAIL.id || String(id).startsWith('postcard-')) {
    return Object.assign({}, POSTCARD_DETAIL, {
      paragraphs: POSTCARD_DETAIL.paragraphs.slice()
    });
  }
  return null;
}

module.exports = {
  ALBUM_MODES,
  MEET_DETAIL,
  POSTCARD_DETAIL,
  createKeepsakeAlbumFixture,
  getMeetDetailById,
  getPostcardDetailById
};
