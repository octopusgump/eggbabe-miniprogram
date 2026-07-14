const currency = require('../../services/currency-store');

Page({
  data: { balance: 0, items: [] },
  onShow() { this.refresh(); },
  async refresh() {
    const account = await currency.loadAccount();
    const items = account.inventory.map(owned => {
      const definition = account.catalog.find(item => item.id === owned.itemId) || {};
      return Object.assign({}, definition, owned);
    });
    this.setData({ balance: account.balance, items });
  },
  async onToggle(event) {
    const current = event.currentTarget.dataset.equipped;
    const shouldEquip = !(current === true || current === 'true' || current === 1 || current === '1');
    const result = await Promise.resolve(currency.setEquipped(event.currentTarget.dataset.id, shouldEquip));
    if (!result.ok) return wx.showToast({ title: result.message || '暂时无法使用', icon: 'none' });
    this.refresh();
  },
  async onUseSnack(event) {
    const result = await Promise.resolve(currency.useSnack(event.currentTarget.dataset.id));
    if (!result.ok) return wx.showToast({ title: result.message || '暂时无法投喂', icon: 'none' });
    this.refresh();
    wx.showModal({ title: '它很喜欢', content: result.reaction, showCancel: false, confirmText: '好呀', confirmColor: '#3F5A47' });
  },
  onOpenShop() { wx.navigateTo({ url: '/pages/shop/shop' }); }
});
