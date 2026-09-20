const { ALBUM_MODES, createAlbumFixture } = require('../fixtures/iaa-memories');

function assertEnvelope(payload) {
  if (!payload || payload.contractVersion !== 'iaa-mvp-v1') throw new Error('IAA_MEMORY_CONTRACT_INVALID');
  if (payload.source !== 'local-fixture') throw new Error('IAA_MEMORY_SOURCE_INVALID');
  return payload;
}

function createIaaMemoryAdapter(options) {
  const settings = options || {};
  const albumFactory = settings.albumFactory || createAlbumFixture;

  return Object.freeze({
    getAlbum(mode) {
      return Promise.resolve(assertEnvelope(albumFactory(mode)));
    }
  });
}

module.exports = {
  assertEnvelope,
  createIaaMemoryAdapter,
  ALBUM_MODES
};
