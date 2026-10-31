const {
  ALBUM_MODES,
  createKeepsakeAlbumFixture,
  getMeetDetailById,
  getPostcardDetailById
} = require('../fixtures/keepsake-album');

function normalizeMode(mode) {
  return Object.values(ALBUM_MODES).includes(mode) ? mode : ALBUM_MODES.READY;
}

function getAlbum(mode) {
  return Promise.resolve(createKeepsakeAlbumFixture(normalizeMode(mode)));
}

function getMeetDetail(id) {
  const detail = getMeetDetailById(id);
  return Promise.resolve(detail);
}

function getPostcardDetail(id) {
  const detail = getPostcardDetailById(id);
  return Promise.resolve(detail);
}

module.exports = {
  ALBUM_MODES,
  getAlbum,
  getMeetDetail,
  getPostcardDetail
};
