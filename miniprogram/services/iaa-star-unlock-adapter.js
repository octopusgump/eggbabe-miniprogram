const { createPhotoState } = require('./companion-photo-state');
const photoCatalog = require('./companion-photo-catalog');
let photoState = createPhotoState();
let roomPet = null;
const fixture = require('../fixtures/iaa-star-unlock');
const { decideDrawingGift } = require('./companion-drawing-gift');
const localCache = require('./companion-local-cache');

const { dailyStars, shanghaiDate, previousShanghaiDate } = require('./companion-star-rules');
const LISTEN_EXTRA_STARS = 10;
const PROP_DRAWING_REWARD = 10;
let roomPreviewView = null;
let roomPetId = '';
let collectedMemories = [];
let companionDraft = null;
let companionDraftStartDate = null;
let completedDrawingIds = new Set();
let firstDrawingGiftDone = false;
let drawingGiftResults = new Map();
let activityState = { current: null, firstResultSeen: false };
let lastEffectiveDate = null;
let listeningState = { cursors: {}, day: null, draft: null, results: {} };
let invitation = null;
let roomCacheKey = '';

function snapshot() {
  return clone({ version: 1, roomPreviewView, lastEffectiveDate, completedDrawingIds: [...completedDrawingIds],
    firstDrawingGiftDone, drawingGiftResults: [...drawingGiftResults], listeningState, invitation,
    collectedMemories, activityState, photos: photoState.snapshot() });
}
function restore(value) {
  roomPreviewView = value.roomPreviewView || null;
  lastEffectiveDate = value.lastEffectiveDate || null;
  completedDrawingIds = new Set(value.completedDrawingIds || []);
  firstDrawingGiftDone = Boolean(value.firstDrawingGiftDone);
  drawingGiftResults = new Map(value.drawingGiftResults || []);
  listeningState = value.listeningState || { cursors: {}, day: null, draft: null, results: {} };
  invitation = value.invitation || null;
  collectedMemories = value.collectedMemories || [];
  activityState = value.activityState || { current: null, firstResultSeen: false };
  photoState = createPhotoState(value.photos);
}
function persist() { return !roomCacheKey || localCache.write(roomCacheKey, snapshot()); }
function saveFailure() { return { ok: false, error: { code: 'LOCAL_WRITE_FAILED', message: '刚才没有保存好，请再试一次。' } }; }
function configureRoom(petId, pet) {
  const nextId = String(petId || '');
  const nextPet = pet || (nextId === roomPetId ? roomPet : null);
  const key = localCache.keyFor(nextId, nextPet);
  if (key === roomCacheKey) { roomPet = nextPet; return; }
  roomPetId = nextId;
  roomPet = nextPet;
  roomCacheKey = key;
  restore(localCache.read(key) || {});
  companionDraft = null;
  companionDraftStartDate = null;
}
function getListeningState() { return clone(listeningState); }
function saveListeningState(value) {
  const previous = snapshot();
  listeningState = clone(value);
  if (!persist()) { restore(previous); return saveFailure(); }
  return { ok: true, data: getListeningState() };
}
function getTodayInvitationKind() {
  const date = shanghaiDate();
  return invitation && invitation.date === date ? invitation.kind : null;
}
function getDailyInvitation(activities, random) {
  const date = shanghaiDate();
  if (invitation && invitation.date === date) return { ok: true, data: clone(invitation) };
  if (!activities.length) return { ok: true, data: null };
  const previous = invitation;
  const index = Math.min(activities.length - 1, Math.max(0, Math.floor((random || Math.random)() * activities.length)));
  invitation = { date, kind: activities[index] };
  if (!persist()) { invitation = previous; return saveFailure(); }
  return { ok: true, data: clone(invitation) };
}
function getActivityCompleted(kind) {
  if (!roomPreviewView) return false;
  ensureDaily(roomPreviewView);
  const star = roomPreviewView.star;
  if (kind === 'listen') return Boolean(listeningState.day && listeningState.day.date === shanghaiDate() && listeningState.day.categories.length);
  if (kind === 'drawing') return false;
  return Boolean(star.noteCollected);
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
  if (!lastEffectiveDate || lastEffectiveDate === today) return;
  if (lastEffectiveDate === previousShanghaiDate(today)) return;
  star.companionDays = 0;
}

function refreshDailyBasis(star) {
  const days = Number(star.companionDays || 0);
  star.dailyBasis = dailyStars(star.effectiveDone ? days : days + 1);
}

// 本机前端账本；真实账户、可信时间与跨设备幂等由后续服务端实现。
function ensureDaily(view, dateKey) {
  const date = dateKey || shanghaiDate();
  const star = view.star;
  if (view.dateKey !== date) {
    view.dateKey = date;
    star.dailyClaimStatus = 'AVAILABLE';
    star.baseClaimed = false;
    star.drawingGiftChecked = false;
    star.drawingCompleted = false;
    star.effectiveDone = false;
    star.noteCollected = false;
    applyDisconnectClear(star, date);
    refreshDailyBasis(star);
    view.newlyUnlockedMemory = null;
  }
  if (typeof star.baseClaimed !== 'boolean') star.baseClaimed = ['CLAIMED', 'UNLOCKED'].includes(star.dailyClaimStatus);
  if (typeof star.effectiveDone !== 'boolean') star.effectiveDone = false;
  if (typeof star.noteCollected !== 'boolean') star.noteCollected = false;
  if (typeof star.drawingGiftChecked !== 'boolean') star.drawingGiftChecked = false;
  if (typeof star.drawingCompleted !== 'boolean') star.drawingCompleted = false;
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
  lastEffectiveDate = null;
  completedDrawingIds = new Set();
  drawingGiftResults = new Map();
  firstDrawingGiftDone = false;
  ensureDaily(roomPreviewView);
  return { ok: true, data: clone(roomPreviewView) };
}

/** 打开信封：发放当日基础星一次（§5.1）；不增加「一起 X 天」。 */
function recordLetterOpen(view) {
  if (!view || !view.star || !view.star.dailyClaimStatus) return Promise.resolve({ ok: false, error: { code: 'INVALID_LOCAL_VIEW', message: '这次陪伴还没有准备好。' } });
  if (view.star.dailyClaimStatus === 'ERROR') return Promise.resolve({ ok: false, error: { code: 'LOCAL_FIXTURE_RECORD_FAILED', message: '刚才没有记下来，请再试一次。' } });
  const previous = snapshot();
  const current = ensureDaily(clone(roomPreviewView || view));
  const star = current.star;
  refreshDailyBasis(star);
  let baseAwardedStars = 0;
  if (!star.baseClaimed) {
    baseAwardedStars = star.dailyBasis;
    star.baseClaimed = true;
    star.balance = Number(star.balance || 0) + baseAwardedStars;
    star.dailyClaimStatus = star.balance >= current.nextMemory.unlockedAtStar ? 'UNLOCKED' : 'CLAIMED';
    current.progress = fixture.progressPresentation(star.balance, star.nextUnlockAt);
    current.newlyUnlockedMemory = baseAwardedStars > 0 && star.balance >= current.nextMemory.unlockedAtStar ? clone(current.nextMemory) : null;
  }
  roomPreviewView = clone(current);
  if (!persist()) { restore(previous); return Promise.resolve(saveFailure()); }
  return Promise.resolve({
    ok: true, data: current, awardedStars: baseAwardedStars, baseAwardedStars, giftStars: 0, listenExtraStars: 0,
    effectiveAdded: false, duplicate: baseAwardedStars === 0
  });
}

function settle(view, kind, completionId, options) {
  if (!view || !view.star || !view.star.dailyClaimStatus) return Promise.resolve({ ok: false, error: { code: 'INVALID_LOCAL_VIEW', message: '这次陪伴还没有准备好。' } });
  if (view.star.dailyClaimStatus === 'ERROR') return Promise.resolve({ ok: false, error: { code: 'LOCAL_FIXTURE_RECORD_FAILED', message: '刚才没有记下来，请再试一次。' } });
  const previous = snapshot();
  const completedAt = Date.now();
  const today = shanghaiDate(completedAt);
  const current = ensureDaily(clone(roomPreviewView || view), today);
  const star = current.star;
  const alreadyCompleted = kind === 'complete' ? completedDrawingIds.has(completionId)
    : kind === 'listen' ? Boolean(listeningState.results[completionId]) : star.noteCollected;
  let baseAwardedStars = 0, giftStars = 0, listenExtraStars = 0, effectiveAdded = false, streakInterrupted = false;
  let drawingGift = kind === 'complete' ? drawingGiftResults.get(completionId) || null : null;
  if (!alreadyCompleted && kind === 'listen') {
    const record = options.listeningResult;
    if (!listeningState.draft || listeningState.draft.groupId !== completionId) return Promise.resolve({ ok: false, error: { code: 'DRAFT_CHANGED', message: '这组回答已更新，请重新打开。' } });
    const rules = require('./listen-rules');
    const entry = rules.groupById(completionId);
    if (!entry || record.groupId !== completionId || record.categoryId !== entry.category.id ||
      listeningState.draft.categoryId !== entry.category.id ||
      !rules.complete(entry.group, listeningState.draft.answers || {}) || !rules.complete(entry.group, record.answers || {})) {
      return Promise.resolve({ ok: false, error: { code: 'ANSWERS_REQUIRED', message: '先把这组五个答案选好吧。' } });
    }
    if (listeningState.day && listeningState.day.date === today && listeningState.day.categories.includes(record.categoryId)) return Promise.resolve({ ok: false, error: { code: 'CATEGORY_COMPLETED_TODAY', message: '今天已经聊过这个话题啦。' } });
  }
  if (!alreadyCompleted) {
    if (!star.effectiveDone) {
      streakInterrupted = Boolean(lastEffectiveDate && lastEffectiveDate !== today && lastEffectiveDate !== previousShanghaiDate(today));
      applyDisconnectClear(star, today);
      star.companionDays = Number(star.companionDays || 0) + 1;
      star.effectiveDone = true;
      lastEffectiveDate = today;
      effectiveAdded = true;
      refreshDailyBasis(star);
    }
    if (kind === 'listen') {
      const firstGroupToday = !listeningState.day || listeningState.day.date !== today || !listeningState.day.categories.length;
      listenExtraStars = firstGroupToday ? LISTEN_EXTRA_STARS : 0;
    }
    // 当日基础星仅在 recordLetterOpen 发放；完成活动只记有效日与专属奖励（听你说 +10、画画回礼等）。
    if (kind === 'complete') {
      if (!star.drawingGiftChecked) {
        drawingGift = decideDrawingGift(!firstDrawingGiftDone, options && options.random);
        giftStars = drawingGift.stars;
        star.drawingGiftChecked = true;
        firstDrawingGiftDone = true;
        drawingGiftResults.set(completionId, clone(drawingGift));
      }
      completedDrawingIds.add(completionId);
      star.drawingCompleted = true;
    }
    if (kind === 'ordinary') star.noteCollected = true;
    if (kind === 'listen') {
      const record = clone(options.listeningResult);
      record.completedAt = completedAt;
      record.completedDate = today;
      record.reward = { baseAwardedStars: 0, listenExtraStars, giftStars: 0, effectiveAdded, streakInterrupted, date: today };
      if (!listeningState.day || listeningState.day.date !== today) listeningState.day = { date: today, categories: [] };
      listeningState.day.categories.push(record.categoryId);
      listeningState.cursors[record.categoryId] = (listeningState.cursors[record.categoryId] || 0) + 1;
      listeningState.results[completionId] = record;
      listeningState.draft = null;
      listeningState.pendingResult = completionId;
    }
  }
  const awardedStars = baseAwardedStars + giftStars + listenExtraStars;
  star.balance = Number(star.balance || 0) + awardedStars;
  star.dailyClaimStatus = star.baseClaimed ? (star.balance >= current.nextMemory.unlockedAtStar ? 'UNLOCKED' : 'CLAIMED') : 'AVAILABLE';
  current.progress = fixture.progressPresentation(star.balance, star.nextUnlockAt);
  current.newlyUnlockedMemory = awardedStars > 0 && star.balance >= current.nextMemory.unlockedAtStar ? clone(current.nextMemory) : null;
  current.helperText = star.effectiveDone ? '今天的陪伴已经记下。' : '完成活动，记下今天的陪伴。';
  roomPreviewView = clone(current);
  const paperPhoto = kind === 'ordinary' && options && options.paper ? photoState.offer(photoCatalog.eligiblePhotos(roomPet, today), options) : null;
  if (!persist()) { restore(previous); return Promise.resolve(saveFailure()); }
  return Promise.resolve({ ok: true, data: current, awardedStars, baseAwardedStars, giftStars, listenExtraStars,
    drawingGift: drawingGift ? clone(drawingGift) : null, effectiveAdded, streakInterrupted, duplicate: Boolean(alreadyCompleted),
    paperPhoto,
    listeningResult: kind === 'listen' ? clone(listeningState.results[completionId]) : null });
}
function recordListeningComplete(view, groupId, record) {
  if (!groupId || !record || record.groupId !== groupId) return Promise.resolve({ ok: false, error: { code: 'INVALID_LISTEN_RESULT', message: '这组回答还没有准备好。' } });
  return settle(view, 'listen', groupId, { listeningResult: record });
}
function recordCompanion(view, options) { return settle(view, 'ordinary', null, options); }
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
function recordDrawingStart(view) { return recordLetterOpen(view); }
function recordDrawingComplete(view, drawingId, options) {
  if (!drawingId || typeof drawingId !== 'string') return Promise.resolve({ ok: false, error: { code: 'DRAWING_ID_REQUIRED', message: '这幅画还没有准备好，请再试一次。' } });
  return recordPropDrawingComplete(view, drawingId, options);
}

function beginCompanionPropDrawing() {
  if (!roomPreviewView) {
    roomPreviewView = fixture.starUnlockViewFor('AVAILABLE');
    roomPreviewView.dateKey = shanghaiDate();
  }
  ensureDaily(roomPreviewView);
  return Promise.resolve({ ok: true, cost: 0, data: clone(roomPreviewView) });
}

function recordPropDrawingComplete(view, drawingId) {
  if (!drawingId || typeof drawingId !== 'string') {
    return Promise.resolve({ ok: false, error: { code: 'DRAWING_ID_REQUIRED', message: '这幅画还没有准备好，请再试一次。' } });
  }
  if (!view || !view.star || !view.star.dailyClaimStatus) {
    return Promise.resolve({ ok: false, error: { code: 'INVALID_LOCAL_VIEW', message: '这次陪伴还没有准备好。' } });
  }
  if (view.star.dailyClaimStatus === 'ERROR') {
    return Promise.resolve({ ok: false, error: { code: 'LOCAL_FIXTURE_RECORD_FAILED', message: '刚才没有记下来，请再试一次。' } });
  }
  const previous = snapshot();
  const completedAt = Date.now();
  const today = shanghaiDate(completedAt);
  const current = ensureDaily(clone(roomPreviewView || view), today);
  const star = current.star;
  const duplicate = completedDrawingIds.has(drawingId);
  let effectiveAdded = false;
  let streakInterrupted = false;
  if (!duplicate) {
    if (!star.effectiveDone) {
      streakInterrupted = Boolean(lastEffectiveDate && lastEffectiveDate !== today && lastEffectiveDate !== previousShanghaiDate(today));
      applyDisconnectClear(star, today);
      star.companionDays = Number(star.companionDays || 0) + 1;
      star.effectiveDone = true;
      lastEffectiveDate = today;
      effectiveAdded = true;
      refreshDailyBasis(star);
    }
    completedDrawingIds.add(drawingId);
  }
  const giftStars = duplicate ? 0 : PROP_DRAWING_REWARD;
  if (giftStars > 0) {
    star.balance = Number(star.balance || 0) + giftStars;
  }
  star.dailyClaimStatus = star.baseClaimed ? (star.balance >= current.nextMemory.unlockedAtStar ? 'UNLOCKED' : 'CLAIMED') : 'AVAILABLE';
  current.progress = fixture.progressPresentation(star.balance, star.nextUnlockAt);
  current.newlyUnlockedMemory = giftStars > 0 && star.balance >= current.nextMemory.unlockedAtStar ? clone(current.nextMemory) : null;
  current.helperText = star.effectiveDone ? '今天的陪伴已经记下。' : '完成活动，记下今天的陪伴。';
  roomPreviewView = clone(current);
  if (!persist()) {
    restore(previous);
    return Promise.resolve(saveFailure());
  }
  return Promise.resolve({
    ok: true,
    data: current,
    awardedStars: giftStars,
    baseAwardedStars: 0,
    giftStars,
    listenExtraStars: 0,
    drawingGift: giftStars > 0 ? { kind: 'prop', stars: giftStars, line: '这个小道具，送给你。' } : null,
    effectiveAdded,
    streakInterrupted,
    duplicate: Boolean(duplicate)
  });
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

function commitMutation(action) {
  const previous = snapshot();
  const result = action();
  if (!result.ok || !persist()) { restore(previous); return result.ok ? saveFailure() : result; }
  return result;
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
  getRoomScope: () => roomCacheKey,
  getConfiguredPet: () => roomPet ? clone(roomPet) : null,
  getMemories,
  getPendingPhotos,
  collectPhoto: id => commitMutation(() => collectPhoto(id)),
  getExchangePhoto,
  exchangePhoto: (id, ready) => commitMutation(() => exchangePhoto(id, ready)),
  collectMemory: memory => commitMutation(() => ({ ok: collectMemory(memory) })).ok,
  getStarUnlockView,
  getRoomStarView,
  resetRoomStarView,
  recordLetterOpen,
  getDailyInvitation,
  getTodayInvitationKind,
  getActivityCompleted,
  getListeningState,
  saveListeningState,
  recordListeningComplete,
  recordCompanion,
  recordDrawingStart,
  recordDrawingComplete,
  beginCompanionPropDrawing,
  recordPropDrawingComplete,
  PROP_DRAWING_REWARD,
  getCompanionDraft,
  setCompanionDraft,
  getCompanionDraftStartDate,
  markCompanionDraftStarted,
  getActivityState,
  beginTeaActivity: options => commitMutation(() => beginTeaActivity(options)),
  chooseTea: choice => commitMutation(() => chooseTea(choice)),
  confirmTeaActivity: () => commitMutation(confirmTeaActivity),
  collectTeaActivity: () => commitMutation(collectTeaActivity),
  retryCompanion
};
