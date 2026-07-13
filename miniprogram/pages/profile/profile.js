const petStore = require('../../utils/pet-store');
const PROFILE_KEY = 'eggbabe_profile_v2';
const MBTI_LIST = ['INFP','INFJ','INTJ','INTP','ENFP','ENFJ','ENTJ','ENTP','ISFP','ISFJ','ISTJ','ISTP','ESFP','ESFJ','ESTJ','ESTP'];
const safeStorage = require('../../services/safe-storage');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const syncQueue = require('../../services/sync-queue');

Page({
  data: {
    nickname: '微信用户', publicId: '', avatarUrl: '', gender: '', birthday: '', zodiac: '', city: '', mbti: '', mbtiDraft: '',
    genderLocked: false, birthdayLocked: false, today: ''
  },

  onLoad() {
    const user = petStore.saveUser(petStore.getUser() || {}) || petStore.getUser() || {};
    const profile = safeStorage.get(PROFILE_KEY, {});
    const gender = profile.gender || user.gender || '';
    const birthday = profile.birthday || user.birthday || '';
    this.setData({
      nickname: profile.nickname || user.nickname || '微信用户',
      publicId: user.publicId,
      avatarUrl: profile.avatarUrl || user.avatarUrl || '',
      gender,
      birthday,
      zodiac: profile.zodiac || user.zodiac || petStore.getZodiac(birthday),
      city: profile.city || user.city || '',
      mbti: profile.mbti || user.mbti || '',
      mbtiDraft: profile.mbti || user.mbti || '',
      genderLocked: profile.genderLocked || !!gender,
      birthdayLocked: profile.birthdayLocked || !!birthday,
      today: petStore.todayKey()
    });
  },

  save(changes) {
    const next = Object.assign({}, this.data, changes);
    const localResult = safeStorage.set(PROFILE_KEY, next, 'profile');
    if (!localResult.ok) {
      wx.showToast({ title: localResult.message, icon: 'none' });
      return false;
    }
    const user = petStore.getUser() || {};
    const savedUser = petStore.saveUser(Object.assign({}, user, changes));
    if (!savedUser) {
      wx.showToast({ title: '资料保存失败，请重试', icon: 'none' });
      return false;
    }
    this.setData(changes);
    this.setData({ publicId: savedUser.publicId });
    if (config.cloudEnabled) syncQueue.enqueue('updateProfile', { profile: changes });
    return true;
  },

  onChooseAvatar(event) {
    const avatarUrl = event.detail.avatarUrl;
    if (!avatarUrl) return;
    analytics.track('avatar_change', { status: 'start' });
    if (config.cloudEnabled) {
      wx.showLoading({ title: '正在上传' });
      cloudApi.uploadAvatar(avatarUrl).then(result => {
        wx.hideLoading();
        if (!result.ok || !this.save({ avatarUrl: result.fileID })) {
          analytics.track('avatar_change', { status: 'fail' });
          wx.showToast({ title: result.message || '头像上传失败，请重试', icon: 'none' });
          return;
        }
        analytics.track('avatar_change', { status: 'success' });
        wx.showToast({ title: '头像已更新', icon: 'success' });
      });
      return;
    }
    if (this.save({ avatarUrl })) {
      analytics.track('avatar_change', { status: 'success' });
      wx.showToast({ title: '头像已更新', icon: 'success' });
    } else analytics.track('avatar_change', { status: 'fail' });
  },

  onEditNickname() {
    wx.showModal({
      title: '修改昵称', editable: true, placeholderText: '最多 16 个字', content: this.data.nickname === '微信用户' ? '' : this.data.nickname,
      success: (result) => {
        const nickname = (result.content || '').trim().slice(0, 16);
        if (result.confirm && nickname) this.save({ nickname });
      }
    });
  },

  onEditGender() {
    if (this.data.genderLocked) return wx.showToast({ title: '性别设置后不可修改', icon: 'none' });
    wx.showModal({
      title: '设置性别', content: '性别设置后不可修改，确认继续吗？',
      success: (result) => {
        if (!result.confirm) return;
        wx.showActionSheet({ itemList: ['男', '女'], success: (choice) => this.save({ gender: choice.tapIndex === 0 ? '男' : '女', genderLocked: true }) });
      }
    });
  },

  onBirthdayChange(event) {
    if (this.data.birthdayLocked) return;
    const birthday = event.detail.value;
    wx.showModal({
      title: '确认生日', content: `${birthday} 设置后不可修改，确认保存吗？`,
      success: (result) => {
        if (result.confirm) this.save({ birthday, zodiac: petStore.getZodiac(birthday), birthdayLocked: true });
      }
    });
  },

  onEditCity() {
    wx.showModal({
      title: '常驻城市', editable: true, placeholderText: '例如：上海 · 浦东新区', content: this.data.city,
      success: (result) => {
        const city = (result.content || '').trim().slice(0, 24);
        if (result.confirm) this.save({ city });
      }
    });
  },

  onMbtiInput(event) {
    const mbtiDraft = event.detail.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    this.setData({ mbtiDraft });
    return mbtiDraft;
  },

  onMbtiBlur() {
    const value = this.data.mbtiDraft;
    if (!value) {
      this.save({ mbti: '', mbtiDraft: '' });
      return;
    }
    if (!MBTI_LIST.includes(value)) {
      wx.showToast({ title: '请输入有效的 4 位 MBTI', icon: 'none' });
      this.setData({ mbtiDraft: this.data.mbti });
      return;
    }
    this.save({ mbti: value, mbtiDraft: value });
  }
});
