const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const rules = require('../companion-star-rules');
const adapter = require('../iaa-star-unlock-adapter');
const fixture = require('../../fixtures/iaa-star-unlock');
const originalNow = Date.now;
let now = Date.parse('2026-09-26T00:00:00+08:00');
Date.now = () => now;

async function main() {
  const tiers = [[0,0],[1,10],[2,10],[3,11],[6,11],[7,12],[13,12],[14,13],[20,13],[21,14],[29,14],[30,15],[44,15],[45,16],[59,16],[60,17],[89,17],[90,18],[900,18]];
  for (const [day,reward] of tiers) assert.equal(rules.dailyStars(day), reward, `第 ${day} 个陪伴日`);
  assert.equal(rules.shanghaiDate(Date.parse('2026-09-25T15:59:59Z')), '2026-09-25');
  assert.equal(rules.shanghaiDate(Date.parse('2026-09-25T16:00:00Z')), '2026-09-26');
  assert.equal(rules.previousShanghaiDate('2026-09-26'), '2026-09-25');
  adapter.configureRoom('first-pet');
  adapter.resetRoomStarView('AVAILABLE');
  const stale = (await adapter.getRoomStarView()).data;
  assert.equal((await adapter.recordCompanion(null)).ok,false,'空视图不能结算');
  assert.equal((await adapter.recordLetterOpen(null)).ok,false,'空视图不能开信计日');

  const open1 = await adapter.recordLetterOpen(stale);
  assert.equal(open1.awardedStars,0,'开信不发星');
  assert.equal(open1.effectiveAdded,true);
  assert.equal(open1.data.star.companionDays,1);
  assert.equal(open1.data.star.effectiveDone,true);
  const openDup = await adapter.recordLetterOpen(stale);
  assert.equal(openDup.effectiveAdded,false,'同日重复开信不加天');
  assert.equal(openDup.data.star.companionDays,1);

  const first = await adapter.recordCompanion(stale);
  assert.equal(first.awardedStars,10);
  assert.equal(first.data.star.companionDays,1,'普通动作不加天');
  const duplicate = await adapter.recordCompanion(stale);
  assert.equal(duplicate.awardedStars,0,'同日旧快照不重复得星');

  now += 86400000;
  const open2 = await adapter.recordLetterOpen(stale);
  assert.equal(open2.data.star.companionDays,2,'连续次日开信 +1');
  const second = await adapter.recordCompanion(stale);
  assert.equal(second.awardedStars,10,'跨上海日界后可完成新一天');
  assert.equal(second.data.star.companionDays,2);

  now += 86400000 * 5;
  const openGap = await adapter.recordLetterOpen(stale);
  assert.equal(openGap.data.star.companionDays,1,'断天后开信从 1 重计');
  const third = await adapter.recordCompanion(stale);
  assert.equal(third.data.star.companionDays,1,'缺席清零后普通动作不加天');
  assert.equal(third.awardedStars,10,'断天后第 1 档 10 星');
  assert.equal((await adapter.recordCompanion(fixture.starUnlockViewFor('ERROR'))).ok,false);
  assert.equal(adapter.collectMemory({id:'drawing-1',image:'local.png',title:'作品'}),true);
  adapter.collectMemory({id:'drawing-1',image:'local.png',title:'作品'});
  assert.equal(adapter.getMemories().length,1,'收录幂等');
  const outside = adapter.getMemories(); outside[0].title='改动';
  assert.equal(adapter.getMemories()[0].title,'作品','不暴露内部状态');
  adapter.configureRoom('second-pet');
  assert.equal(adapter.getMemories().length,0,'宠物切换不混入作品');

  const storage = new Map();
  let navigation;
  global.wx = {
    getAccountInfoSync:()=>({miniProgram:{envVersion:'release'}}),
    getStorageSync:key=>storage.get(key), setStorageSync:(key,value)=>storage.set(key,value),
    onAppShow(){}, onAppHide(){}, onNetworkStatusChange(){}, getNetworkType(){},
    navigateTo:options=>{navigation=options;}, showToast(){},
    getSystemInfoSync:()=>({windowWidth:375,windowHeight:667}),
  };
  global.getApp = ()=>({globalData:{}});
  global.Component = ()=>{};
  let definition;
  global.Page = value=>{definition=value;};
  require('../../pages/life-scene/life-scene');
  const page = Object.assign({},definition,{pageActive:true,data:Object.assign({},definition.data,{pet:{id:'room-pet',name:'玉兔'},sceneEntered:true,initialViewportReady:true,currentState:{atHome:false,key:'travel'},snapshot:{chatAccess:{status:'away'}}}),setData(patch){Object.assign(this.data,patch);}});
  let opened=0;
  page.onOpenTodayCompanion=()=>{opened++;page.markCompanionSeen();return Promise.resolve();};
  page.maybeShowDailyCompanion(); page.maybeShowDailyCompanion();
  assert.equal(opened,0,'每天只提示到信，不自动展开信纸');
  assert.equal(page.data.companionLetterArriving,true);
  page.onContextActionTap(); assert.equal(opened,1,'已读后仍可主动重开');
  const nextPage = Object.assign({},page,{companionSeenDate:null,data:Object.assign({},page.data)});
  nextPage.maybeShowDailyCompanion(); assert.equal(opened,1,'退出页面后已读标记仍生效');
  now += 86400000; nextPage.maybeShowDailyCompanion(); assert.equal(opened,1,'新一天提示到信，仍等待主动读信');
  page.showSystemNotice=()=>{};
  page.onCompanionChatTap(); assert.equal(navigation,undefined,'外出仍可读信，但不绕过聊天权限');
  page.data.currentState={atHome:true,key:'drawing'};page.data.snapshot.chatAccess={status:'available'};
  page.onCloseTodayCompanion=()=>{};page.onCompanionChatTap();
  assert.match(navigation.url,/pages\/chat\/chat/,'聊天展开现有完整页');
  page.data.companionNavigating=false;
  page.data.todayCompanionInteractionDone=true;
  page.onTodayCompanionAction();assert.match(navigation.url,/entry=companion/,'得星后仍能继续画画');
  navigation.events.companionDrawingCompleted({id:'second-drawing',image:'local.png',line:'一起画的'});
  page.startClock=()=>{};page.loadCompanionStar=()=>adapter.getRoomStarView();page.refreshEnvironment=()=>{};page.loadSnapshot=()=>{};page.scheduleEnvironmentRefresh=()=>{};
  page.returnToCompanion=false; page.onShow(); await new Promise(resolve=>setImmediate(resolve)); assert.equal(page.data.pendingCompanionMemory.id,'second-drawing','当天第二次创作仍可收录');
  page.onCollectCompanionMemory();assert.equal(adapter.getMemories().length,1);
  page.onToggleToolbox();assert.equal(page.data.toolboxVisible,true);
  page.onOpenMemoryAlbum();assert.match(navigation.url,/entry=room/);

  const doodle = require('../../pages/doodle/doodle-definition');
  const editor=Object.assign({},doodle,{companionDrawing:true,setData(){}});
  assert.equal((await editor.performPersistence({operations:[]})).ok,true,'陪伴模式只保存运行内草稿，不写蛋壳、孵化或服务端');
  let notice=''; editor.shellArt={operations:[]};editor.showCanvasNotice=text=>notice=text;
  assert.equal((await editor.completeCompanionDrawing()).ok,false,'空画不能算完成');assert.ok(notice);
  page.stopLetterArrival(); nextPage.stopLetterArrival();
  page.clearStarAwardFeedback();
  console.log('开信计日、断天清零、普通发星、九档边界、上海跨日、作品隔离与画画模式隔离通过。');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{Date.now=originalNow;});
