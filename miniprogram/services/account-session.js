const analytics = require('./analytics');
const runtime = require('./runtime-context');
const storage = require('./storage-migration');
const syncQueue = require('./sync-queue');
const petStore = require('../utils/pet-store');
const compliance = require('./compliance-service');

const ACCOUNT_SCOPED_KEYS = Object.freeze([
  'eggbabe_sync_queue_v2',
  'eggbabe_analytics_queue_v2',
  'eggbabe_incubation_practice_v35',
  'eggbabe_incubation_practice_v13',
  'eggbabe_ordinary_user_v228',
  'eggbabe_ordinary_pet_v228',
  'eggbabe_ordinary_identity_v228',
  'eggbabe_post_hatch_v36',
  'eggbabe_subscription_permissions_v216',
  ...compliance.ACCOUNT_SCOPED_STORAGE_KEYS
]);
const DEREGISTER_KEY = 'eggbabe_deregister_request_v1';

function removeAndVerify(key) {
  try {
    storage.remove(key);
    const missing = {};
    return storage.read(key, missing) === missing;
  } catch (error) {
    return false;
  }
}

function clearLocalAccountState() {
  const user = petStore.getUser();
  const userId = String((user && user.id) || petStore.getIdentityId() || '');

  // 先终止待同步任务并重置模块内的会话态，再删除对应持久化数据。
  syncQueue.clear();
  analytics.clearQueue();
  petStore.clearUser();

  const keys = ACCOUNT_SCOPED_KEYS.map(key => runtime.scopedKey(key));
  if (userId) keys.push(`${DEREGISTER_KEY}_${userId}`);
  keys.push(`${DEREGISTER_KEY}_signed-out`);

  const failedKeys = keys.filter(key => !removeAndVerify(key));
  const session = runtime.resetSessionId();
  if (!session.ok) failedKeys.push(runtime.scopedKey('eggbabe_session_id_v2'));

  if (failedKeys.length) {
    return {
      ok: false,
      code: 'LOCAL_ACCOUNT_CLEAR_FAILED',
      message: '本地账号数据清除失败，请重试',
      failedKeys
    };
  }

  return {
    ok: true,
    previousSessionId: session.previousSessionId,
    sessionId: session.sessionId
  };
}

module.exports = { ACCOUNT_SCOPED_KEYS, clearLocalAccountState };
