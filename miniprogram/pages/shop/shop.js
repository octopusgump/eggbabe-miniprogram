const currency = require('../../services/currency-store');
const analytics = require('../../services/analytics');
const runtime = require('../../services/runtime-context');

Page({
  data: { balance: 0, items: [], isDemo: false, serverReady: false, purchasingId: '' },
  async onShow() {
    const account = await currency.loadAccount();
    this.refresh(account);
    analytics.track('shop_view');
  },
  refresh(account) {
    const isDemo = runtime.getMode() === 'demo';
    const ownedIds = new Set(account.inventory.map(item => item.itemId));
    const items = account.catalog.map(item => {
      const owned = ownedIds.has(item.id);
      const insufficient = account.balance < item.price;
      const waitingForServer = !isDemo && !account.serverReady;
      const locked = waitingForServer || insufficient || (owned && !item.stackable);
      let actionLabel = `${item.price} 露珠`;
      if (waitingForServer) actionLabel = '等待同步';
      else if (owned && !item.stackable) actionLabel = '已拥有';
      else if (insufficient) actionLabel = '露珠不足';
      else if (owned && item.stackable) actionLabel = `再买一份 · ${item.price}`;
      return Object.assign({}, item, { owned, insufficient, locked, actionLabel });
    });
    this.setData({ balance: account.balance, items, isDemo, serverReady: account.serverReady, purchasingId: '' });
  },
  onPurchase(event) {
    const item = this.data.items.find(entry => entry.id === event.currentTarget.dataset.id);
    if (!item || item.locked || this.data.purchasingId) return;
    wx.showModal({
      title: item.name,
      content: `用 ${item.price} 个露珠兑换，确认后会放进背包。`,
      confirmText: '确认兑换',
      confirmColor: '#3F5A47',
      success: async modal => {
        if (!modal.confirm) return;
        this.setData({ purchasingId: item.id });
        const result = await Promise.resolve(currency.purchase(item.id));
        if (!result.ok) {
          this.setData({ purchasingId: '' });
          return wx.showToast({ title: result.message || '暂时无法兑换', icon: 'none' });
        }
        this.refresh(result.account);
        wx.showToast({ title: '已经放进背包', icon: 'success' });
      }
    });
  },
  onOpenBag() { wx.navigateTo({ url: '/pages/bag/bag' }); }
});
