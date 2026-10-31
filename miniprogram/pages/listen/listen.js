const petStore = require('../../utils/pet-store');
const companionPetImage = require('../../utils/companion-pet-image');
const config = require('../../config/v2');
const adapter = require('../../services/listen-adapter');
const rules = require('../../services/listen-rules');
const stars = require('../../services/iaa-star-unlock-adapter');
const SOUND = '/assets/scenes/lifecycle/post-hatch/40-interaction-fx/companion-star/companion-star-award.mp3';

Page({
  data: { view: 'loading', title: '', question: null, questionNumber: 1, progress: 0, selected: '', supplement: '', noteOpen: false,
    error: '', busy: false, categories: [], petImage: '', petName: '', feedback: '', awardedStars: 0, awardVisible: false, rewardLabel: '', reducedMotion: false },
  currentPet() {
    const stored = petStore.getPet();
    if (stored && petStore.getStage(stored) === 'hatched') return stored;
    return config.localDemoEnabled ? stars.getConfiguredPet() || stored : stored;
  },
  onLoad() {
    this.pageActive = true;
    const pet = this.currentPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') { this.setData({ view: 'blocked', error: '破壳后才能来这里聊聊。' }); return; }
    stars.configureRoom(pet.id, pet);
    this.scope = stars.getRoomScope();
    let reducedMotion = false;
    try { const system = wx.getSystemSetting ? wx.getSystemSetting() : wx.getSystemInfoSync(); reducedMotion = Boolean(system.reducedMotion || system.enableReduceMotion); } catch (error) {}
    this.setData({ petImage: companionPetImage.resolveCompanionPetImage(pet), petName: pet.name || pet.nickname || pet.prototype || '蛋宝宝', reducedMotion });
    this.openCurrent();
  },
  onShow() {
    this.pageActive = true;
    if (!this.scope) return;
    const pet = this.currentPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') { this.draft = null; this.setData({ view: 'blocked', error: '当前宠物已变更，请返回房间。' }); return; }
    stars.configureRoom(pet.id, pet);
    if (stars.getRoomScope() !== this.scope) { this.draft = null; this.clearAward(); this.setData({ view: 'blocked', error: '当前宠物已变更，请返回房间。' }); return; }
    if (this.pendingResult) { const result = this.pendingResult; this.pendingResult = null; this.showFeedback(result.data, 0); }
    if (this.data.view === 'choices') this.showChoices();
    if (this.data.view === 'feedback') this.setData({ categories: adapter.getState().data.categories });
    if (this.data.view === 'end' && adapter.getState().data.categories.length) this.openCurrent();
  },
  openCurrent() {
    const state = adapter.getState().data;
    if (state.draft) { this.draft = state.draft; this.renderQuestion(); return; }
    if (state.pendingResult) { this.showFeedback(state.pendingResult, 0); return; }
    if (!state.categories.length) { this.showEnd(state); return; }
    if (state.completedToday) this.showChoices();
    else this.startGroup();
  },
  startGroup(event) {
    if (this.data.busy || stars.getRoomScope() !== this.scope) return;
    const id = typeof event === 'string' ? event : event && event.currentTarget.dataset.id;
    const result = adapter.startGroup(id);
    if (!result.ok) { this.setData({ error: result.error.message }); return; }
    this.resultId = null;
    this.draft = result.data;
    this.renderQuestion();
  },
  renderQuestion() {
    const entry = rules.groupById(this.draft.groupId);
    if (!entry) { this.setData({ view: 'blocked', error: '这个话题暂时没有新的问题。' }); return; }
    const question = entry.group.questions[this.draft.questionIndex];
    const answer = this.draft.answers[question.id] || {};
    this.setData({ view: 'question', title: entry.group.title, contextNote: entry.group.contextNote, question,
      questionNumber: this.draft.questionIndex + 1, progress: this.draft.questionIndex * 20,
      selected: answer.optionId || '', supplement: answer.text || '', noteOpen: Boolean(answer.text || answer.optionId && question.options[4].id === answer.optionId), scrollTarget: '', error: '', busy: false, scrollTop: 0 });
  },
  saveCurrent() {
    if (!this.draft || this.data.view !== 'question' || stars.getRoomScope() !== this.scope) return { ok: true };
    const question = this.data.question;
    this.draft.answers[question.id] = { optionId: this.data.selected, text: this.data.supplement };
    const result = adapter.saveDraft(this.draft);
    if (!result.ok && this.pageActive) this.setData({ error: result.error.message });
    return result;
  },
  onSelect(event) {
    if (this.data.busy) return;
    const id = event.currentTarget.dataset.id;
    if (!this.data.question.options.some(option => option.id === id)) return;
    const isOther = id === this.data.question.options[4].id;
    this.setData({ selected: id, error: '', noteOpen: this.data.noteOpen || isOther, scrollTarget: isOther ? 'listen-supplement' : '' });
    this.saveCurrent();
  },
  onSupplement(event) {
    if (this.data.busy) return;
    this.setData({ supplement: event.detail.value });
    this.saveCurrent();
  },
  onAddNote() { this.setData({ noteOpen: true, scrollTarget: 'listen-supplement' }); },
  async onNext() {
    if (this.data.busy || !this.data.selected || stars.getRoomScope() !== this.scope) return;
    if (!this.saveCurrent().ok) return;
    if (this.draft.questionIndex < 4) {
      const next = JSON.parse(JSON.stringify(this.draft)); next.questionIndex++;
      const saved = adapter.saveDraft(next);
      if (!saved.ok) { this.setData({ error: saved.error.message }); return; }
      this.draft = next; this.renderQuestion(); return;
    }
    this.setData({ busy: true, error: '' });
    let result;
    try { result = await adapter.completeGroup(this.draft.groupId); }
    catch (error) { result = { ok: false, error: { message: '刚才没有保存好，请再试一次。' } }; }
    if (stars.getRoomScope() !== this.scope) return;
    if (!result.ok) { if (this.pageActive) this.setData({ busy: false, error: result.error.message }); else this.setData({ busy: false }); return; }
    this.draft = null;
    if (!this.pageActive) { this.pendingResult = result; return; }
    this.showFeedback(result.data, result.awardedStars);
    if (result.streakInterrupted && wx.showToast) wx.showToast({ title: '连续天数中断了', icon: 'none' });
  },
  showFeedback(result, awardedStars) {
    this.clearAward(); this.resultId = result.groupId;
    const stars = Number(awardedStars || 0);
    this.setData({
      view: 'feedback', title: result.title, feedback: result.feedback.petFeedback, awardedStars: stars,
      awardVisible: stars > 0, rewardLabel: stars > 0 ? '' : '谢谢你说给我听',
      categories: adapter.getState().data.categories, error: '', busy: false
    });
    if (stars > 0) this.playAward();
  },
  onContinue() {
    if (this.resultId) {
      const acknowledged = adapter.acknowledgeFeedback(this.resultId);
      if (!acknowledged.ok) { this.setData({ error: acknowledged.error.message }); return; }
    }
    this.clearAward(); this.showChoices();
  },
  showChoices() {
    const state = adapter.getState().data;
    if (!state.categories.length) { this.showEnd(state); return; }
    if (!state.completedToday) { this.startGroup(); return; }
    this.setData({ view: 'choices', categories: state.categories, error: '' });
  },
  showEnd(state) {
    let title = '今天先聊到这里';
    let endText = '明天再接着说。';
    if (state.exhausted) {
      title = '这些小事都听你说过啦';
      endText = '等有新的小事，我们再慢慢聊。';
    } else if (!state.categories.length && state.completedToday) {
      title = '明天再来';
      endText = '';
    }
    this.setData({ view: 'end', title, endText, error: '', busy: false });
  },
  onBack() {
    if (!this.saveCurrent().ok) return false;
    if (this.resultId && stars.getRoomScope() === this.scope) {
      const result = adapter.acknowledgeFeedback(this.resultId);
      if (!result.ok) { this.setData({ error: result.error.message }); return false; }
    }
    this.clearAward(); return true;
  },
  onReturnRoom() {
    if (!this.onBack()) return;
    if (getCurrentPages().length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/home/home' });
  },
  playAward() {
    this.awardTimer = setTimeout(() => { if (this.pageActive) this.setData({ awardVisible: false }); }, 2100);
    try {
      if (wx.createInnerAudioContext) { this.audio = wx.createInnerAudioContext({ useWebAudioImplement: true }); this.audio.src = SOUND; this.audio.volume = .2; this.audio.obeyMuteSwitch = true;
        if (this.audio.onError) this.audio.onError(() => this.releaseAudio());
        this.soundTimer = setTimeout(() => { if (this.pageActive && this.audio) { try { this.audio.play(); } catch (error) {} } }, 520); }
    } catch (error) { this.releaseAudio(); }
    if (!this.data.reducedMotion) this.hapticTimer = setTimeout(() => { if (this.pageActive && wx.vibrateShort) { try { wx.vibrateShort({ type: 'light' }); } catch (error) {} } }, 840);
  },
  releaseAudio() { if (this.audio) { try { this.audio.stop(); this.audio.destroy(); } catch (error) {} this.audio = null; } },
  clearAward() { clearTimeout(this.awardTimer); clearTimeout(this.soundTimer); clearTimeout(this.hapticTimer); this.releaseAudio(); if (this.data.awardVisible) this.setData({ awardVisible: false }); },
  onHide() { this.saveCurrent(); this.pageActive = false; this.clearAward(); },
  onUnload() { this.onHide(); }
});
