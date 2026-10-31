const assert = require('assert');
const fs = require('fs');
const path = require('path');
let definition, navigatedBack = 0, failWrite = false;
const storage = new Map(), timers = new Map(), sound = [], haptics = [];
let timerIndex = 0;
global.wx = {
  getAccountInfoSync: () => ({ miniProgram: { envVersion: 'release' } }),
  getStorageSync: key => storage.get(key), setStorageSync: (key, value) => { if (failWrite) throw Error('quota'); storage.set(key, structuredClone(value)); },
  getSystemInfoSync: () => ({}), navigateBack: () => navigatedBack++, showToast() {},
  createInnerAudioContext: () => ({ play() { sound.push('played'); }, stop() {}, destroy() {}, onError() {} }),
  vibrateShort: () => haptics.push('light')
};
global.Page = value => { definition = value; };
global.getCurrentPages = () => [{}, {}];
const petStore = require('../../utils/pet-store');
const pet = { id: 'listen-page', ownerId: 'owner', lifecycleStage: 'HATCHED', prototype: '锦鲤' };
petStore.getPet = () => pet;
require('../../pages/listen/listen');
const stars = require('../iaa-star-unlock-adapter'), adapter = require('../listen-adapter');
const savedTimeout = global.setTimeout, savedClear = global.clearTimeout;
global.setTimeout = (fn, ms) => { const id = ++timerIndex; timers.set(id, { fn, ms }); return id; };
global.clearTimeout = id => timers.delete(id);
function page() { return Object.assign({}, definition, { data: structuredClone(definition.data), setData(patch) { Object.assign(this.data, patch); } }); }
function select(p, index = 0) { p.onSelect({ currentTarget: { dataset: { id: p.data.question.options[index].id } } }); }
(async () => {
  const p = page(); p.onLoad(); p.onShow();
  assert.equal(p.data.view, 'question'); assert.equal(p.data.questionNumber, 1);
  assert.match(p.data.petImage, /boon-koi\/stare.webp$/);
  await p.onNext(); assert.equal(p.data.questionNumber, 1, '未选答案不能进入下一题');
  assert.equal(navigatedBack, 0);
  select(p, 4); assert.equal(p.data.noteOpen, true); assert.equal(p.data.scrollTarget, 'listen-supplement');
  p.onSupplement({ detail: { value: '只保存的补充' } });
  await p.onNext(); assert.equal(p.data.questionNumber, 2);
  p.onReturnRoom(); assert.equal(navigatedBack, 1);
  const resumed = page(); resumed.onLoad(); assert.equal(resumed.data.questionNumber, 2, '中途主动返回，重进仍在第二题');
  assert.equal(Object.values(resumed.draft.answers)[0].text, '只保存的补充');
  for (let i = 2; i <= 5; i++) { select(resumed); await resumed.onNext(); }
  assert.equal(resumed.data.view, 'feedback'); assert.ok(resumed.data.feedback);
  assert.equal(resumed.data.awardedStars, 10); assert.equal(resumed.data.awardVisible, true);
  const soundTimer = [...timers.values()].find(timer => timer.ms === 520);
  const hapticTimer = [...timers.values()].find(timer => timer.ms === 840);
  assert.ok(soundTimer); assert.ok(hapticTimer); soundTimer.fn(); hapticTimer.fn();
  assert.equal(sound.length, 1); assert.equal(haptics.length, 1);
  resumed.onHide(); assert.equal(timers.size, 0); resumed.onShow(); assert.equal(resumed.data.awardVisible, false, '恢复不重播');
  const reopened = page(); reopened.onLoad(); assert.equal(reopened.data.view, 'feedback'); assert.equal(reopened.data.awardedStars, 0);
  reopened.onContinue(); assert.equal(reopened.data.view, 'choices'); assert.equal(reopened.data.categories.length, 4);
  const category = reopened.data.categories[0]; reopened.startGroup(category.id);
  for (let i = 1; i <= 5; i++) { select(reopened, 4); await reopened.onNext(); }
  assert.equal(reopened.data.view, 'feedback'); assert.equal(reopened.data.awardedStars, 0);
  reopened.onReturnRoom();
  const next = page(); next.onLoad();
  assert.equal(next.data.view, 'choices', '当天已答过，回房间再进应从剩余类别选择');
  next.startGroup(next.data.categories[0].id); select(next);
  failWrite = true; await next.onNext();
  const beforeBack = navigatedBack; next.onReturnRoom();
  assert.equal(navigatedBack, beforeBack, '明确保存失败时主动退出必须先留下输入');
  failWrite = false;
  assert.equal(next.data.questionNumber, 1); assert.ok(next.data.error); assert.ok(next.data.selected);
  next.onHide();
  // 次日恢复旧反馈可继续，奖励不重播；首个新日题组仍由系统随机。
  const previousNow = Date.now;
  Date.now = () => previousNow() + 86400000;
  reopened.pageActive = true; reopened.data.view = 'feedback'; reopened.data.categories = [];
  reopened.onShow(); assert.equal(reopened.data.categories.length, 5);
  assert.equal(reopened.data.awardVisible, false);
  reopened.onContinue(); assert.equal(reopened.data.view, 'question');
  reopened.onHide(); Date.now = previousNow;
  const root = path.resolve(__dirname, '../..');
  const template = fs.readFileSync(path.join(root, 'pages/listen/listen.wxml'), 'utf8');
  assert.ok(template.includes('listen-quote-mark.svg'), '反馈 Quote 须使用 Figma 双引号 SVG');
  assert.ok(template.includes('写下你的想法...')); assert.ok(!template.includes('我想自己说'));
  assert.ok(template.includes('谢谢你说给我听') || template.includes('rewardLabel'), '第 2 组起展示谢谢你说给我听');
  assert.ok(template.includes('listen-thank-spark-v01.png') && template.includes('feedback-reward-spark--3'), '非收星反馈须使用 Figma 星点 PNG 三处定位');
  const sparkPath = path.join(root, 'assets/icons/listen-thank-spark-v01.png');
  const sparkBuf = fs.readFileSync(sparkPath);
  assert.equal(sparkBuf.toString('ascii', 1, 4), 'PNG', '星点素材必须是 PNG');
  assert.equal(sparkBuf[25], 6, '星点 PNG 须保留透明通道');
  const feedbackStyles = fs.readFileSync(path.join(root, 'pages/listen/listen.wxss'), 'utf8');
  assert.match(feedbackStyles, /\.feedback-reward-label[\s\S]*?width:\s*300rpx/, '谢谢回答容器须对齐 Figma 150×100');
  assert.match(feedbackStyles, /\.feedback-reward-label__copy[\s\S]*?color:\s*#17311F/, '谢谢你说给我听须为墨绿正文色');
  assert.match(feedbackStyles, /\.feedback-footer[\s\S]*?align-items:\s*stretch/, '反馈页底栏按钮须同宽对齐');
  assert.ok(!template.includes('谢谢回答'), '不得再使用旧版谢谢回答文案');
  assert.ok(template.includes('{{feedback}}')); assert.ok(!template.includes('我听见啦'));
  assert.ok(JSON.parse(fs.readFileSync(path.join(root, 'app.json'))).pages.includes('pages/listen/listen'));
  assert.equal(adapter.getState().data.draft.questionIndex, 0);
  let navDefinition; global.Component = value => { navDefinition = value; };
  require('../../components/nav-bar/nav-bar');
  const nav = { properties: { customBack: true }, triggerEvent() {} };
  const beforeCustomBack = navigatedBack; navDefinition.methods.onBack.call(nav);
  assert.equal(navigatedBack, beforeCustomBack, '只对选择接管返回的页面停止自动导航');
  nav.properties.customBack = false; navDefinition.methods.onBack.call(nav);
  assert.equal(navigatedBack, beforeCustomBack + 1, '其他页面保留原返回行为');
  const dailyPet = { id: 'listen-daily-done', ownerId: 'owner', lifecycleStage: 'HATCHED', prototype: '锦鲤' };
  petStore.getPet = () => dailyPet;
  stars.configureRoom(dailyPet.id, dailyPet);
  stars.getDailyInvitation(['listen'], () => 0);
  await stars.recordLetterOpen((await stars.getRoomStarView()).data);
  const rules = require('../listen-rules');
  const todayKey = require('../companion-star-rules').shanghaiDate();
  stars.saveListeningState({
    cursors: {},
    day: { date: todayKey, categories: rules.bank.categories.map(category => category.id) },
    draft: null,
    pendingResult: null,
    results: {}
  });
  const dailyDone = page();
  dailyDone.onLoad();
  assert.equal(dailyDone.data.view, 'end');
  assert.equal(dailyDone.data.title, '明天再来', '当天额度用尽须与 Figma 一致展示明天再来');
  assert.equal(dailyDone.data.endText, '');
  console.log('听你说页面行为通过：中途退出恢复、可选文字、五题反馈、原声震时点、重开不重播、后续组零星、写失败保留。');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { global.setTimeout = savedTimeout; global.clearTimeout = savedClear; });
