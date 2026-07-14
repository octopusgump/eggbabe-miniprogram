const cloud = require('wx-server-sdk');
const crypto = require('crypto');
const catalog = require('./card-catalog');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function beijingDateKey() { return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10); }
function roll() { return crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF; }
async function awardSceneDew(transaction, userId, date) {
  const earnCounterId = `${userId}-live-${date}-scene_interaction`;
  const counters = await transaction.collection('daily_earn_counters').where({ counter_id: earnCounterId, mode: 'live' }).limit(1).get();
  const currentEarned = Number((counters.data[0] || {}).amount || 0);
  if (currentEarned >= 5) return 0;
  const balances = await transaction.collection('currency_balances').where({ user_id: userId, mode: 'live' }).limit(1).get();
  const currentBalance = Number((balances.data[0] || {}).amount || 0);
  const nextBalance = currentBalance + 1;
  if (balances.data[0]) await transaction.collection('currency_balances').doc(balances.data[0]._id).update({ data: { amount: nextBalance, updated_at: db.serverDate() } });
  else await transaction.collection('currency_balances').add({ data: { user_id: userId, mode: 'live', amount: nextBalance, created_at: db.serverDate(), updated_at: db.serverDate() } });
  if (counters.data[0]) await transaction.collection('daily_earn_counters').doc(counters.data[0]._id).update({ data: { amount: db.command.inc(1), server_ts: db.serverDate() } });
  else await transaction.collection('daily_earn_counters').add({ data: { counter_id: earnCounterId, user_id: userId, mode: 'live', date, source: 'scene_interaction', amount: 1, server_ts: db.serverDate() } });
  await transaction.collection('currency_ledger').add({ data: { user_id: userId, mode: 'live', direction: 'earn', source: 'scene_interaction', amount: 1, balance_after: nextBalance, server_ts: db.serverDate() } });
  await transaction.collection('analytics_events').add({ data: {
    event_id: `currency-earned-${earnCounterId}-${currentEarned + 1}`,
    event_name: 'currency_earned',
    user_id: userId,
    mode: 'live',
    source: 'scene_interaction',
    amount: 1,
    server_ts: db.serverDate(),
    received_at: db.serverDate()
  } });
  return 1;
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const sceneId = String(event.scene_id || '');
  const pointId = String(event.point_id || '');
  if (!sceneId || !pointId) return { ok: false, code: 'INVALID_ARGUMENT' };
  return db.runTransaction(async transaction => {
    const userResult = await transaction.collection('users').where({ openid: OPENID }).limit(1).get();
    const user = userResult.data[0];
    if (!user) return { ok: false, code: 'LOGIN_REQUIRED' };
    const petResult = await transaction.collection('pets').where({ user_id: user._id, mode: 'live', stage: 'hatched' }).limit(1).get();
    const pet = petResult.data[0];
    if (!pet) return { ok: false, code: 'PET_NOT_HATCHED' };
    const date = beijingDateKey();
    const counterId = `${user._id}_${date}`;
    let counter;
    try { counter = (await transaction.collection('scene_card_daily').doc(counterId).get()).data; } catch (error) { counter = null; }
    const count = counter ? counter.count || 0 : 0;
    const attempts = (counter ? counter.attempts || 0 : 0) + 1;
    const attemptKey = `${sceneId}:${pointId}`;
    const attemptedPoints = counter ? counter.attempted_points || [] : [];
    if (attemptedPoints.includes(attemptKey)) return { ok: true, dropped: false, repeated: true, dailyCount: count, dailyLimit: 2 };
    attemptedPoints.push(attemptKey);
    const dewEarned = await awardSceneDew(transaction, user._id, date);
    if (count >= 2) return { ok: true, dropped: false, capped: true, dewEarned, dailyCount: count, dailyLimit: 2 };
    if (roll() >= 0.28) {
      if (counter) await transaction.collection('scene_card_daily').doc(counterId).update({ data: { mode: 'live', attempts, attempted_points: attemptedPoints, updated_at: db.serverDate() } });
      else await transaction.collection('scene_card_daily').doc(counterId).set({ data: { user_id: user._id, mode: 'live', date, count: 0, attempts, attempted_points: attemptedPoints, updated_at: db.serverDate() } });
      return { ok: true, dropped: false, dewEarned, dailyCount: count, dailyLimit: 2 };
    }
    const pool = catalog.getCardPool(pet.prototype, sceneId);
    if (!pool.length) return { ok: true, dropped: false, code: 'EMPTY_POOL' };
    const template = pool[Math.floor(roll() * pool.length)];
    const cardKey = template.card_key || template.card_definition_id || template._id;
    const issueDay = date.replace(/-/g, '');
    const issueCounterId = `YT_${issueDay}`;
    let issueCounter;
    try { issueCounter = (await transaction.collection('scene_card_issue_counters').doc(issueCounterId).get()).data; } catch (error) { issueCounter = null; }
    const issueNumber = (issueCounter ? Number(issueCounter.count || 0) : 0) + 1;
    if (issueCounter) await transaction.collection('scene_card_issue_counters').doc(issueCounterId).update({ data: { mode: 'live', count: issueNumber, updated_at: db.serverDate() } });
    else await transaction.collection('scene_card_issue_counters').doc(issueCounterId).set({ data: { mode: 'live', character: pet.prototype, date, count: issueNumber, updated_at: db.serverDate() } });
    const existingCopies = await transaction.collection('scene_cards').where({ user_id: user._id, mode: 'live', card_key: cardKey }).get();
    const copyId = crypto.randomBytes(16).toString('hex');
    const uniqueCode = `EGG-YT-${issueDay}-${String(issueNumber).padStart(6, '0')}`;
    const snapshot = {
      copy_id: copyId,
      unique_code: uniqueCode,
      card_definition_id: template.card_definition_id || cardKey,
      set_code: template.set_code || 'YT-S01',
      collector_number: template.collector_number,
      checklist_number: template.checklist_number,
      checklist_total: template.checklist_total,
      treatment: 'BASE',
      hero_asset_id: template.hero_asset_id || '',
      hero_asset_version: 1,
      card_template_version: 1
    };
    const issuedAt = db.serverDate();
    const cardData = {
      copy_id: copyId,
      user_id: user._id,
      owner_id: user._id,
      pet_id: pet._id,
      mode: 'live',
      issued_mode: 'live',
      template_id: template._id || cardKey,
      card_key: cardKey,
      card_definition_id: template.card_definition_id || cardKey,
      set_code: template.set_code || 'YT-S01',
      set_name: template.set_name || '玉兔初见·水彩日常',
      collector_number: template.collector_number,
      collector_label: template.collector_label,
      checklist_number: template.checklist_number,
      checklist_total: template.checklist_total,
      treatment: 'BASE',
      hero_asset_id: template.hero_asset_id || '',
      hero_asset_version: 1,
      card_template_version: 1,
      card_snapshot_hash: crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),
      unique_code: uniqueCode,
      copy_count: existingCopies.data.length + 1,
      is_new_definition: existingCopies.data.length === 0,
      character: pet.prototype,
      scene_id: sceneId,
      point_id: pointId,
      name: template.name,
      image: template.image || '',
      tint: template.tint || '#F6F2E8',
      mark: template.mark || '景',
      issued_at: issuedAt,
      obtained_at: issuedAt,
      provenance_events: [{ type: 'issued', mode: 'live', date, scene_id: sceneId, point_id: pointId }],
      shared: false
    };
    await transaction.collection('scene_cards').doc(copyId).set({ data: cardData });
    if (counter) await transaction.collection('scene_card_daily').doc(counterId).update({ data: { mode: 'live', count: db.command.inc(1), attempts, attempted_points: attemptedPoints, updated_at: db.serverDate() } });
    else await transaction.collection('scene_card_daily').doc(counterId).set({ data: { user_id: user._id, mode: 'live', date, count: 1, attempts, attempted_points: attemptedPoints, updated_at: db.serverDate() } });
    await transaction.collection('preference_events').add({ data: { user_id: user._id, pet_id: pet._id, mode: 'live', event_type: 'interaction_point_tap', scene_id: sceneId, point_id: pointId, card_id: copyId, server_ts: db.serverDate() } });
    const responseTimestamp = Date.now();
    return { ok: true, dropped: true, card: Object.assign({ id: copyId }, cardData, { issued_at: responseTimestamp, obtained_at: responseTimestamp }), dewEarned, dailyCount: count + 1, dailyLimit: 2 };
  });
};
