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
    environmentCdnBase: '',
    windowMetrics: null,
    dailyMoodIntroShown: false
  },

  onLaunch() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    this.globalData.windowMetrics = {
      width: Number(windowInfo.windowWidth || 0),
      height: Number(windowInfo.windowHeight || 0),
      safeTop: Number((windowInfo.safeArea && windowInfo.safeArea.top) || windowInfo.statusBarHeight || 0),
      safeBottom: Math.max(0, Number(windowInfo.screenHeight || 0) - Number((windowInfo.safeArea && windowInfo.safeArea.bottom) || windowInfo.screenHeight || 0)),
      menuBottom: Number((menu && menu.bottom) || 0)
    };
    // develop 使用隔离 demo；trial / release 固定 live。
    // demo 没有用户界面开关，也不会进入正式存储与接口。
    runtime.setMode(config.defaultMode);
    analytics.track('app_open', { enter_scene: 'direct' });
    syncQueue.flush();
    wx.login({
      success: ({ code }) => {
        this.globalData.loginCode = code || '';
        analytics.track('login_result', { success: !!code, fail_reason: code ? '' : 'EMPTY_CODE' });
        if (code && config.backendEnabled && runtime.getMode() === 'live') {
          cloudApi.bootstrap(code).then(result => {
            if (!result.ok || result.mode !== 'live' || !result.user) return;
            const sessionId = result.session_id || result.sessionId;
            if (sessionId) runtime.setSessionId(sessionId);
            if (result.serverTs) timeService.acceptServerTime(result.serverTs);
            this.globalData.backendReady = true;
            // 仅接收备案 CDN 根路径；不接收、也不使用服务端天气结果。
            this.globalData.environmentCdnBase = String(result.environment_cdn_base || result.environmentCdnBase || '').replace(/\/$/, '');
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
              collectionCard: result.hatchCard || null
            }), 'live');
            timeService.sync().then(timeResult => {
              if (!timeResult.ok || typeof getCurrentPages === 'undefined') return;
              const pages = getCurrentPages();
              const current = pages[pages.length - 1];
              if (current && current.onShow) current.onShow();
            });
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
