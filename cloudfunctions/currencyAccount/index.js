const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const command = db.command;

async function currentUser(transaction, openid) {
  const result = await transaction.collection('users').where({ openid }).limit(1).get();
  return result.data[0] || null;
}

async function snapshot(transaction, userId) {
  const balances = await transaction.collection('currency_balances').where({ user_id: userId, mode: 'live' }).limit(1).get();
  const inventory = await transaction.collection('user_inventory').where({ user_id: userId, mode: 'live' }).limit(100).get();
  const items = await transaction.collection('item_catalog').where({ mode: 'live', status: 'active' }).limit(100).get();
  return { mode: 'live', balance: Number((balances.data[0] || {}).amount || 0), inventory: inventory.data, catalog: items.data, serverTs: Date.now() };
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const action = String(event.action || 'get');
  if (!['get', 'purchase', 'equip', 'unequip', 'use_snack'].includes(action)) return { ok: false, code: 'INVALID_ACTION' };
  return db.runTransaction(async transaction => {
    const user = await currentUser(transaction, OPENID);
    if (!user) return { ok: false, code: 'LOGIN_REQUIRED', message: '请重新登录后再试' };
    if (action === 'get') return Object.assign({ ok: true }, await snapshot(transaction, user._id));

    const itemId = String(event.itemId || '');
    const itemRows = await transaction.collection('item_catalog').where({ item_id: itemId, mode: 'live', status: 'active' }).limit(1).get();
    const item = itemRows.data[0];
    if (!item) return { ok: false, code: 'ITEM_NOT_FOUND', message: '这个道具暂时无法使用' };

    if (action === 'purchase') {
      const balances = await transaction.collection('currency_balances').where({ user_id: user._id, mode: 'live' }).limit(1).get();
      const balance = balances.data[0];
      const price = Math.max(0, Number(item.price || 0));
      if (!balance || Number(balance.amount || 0) < price) return { ok: false, code: 'INSUFFICIENT_DEW', message: '露珠还不够，再和蛋宝宝互动一会儿吧' };
      const nextBalance = Number(balance.amount) - price;
      await transaction.collection('currency_balances').doc(balance._id).update({ data: { amount: nextBalance, updated_at: db.serverDate() } });
      await transaction.collection('currency_ledger').add({ data: { user_id: user._id, mode: 'live', direction: 'spend', source: 'item_purchase', item_id: itemId, amount: price, balance_after: nextBalance, server_ts: db.serverDate() } });
      const ownedRows = await transaction.collection('user_inventory').where({ user_id: user._id, mode: 'live', item_id: itemId }).limit(1).get();
      if (ownedRows.data[0]) {
        await transaction.collection('user_inventory').doc(ownedRows.data[0]._id).update({ data: { quantity: command.inc(1), updated_at: db.serverDate() } });
      } else {
        await transaction.collection('user_inventory').add({ data: { user_id: user._id, mode: 'live', item_id: itemId, category: item.category, quantity: 1, equipped: false, slot: item.slot || '', acquired_at: db.serverDate(), updated_at: db.serverDate() } });
      }
    } else {
      const ownedRows = await transaction.collection('user_inventory').where({ user_id: user._id, mode: 'live', item_id: itemId }).limit(1).get();
      const owned = ownedRows.data[0];
      if (!owned) return { ok: false, code: 'ITEM_NOT_OWNED', message: '背包里还没有这个道具' };
      if (action === 'use_snack') {
        if (item.category !== 'snack' || Number(owned.quantity || 0) < 1) return { ok: false, code: 'SNACK_NOT_OWNED', message: '背包里没有这份零食' };
        await transaction.collection('user_inventory').doc(owned._id).update({ data: { quantity: Number(owned.quantity) - 1, updated_at: db.serverDate() } });
        return Object.assign({ ok: true, itemId, reaction: '它捧着小饼认真闻了闻，然后开心地晃了晃耳朵。' }, await snapshot(transaction, user._id));
      }
      if (item.category === 'snack') return { ok: false, code: 'SNACK_NOT_EQUIPPABLE', message: '零食可以投喂，但不能穿戴' };
      const equipped = action === 'equip';
      if (equipped && item.slot) {
        const sameSlot = await transaction.collection('user_inventory').where({ user_id: user._id, mode: 'live', slot: item.slot, equipped: true }).limit(20).get();
        await Promise.all(sameSlot.data.map(row => transaction.collection('user_inventory').doc(row._id).update({ data: { equipped: false, updated_at: db.serverDate() } })));
      }
      await transaction.collection('user_inventory').doc(owned._id).update({ data: { equipped, updated_at: db.serverDate() } });
    }
    return Object.assign({ ok: true, itemId }, await snapshot(transaction, user._id));
  });
};
