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
  const opened=await adapter.recordLetterOpen(input);
  assert.equal(opened.awardedStars, 13); assert.equal(opened.data.star.companionDays, 2, '开信不加天');
  assert.equal(opened.data.star.effectiveDone, false);
  const start = await adapter.recordDrawingStart(opened.data);
  assert.equal(start.awardedStars, 0); assert.equal(start.data.star.companionDays, 2, '进入画纸不增加日数');
  assert.equal((await adapter.recordDrawingStart(start.data)).awardedStars, 0, '旧快照不重复发开始奖励');
  const done = await adapter.recordDrawingComplete(start.data, 'work-1');
  assert.equal(done.awardedStars, 10); assert.equal(done.baseAwardedStars, 0); assert.equal(done.giftStars, 10); assert.equal(done.data.star.companionDays, 3, '画画完成才加天');
  assert.equal(done.data.star.balance, 25); assert.equal(done.data.star.dailyBasis, 13);
  assert.equal((await adapter.recordDrawingComplete(input,'work-1')).awardedStars,0);
  assert.equal((await adapter.recordDrawingComplete(input,'work-2')).awardedStars,10,'第二幅达标仍 +10');
  assert.equal((await adapter.recordCompanion(input)).data.star.companionDays,3,'普通动作不会重复计日');

  adapter.configureRoom('ordinary-first');
  await adapter.recordLetterOpen(seed(6));
  const ordinary = await adapter.recordCompanion((await adapter.getRoomStarView()).data); assert.equal(ordinary.awardedStars, 0);
  assert.equal(ordinary.data.star.companionDays,7,'完成后第7天');
  const subsequentStart=await adapter.recordDrawingStart(ordinary.data);assert.equal(subsequentStart.awardedStars,0);
  const bonus=await adapter.recordDrawingComplete(ordinary.data,'ordinary-work');assert.equal(bonus.awardedStars,10);assert.equal(bonus.baseAwardedStars,0);assert.equal(bonus.data.star.companionDays,7);

  adapter.configureRoom('midnight-draft');
  await adapter.recordLetterOpen(seed(2));
  const yesterday=await adapter.recordDrawingStart((await adapter.getRoomStarView()).data);assert.equal(yesterday.awardedStars,0);
  adapter.setCompanionDraft({operations:[{type:'stroke',tool:'brush',points:[{x:1,y:1}]}]});adapter.markCompanionDraftStarted();
  now+=86400000;
  await adapter.recordLetterOpen((await adapter.getRoomStarView()).data);
  assert.equal((await adapter.getRoomStarView()).data.star.companionDays,2,'没有完成活动，不因开信累计');
  const resumed=Object.assign({},editorDefinition,{companionDrawing:true,resumingCompanionDraft:true,pageActive:true,data:{},shellArt:adapter.getCompanionDraft(),setData(patch){Object.assign(this.data,patch);}});
  await resumed.beginCompanionDrawing();
  const todayView=(await adapter.getRoomStarView()).data;
  assert.equal(todayView.star.baseClaimed, true, '跨日开信发放当日基础');
  const nextDone = await adapter.recordDrawingComplete(todayView, 'midnight-work'); assert.equal(nextDone.awardedStars, 10); assert.equal(nextDone.baseAwardedStars, 0); assert.equal(nextDone.data.star.companionDays, 3);
  assert.equal(nextDone.data.star.baseClaimed,true);
  assert.equal(nextDone.data.star.noteCollected,false,'完成画画不冒充已经收好纸条');
  assert.equal((await adapter.recordDrawingStart(nextDone.data)).awardedStars,0,'进入新画作仍不发奖励');
  now+=86400000;
  assert.equal((await adapter.recordDrawingComplete(nextDone.data,'midnight-work')).awardedStars,0,'旧作品回调跨日也不重复结算');

  adapter.configureRoom('bonus-before-note');
  await adapter.recordLetterOpen(seed());
  const priorBonus=await adapter.recordDrawingComplete((await adapter.getRoomStarView()).data,'bonus-first');
  const followingNote=await adapter.recordCompanion(priorBonus.data);assert.equal(followingNote.awardedStars,0,'画画完成与普通动作共用每日基础额度');assert.equal(followingNote.data.star.companionDays,1);assert.equal(followingNote.data.star.noteCollected,true);

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
  adapter.getDailyInvitation(['drawing'], () => 0);
  const p=page();p.maybeShowDailyCompanion();
  assert.equal(p.data.todayCompanionVisible,false,'提示到信不弹开信纸');assert.equal(p.data.companionLetterArriving,true);assert.equal(p.data.companionUnread,true);
  const timerCount=timers.size;p.maybeShowDailyCompanion();assert.equal(timers.size,timerCount,'重复刷新不重复播放到信');
  p.data.companionRoleImage='/assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/stare.webp';
  await p.onOpenTodayCompanion();assert.equal(p.data.companionRoleImage.endsWith('/stare.webp'),true,'展开信纸不清空角色素材');assert.equal(p.data.companionLetterArriving,false,'动画期间点击立即读信');assert.equal(p.data.companionUnread,false);
  p.syncRoomContextEntry();
  assert.equal(p.data.contextEntryFlatEnvelope, false, '开信后左下切宠物头像，不再保持扁信封');
  assert.match(p.data.contextActionIcon, /30-character\/jade-rabbit\/stare\.webp/, '开信后展示玉兔头像');
  assert.equal(p.data.contextEntryOpensChat, true, '开信后左下进入聊天');
  p.onTodayCompanionRevealTomorrow();assert.equal(p.data.todayCompanionTomorrowVisible,false,'未进入小游戏时不能展开明日内容');
  p.onTodayCompanionAction();navigation.success();
  p.setData({companionNavigating:false,todayCompanionVisible:true});navigation=undefined;
  assert.equal(p.data.todayCompanionTomorrowAvailable,true,'成功进入后返回才出现明天入口');
  p.onTodayCompanionRevealTomorrow();assert.equal(p.data.companionRoleEntering,false,'小游戏宠物固定显示，不滑入');
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
  adapter.getDailyInvitation(['drawing'], () => 0);
  const parent=page();await parent.onOpenTodayCompanion();
  parent.onTodayCompanionAction();const route=navigation;
  assert.equal((await adapter.getRoomStarView()).data.star.balance,13,'开信已发基础星，仅导航不再加星');
  route.fail();assert.equal(parent.data.companionNavigating,false);
  const gate=require('../companion-drawing-gate');
  const propChallenge=require('../companion-prop-challenge');
  const editor=Object.assign({},editorDefinition,{pageActive:true,data:{},shellArt:{operations:[]},setData(patch){Object.assign(this.data,patch);},pageTransitionDuration:()=>20,showCanvasNotice:()=>{},leaveEditor:async()=>{}});
  editor.onLoad({entry:'companion',mode:'prop',source:'letter',propId:'dried_tea_tag'});
  propChallenge.markTutorialSeen();
  editor.setData({propDrawingLocked:false,propTutorialVisible:false,propPeekVisible:false});
  assert.equal(editor.companionPropMode,true,'陪伴画画入口须走道具临摹模式');
  assert.equal((await adapter.getRoomStarView()).data.star.companionDays,0,'开信不计一天');
  await editor.beginCompanionDrawing();assert.equal(Number(editor.data.companionStartAward || 0),0);assert.equal((await adapter.getRoomStarView()).data.star.companionDays,0,'进入画纸不加天');
  editor.companionStartRequested=false;editor.resumingCompanionDraft=true;
  editor.data.companionStartAwardVisible=false;await editor.beginCompanionDrawing();assert.equal(editor.data.companionStartAwardVisible,false,'同日继续草稿不重播开始奖励');
  const canvas=require('../../utils/canvas-2d');const oldExport=canvas.exportImage;
  editor.getOpenerEventChannel=()=>({emit:(name,memory)=>{assert.equal(name,'companionDrawingCompleted');parent.completedCompanionDrawing=memory;}});
  canvas.exportImage=async()=>{throw new Error('canvas not ready');};
  editor.gateTracker=gate.createTracker();
  assert.equal((await editor.completeCompanionDrawing()).ok,false,'导出失败不产生完成回调');assert.equal(parent.completedCompanionDrawing,undefined);
  let gateNow=0;editor.gateTracker=gate.createTracker();
  for(let index=0;index<5;index+=1){const strokeId=gate.beginStroke(editor.gateTracker,'brush');for(let step=0;step<4;step+=1){gate.trackActiveElapsed(editor.gateTracker,gateNow);gate.trackPoint(editor.gateTracker,'brush',{x:0.35+index*0.05+step*0.02,y:0.35+index*0.04+step*0.015});gateNow+=1000;}gate.endStroke(editor.gateTracker,strokeId,'brush',false);}
  editor.artLayer={};editor.companionCompleting=false;
  canvas.exportImage=async()=>'/tmp/local-drawing.png';
  assert.equal((await editor.completeCompanionDrawing()).ok,true);
  assert.equal(parent.completedCompanionDrawing,undefined,'解锁层未确认前不回调房间');
  editor.onPropUnlockOk();canvas.exportImage=oldExport;
  assert.equal(parent.completedCompanionDrawing.kind,'prop');
  assert.equal(adapter.getCompanionDraft(),null,'画好后清空旧草稿，下一幅从空白开始');
  parent.startClock=()=>{};parent.refreshEnvironment=()=>{};parent.loadSnapshot=()=>{};parent.scheduleEnvironmentRefresh=()=>{};
  parent.onShow();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(parent.data.pendingCompanionMemory,null,'道具临摹无收下/纪念册 pending');
  assert.equal(parent.data.todayCompanionAwardedStars,10);assert.equal(parent.data.todayCompanionInteractionFeedback,'这个小道具，送给你。');
  assert.equal(parent.data.companionStarBalance,23);assert.equal(parent.data.companionDays,1);
  parent.clearStarAwardFeedback();editor.clearCompanionFeedback();
  adapter.configureRoom('background-note');
  const background=page();background.data.currentState={atHome:false};await background.onOpenTodayCompanion();
  const noteTask=background.onTodayCompanionInteract();background.pageActive=false;await noteTask;
  assert.ok(background.pendingCompanionResult);assert.equal(background.data.todayCompanionInteractionPending,true);
  background.startClock=()=>{};background.refreshEnvironment=()=>{};background.loadSnapshot=()=>{};background.scheduleEnvironmentRefresh=()=>{};
  background.onShow();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(background.data.todayCompanionInteractionPending,false,'后台完成后恢复处理状态');assert.equal(background.data.companionStarBalance,13);assert.equal(background.pendingCompanionResult,null);
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
  console.log('画画完成共享基础与独立回礼、升档固定基数、普通动作共用额度、跨日草稿、有效日数、防重复、信件到达及聊天门禁通过。');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{Date.now=originalNow;global.setTimeout=originalSetTimeout;global.clearTimeout=originalClearTimeout;});
