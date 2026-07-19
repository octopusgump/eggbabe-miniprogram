const storage = require('../../services/storage-migration');
const subscriptionMessages = require('../../services/subscription-messages');
const STORAGE_KEY = 'eggbabe_notification_preferences_v1';
const DEFAULTS = { hatch: true, seasonal: false };

Page({
  data: { notifs: DEFAULTS },

  onLoad() {
    this.setData({ notifs: Object.assign({}, DEFAULTS, storage.read(STORAGE_KEY, {})) });
  },

  update(key, value) {
    this.setData({ [`notifs.${key}`]: value }, () => storage.set(STORAGE_KEY, this.data.notifs));
  },

  onToggleHatch(e) {
    const enabled = e.detail.value;
    this.update('hatch', enabled);
    if (enabled) subscriptionMessages.requestHatchReminders();
  },
  onToggleSeasonal(e) {
    const enabled = e.detail.value;
    this.update('seasonal', enabled);
    if (enabled) subscriptionMessages.requestSeasonalUpdates();
  }
});
