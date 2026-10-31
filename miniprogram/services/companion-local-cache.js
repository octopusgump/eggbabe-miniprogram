// 本机前端记录；由 CTO 的账户与结算 adapter 替换，不产生网络请求。
const runtime = require('./runtime-context');
const config = require('../config/v2');
function keyFor(petId, pet) {
  const owner = pet && pet.ownerId || runtime.getSessionId();
  return runtime.scopedKey(`companion_local_v1_${config.envVersion}_${encodeURIComponent(owner)}_${encodeURIComponent(petId)}`);
}
function read(key) {
  try {
    const value = typeof wx !== 'undefined' && wx.getStorageSync ? wx.getStorageSync(key) : null;
    return value && value.version === 1 ? JSON.parse(JSON.stringify(value)) : null;
  } catch (error) { return null; }
}
function write(key, value) {
  // Node 检查可使用内存；小程序里的写入异常必须返回失败，不能冒充已经保存。
  if (typeof wx === 'undefined' || !wx.setStorageSync) return true;
  try { wx.setStorageSync(key, JSON.parse(JSON.stringify(value))); return true; }
  catch (error) { return false; }
}
module.exports = { keyFor, read, write };
