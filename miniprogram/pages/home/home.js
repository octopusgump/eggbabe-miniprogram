const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const timeService = require('../../services/time-service');
const sceneConfig = require('../../utils/life-scenes');
const syncQueue = require('../../services/sync-queue');
const environmentService = require('../../services/incubation-environment');
const config = require('../../config/v2');

const TOUCH_LINES = ['你碰到我啦。', '我轻轻晃了一下。', '我听见你了。', '壳里传来我小小的回应。'];
const TALK_REACTIONS = [
  { motion: 'egg--talk-soft', text: '' },
  { motion: 'egg--talk-happy', text: '我听见啦。' },
  { motion: 'egg--talk-glow', text: '' },
  { motion: 'egg--talk-color', text: '' },
  { motion: 'egg--talk-knock', text: '' }
];
const WEATHER_PARTICLES = Array.from({ length: 12 }, (_, index) => index);
const TASK_DEFINITIONS = {
  nickname: { title: '给我起个昵称', desc: '让我知道自己的名字', reward: '+20%', action: 'name', greeting: '今天给我起个名字好不好？' },
  doodle: { title: '装点我的蛋壳', desc: '选一种颜色和纹理', reward: '+20%', action: 'route', route: '/pages/doodle/doodle', greeting: '今天想帮我换一种颜色吗？' },
  cuddle: { title: '今天摸摸我', desc: '长按蛋壳 3 秒', reward: '+5%', action: 'hint', greeting: '今天摸摸我吧。' },
  wish: { title: '告诉我今天的愿望', desc: '让我更懂你的期待', reward: '+5%', action: 'route', route: '/pages/wish/wish', greeting: '今天也把愿望告诉我吧。' },
  lesson: { title: '今天教我一件事', desc: '你的选择会影响我的性格', reward: '+5%', action: 'route', route: '/pages/lesson/lesson', greeting: '今天想教我点什么？' },
  talk: { title: '跟我说说话', desc: '我会用身体回应你', reward: '', action: 'talk', greeting: '跟我说说话好不好？' }
};

function task(key, done) {
  return Object.assign({ key, done }, TASK_DEFINITIONS[key]);
}

function taskCandidates(pet, today) {
  const oneOff = [
    task('nickname', !!pet.tasks.nicknameDone),
    task('doodle', !!pet.tasks.doodleDone)
  ].filter(item => !item.done);
  const daily = [
    task('cuddle', pet.tasks.cuddleDate === today),
    task('wish', pet.tasks.wishDate === today),
    task('lesson', pet.tasks.lessonDate === today),
    task('talk', pet.tasks.talkDate === today)
  ];
  const start = Array.from(`${pet.id}-${today}`).reduce((sum, char) => sum + char.charCodeAt(0), 0) % daily.length;
  const rotated = daily.slice(start).concat(daily.slice(0, start));
  return oneOff.concat(rotated).slice(0, 2);
}

Page({
  data: {
    pet: null,
    stage: 'empty',
    stageText: '',
    actionLabel: '',
    dailyStatus: null,
    feedback: '',
    eggMotion: '',
    cuddleProgress: 0,
    hasScenes: false,
    syncPending: 0,
    activationCode: config.localActivationCode,
    hatchedActivationCode: config.localHatchedActivationCode,
    sceneImage: '',
    environment: environmentService.resolve(),
    weatherParticles: WEATHER_PARTICLES,
    homeTasks: [],
    greeting: '',
    greetingAction: '',
    progressTip: false,
    talkDraft: '',
    talkCount: 0,
    talkFocused: false,
    tapParticles: [],
    showNameSheet: false,
    nameDraft: '',
    nameCount: 0,
    nameError: '',
    savingName: false
  },

  async onShow() {
    const pet = petStore.getPet();
    if (!pet) {
      this.setData({ pet: null, stage: 'empty', hasScenes: false, homeTasks: [], greeting: '', showNameSheet: false, syncPending: syncQueue.pendingCount() });
      return;
    }
    const stage = petStore.getStage(pet);
    const presentation = petStore.getStagePresentation(stage);
    const hatched = stage === 'hatched';
    const showNameSheet = !hatched && petStore.shouldPromptNickname();
    const homeTasks = hatched || stage === 'ready' ? [] : taskCandidates(pet, petStore.todayKey());
    let greeting = '';
    let greetingAction = '';
    if (!hatched && !showNameSheet && petStore.shouldShowDailyGreeting()) {
      const task = homeTasks.find(item => !item.done) || homeTasks[0];
      if (task) {
        greeting = task.greeting || '今天也陪我一会儿吧。';
        greetingAction = task.key;
        petStore.markDailyGreetingShown();
      }
    }
    const app = typeof getApp === 'function' ? getApp() : null;
    const serverEnvironment = app && app.globalData ? app.globalData.incubationEnvironment : null;
    this.setData({
      pet,
      stage,
      stageText: presentation.homeText,
      actionLabel: presentation.actionLabel,
      dailyStatus: hatched ? petStore.getDailyStatus() : null,
      homeTasks,
      greeting,
      greetingAction,
      showNameSheet,
      nameDraft: pet.name || '',
      nameCount: Array.from(pet.name || '').length,
      nameError: '',
      hasScenes: hatched && sceneConfig.getScenesForCharacter(pet.prototype).length > 0,
      sceneImage: hatched ? sceneConfig.getScene('grass', pet.prototype).image : '',
      environment: environmentService.resolve(serverEnvironment),
      syncPending: syncQueue.pendingCount()
    });
    analytics.track(hatched ? 'role_home_view' : 'hatch_home_view');
    if (hatched && this.data.dailyStatus) analytics.track('daily_status_viewed', { where: 'role_home', mood_type: this.data.dailyStatus.mood });
  },

  onAddDevice() { wx.navigateTo({ url: '/pages/add-device/add-device' }); },

  onRoleTap() {
    if (this.completedLongPress) {
      this.completedLongPress = false;
      return;
    }
    wx.navigateTo({ url: '/pages/life-scene/life-scene?scene=grass' });
  },

  onChangeScene() { wx.navigateTo({ url: '/pages/life-scenes/life-scenes' }); },

  onPetNameTap() {
    if (this.data.stage === 'hatched') {
      wx.navigateTo({ url: '/pages/nickname/nickname' });
      return;
    }
    this.setData({ showNameSheet: true, nameError: '' });
  },

  showFeedback(text) {
    this.setData({ feedback: text });
    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => this.setData({ feedback: '' }), 2200);
  },

  spawnTapParticles(event) {
    const id = `tap-${timeService.now()}-${this.particleSequence = (this.particleSequence || 0) + 1}`;
    const point = event.detail || {};
    wx.createSelectorQuery().in(this).select('.egg-zone').boundingClientRect(rect => {
      if (!rect) return;
      const x = Math.max(24, Math.min(rect.width - 24, Number(point.x || rect.left + rect.width / 2) - rect.left));
      const y = Math.max(24, Math.min(rect.height - 24, Number(point.y || rect.top + rect.height / 2) - rect.top));
      const next = this.data.tapParticles.concat({ id, x, y }).slice(-3);
      this.setData({ tapParticles: next });
      const timer = setTimeout(() => {
        this.setData({ tapParticles: this.data.tapParticles.filter(item => item.id !== id) });
        this.particleTimers = (this.particleTimers || []).filter(item => item !== timer);
      }, 560);
      this.particleTimers = (this.particleTimers || []).concat(timer);
    }).exec();
  },

  onEggTap(event) {
    if (this.completedLongPress) {
      this.completedLongPress = false;
      return;
    }
    this.spawnTapParticles(event);
    const now = timeService.now();
    this.setData({ eggMotion: 'egg--wobble' });
    clearTimeout(this.wobbleTimer);
    this.wobbleTimer = setTimeout(() => this.setData({ eggMotion: '' }), 600);
    petStore.recordTouch();
    analytics.track('egg_tap', { tap_count: 1 });
    if (this.lastTapAt && now - this.lastTapAt < 2000) return;
    this.lastTapAt = now;
    this.showFeedback(TOUCH_LINES[Math.floor(Math.random() * TOUCH_LINES.length)]);
  },

  vibrateCuddleTick() {
    if (this.vibrationCount >= 3) return;
    this.vibrationCount += 1;
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
  },

  onTouchStart() {
    if (!this.data.pet) return;
    this.clearCuddleTimers();
    this.completedLongPress = false;
    this.vibrationCount = 0;
    const started = timeService.now();
    this.setData({ eggMotion: 'egg--warming', cuddleProgress: 1 });
    this.cuddleTicker = setInterval(() => {
      const progress = Math.min(99, Math.round((timeService.now() - started) / 30));
      this.setData({ cuddleProgress: progress });
    }, 90);
    this.cuddleVibrationTicker = setInterval(() => this.vibrateCuddleTick(), 1000);
    this.cuddleTimer = setTimeout(() => {
      clearInterval(this.cuddleTicker);
      clearInterval(this.cuddleVibrationTicker);
      if (this.vibrationCount < 3) this.vibrateCuddleTick();
      const result = this.data.stage === 'hatched' ? { ok: true, added: 0 } : petStore.completeCuddle();
      if (!result.ok) {
        this.clearCuddleTimers();
        this.setData({ cuddleProgress: 0, eggMotion: '' });
        this.showFeedback(result.message || '这次没有记录成功，请再试一次');
        return;
      }
      analytics.track(this.data.stage === 'hatched' ? 'role_cuddle_complete' : 'pat_egg_complete');
      if (this.data.stage !== 'hatched') analytics.track('incubation_action', { action_type: 'cuddle', is_first_time: !!result.added, progress_delta: result.added || 0 });
      this.completedLongPress = true;
      this.setData({ cuddleProgress: 100, eggMotion: 'egg--warm' });
      this.showFeedback(result.added ? '我暖起来了 · 孵化进度 +5%' : '我又往你这边靠了靠');
      this.cuddleResetTimer = setTimeout(() => {
        this.setData({ cuddleProgress: 0, eggMotion: '' });
        this.onShow();
      }, 900);
    }, 3000);
  },

  onTouchEnd() {
    clearTimeout(this.cuddleTimer);
    clearInterval(this.cuddleTicker);
    clearInterval(this.cuddleVibrationTicker);
    if (!this.completedLongPress) this.setData({ cuddleProgress: 0, eggMotion: '' });
  },

  clearCuddleTimers() {
    clearTimeout(this.cuddleTimer);
    clearTimeout(this.cuddleResetTimer);
    clearInterval(this.cuddleTicker);
    clearInterval(this.cuddleVibrationTicker);
  },

  onTaskTap(event) {
    const key = event.currentTarget.dataset.key;
    const task = this.data.homeTasks.find(item => item.key === key);
    if (!task) return;
    if (task.action === 'name') return this.setData({ showNameSheet: true, nameError: '' });
    if (task.action === 'hint') return this.showFeedback('长按我 3 秒，完成今天的贴贴吧。');
    if (task.action === 'talk') return this.setData({ talkFocused: true });
    if (task.action === 'route') wx.navigateTo({ url: task.route });
  },

  onGreetingTap() {
    const key = this.data.greetingAction;
    this.setData({ greeting: '', greetingAction: '' });
    this.onTaskTap({ currentTarget: { dataset: { key } } });
  },

  onProgressTap() {
    this.setData({ progressTip: true });
    clearTimeout(this.progressTipTimer);
    this.progressTipTimer = setTimeout(() => this.setData({ progressTip: false }), 2000);
  },

  onTalkInput(event) {
    const value = Array.from(event.detail.value || '').slice(0, 50).join('');
    this.setData({ talkDraft: value, talkCount: Array.from(value).length });
  },

  onTalkSubmit() {
    const result = petStore.completeTalk(this.data.talkDraft);
    if (!result.ok) return this.showFeedback(result.message || '换个说法告诉我吧');
    const reaction = TALK_REACTIONS[Math.floor(timeService.now()) % TALK_REACTIONS.length];
    this.setData({ talkDraft: '', talkCount: 0, talkFocused: false, eggMotion: reaction.motion });
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    if (reaction.text) this.showFeedback(reaction.text);
    analytics.track('incubation_action', { action_type: 'talk', is_first_time: !!result.added, progress_delta: result.added || 0 });
    clearTimeout(this.talkReactionTimer);
    this.talkReactionTimer = setTimeout(() => {
      this.setData({ eggMotion: '' });
      this.onShow();
    }, 900);
  },

  onNameInput(event) {
    const value = Array.from(event.detail.value || '').slice(0, 10).join('');
    this.setData({ nameDraft: value, nameCount: Array.from(value).length, nameError: '' });
  },

  onSaveName() {
    if (this.data.savingName) return;
    this.setData({ savingName: true, nameError: '' });
    const result = petStore.updateNickname(this.data.nameDraft);
    if (!result.ok) {
      this.setData({ savingName: false, nameError: result.message || '名字没有保存成功' });
      return;
    }
    analytics.track('incubation_action', { action_type: 'nickname', is_first_time: !!result.added, progress_delta: result.added || 0 });
    this.setData({ savingName: false, showNameSheet: false });
    this.showFeedback(result.added ? '我记住自己的名字啦 · +20%' : '我记住新名字啦');
    this.onShow();
  },

  onSkipName() {
    const result = petStore.dismissNicknamePrompt();
    if (!result.ok) return this.setData({ nameError: result.message });
    this.setData({ showNameSheet: false, nameError: '' });
    this.onShow();
  },

  noop() {},

  onPrimaryAction() {
    if (this.data.stage === 'ready') wx.navigateTo({ url: '/pages/hatch/hatch' });
    else if (this.data.stage === 'hatched') wx.navigateTo({ url: '/pages/chat/chat' });
  },

  clearInteractionTimers() {
    this.clearCuddleTimers();
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.wobbleTimer);
    clearTimeout(this.progressTipTimer);
    clearTimeout(this.talkReactionTimer);
    (this.particleTimers || []).forEach(clearTimeout);
    this.particleTimers = [];
  },

  onHide() {
    this.clearInteractionTimers();
    this.completedLongPress = false;
    this.setData({ cuddleProgress: 0, eggMotion: '', feedback: '', progressTip: false, tapParticles: [] });
  },

  onUnload() { this.clearInteractionTimers(); }
});
