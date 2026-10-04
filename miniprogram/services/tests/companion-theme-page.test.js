const assert = require('assert');

// 破壳后画纸不加载蛋底图，也不裁切掉纸角的真实笔迹。
const shellService=require('../egg-shell-art');
const paintCalls=[];
const paperContext={clearRect(){},save(){},restore(){},fillRect(...args){paintCalls.push(args);},clip(){throw Error('paper must not clip to egg');},drawImage(){throw Error('paper must not mask to egg');}};
shellService.drawEggArt(paperContext,null,300,300,{operations:[{type:'stroke',tool:'brush',color:'#526B4D',width:.01,points:[{x:.02,y:.02}]}]},null,true);
assert(paintCalls.length,'纸角笔迹必须保留');
const layout=require('fs').readFileSync(require('path').join(__dirname,'../../pages/doodle/doodle.wxml'),'utf8');
const styles=require('fs').readFileSync(require('path').join(__dirname,'../../pages/doodle/doodle.wxss'),'utf8');
assert.match(styles,/\.page--theme \.preview \{ flex:0 0 60%/);
assert.match(styles,/\.page--theme \.egg-canvas-stack--paper \{[^}]*width:100%; height:100%; border:0/);
assert(layout.includes('themeReferenceImage') && !layout.includes('onNextThemeStep'),'完整参考图直接展示，不保留三步按钮');

const originalSetTimeout=global.setTimeout, originalClearTimeout=global.clearTimeout;
const timers=new Map();let sequence=0;
global.setTimeout=(fn,delay)=>{const id=++sequence;timers.set(id,{fn,delay});return id;};
global.clearTimeout=id=>timers.delete(id);
global.wx={getAccountInfoSync:()=>({miniProgram:{envVersion:'release'}}),getStorageSync(){},setStorageSync(){},
  getWindowInfo:()=>({statusBarHeight:20}),getSystemInfoSync:()=>({}),getSystemSetting:()=>({reducedMotion:true}),
  onAppShow(){},onAppHide(){},onNetworkStatusChange(){},getNetworkType(){}};
global.getApp=()=>({globalData:{}});
const themes=require('../companion-theme-catalog').THEMES;
const stars=require('../iaa-star-unlock-adapter');
const editorDefinition=require('../../pages/doodle/doodle-definition');
const canvas=require('../../utils/canvas-2d');
const oldExport=canvas.exportImage, oldRandom=Math.random;
const approvals=themes.map(t=>t.approved);
themes.forEach(t=>t.approved=false);
const theme=themes.find(t=>t.id==='K-R01');
let event, closed=0;
const editor=Object.assign({},editorDefinition,{data:{...editorDefinition.data},setData(patch,callback){Object.assign(this.data,patch);if(callback)callback();},
  showCanvasNotice(){},getOpenerEventChannel:()=>({emit:(name,value)=>{event={name,value};}}),leaveEditor:async()=>{closed++;}});
async function run(){
  theme.approved=true;
  stars.configureRoom('theme-page',{prototype:'玉兔'});
  // 只开放小黄鸭，复用真实配置、入口和画画页，而不是独立演示路由。
  const offer=stars.getThemeInvitation();
  assert.equal(offer.theme.id,'K-R01');
  editor.onLoad({entry:'companion',theme:offer.id});
  assert.equal(editor.data.themeReferenceImage,theme.artwork,'进入后直接展示完整单色参考图');
  await editor.beginCompanionDrawing();
  assert.equal((await editor.completeCompanionDrawing()).ok,false,'有参考图但空白仍不能完成');
  editor.shellArt={operations:[{type:'stroke',tool:'brush',points:[{x:1,y:1}]}]};
  canvas.exportImage=async()=>{throw Error('export failure');};
  assert.equal((await editor.completeCompanionDrawing()).ok,false);
  assert.equal(stars.getMemories().length,0);
  assert.equal(stars.getActiveThemeDrawing().id,offer.id);
  canvas.exportImage=async()=>'/tmp/original-art.png';Math.random=()=>0.95;
  const result=await editor.completeCompanionDrawing();
  assert.equal(result.ok,true);
  assert.equal(event.name,'companionThemeDrawingCompleted');
  assert.equal(stars.getMemories()[0].image,'/tmp/original-art.png');
  assert.equal(editor.data.themeOriginalImage,'/tmp/original-art.png');
  assert.equal(editor.data.themeFullImage,theme.artwork);
  assert.equal(editor.data.themeRevealPhase,'original');
  assert.equal(editor.data.themeRewardLabel,'惊喜加倍！');
  assert.equal(stars.getCompanionDraft(),null);
  const settled=(await stars.getRoomStarView()).data.star.balance;
  editor.onThemeFullError();
  assert.equal(editor.data.themeRevealPhase,'original','主题图片失败仍保留原画');
  assert.equal(editor.data.themeFullFailed,true);
  editor.onRetryThemeFull();editor.onThemeFullLoad();
  for(const timer of [...timers.values()])if(timer.delay===80)timer.fn();
  assert.equal(editor.data.themeRevealPhase,'artwork');
  for(const timer of [...timers.values()])if(timer.delay===1200)timer.fn();
  assert.equal(editor.data.themeRevealPhase,'reward');
  editor.onHide();
  assert.equal(editor.themeRevealTimers.length,0);
  editor.onShow(); // 同一路径不再触发图片load，也必须恢复自动结束。
  assert.equal(editor.data.themeRevealPhase,'reward','恢复不把已揭晓奖励退回原画');
  assert.ok(editor.themeRevealTimers.some(id=>timers.get(id).delay===5000),'已加载图返回前台主动恢复计时');
  await editor.onCloseThemeResult();
  assert.equal(closed,1);
  assert.equal(editor.data.themeResultVisible,false);
  assert.equal((await stars.getRoomStarView()).data.star.balance,settled,'加载重试或提前关闭不重抽和重复发奖');
  assert.equal(stars.getMemories().length,1);
  editor.clearCompanionFeedback();
  console.log('画画页完整参考、空白拦截、导出失败、原画自动保存、PNG揭晓顺序、加载重试和提前关闭通过。');
}
run().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{themes.forEach((t,i)=>t.approved=approvals[i]);Math.random=oldRandom;canvas.exportImage=oldExport;global.setTimeout=originalSetTimeout;global.clearTimeout=originalClearTimeout;});
