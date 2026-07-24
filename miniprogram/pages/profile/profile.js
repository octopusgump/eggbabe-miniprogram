const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const chatSafety = require('../../services/chat-safety');

Page({
  data: { nickname: '微信用户', publicId: '', avatarUrl: '', saving: false },

  onLoad() {
    const user = petStore.getUser() || {};
    this.setData({
      nickname: user.nickname || '微信用户',
      publicId: user.publicId || '由服务端登录后生成',
      avatarUrl: user.avatarUrl || ''
    });
  },

  saveConfirmed(changes) {
    const user = petStore.getUser() || {};
    const saved = petStore.saveUser(Object.assign({}, user, changes));
    if (!saved) return false;
    this.setData(changes);
    return true;
  },

  onChooseAvatar(event) {
    const avatarUrl = event.detail.avatarUrl;
    if (!avatarUrl) return;
    if (!config.backendEnabled) {
      wx.showToast({ title: '头像服务尚未接入', icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    cloudApi.uploadAvatar(avatarUrl).then(result => {
      this.setData({ saving: false });
      if (!result.ok || result.mode !== 'live' || !result.avatarUrl || !this.saveConfirmed({ avatarUrl: result.avatarUrl })) {
        wx.showToast({ title: result.message || '头像上传失败，请重试', icon: 'none' });
        return;
      }
      wx.showToast({ title: '头像已更新', icon: 'success' });
    });
  },

  onEditNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '最多 16 个字',
      content: this.data.nickname === '微信用户' ? '' : this.data.nickname,
      success: result => {
        const nickname = Array.from((result.content || '').trim()).slice(0, 16).join('');
        if (!result.confirm || !nickname) return;
        if (!chatSafety.isSafeDisplayText(nickname)) {
          wx.showToast({ title: '昵称含有不适合的内容，请换一个', icon: 'none' });
          return;
        }
        if (!config.backendEnabled) {
          wx.showToast({ title: '账号资料服务尚未接入', icon: 'none' });
          return;
        }
        cloudApi.updateProfile({ nickname }).then(response => {
          if (!response.ok || response.mode !== 'live' || !this.saveConfirmed({ nickname })) {
            wx.showToast({ title: response.message || '昵称保存失败，请重试', icon: 'none' });
            return;
          }
          analytics.track('companion_interaction', { interaction_type: 'profile_name', result: 'saved' });
          wx.showToast({ title: '昵称已更新', icon: 'success' });
        });
      }
    });
  }
});
