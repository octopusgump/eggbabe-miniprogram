const assert = require('assert');
const { resolveCompanionPetImage, resolveCompanionPetCharacterFolder } = require('../../utils/companion-pet-image');

const koiPath = '/assets/scenes/lifecycle/post-hatch/30-character/boon-koi/stare.webp';
const rabbitPath = '/assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/stare.webp';

assert.equal(resolveCompanionPetImage({ prototype: '锦鲤' }), koiPath);
assert.equal(resolveCompanionPetImage({ prototype: 'KOI' }), koiPath);
assert.equal(resolveCompanionPetImage({ prototype: 'boon-koi' }), koiPath);
assert.equal(resolveCompanionPetImage({ prototype: '玉兔' }), rabbitPath);
assert.equal(resolveCompanionPetImage({ prototype: 'jade-rabbit' }), rabbitPath);
assert.equal(resolveCompanionPetImage({ prototype: '' }), rabbitPath);
assert.equal(resolveCompanionPetCharacterFolder({ prototype: 'YT' }), 'jade-rabbit');
assert.equal(resolveCompanionPetImage({ prototype: '锦鲤' }, 'stare'), koiPath);

console.log('companion-pet-image 通过：信件角标与听你说反馈共用 stare 路径，别名原型一致。');
