const practice = require('../../services/incubation-practice');
const analytics = require('../../services/analytics');

Page({
  data: {
    loading: true,
    submitting: false,
    selected: '',
    options: [],
    storedOption: null,
    animation: '',
    animationLine: '',
    error: ''
  },

  async onLoad() {
    const state = await practice.getState('edu_class');
    if (!state.ok) {
      this.setData({ loading: false, error: state.message || '教室还在准备中' });
      return;
    }
    const storedOption = state.record ? practice.optionById(state.options, state.record.option_id) : null;
    this.setData({
      loading: false,
      options: state.options,
      storedOption,
      selected: storedOption ? storedOption.id : '',
      error: ''
    });
  },

  onSelect(event) {
    if (this.data.storedOption || this.data.submitting) return;
    this.setData({ selected: event.currentTarget.dataset.id });
  },

  async onSubmit() {
    if (!this.data.selected || this.data.submitting) {
      if (!this.data.selected) wx.showToast({ title: '先选一件小事吧', icon: 'none' });
      return;
    }
    const selectedOption = practice.optionById(this.data.options, this.data.selected);
    if (!selectedOption) return;
    this.setData({ submitting: true, error: '' });
    const result = await practice.submit('edu_class', {
      questionId: 'EDU-DAILY',
      optionId: selectedOption.id
    });
    if (!result.ok) {
      this.setData({ submitting: false, error: result.message || '我刚才没有听清，请重试' });
      return;
    }
    const record = result.record || { option_id: selectedOption.id };
    const storedOption = practice.optionById(this.data.options, record.option_id) || selectedOption;
    this.setData({
      submitting: false,
      storedOption,
      selected: storedOption.id,
      animation: result.alreadyDone ? '' : storedOption.animation,
      animationLine: result.alreadyDone ? '我还记得你教我的这件事。' : storedOption.response
    });
    analytics.track('companion_interaction', {
      interaction_type: 'edu_class',
      result: result.alreadyDone ? 'already_done' : 'recorded',
      option_id: storedOption.id
    });
    if (!result.alreadyDone) {
      clearTimeout(this.animationTimer);
      this.animationTimer = setTimeout(() => this.setData({ animation: '' }), 2400);
    }
  },

  onUnload() {
    clearTimeout(this.animationTimer);
  }
});
