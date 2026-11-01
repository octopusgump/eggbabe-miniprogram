const assert = require('assert');
const stars = require('../iaa-star-unlock-adapter');

(async () => {
  stars.configureRoom('prop-entry');
  const day = () => stars.getRoomStarView().then(result => result.data);
  await stars.recordLetterOpen(await day());

  const before = (await day()).star.balance;
  const letter = await stars.beginCompanionPropDrawing();
  assert.equal(letter.ok, true);
  assert.equal(letter.cost, 0);
  assert.equal((await day()).star.balance, before);

  const activity = await stars.beginCompanionPropDrawing();
  assert.equal(activity.ok, true);
  assert.equal(activity.cost, 0);
  assert.equal((await day()).star.balance, before);

  const completion = await stars.recordPropDrawingComplete(await day(), 'prop-work-1');
  assert.equal(completion.awardedStars, 10);
  assert.equal((await day()).star.balance, before + 10);

  console.log('一起画免费入场与达标 +10 星口径通过。');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
