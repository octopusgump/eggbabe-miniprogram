const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const chatSafety = require('../../services/chat-safety');
const runtime = require('../../services/runtime-context');
const { createInlineNoticeController } = require('../../utils/inline-notice-controller');

Page({
  data: {
    nickname: '微信用户',
    publicId: '',
    avatarUrl: '',
    saving: false,
    systemNoticeText: '',
    systemNoticeTone: 'info',
    systemNoticeVisible: false
  },

  onLoad() {
    this.pageActive = true;
    const user = petStore.getUser() || {};
    this.setData({
      nickname: user.nickname || '微信用户',
      publicId: user.publicId || '由服务端登录后生成',
      avatarUrl: user.avatarUrl || ''
    });
  },

  onShow() { this.pageActive = true; },

  showSystemNotice(text, tone) {
    if (!this.systemNoticeController) {
      this.systemNoticeController = createInlineNoticeController(this, {
        textKey: 'systemNoticeText',
        toneKey: 'systemNoticeTone',
        visibleKey: 'systemNoticeVisible',
        timerKey: 'systemNoticeTimer',
        cleanupTimerKey: 'systemNoticeCleanupTimer',
        isActive: () => this.pageActive !== false
      });
    }
    return this.systemNoticeController.show(text, tone);
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
    if (runtime.getMode() === 'demo' && this.saveConfirmed({ avatarUrl })) {
      this.showSystemNotice('头像已更新（开发验收）', 'info');
      return;
    }
    if (!config.backendEnabled) {
      this.showSystemNotice('头像服务尚未接入', 'warning');
      return;
    }
    this.setData({ saving: true });
    cloudApi.uploadAvatar(avatarUrl).then(result => {
      this.setData({ saving: false });
      if (!result.ok || result.mode !== 'live' || !result.avatarUrl || !this.saveConfirmed({ avatarUrl: result.avatarUrl })) {
        this.showSystemNotice(result.message || '头像上传失败，请重试', 'warning');
        return;
      }
      this.showSystemNotice('头像已更新', 'info');
    }).catch(() => {
      this.setData({ saving: false });
      this.showSystemNotice('头像上传失败，请重试', 'warning');
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
        if (runtime.getMode() === 'demo' && this.saveConfirmed({ nickname })) {
          analytics.track('companion_interaction', { interaction_type: 'profile_name', result: 'saved' });
          this.showSystemNotice('昵称已更新（开发验收）', 'info');
          return;
        }
        if (!config.backendEnabled) {
          this.showSystemNotice('账号资料服务尚未接入', 'warning');
          return;
        }
        cloudApi.updateProfile({ nickname }).then(response => {
          if (!response.ok || response.mode !== 'live' || !this.saveConfirmed({ nickname })) {
            this.showSystemNotice(response.message || '昵称保存失败，请重试', 'warning');
            return;
          }
          analytics.track('companion_interaction', { interaction_type: 'profile_name', result: 'saved' });
          this.showSystemNotice('昵称已更新', 'info');
        }).catch(() => this.showSystemNotice('昵称保存失败，请重试', 'warning'));
      }
    });
  },

  clearSystemNotice() {
    if (this.systemNoticeController) this.systemNoticeController.destroy();
    this.setData({ systemNoticeText: '', systemNoticeVisible: false });
  },

  onHide() {
    this.pageActive = false;
    this.clearSystemNotice();
  },

  onUnload() {
    this.pageActive = false;
    this.clearSystemNotice();
  }
});
