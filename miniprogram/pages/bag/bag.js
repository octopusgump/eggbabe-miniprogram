const currency = require('../../services/currency-store');

Page({
  data: { balance: 0, items: [] },
  onShow() { this.refresh(); },
  async refresh() {
    const account = await currency.loadAccount();
    const items = account.inventory.map(owned => {
      const definition = account.catalog.find(item => item.id === owned.itemId) || {};
      const item = Object.assign({}, definition, owned);
      if (item.category === 'snack') item.actionLabel = '投喂';
      else if (item.category === 'scene-decor') item.actionLabel = item.equipped ? '收起' : '摆放';
      else item.actionLabel = item.equipped ? '卸下' : '装配';
      item.statusLabel = item.equipped ? (item.category === 'scene-decor' ? '已摆放' : '已装配') : '';
      return item;
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
    wx.showModal({ title: '我很喜欢', content: result.reaction, showCancel: false, confirmText: '好呀', confirmColor: '#3F5A47' });
  },
  onOpenShop() { wx.navigateTo({ url: '/pages/shop/shop' }); }
});
