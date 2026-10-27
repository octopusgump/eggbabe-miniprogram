const petStore = require('./pet-store');

const CHARACTER_ROOT = '/assets/scenes/lifecycle/post-hatch/30-character';

function resolveCompanionPetCharacterFolder(pet) {
  return petStore.normalizePrototype(pet && pet.prototype) === '锦鲤' ? 'boon-koi' : 'jade-rabbit';
}

function resolveCompanionPetImage(pet, pose) {
  const folder = resolveCompanionPetCharacterFolder(pet);
  const file = String(pose || 'stare').trim() || 'stare';
  return `${CHARACTER_ROOT}/${folder}/${file}.webp`;
}

module.exports = {
  resolveCompanionPetCharacterFolder,
  resolveCompanionPetImage
};
