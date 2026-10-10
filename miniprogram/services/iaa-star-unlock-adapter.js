const { createPhotoState } = require('./companion-photo-state');
const photoCatalog = require('./companion-photo-catalog');
let photoState = createPhotoState();
let roomPet = null;
const fixture = require('../fixtures/iaa-star-unlock');
const { decideDrawingGift } = require('./companion-drawing-gift');

const { dailyStars, shanghaiDate, previousShanghaiDate } = require('./companion-star-rules');
let roomPreviewView = null;
let roomPetId = '';
let collectedMemories = [];
let companionDraft = null;
let companionDraftStartDate = null;
let completedDrawingIds = new Set();
let firstDrawingGiftDone = false;
let drawingGiftResults = new Map();
let activityState = { current: null, firstResultSeen: false };
/** Shanghai date of last letter open that counted toward 一起 X 天 (session mock). */
let lastLetterOpenDate = null;

function configureRoom(petId, pet) {
  roomPet = pet || roomPet;
  if (String(petId || '') !== roomPetId) {
    roomPetId = String(petId || '');
    photoState = createPhotoState();
    roomPreviewView = null;
    collectedMemories = [];
    companionDraft = null;
    companionDraftStartDate = null;
    completedDrawingIds = new Set();
    firstDrawingGiftDone = false;
    drawingGiftResults = new Map();
    activityState = { current: null, firstResultSeen: false };
    lastLetterOpenDate = null;
  }
}
function getMemories() { return clone(collectedMemories); }
function collectMemory(memory) {
  if (!memory || !memory.image || !memory.id) return false;
  if (!collectedMemories.some(item => item.id === memory.id)) collectedMemories.unshift(clone(memory));
  return true;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStarUnlockView(options) {
  const state = String(options && options.state || 'AVAILABLE');
  const data = fixture.starUnlockViewFor(state);
  if (!data) {
    return Promise.resolve({ ok: false, error: { code: 'UNKNOWN_LOCAL_STATE', message: '没有找到这个本地演示状态。' } });
  }
  return Promise.resolve({ ok: true, data });
}

function applyDisconnectClear(star, today) {
  if (!lastLetterOpenDate || lastLetterOpenDate === today) return;
  if (lastLetterOpenDate === previousShanghaiDate(today)) return;
  star.companionDays = 0;
}

function refreshDailyBasis(star) {
  const days = Number(star.companionDays || 0);
  star.dailyBasis = dailyStars(star.effectiveDone ? days : days + 1);
}

// 本次运行内的静态演示账本；真实幂等与持久化由后续服务端实现。
function ensureDaily(view) {
  const date = shanghaiDate();
  const star = view.star;
  if (view.dateKey !== date) {
    view.dateKey = date;
    star.dailyClaimStatus = 'AVAILABLE';
    star.baseClaimed = false;
    star.drawingBonusClaimed = false;
    star.effectiveDone = false;
    star.noteCollected = false;
    applyDisconnectClear(star, date);
    refreshDailyBasis(star);
    view.newlyUnlockedMemory = null;
  }
  if (typeof star.baseClaimed !== 'boolean') star.baseClaimed = ['CLAIMED', 'UNLOCKED'].includes(star.dailyClaimStatus);
  if (typeof star.effectiveDone !== 'boolean') star.effectiveDone = false;
  if (typeof star.noteCollected !== 'boolean') star.noteCollected = false;
  if (typeof star.drawingBonusClaimed !== 'boolean') star.drawingBonusClaimed = false;
  applyDisconnectClear(star, date);
  if (!star.dailyBasis) refreshDailyBasis(star);
  return view;
}
function getRoomStarView() {
  if (!roomPreviewView) { roomPreviewView = fixture.starUnlockViewFor('AVAILABLE'); roomPreviewView.dateKey = shanghaiDate(); }
  ensureDaily(roomPreviewView);
  return Promise.resolve({ ok: true, data: clone(roomPreviewView) });
}
function resetRoomStarView(state) {
  const next = fixture.starUnlockViewFor(String(state || 'AVAILABLE'));
  if (!next) return { ok: false, error: { code: 'UNKNOWN_LOCAL_STATE', message: '没有找到这个本地演示状态。' } };
  roomPreviewView = clone(next);
  roomPreviewView.dateKey = shanghaiDate();
  lastLetterOpenDate = null;
  ensureDaily(roomPreviewView);
  return { ok: true, data: clone(roomPreviewView) };
}

/** 当日首次点开信纸：一起 X 天 +1，0 星；断天则从 1 重计。 */
function recordLetterOpen(view) {
  if (!view || !view.star || !view.star.dailyClaimStatus) {
    return Promise.resolve({ ok: false, error: { code: 'INVALID_LOCAL_VIEW', message: '这次陪伴还没有准备好。' } });
  }
  if (view.star.dailyClaimStatus === 'ERROR') {
    return Promise.resolve({ ok: false, error: { code: 'LOCAL_FIXTURE_RECORD_FAILED', message: '刚才没有记下来，请再试一次。' } });
  }
  const current = ensureDaily(clone(roomPreviewView || view));
  const star = current.star;
  const today = shanghaiDate();
  applyDisconnectClear(star, today);
  let effectiveAdded = false;
  if (!star.effectiveDone) {
    star.companionDays = Number(star.companionDays || 0) + 1;
    star.effectiveDone = true;
    lastLetterOpenDate = today;
    effectiveAdded = true;
    refreshDailyBasis(star);
  }
  current.helperText = star.effectiveDone ? '今天的陪伴已经记下。' : '打开信件记下今天的陪伴。';
  roomPreviewView = clone(current);
  return Promise.resolve({
    ok: true,
    data: current,
    awardedStars: 0,
    baseAwardedStars: 0,
    giftStars: 0,
    effectiveAdded,
    duplicate: !effectiveAdded
  });
}

function settle(view, kind, drawingId, options) {
  if (!view || !view.star || !view.star.dailyClaimStatus) return Promise.resolve({ ok: false, error: { code: 'INVALID_LOCAL_VIEW', message: '这次陪伴还没有准备好。' } });
  if (view.star.dailyClaimStatus === 'ERROR') return Promise.resolve({ ok: false, error: { code: 'LOCAL_FIXTURE_RECORD_FAILED', message: '刚才没有记下来，请再试一次。' } });
  const current = ensureDaily(clone(roomPreviewView || view));
  const star = current.star;
  let awardedStars = 0;
  let giftStars = 0;
  let drawingGift = drawingId ? drawingGiftResults.get(drawingId) || null : null;
  const alreadyCompleted = (kind === 'complete' && drawingId && completedDrawingIds.has(drawingId)) || (kind === 'ordinary' && star.noteCollected);
  if (!alreadyCompleted) {
    if (kind !== 'complete' && !star.baseClaimed) { awardedStars = star.dailyBasis; star.baseClaimed = true; }
    if (kind === 'complete' && !star.drawingBonusClaimed) {
      drawingGift = decideDrawingGift(!firstDrawingGiftDone, options && options.random);
      awardedStars = star.dailyBasis;
      giftStars = drawingGift.stars;
      star.drawingBonusClaimed = true;
      firstDrawingGiftDone = true;
      if (drawingId) drawingGiftResults.set(drawingId, clone(drawingGift));
    }
    // 「一起 X 天」只由 recordLetterOpen 增加；完成普通/画画不 +1。
    if (kind === 'ordinary') star.noteCollected = true;
    if (kind === 'complete' && drawingId) completedDrawingIds.add(drawingId);
  }
  star.balance = Number(star.balance || 0) + awardedStars + giftStars;
  star.dailyClaimStatus = star.baseClaimed ? (star.balance >= current.nextMemory.unlockedAtStar ? 'UNLOCKED' : 'CLAIMED') : 'AVAILABLE';
  current.progress = fixture.progressPresentation(star.balance, star.nextUnlockAt);
  // 保留旧 demo 合同，不在正式纪念册自动收录其样例照片。
  current.newlyUnlockedMemory = awardedStars > 0 && star.balance >= current.nextMemory.unlockedAtStar ? clone(current.nextMemory) : null;
  current.helperText = star.effectiveDone ? '今天的陪伴已经记下。' : '打开信件记下今天的陪伴。';
  roomPreviewView = clone(current);
  return Promise.resolve({
    ok: true,
    data: current,
    awardedStars: awardedStars + giftStars,
    baseAwardedStars: awardedStars,
    giftStars,
    drawingGift: drawingGift ? clone(drawingGift) : null,
    effectiveAdded: false,
    duplicate: awardedStars === 0 && giftStars === 0
  });
}
function recordCompanion(view, options) {
  return settle(view, 'ordinary').then(result => {
    if (result.ok && options && options.paper) result.paperPhoto = photoState.offer(photoCatalog.eligiblePhotos(roomPet, shanghaiDate()), options);
    return result;
  });
}
function getPendingPhotos() { return photoState.getPending(); }
function collectPhoto(id) {
  const photo = photoState.find(id);
  if (!photo) return { ok: false };
  const collected = Object.assign({}, photo, { collected: true });
  if (!collectMemory(collected)) return { ok: false };
  photoState.receive(id);
  return { ok: true, memory: collected };
}
function getExchangePhoto() {
  const photo = photoCatalog.eligiblePhotos(roomPet, shanghaiDate()).find(item => item.kind === 'exchange');
  if (!photo) return null;
  return Object.assign({}, clone(photo), { owned: Boolean(photoState.find(photo.id)), cost: 10 });
}
function exchangePhoto(id, ready) {
  const photo = getExchangePhoto();
  if (!photo || photo.id !== id) return { ok: false, error: { code: 'PHOTO_NOT_READY' } };
  if (photo.owned) return { ok: true, duplicate: true, memory: photoState.find(id) };
  if (!ready) return { ok: false, error: { code: 'PHOTO_NOT_READY' } };
  if (!roomPreviewView || Number(roomPreviewView.star.balance || 0) < 10) return { ok: false, error: { code: 'INSUFFICIENT_STARS' } };
  deductActivityStars(10);
  const memory = photoState.purchase(photo);
  collectMemory(memory);
  return { ok: true, memory };
}
function recordDrawingStart(view) { return settle(view, 'start'); }
function recordDrawingComplete(view, drawingId, options) {
  if (!drawingId || typeof drawingId !== 'string') return Promise.resolve({ ok: false, error: { code: 'DRAWING_ID_REQUIRED', message: '这幅画还没有准备好，请再试一次。' } });
  return settle(view, 'complete', drawingId, options);
}
function getCompanionDraft() { return companionDraft ? clone(companionDraft) : null; }
function setCompanionDraft(art) { companionDraft = art ? clone(art) : null; if (!art) companionDraftStartDate = null; }
function getCompanionDraftStartDate() { return companionDraftStartDate; }
function markCompanionDraftStarted() { companionDraftStartDate = shanghaiDate(); }

// 活动协议准备：照片、文案与结算时点由已确认配置传入，不自行选定。
function getActivityState() { return clone(activityState); }
function deductActivityStars(cost) {
  roomPreviewView.star.balance = Number(roomPreviewView.star.balance || 0) - cost;
  roomPreviewView.progress = fixture.progressPresentation(roomPreviewView.star.balance, roomPreviewView.star.nextUnlockAt);
  roomPreviewView.newlyUnlockedMemory = null;
}
function beginTeaActivity(options) {
  const input = options || {};
  if (activityState.current) return { ok: true, resumed: true, data: getActivityState() };
  if (!input.id || !input.photo || !input.photo.image) {
    return { ok: false, error: { code: 'ACTIVITY_NOT_CONFIGURED' } };
  }
  if (!roomPreviewView) { roomPreviewView = fixture.starUnlockViewFor('AVAILABLE'); roomPreviewView.dateKey = shanghaiDate(); }
  ensureDaily(roomPreviewView);
  const cost = activityState.firstResultSeen ? 20 : 0;
  if (Number(roomPreviewView.star.balance || 0) < cost) return { ok: false, error: { code: 'INSUFFICIENT_STARS' } };
  activityState.current = { id: String(input.id), phase: 'choosing', choice: null, cost, paid: false, photo: clone(input.photo) };
  return { ok: true, data: getActivityState() };
}
function chooseTea(choice) {
  const current = activityState.current;
  if (!current || !['choosing', 'confirming'].includes(current.phase) || typeof choice !== 'string' || !choice.trim()) return { ok: false, error: { code: 'INVALID_ACTIVITY_CHOICE' } };
  current.choice = choice;
  current.phase = 'confirming';
  return { ok: true, data: getActivityState() };
}
function confirmTeaActivity() {
  const current = activityState.current;
  if (!current) return { ok: false, error: { code: 'NO_ACTIVITY' } };
  if (current.phase === 'result') return { ok: true, duplicate: true, data: getActivityState(), effectiveAdded: false };
  if (current.phase !== 'confirming' || !current.choice) return { ok: false, error: { code: 'CHOICE_REQUIRED' } };
  ensureDaily(roomPreviewView);
  if (!current.paid) {
    if (Number(roomPreviewView.star.balance || 0) < current.cost) return { ok: false, error: { code: 'INSUFFICIENT_STARS' } };
    deductActivityStars(current.cost);
    current.paid = true;
  }
  // 茶会永不因完成使「一起 X 天」+1。
  current.completedDate = shanghaiDate();
  current.phase = 'result';
  return { ok: true, effectiveAdded: false, data: getActivityState() };
}
function collectTeaActivity() {
  const current = activityState.current;
  if (!current || current.phase !== 'result') return { ok: false, error: { code: 'RESULT_REQUIRED' } };
  const memory = Object.assign({}, current.photo, { id: current.id, date: current.completedDate || shanghaiDate() });
  if (!collectMemory(memory)) return { ok: false, error: { code: 'INVALID_ACTIVITY_PHOTO' } };
  activityState.firstResultSeen = true;
  activityState.current = null;
  return { ok: true, memory: clone(memory), data: getActivityState() };
}

function retryCompanion() {
  return getStarUnlockView({ state: 'AVAILABLE' }).then(result => {
    if (!result.ok) return result;
    return recordCompanion(result.data);
  });
}

module.exports = {
  contractVersion: 'iaa-mvp-v1',
  source: 'local-fixture',
  configureRoom,
  getRoomIdentity: () => roomPetId,
  getMemories,
  getPendingPhotos,
  collectPhoto,
  getExchangePhoto,
  exchangePhoto,
  collectMemory,
  getStarUnlockView,
  getRoomStarView,
  resetRoomStarView,
  recordLetterOpen,
  recordCompanion,
  recordDrawingStart,
  recordDrawingComplete,
  getCompanionDraft,
  setCompanionDraft,
  getCompanionDraftStartDate,
  markCompanionDraftStarted,
  getActivityState,
  beginTeaActivity,
  chooseTea,
  confirmTeaActivity,
  collectTeaActivity,
  retryCompanion
};
