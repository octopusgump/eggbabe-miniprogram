const config = require('./config/v2');
const timeService = require('./services/time-service');
const analytics = require('./services/analytics');
const cloudApi = require('./services/cloud-api');
const petStore = require('./utils/pet-store');
const syncQueue = require('./services/sync-queue');
const runtime = require('./services/runtime-context');

App({
  globalData: {
    version: config.version,
    backendReady: false,
    incubationEnvironment: null
  },

  onLaunch() {
    // 普通版生产构建固定使用 live。内部演示必须使用独立项目，
    // 不能再通过“后端未连接”等条件把生产包切到 demo。
    runtime.setMode('live');
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
        if (code && config.backendEnabled) {
          cloudApi.bootstrap(code).then(result => {
            if (!result.ok || result.mode !== 'live' || !result.user) return;
            this.globalData.backendReady = true;
            this.globalData.incubationEnvironment = result.incubationEnvironment || null;
            petStore.saveUser({
              id: result.user.id || result.user._id,
              publicId: result.user.public_id || result.user.publicId || '',
              nickname: result.user.nickname || '微信用户',
              avatarUrl: result.user.avatar_url || result.user.avatarUrl || '',
              registeredAt: result.user.created_at || result.user.createdAt || result.serverTs
            });
            if (result.pet) petStore.importCloudPet(Object.assign({}, result.pet, {
              id: result.pet._id,
              mode: result.pet.mode || result.mode,
              hatchAt: result.pet.hatch_at || '',
              collectionCard: result.hatchCard || null,
              messages: result.messages || []
            }), 'live');
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
