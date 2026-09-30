const fixture = require('../fixtures/iaa-star-unlock');

const { dailyStars, shanghaiDate } = require('./companion-star-rules');
let roomPreviewView = null;
let roomPetId = '';
let collectedMemories = [];
let companionDraft = null;
let companionDraftStartDate = null;
let completedDrawingIds = new Set();
let activityState = { current: null, firstResultSeen: false };
function configureRoom(petId) {
  if (String(petId || '') !== roomPetId) { roomPetId = String(petId || ''); roomPreviewView = null; collectedMemories = []; companionDraft = null; companionDraftStartDate = null; completedDrawingIds = new Set(); activityState = { current: null, firstResultSeen: false }; }
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
    star.dailyBasis = dailyStars(Number(star.companionDays || 0) + 1);
    view.newlyUnlockedMemory = null;
  }
  if (typeof star.baseClaimed !== 'boolean') star.baseClaimed = ['CLAIMED', 'UNLOCKED'].includes(star.dailyClaimStatus);
  if (typeof star.effectiveDone !== 'boolean') star.effectiveDone = star.baseClaimed;
  if (typeof star.noteCollected !== 'boolean') star.noteCollected = star.baseClaimed && star.effectiveDone;
  if (typeof star.drawingBonusClaimed !== 'boolean') star.drawingBonusClaimed = false;
  if (!star.dailyBasis) star.dailyBasis = dailyStars(Number(star.companionDays || 0) + (star.effectiveDone ? 0 : 1));
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
  ensureDaily(roomPreviewView);
  return { ok: true, data: clone(roomPreviewView) };
}
function settle(view, kind, drawingId) {
  if (!view || !view.star || !view.star.dailyClaimStatus) return Promise.resolve({ ok: false, error: { code: 'INVALID_LOCAL_VIEW', message: '这次陪伴还没有准备好。' } });
  if (view.star.dailyClaimStatus === 'ERROR') return Promise.resolve({ ok: false, error: { code: 'LOCAL_FIXTURE_RECORD_FAILED', message: '刚才没有记下来，请再试一次。' } });
  const current = ensureDaily(clone(roomPreviewView || view));
  const star = current.star;
  let awardedStars = 0;
  let effectiveAdded = false;
  const alreadyCompleted = (kind === 'complete' && drawingId && completedDrawingIds.has(drawingId)) || (kind === 'ordinary' && star.noteCollected);
  if (!alreadyCompleted) {
    if (kind !== 'complete' && !star.baseClaimed) { awardedStars = star.dailyBasis; star.baseClaimed = true; }
    if (kind === 'complete' && !star.drawingBonusClaimed) { awardedStars = star.dailyBasis; star.drawingBonusClaimed = true; }
    if (kind !== 'start' && !star.effectiveDone) { star.companionDays = Number(star.companionDays || 0) + 1; star.effectiveDone = true; effectiveAdded = true; }
    if (kind === 'ordinary') star.noteCollected = true;
    if (kind === 'complete' && drawingId) completedDrawingIds.add(drawingId);
  }
  star.balance = Number(star.balance || 0) + awardedStars;
  star.dailyClaimStatus = star.baseClaimed ? (star.balance >= current.nextMemory.unlockedAtStar ? 'UNLOCKED' : 'CLAIMED') : 'AVAILABLE';
  current.progress = fixture.progressPresentation(star.balance, star.nextUnlockAt);
  // 保留旧 demo 合同，不在正式纪念册自动收录其样例照片。
  current.newlyUnlockedMemory = awardedStars > 0 && star.balance >= current.nextMemory.unlockedAtStar ? clone(current.nextMemory) : null;
  current.helperText = star.effectiveDone ? '今天的陪伴已经记下。' : '画好了再记下今天的陪伴。';
  roomPreviewView = clone(current);
  return Promise.resolve({ ok: true, data: current, awardedStars, effectiveAdded, duplicate: awardedStars === 0 && !effectiveAdded });
}
function recordCompanion(view) { return settle(view, 'ordinary'); }
function recordDrawingStart(view) { return settle(view, 'start'); }
function recordDrawingComplete(view, drawingId) { return settle(view, 'complete', drawingId); }
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
  if (current.phase === 'result') return { ok: true, duplicate: true, data: getActivityState() };
  if (current.phase !== 'confirming' || !current.choice) return { ok: false, error: { code: 'CHOICE_REQUIRED' } };
  if (!current.paid) {
    if (Number(roomPreviewView.star.balance || 0) < current.cost) return { ok: false, error: { code: 'INSUFFICIENT_STARS' } };
    deductActivityStars(current.cost);
    current.paid = true;
  }
  current.phase = 'result';
  return { ok: true, data: getActivityState() };
}
function collectTeaActivity() {
  const current = activityState.current;
  if (!current || current.phase !== 'result') return { ok: false, error: { code: 'RESULT_REQUIRED' } };
  const memory = Object.assign({}, current.photo, { id: current.id, date: shanghaiDate() });
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
  getMemories,
  collectMemory,
  getStarUnlockView,
  getRoomStarView,
  resetRoomStarView,
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
