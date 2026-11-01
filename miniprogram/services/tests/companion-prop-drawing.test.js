const assert = require('assert');
const stars = require('../iaa-star-unlock-adapter');

(async () => {
  stars.configureRoom('prop-entry');
  const day = () => stars.getRoomStarView().then(result => result.data);
  await stars.recordLetterOpen(await day());

  const letter = await stars.beginCompanionPropDrawing('letter');
  assert.equal(letter.ok, true);
  assert.equal(letter.cost, 0);

  const before = (await day()).star.balance;
  const poor = await stars.beginCompanionPropDrawing('activity');
  assert.equal(poor.ok, false);
  assert.equal(poor.error.code, 'INSUFFICIENT_STARS');
  assert.equal((await day()).star.balance, before);

  await stars.recordPropDrawingComplete(await day(), 'seed-a');
  await stars.recordPropDrawingComplete(await day(), 'seed-b');
  const paid = await stars.beginCompanionPropDrawing('activity');
  assert.equal(paid.ok, true);
  assert.equal(paid.cost, 20);
  assert.equal((await day()).star.balance, before + 20 - 20);

  console.log('一起画 20 星入场与信件免费口径通过。');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
