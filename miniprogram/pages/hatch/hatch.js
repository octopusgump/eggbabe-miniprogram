const petStore = require('../../utils/pet-store');
const analytics = require('../../services/analytics');
const cloudApi = require('../../services/cloud-api');
const config = require('../../config/v2');
const runtime = require('../../services/runtime-context');
const demoExperience = require('../../services/demo-experience');
const practice = require('../../services/incubation-practice');

const REVIEW_LABELS = {
  nickname: '你给了我一个名字',
  wish_pool: '我们一起把愿望放进了许愿池',
  touch: '你轻轻摸过我的蛋壳',
  doodle: '你亲手画过我的蛋壳',
  edu_class: '你在早教班教过我',
  pre_hatch_talk: '你隔着蛋壳和我说过话',
  heartbeat: '你听见了我的心跳',
  birth_gift: '你为我准备了出生礼物',
  personality_test: '我们完成了性格小测试'
};

Page({
  data: {
    phase: 'confirm',
    pet: null,
    gateMessage: '',
    resultError: '',
    reviewItems: [],
    particles: [
      { tx: '-140rpx', ty: '-110rpx', color: '#EDE78E' },
      { tx: '150rpx', ty: '-90rpx', color: '#F4B9AE' },
      { tx: '-170rpx', ty: '70rpx', color: '#9DB65B' },
      { tx: '160rpx', ty: '90rpx', color: '#EDE78E' },
      { tx: '0rpx', ty: '-180rpx', color: '#FFFFFF' },
      { tx: '30rpx', ty: '180rpx', color: '#F4B9AE' }
    ]
  },

  async onLoad() {
    const pet = petStore.getPet();
    if (pet && pet.collectionCard) {
      wx.redirectTo({ url: '/pages/collection-card/collection-card' });
      return;
    }
    if (!pet || petStore.getStage(pet) !== 'ready') {
      wx.showToast({ title: '还没到破壳时间', icon: 'none' });
      this.backTimer = setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const gateState = await practice.getHatchGateState();
    if (!gateState.ok) {
      this.setData({ pet, phase: 'blocked', gateMessage: gateState.message || '破壳准备状态暂时无法确认' });
      return;
    }
    const missing = [];
    if (!gateState.gates.incubation_ready) missing.push('修炼值还没有达到 100%');
    if (!gateState.gates.nickname_ready) missing.push('还没有名字');
    if (!gateState.gates.birth_gift_ready) missing.push('出生礼物内容尚未完成');
    const reviewItems = Array.from(new Set(
      (gateState.records || []).map(record => REVIEW_LABELS[record.module]).filter(Boolean)
    ));
    this.setData({
      pet,
      phase: gateState.canStartReview ? 'confirm' : 'blocked',
      gateMessage: missing.join('；'),
      reviewItems
    });
    analytics.track('hatch_receive_start');
  },

  async onReveal() {
    if (this.data.phase !== 'confirm' || !this.data.pet) return;
    const reviewResult = await practice.submitOnce('review');
    if (!reviewResult.ok && reviewResult.code !== 'already_done') {
      wx.showToast({ title: reviewResult.message || '回顾状态没有保存，请重试', icon: 'none' });
      return;
    }
    const gateState = await practice.getHatchGateState();
    if (!gateState.ok || !gateState.canHatch) {
      wx.showToast({ title: '破壳准备还没有全部完成', icon: 'none' });
      return;
    }
    this.setData({ phase: 'reveal', resultError: '' });
    this.revealTimer = setTimeout(() => {
      this.requestHatchCard();
    }, 1450);
  },

  requestHatchCard() {
    if (runtime.getMode() === 'demo') {
      this.handleHatchResult(demoExperience.generateHatchCard());
      return;
    }
    if (config.backendEnabled && runtime.getMode() === 'live') {
      cloudApi.generateHatchCard().then(result => this.handleHatchResult(result));
      return;
    }
    this.handleHatchResult({ ok: false, code: 'BACKEND_REQUIRED', message: '收藏卡需要由实体服务确认后生成' });
  },

  onRetryHatch() {
    if (this.data.phase !== 'error') return;
    this.setData({ phase: 'reveal', resultError: '' });
    this.requestHatchCard();
  },

  onBackHome() { wx.switchTab({ url: '/pages/home/home' }); },

  handleHatchResult(result) {
      if (!result.ok || result.mode !== runtime.getMode()) {
        analytics.track('data_write_fail', { where: 'hatch_card', error_code: result.reason || result.code || 'GENERATE_FAILED' });
        this.setData({ phase: 'error', resultError: result.message || '这次没有承接好，请重试' });
        return;
      }
      if (config.backendEnabled && runtime.getMode() === 'live') {
        const applied = petStore.applyCloudHatchCard(result.card);
        if (!applied.ok) {
          this.setData({ phase: 'error', resultError: applied.message || '收藏卡没有保存好，请重试' });
          return;
        }
      }
      analytics.track('hatch_card_ready', { card_id: result.card.card_id || result.card.id });
      wx.redirectTo({ url: '/pages/collection-card/collection-card?new=1' });
  },

  onUnload() {
    clearTimeout(this.backTimer);
    clearTimeout(this.revealTimer);
  }
});
