const assert=require('assert');
global.wx={getAccountInfoSync:()=>({miniProgram:{envVersion:'release'}}),getStorageSync(){},onAppShow(){},onAppHide(){},onNetworkStatusChange(){},getNetworkType(){}};
global.getApp=()=>({globalData:{}});
const definition=require('../../pages/doodle/doodle-definition');
const shell=require('../egg-shell-art');
function run(tool){
 const frames=new Map();let id=0,clears=0,paints=0;
 const context={save(){},restore(){},clearRect(){clears++;},fillRect(){paints++;},beginPath(){},arc(){},fill(){paints++;},moveTo(){},lineTo(){},stroke(){paints++;}};
 const canvas={requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(key){frames.delete(key);}};
 const editor=Object.assign({},definition,{companionDrawing:true,pageActive:true,data:{canvasScale:1},artLayer:{context,canvas,width:300,height:400,left:0,top:0},shellArt:shell.defaultShellArt(),operationSequence:1,undoStack:[],syncViewState(){this.shellArt=shell.normalizeShellArt(this.shellArt);},markDirty(){}});
 editor.currentStroke=shell.createStroke(tool,[{x:0,y:.2}],1,.01,'#526B4D');
 editor.paperPaintedPoints=0;editor.queuePaperStroke();editor.queuePaperStroke();
 assert.equal(frames.size,1,'同一帧多次输入仅排一个绘制');
 const tick=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());};tick();
 for(let n=1;n<=350;n++) { editor.onCanvasTouchMove({touches:[{clientX:n%2?280:20,clientY:80+n/2}]});if(n%12===0)tick(); }
 const canceled=Object.assign({},editor,{shellArt:shell.cloneShellArt(editor.shellArt),undoStack:[[]],strokeFrame:null});
 canceled.cancelPendingDrawing();
 assert.deepEqual(canceled.shellArt.operations,[],'长笔或长橡皮中途双指取消，恢复整笔开始前的历史');
 editor.finishStroke();
 assert.equal(frames.size,0,'松手刷新尾段并取消待绘制帧');
 assert.equal(clears,1,'move不清屏重画历史，取消副本仅重绘一次');
 assert.equal(editor.shellArt.operations.length,2,'长笔画完整分成两个可存储段');
 assert(editor.shellArt.operations.every(op=>op.points.length<=300));
 const restored=shell.normalizeShellArt(shell.cloneShellArt(editor.shellArt));
 const last=restored.operations.at(-1).points.at(-1);
 assert.equal(last.x,20/300,'恢复后保留长笔最后一点');
 assert.equal(last.y,255/400);
 const before=paints; shell.drawEggArt(context,null,300,400,restored,null,true);
 assert(paints>before,'原画重绘保留刷笔或橡皮尾段');
 editor.currentStroke=shell.createStroke(tool,[{x:.1,y:.1}],9,.01,'#526B4D');editor.paperPaintedPoints=0;editor.queuePaperStroke();editor.cancelPendingDrawing();assert.equal(frames.size,0,'取消手势撤销尚未完成笔画及排队帧');
}
run('brush');run('eraser');
console.log('纸画合帧、增量绘制、长刷笔/橡皮分段保存恢复、收笔刷新及取消通过。');
