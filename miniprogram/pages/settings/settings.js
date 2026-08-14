const storage = require('../../services/storage-migration');
const subscriptionMessages = require('../../services/subscription-messages');
const petStore = require('../../utils/pet-store');
const STORAGE_KEY = 'eggbabe_notification_preferences_v1';
const DEFAULTS = { hatch: true };

Page({
  data: { notifs: DEFAULTS, hatchReminderAvailable: false },

  onLoad() {
    const pet = petStore.getPet();
    const saved = storage.read(STORAGE_KEY, {});
    this.setData({
      notifs: { hatch: typeof saved.hatch === 'boolean' ? saved.hatch : DEFAULTS.hatch },
      hatchReminderAvailable: !pet || petStore.getStage(pet) !== 'hatched'
    });
  },

  update(key, value) {
    this.setData({ [`notifs.${key}`]: value }, () => storage.set(STORAGE_KEY, this.data.notifs));
  },

  onToggleHatch(e) {
    if (!this.data.hatchReminderAvailable) return;
    const enabled = e.detail.value;
    this.update('hatch', enabled);
    if (enabled) subscriptionMessages.requestHatchReminders();
  }
});
