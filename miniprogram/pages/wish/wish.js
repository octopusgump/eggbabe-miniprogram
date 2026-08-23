const practice = require('../../services/incubation-practice');
const analytics = require('../../services/analytics');

Page({
  data: {
    loading: true,
    submitting: false,
    question: null,
    selected: '',
    storedOption: null,
    selectionError: '',
    error: '',
    successLine: ''
  },

  async onLoad() {
    this.pageAlive = true;
    const requestToken = this.loadRequestToken = (this.loadRequestToken || 0) + 1;
    const state = await practice.getState('wish_pool');
    if (!this.pageAlive || requestToken !== this.loadRequestToken) return;
    if (!state.ok) {
      this.setData({ loading: false, error: state.message || '今天的愿望还没有来到这里' });
      return;
    }
    const storedOption = state.record && state.question
      ? practice.optionById(state.question.options, state.record.option_id)
      : null;
    this.setData({
      loading: false,
      question: state.question,
      storedOption,
      selected: storedOption ? storedOption.id : '',
      error: ''
    });
  },

  onUnload() {
    this.pageAlive = false;
    this.loadRequestToken = (this.loadRequestToken || 0) + 1;
  },

  onSelect(event) {
    if (this.data.storedOption || this.data.submitting) return;
    this.setData({ selected: event.currentTarget.dataset.id, selectionError: '' });
  },

  onSubmit() {
    if (!this.data.selected || this.data.submitting) {
      if (!this.data.selected) this.setData({ selectionError: '先选一个愿望吧' });
      return;
    }
    this.submitAnswer();
  },

  async submitAnswer() {
    const question = this.data.question;
    const selectedOption = question && practice.optionById(question.options, this.data.selected);
    if (!question || !selectedOption) return;
    this.setData({ submitting: true, error: '', selectionError: '' });
    const result = await practice.submit('wish_pool', {
      questionId: question.id,
      optionId: selectedOption.id
    });
    if (!result.ok) {
      this.setData({ submitting: false, error: result.message || '这个愿望没有送达，请重试' });
      return;
    }
    const record = result.record || { option_id: selectedOption.id };
    const storedOption = practice.optionById(question.options, record.option_id) || selectedOption;
    this.setData({
      submitting: false,
      storedOption,
      selected: storedOption.id,
      successLine: result.responseLine || (result.alreadyDone ? '' : '我把这个愿望收好啦，感觉离你近了一点点。')
    });
    analytics.track('companion_interaction', {
      interaction_type: 'wish_pool',
      result: result.alreadyDone ? 'already_done' : 'recorded',
      question_id: question.id,
      option_id: storedOption.id
    });
  }
});
