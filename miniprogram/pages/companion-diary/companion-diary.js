const petStore = require('../../utils/pet-store');
const config = require('../../config/v2');
const stars = require('../../services/iaa-star-unlock-adapter');
const diaryAdapter = require('../../services/companion-diary-adapter');
const { createInlineNoticeController } = require('../../utils/inline-notice-controller');

function splitParagraphs(body) {
  return String(body || '')
    .split(/\n\n+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function parseSignOff(signOff) {
  const raw = String(signOff || '').trim();
  const commaMatch = raw.match(/^(.+[，,])\s*(.*)$/);
  if (commaMatch) {
    return { signOffLine: commaMatch[1], signOffName: commaMatch[2] || '' };
  }
  return { signOffLine: raw, signOffName: '' };
}

Page({
  data: {
    screenState: 'loading',
    detail: null,
    paragraphs: [],
    signOffLine: '',
    signOffName: '',
    pet: null,
    shareSheetVisible: false,
    systemNoticeText: '',
    systemNoticeTone: 'info',
    systemNoticeVisible: false
  },

  onLoad(query) {
    this.pageActive = true;
    this.entryKey = (query && query.entry) || 'room';
    const pet = this.currentPet();
    if (!pet || petStore.getStage(pet) !== 'hatched') {
      this.setData({ screenState: 'error', detail: null, paragraphs: [] });
      this.showSystemNotice('破壳后才能打开日记。', 'warning');
      return;
    }
    this.setData({ pet });
    this.loadDiary();
  },

  onShow() {
    this.pageActive = true;
  },

  onUnload() {
    this.pageActive = false;
  },

  currentPet() {
    const stored = petStore.getPet();
    if (stored && petStore.getStage(stored) === 'hatched') return stored;
    return config.localDemoEnabled ? stars.getConfiguredPet() || stored : stored;
  },

  loadDiary() {
    const pet = this.data.pet || this.currentPet();
    this.setData({ screenState: 'loading', detail: null, paragraphs: [] });
    return diaryAdapter
      .getDiaryDetail({ pet, entry: this.entryKey })
      .then(result => {
        if (!this.pageActive) return;
        if (!result.ok) {
          this.setData({ screenState: 'error', detail: null, paragraphs: [] });
          this.showSystemNotice((result.error && result.error.message) || '日记没有打开，请重试', 'warning');
          return;
        }
        const detail = result.data;
        const signOff = parseSignOff(detail.signOff);
        this.setData({
          screenState: 'ready',
          detail,
          paragraphs: splitParagraphs(detail.body),
          signOffLine: signOff.signOffLine,
          signOffName: signOff.signOffName
        });
      });
  },

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

  onOpenShareSheet() {
    if (this.data.screenState !== 'ready' || !this.data.detail) return;
    this.setData({ shareSheetVisible: true });
  },

  onCloseShareSheet() {
    this.setData({ shareSheetVisible: false });
  },

  onShareOverlayTap() {
    this.onCloseShareSheet();
  },

  stopOverlayBubble() {},

  onSaveShareCard() {
    this.showSystemNotice('日记已保存到相册（开发样例，正式版将生成分享图）', 'success');
  },

  onShareAppMessage() {
    const detail = this.data.detail;
    return {
      title: (detail && detail.shareCardTitle) || '来自蛋宝宝的日记',
      path: '/pages/life-scene/life-scene?open=toolbox-diary'
    };
  }
});
