const config = require('./config/v2');
const timeService = require('./services/time-service');
const analytics = require('./services/analytics');
const cloudApi = require('./services/cloud-api');
const petStore = require('./utils/pet-store');
const sceneCardStore = require('./services/scene-card-store');
const syncQueue = require('./services/sync-queue');
const runtime = require('./services/runtime-context');

App({
  globalData: {
    version: config.version,
    cloudReady: false
  },

  onLaunch() {
    if (!config.cloudEnabled) runtime.setMode('demo');
    if (config.cloudEnabled && wx.cloud) {
      wx.cloud.init({ env: config.cloudEnv || undefined, traceUser: true });
      this.globalData.cloudReady = true;
    }
    timeService.sync().then(result => {
      if (!result.ok || typeof getCurrentPages === 'undefined') return;
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      if (current && current.onShow) current.onShow();
    });
    analytics.track('app_open', { enter_scene: 'direct' });
    syncQueue.flush();
    wx.login({
      success: ({ code }) => {
        this.globalData.loginCode = code || '';
        analytics.track('login_result', { success: !!code, fail_reason: code ? '' : 'EMPTY_CODE' });
        if (code && config.cloudEnabled) {
          cloudApi.bootstrap().then(result => {
            if (!result.ok) return;
            petStore.saveUser({ id: result.user._id, publicId: result.user.public_id, avatarUrl: result.user.avatar_url || '', registeredAt: result.user.created_at || result.serverTs });
            if (result.pet) petStore.importCloudPet(Object.assign({}, result.pet, { id: result.pet._id, hatchAt: new Date(result.pet.hatch_at).getTime(), collectionCard: result.hatchCard || null, messages: result.messages || [] }), 'live');
            if (result.sceneCards) sceneCardStore.importCloudCards(result.sceneCards);
          });
        }
      },
      fail: () => {
        analytics.track('login_result', { success: false, fail_reason: 'WX_LOGIN_FAILED' });
      }
    });
  },

  onHide() {
    analytics.flush();
    syncQueue.flush();
  }
});
