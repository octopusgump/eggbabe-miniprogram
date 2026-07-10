const petStore = require('../../utils/pet-store');
const PROFILE_KEY = 'eggbaby_profile_v2';
const MBTI_LIST = ['INFP','INFJ','INTJ','INTP','ENFP','ENFJ','ENTJ','ENTP','ISFP','ISFJ','ISTJ','ISTP','ESFP','ESFJ','ESTJ','ESTP'];

function zodiacForDate(value) {
  if (!value) return '';
  const parts = value.split('-');
  const key = Number(parts[1]) * 100 + Number(parts[2]);
  if (key >= 120 || key <= 218) return '水瓶座';
  if (key <= 320) return '双鱼座';
  if (key <= 419) return '白羊座';
  if (key <= 520) return '金牛座';
  if (key <= 621) return '双子座';
  if (key <= 722) return '巨蟹座';
  if (key <= 822) return '狮子座';
  if (key <= 922) return '处女座';
  if (key <= 1023) return '天秤座';
  if (key <= 1122) return '天蝎座';
  if (key <= 1221) return '射手座';
  return '摩羯座';
}

Page({
  data: {
    nickname: '微信用户', publicId: '', avatarUrl: '', gender: '', birthday: '', zodiac: '', city: '', mbti: '', mbtiDraft: '',
    genderLocked: false, birthdayLocked: false, today: ''
  },

  onLoad() {
    const user = petStore.saveUser(petStore.getUser() || {});
    const profile = wx.getStorageSync(PROFILE_KEY) || {};
    const gender = profile.gender || user.gender || '';
    const birthday = profile.birthday || user.birthday || '';
    this.setData({
      nickname: profile.nickname || user.nickname || '微信用户',
      publicId: user.publicId,
      avatarUrl: profile.avatarUrl || user.avatarUrl || '',
      gender,
      birthday,
      zodiac: profile.zodiac || user.zodiac || zodiacForDate(birthday),
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
    this.setData(changes);
    wx.setStorageSync(PROFILE_KEY, next);
    const user = petStore.getUser() || {};
    const savedUser = petStore.saveUser(Object.assign({}, user, changes));
    this.setData({ publicId: savedUser.publicId });
  },

  onChooseAvatar(event) {
    const avatarUrl = event.detail.avatarUrl;
    if (!avatarUrl) return;
    this.save({ avatarUrl });
    wx.showToast({ title: '头像已更新', icon: 'success' });
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
        if (result.confirm) this.save({ birthday, zodiac: zodiacForDate(birthday), birthdayLocked: true });
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
