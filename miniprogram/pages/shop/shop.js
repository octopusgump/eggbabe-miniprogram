const currency = require('../../services/currency-store');
const analytics = require('../../services/analytics');
const runtime = require('../../services/runtime-context');

Page({
  data: { balance: 0, items: [], isDemo: false, serverReady: false },
  async onShow() {
    const account = await currency.loadAccount();
    this.setData({ balance: account.balance, items: account.catalog, isDemo: runtime.getMode() === 'demo', serverReady: account.serverReady });
    analytics.track('shop_view');
  },
  async onPurchase(event) {
    const result = await Promise.resolve(currency.purchase(event.currentTarget.dataset.id));
    if (!result.ok) return wx.showToast({ title: result.message || '暂时无法兑换', icon: 'none' });
    this.setData({ balance: result.account.balance });
    wx.showToast({ title: '已经放进背包', icon: 'success' });
  },
  onOpenBag() { wx.navigateTo({ url: '/pages/bag/bag' }); }
});
