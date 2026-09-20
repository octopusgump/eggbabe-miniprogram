const {
  MEMORY_STATES,
  ALBUM_MODES,
  createAlbumFixture,
  findMemoryFixture
} = require('../fixtures/iaa-memories');

function assertEnvelope(payload) {
  if (!payload || payload.contractVersion !== 'iaa-mvp-v1') throw new Error('IAA_MEMORY_CONTRACT_INVALID');
  if (payload.source !== 'local-fixture') throw new Error('IAA_MEMORY_SOURCE_INVALID');
  return payload;
}

function assertMemory(memory) {
  if (!memory || !Object.values(MEMORY_STATES).includes(memory.state)) throw new Error('IAA_MEMORY_NOT_FOUND');
  return memory;
}

function envelope(fields) {
  return assertEnvelope(Object.assign({
    contractVersion: 'iaa-mvp-v1',
    source: 'local-fixture'
  }, fields));
}

function createIaaMemoryAdapter(options) {
  const settings = options || {};
  const albumFactory = settings.albumFactory || createAlbumFixture;
  const memoryFinder = settings.memoryFinder || findMemoryFixture;

  return Object.freeze({
    getAlbum(mode) {
      return Promise.resolve(assertEnvelope(albumFactory(mode)));
    },

    getMemory(id) {
      try {
        return Promise.resolve(envelope({ memory: assertMemory(memoryFinder(id)) }));
      } catch (error) {
        return Promise.reject(error);
      }
    },

    getSaveCard(id) {
      try {
        const memory = assertMemory(memoryFinder(id));
        if (memory.state === MEMORY_STATES.LOCKED || !memory.canSave) throw new Error('IAA_MEMORY_SAVE_NOT_ALLOWED');
        return Promise.resolve(envelope({
          card: {
            id: `save-card-${memory.id}`,
            sceneImage: memory.sceneImage,
            title: memory.title,
            date: memory.date,
            quote: memory.quote || `“${memory.line}”`,
            brand: 'EGGBABE · 蛋宝宝',
            previewOnly: true
          }
        }));
      } catch (error) {
        return Promise.reject(error);
      }
    }
  });
}

module.exports = {
  assertEnvelope,
  assertMemory,
  createIaaMemoryAdapter,
  ALBUM_MODES
};
