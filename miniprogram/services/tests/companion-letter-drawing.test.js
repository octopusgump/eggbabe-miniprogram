const assert = require('assert');
const adapter = require('../iaa-star-unlock-adapter');
const fixture = require('../../fixtures/iaa-star-unlock');
const rules = require('../companion-star-rules');
const originalNow = Date.now;
let now = Date.parse('2026-09-27T12:00:00+08:00');
Date.now = () => now;
const originalSetTimeout = global.setTimeout, originalClearTimeout = global.clearTimeout;
const timers = new Map(); let timerId = 0;
global.setTimeout = (fn, delay) => { const id = ++timerId; timers.set(id, {fn, delay}); return id; };
global.clearTimeout = id => timers.delete(id);
const storage = new Map(); const plays = []; let navigation;
global.wx = {
  getAccountInfoSync:()=>({miniProgram:{envVersion:'release'}}),
  getStorageSync:key=>storage.get(key),setStorageSync:(key,value)=>storage.set(key,value),
  onAppShow(){},onAppHide(){},onNetworkStatusChange(){},getNetworkType(){},showToast(){},
  navigateTo:options=>{navigation=options;},
  getSystemInfoSync:()=>({windowWidth:375,windowHeight:667}),
  createInnerAudioContext:()=>({src:'',obeyMuteSwitch:true,play(){plays.push(this.src);},stop(){},destroy(){},onError(){}}),
  vibrateShort(){},
};
global.getApp=()=>({globalData:{}});global.Component=()=>{};let definition;global.Page=value=>definition=value;
require('../../pages/life-scene/life-scene');
const editorDefinition=require('../../pages/doodle/doodle-definition');
function seed(days=0) { const v=fixture.starUnlockViewFor('AVAILABLE');v.dateKey=rules.shanghaiDate();v.star.companionDays=days;return v; }
function page() { return Object.assign({},definition,{pageActive:true,data:Object.assign({},definition.data,{pet:{id:'letter-test',prototype:'玉兔'},currentState:{atHome:true,key:'drawing'},snapshot:{chatAccess:{status:'available'}},sceneEntered:true,initialViewportReady:true}),setData(patch,callback){Object.assign(this.data,patch);if(callback)callback();}}); }
async function main(){
  adapter.configureRoom('two-stages');
  const input=seed(2);
  const start=await adapter.recordDrawingStart(input);
  assert.equal(start.awardedStars,11);assert.equal(start.data.star.companionDays,2,'进入画纸不增加日数');
  assert.equal(start.data.star.effectiveDone,false);
  assert.equal((await adapter.recordDrawingStart(input)).awardedStars,0,'旧快照不重复发开始奖励');
  const done=await adapter.recordDrawingComplete(input,'work-1');
  assert.equal(done.awardedStars,11);assert.equal(done.data.star.companionDays,3,'完成才增加一天');
  assert.equal(done.data.star.balance,24);assert.equal(done.data.star.dailyBasis,11);
  assert.equal((await adapter.recordDrawingComplete(input,'work-1')).awardedStars,0);
  assert.equal((await adapter.recordDrawingComplete(input,'work-2')).awardedStars,0,'第二幅仍可收藏但没有额外奖励');
  assert.equal((await adapter.recordCompanion(input)).data.star.companionDays,3,'普通动作不会重复计日');

  adapter.configureRoom('ordinary-first');
  const ordinary=await adapter.recordCompanion(seed(6));assert.equal(ordinary.awardedStars,12);
  const subsequentStart=await adapter.recordDrawingStart(ordinary.data);assert.equal(subsequentStart.awardedStars,0);
  const bonus=await adapter.recordDrawingComplete(ordinary.data,'ordinary-work');assert.equal(bonus.awardedStars,12);assert.equal(bonus.data.star.companionDays,7);

  adapter.configureRoom('midnight-draft');
  const yesterday=await adapter.recordDrawingStart(seed(2));assert.equal(yesterday.awardedStars,11);
  adapter.setCompanionDraft({operations:[{type:'stroke',tool:'brush',points:[{x:1,y:1}]}]});adapter.markCompanionDraftStarted();
  now+=86400000;
  const resumed=Object.assign({},editorDefinition,{companionDrawing:true,resumingCompanionDraft:true,pageActive:true,data:{},shellArt:adapter.getCompanionDraft(),setData(patch){Object.assign(this.data,patch);}});
  await resumed.beginCompanionDrawing();
  const todayView=(await adapter.getRoomStarView()).data;
  assert.equal(todayView.star.baseClaimed,false,'跨日继续旧草稿不自动发新一天基础奖励');
  const nextDone=await adapter.recordDrawingComplete(todayView,'midnight-work');assert.equal(nextDone.awardedStars,11);assert.equal(nextDone.data.star.companionDays,3);
  assert.equal(nextDone.data.star.baseClaimed,false);
  assert.equal(nextDone.data.star.noteCollected,false,'完成画画不冒充已经收好纸条');
  assert.equal((await adapter.recordDrawingStart(nextDone.data)).awardedStars,11,'之后主动进入新画作才发今日基础奖励');
  now+=86400000;
  assert.equal((await adapter.recordDrawingComplete(nextDone.data,'midnight-work')).awardedStars,0,'旧作品回调跨日也不重复结算');

  adapter.configureRoom('bonus-before-note');
  const priorBonus=await adapter.recordDrawingComplete(seed(),'bonus-first');
  const followingNote=await adapter.recordCompanion(priorBonus.data);assert.equal(followingNote.awardedStars,10,'画画完成奖励不占用普通动作基础额度');assert.equal(followingNote.data.star.companionDays,1);assert.equal(followingNote.data.star.noteCollected,true);

  adapter.configureRoom('draft-isolation');assert.equal(adapter.getCompanionDraft(),null);
  const draft={operations:[{type:'stroke',tool:'brush'}]};adapter.setCompanionDraft(draft);draft.operations=[];
  assert.equal(adapter.getCompanionDraft().operations.length,1,'草稿隔离外部修改');
  let left=false;
  const exiting=Object.assign({},editorDefinition,{companionDrawing:true,data:{},shellArt:adapter.getCompanionDraft(),editRevision:1,savedRevision:0,leaveEditor:async()=>{left=true;}});
  await exiting.onBack();assert.equal(left,true,'陪伴画画中途退出不要求额外确认');assert.equal(adapter.getCompanionDraft().operations.length,1);
  adapter.setCompanionDraft(null);assert.equal(adapter.getCompanionDraftStartDate(),null);
  let notice='';const blank=Object.assign({},editorDefinition,{shellArt:{operations:[]},showCanvasNotice:text=>notice=text});
  assert.equal((await blank.completeCompanionDrawing()).ok,false);assert.ok(notice);

  adapter.configureRoom('letter-room');
  const p=page();p.maybeShowDailyCompanion();
  assert.equal(p.data.todayCompanionVisible,false,'提示到信不弹开信纸');assert.equal(p.data.companionLetterArriving,true);assert.equal(p.data.companionUnread,true);
  const timerCount=timers.size;p.maybeShowDailyCompanion();assert.equal(timers.size,timerCount,'重复刷新不重复播放到信');
  p.data.companionRoleImage='/assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/stare.webp';
  await p.onOpenTodayCompanion();assert.equal(p.data.companionRoleImage.endsWith('/stare.webp'),true,'展开信纸不清空角色素材');assert.equal(p.data.companionLetterArriving,false,'动画期间点击立即读信');assert.equal(p.data.companionUnread,false);
  p.onTodayCompanionRevealTomorrow();assert.equal(p.data.companionRoleEntering,true);
  p.onCloseTodayCompanion();await p.onOpenTodayCompanion();
  assert.equal(p.data.todayCompanionTomorrowVisible,true);assert.equal(p.data.companionRoleEntering,false,'同日重开不重播角色');
  p.data.snapshot.chatAccess={status:'limited'};p.showSystemNotice=()=>{};p.onCompanionChatTap();assert.equal(navigation,undefined);assert.equal(p.data.todayCompanionVisible,true);
  p.data.snapshot.chatAccess={status:'available'};p.onCompanionChatTap();assert.match(navigation.url,/pages\/chat\/chat/);
  const lastNavigation=navigation;p.onCompanionChatTap();assert.equal(navigation,lastNavigation,'连续点击只打开一次');
  p.data.currentState={atHome:false};p.data.companionNavigating=false;navigation=undefined;p.onCompanionChatTap();assert.equal(navigation,undefined,'外出不绕过原权限');
  p.stopLetterArrival();p.clearStarAwardFeedback();
  now+=86400000;p.data.todayCompanionVisible=false;p.maybeShowDailyCompanion();assert.equal(p.data.todayCompanionTomorrowVisible,false,'新日收起明日内容');assert.equal(p.data.companionUnread,true);
  p.stopLetterArrival();
  adapter.configureRoom('full-drawing-chain');
  const parent=page();await parent.onOpenTodayCompanion();
  parent.onTodayCompanionAction();const route=navigation;
  assert.equal((await adapter.getRoomStarView()).data.star.balance,2,'仅调用导航不发星');
  route.fail();assert.equal(parent.data.companionNavigating,false);
  const editor=Object.assign({},editorDefinition,{companionDrawing:true,pageActive:true,data:{},shellArt:{operations:[]},setData(patch){Object.assign(this.data,patch);},pageTransitionDuration:()=>20});
  await editor.beginCompanionDrawing();assert.equal(editor.data.companionStartAward,10);assert.equal((await adapter.getRoomStarView()).data.star.companionDays,0);
  editor.companionStartRequested=false;editor.resumingCompanionDraft=true;
  editor.data.companionStartAwardVisible=false;await editor.beginCompanionDrawing();assert.equal(editor.data.companionStartAwardVisible,false,'同日继续草稿不重播开始奖励');
  const canvas=require('../../utils/canvas-2d');const oldExport=canvas.exportImage;
  editor.shellArt={operations:[{type:'stroke',tool:'brush',points:[{x:1,y:1}]}]};editor.editRevision=1;editor.savedRevision=0;
  editor.showCanvasNotice=()=>{};editor.getOpenerEventChannel=()=>({emit:(name,memory)=>{assert.equal(name,'companionDrawingCompleted');parent.completedCompanionDrawing=memory;}});
  editor.leaveEditor=async()=>{};
  canvas.exportImage=async()=>{throw new Error('canvas not ready');};
  assert.equal((await editor.completeCompanionDrawing()).ok,false,'导出失败不产生完成回调');assert.equal(parent.completedCompanionDrawing,undefined);
  canvas.exportImage=async()=>'/tmp/local-drawing.png';
  assert.equal((await editor.completeCompanionDrawing()).ok,true);canvas.exportImage=oldExport;
  assert.equal(adapter.getCompanionDraft(),null,'画好后清空旧草稿，下一幅从空白开始');
  parent.startClock=()=>{};parent.refreshEnvironment=()=>{};parent.loadSnapshot=()=>{};parent.scheduleEnvironmentRefresh=()=>{};
  parent.onShow();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(parent.data.pendingCompanionMemory.image,'/tmp/local-drawing.png');assert.equal(parent.data.todayCompanionAwardedStars,10);
  assert.equal(parent.data.companionStarBalance,22);assert.equal(parent.data.companionDays,1);
  parent.onCollectCompanionMemory();assert.equal(adapter.getMemories().length,1);assert.equal(parent.data.todayCompanionVisible,false);
  parent.clearStarAwardFeedback();editor.clearCompanionFeedback();
  adapter.configureRoom('background-note');
  const background=page();background.data.currentState={atHome:false};await background.onOpenTodayCompanion();
  const noteTask=background.onTodayCompanionInteract();background.pageActive=false;await noteTask;
  assert.ok(background.pendingCompanionResult);assert.equal(background.data.todayCompanionInteractionPending,true);
  background.startClock=()=>{};background.refreshEnvironment=()=>{};background.loadSnapshot=()=>{};background.scheduleEnvironmentRefresh=()=>{};
  background.onShow();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(background.data.todayCompanionInteractionPending,false,'后台完成后恢复处理状态');assert.equal(background.data.companionStarBalance,12);assert.equal(background.pendingCompanionResult,null);
  background.data.pendingCompanionMemory={id:'pending-work',image:'local.png',line:'一起画的回应'};
  background.onCloseTodayCompanion();await background.onOpenTodayCompanion();assert.equal(background.data.todayCompanionInteractionFeedback,'一起画的回应','未收下作品重开保留回应');
  background.clearStarAwardFeedback();background.stopLetterArrival();

  adapter.configureRoom('canvas-load-failure');
  const loadCanvas=require('../../utils/canvas-2d');const previousCreate=loadCanvas.createLayer;
  const failedEditor=Object.assign({},editorDefinition,{companionDrawing:true,pageActive:true,data:{},setData(patch){Object.assign(this.data,patch);},showCanvasNotice(){}});
  loadCanvas.createLayer=async()=>null;failedEditor.setupCanvases();await new Promise(resolve=>setImmediate(resolve));loadCanvas.createLayer=previousCreate;
  assert.equal(failedEditor.data.canvasPreparationError,true);assert.equal(failedEditor.data.pageTransitionPhase,'visible','加载失败时返回入口仍可见');assert.equal((await adapter.getRoomStarView()).data.star.balance,2,'画纸准备失败不发开始星');
  const todayAdapter=require('../iaa-today-companion-adapter');const previousToday=todayAdapter.getTodayView;
  let letterError='';const failLetter=page();failLetter.showSystemNotice=text=>letterError=text;
  todayAdapter.getTodayView=async()=>{throw new Error('fixture failed');};await failLetter.onOpenTodayCompanion();todayAdapter.getTodayView=previousToday;
  assert.ok(letterError);assert.equal(failLetter.companionOpening,false,'读信失败解除打开锁，允许再次点击');assert.equal(failLetter.data.todayCompanionVisible,false);
  console.log('画画两段奖励、升档固定基数、普通动作共用额度、跨日草稿、有效日数、防重复、信件到达及聊天门禁通过。');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{Date.now=originalNow;global.setTimeout=originalSetTimeout;global.clearTimeout=originalClearTimeout;});
