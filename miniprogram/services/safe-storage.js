const analytics = require('./analytics');
const storage = require('./storage-migration');

function get(key, fallback) {
  return storage.read(key, fallback);
}

function set(key, value, where) {
  try {
    storage.set(key, value);
    return { ok: true, value };
  } catch (error) {
    analytics.track('data_write_fail', { where: where || key, error_code: 'LOCAL_WRITE_FAILED' });
    return { ok: false, message: '保存失败，请重试' };
  }
}

function remove(key, where) {
  try {
    storage.remove(key);
    return { ok: true };
  } catch (error) {
    analytics.track('data_write_fail', { where: where || key, error_code: 'LOCAL_REMOVE_FAILED' });
    return { ok: false, message: '操作失败，请重试' };
  }
}

module.exports = { get, set, remove };
