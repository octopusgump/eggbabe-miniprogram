// 陪伴星星收星反馈：只在信件内真实收星成功时各触发一次音效与轻震；
// 失败、重复点击、同日重开、回房间都不得重复。视觉只用两张透明 PNG 与 WXSS 动画。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const STAR_DIR = 'assets/scenes/lifecycle/post-hatch/40-interaction-fx/companion-star';
const roomTemplate = read('pages/life-scene/life-scene.wxml');
const roomStyles = read('pages/life-scene/life-scene.wxss');
const starTemplate = read('components/companion-star/companion-star.wxml');
const starStyles = read('components/companion-star/companion-star.wxss');
const starLogic = read('components/companion-star/companion-star.js');
const moodTemplate = read('components/pet-mood-tab/pet-mood-tab.wxml');

// 素材：两张同尺寸透明 PNG 与一个本地短音效，不引入 GIF、图片序列或 canvas。
for (const file of ['companion-star-neutral.png', 'companion-star-squeezed.png']) {
  const buffer = fs.readFileSync(path.join(root, STAR_DIR, file));
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG', `${file} 必须是 PNG`);
  assert.equal(buffer.readUInt32BE(16), 320, `${file} 宽度必须为 320`);
  assert.equal(buffer.readUInt32BE(20), 320, `${file} 高度必须为 320，两张造型共用同一画布避免跳边`);
  assert.equal(buffer[25], 6, `${file} 必须保留透明通道（RGBA）`);
}
assert.equal(fs.existsSync(path.join(root, STAR_DIR, 'companion-star-award.mp3')), true, '收星音效必须是包内本地文件');
assert.equal(fs.readdirSync(path.join(root, STAR_DIR)).some(file => /\.gif$/i.test(file)), false, '参考 GIF 不得进入小程序包');
assert.equal(/<canvas|\.gif/i.test(`${starTemplate}\n${starLogic}`), false, '星星动效不得使用 canvas 或 GIF');

// 信件：星星宽 20vw，浮在信纸上方居中；信纸正文里不再有“✦ +1”行，overlay 内仍不直接渲染图片，也不新增文案。
const overlayStart = roomTemplate.indexOf('class="today-companion-overlay"');
const overlayTemplate = roomTemplate.slice(overlayStart, roomTemplate.indexOf('<daily-window-detail', overlayStart));
const letterTemplate = overlayTemplate.slice(overlayTemplate.indexOf('class="today-companion-letter"'));
assert.equal(overlayTemplate.includes('<companion-star mode="award" size="150"'), true, '收星星星宽 150rpx，即屏幕宽度 20%');
assert.equal(overlayTemplate.includes('wx:if="{{todayCompanionAwardedStars > 0}}" class="today-companion-award'), true, '收星动效只在真实获得星星时挂载');
assert.equal(overlayTemplate.indexOf('today-companion-award') < overlayTemplate.indexOf('class="today-companion-letter"'), true, '星星在信纸之外，不进入正文流');
assert.equal(/todayCompanionAwardedStars|companion-star|✦/.test(letterTemplate), false, '信纸正文内不再显示星星或“✦ +1”');
assert.equal(overlayTemplate.includes('+{{todayCompanionAwardedStars}}'), true, '保留 +1 数字');
assert.equal((starTemplate.match(/companion-star__spark--\d/g) || []).length, 7, '光点保持 7 个（5–8 范围内）');
assert.match(roomStyles, /\.today-companion-award\{position:absolute;left:50%;bottom:100%;width:150rpx;/, '星星绝对定位在信纸上方居中，不改变信纸排版');
assert.match(roomStyles, /today-companion-award__plus\{[^}]*animation:today-companion-award-plus \.6s [^}]*\.2s both/, '+1 约 0.2 秒开始翻滚、0.8 秒落定');
assert.match(starStyles, /companion-star-neutral-show \.8s step-end/, '两张造型必须硬切换，不做交叉淡化以免重影');

// 房间：左上角沿用同一哑光造型，只做光晕回应，不重播信件动作。
assert.equal(moodTemplate.includes('<companion-star class="pet-mood-tab__star-icon" mode="room" size="22" pulse="{{starAwardVisible}}"'), true, '房间左上角星星沿用同一造型并随原 +1 时机回应');
assert.equal(moodTemplate.includes('pet-mood-tab__star-award">+1'), true, '房间左上角原 +1 徽标保持不变');
assert.equal(/companion-star--room[^{]*\{[^}]*squeezed/.test(starStyles), false, '房间不得重播挤压动作');

function stubWx(log) {
  return {
    getAccountInfoSync() { return { miniProgram: { envVersion: 'release' } }; },
    getWindowInfo() { return { statusBarHeight: 22, windowWidth: 375, windowHeight: 667 }; },
    getSystemInfoSync() { return { statusBarHeight: 22, windowWidth: 375, windowHeight: 667 }; },
    getMenuButtonBoundingClientRect() { return { bottom: 80 }; },
    getStorageSync() { return ''; },
    setStorageSync() {},
    removeStorageSync() {},
    showToast() {},
    switchTab() {},
    createSelectorQuery() { return { select() { return this; }, boundingClientRect() { return this; }, exec(callback) { if (callback) callback([]); } }; },
    onAppShow() {}, offAppShow() {}, onAppHide() {}, offAppHide() {},
    getNetworkType() {}, onNetworkStatusChange() {},
    vibrateShort(options) { log.vibrations.push({ at: Date.now(), type: options && options.type }); },
    createInnerAudioContext() {
      const audio = {
        src: '', volume: 1,
        play() { log.plays.push({ at: Date.now(), src: audio.src, volume: audio.volume }); },
        stop() {},
        destroy() { log.destroyed += 1; },
        onError() {}
      };
      log.created += 1;
      return audio;
    }
  };
}

function loadRoomPage(log, dataOverrides) {
  for (const key of Object.keys(require.cache)) {
    if (['config', 'pages', 'services', 'utils'].some(dir => key.startsWith(path.join(root, dir)))) delete require.cache[key];
  }
  let definition;
  global.Page = page => { definition = page; };
  global.Component = () => {};
  global.App = () => {};
  global.getApp = () => ({ globalData: {} });
  global.getCurrentPages = () => [{}];
  global.wx = stubWx(log);
  require('../../pages/life-scene/life-scene');
  const starAdapter = require('../iaa-star-unlock-adapter');
  starAdapter.resetRoomStarView('AVAILABLE');
  const page = Object.assign({}, definition, {
    pageActive: true,
    data: Object.assign({}, definition.data, { pet: { id: 'test', name: '玉兔' } }, dataOverrides),
    setData(patch) { Object.assign(this.data, patch); }
  });
  return { page, starAdapter, fixture: require('../../fixtures/iaa-star-unlock') };
}

function newLog() { return { plays: [], vibrations: [], created: 0, destroyed: 0 }; }

(async () => {
  // 1. 真实收星成功：音效 0.2 秒、轻震 0.4 秒，各一次。
  {
    const log = newLog();
    const { page } = loadRoomPage(log);
    await page.loadCompanionStar();
    await page.onOpenTodayCompanion();
    assert.equal(log.created, 1, '可收星时打开信件即预加载音效');
    const startedAt = Date.now();
    await page.onTodayCompanionInteract();
    assert.equal(page.data.todayCompanionAwardedStars, 1);
    await page.onTodayCompanionInteract();
    await wait(520);
    assert.equal(log.plays.length, 1, '成功收星只播放一次音效');
    assert.equal(log.vibrations.length, 1, '成功收星只轻震一次');
    assert.equal(log.vibrations[0].type, 'light', '只使用轻档短震');
    assert.equal(log.plays[0].volume, 0.2, '初始音量 0.2，由 COO 真机调整');
    assert.equal(log.plays[0].src.endsWith('/companion-star/companion-star-award.mp3'), true);
    const soundAt = log.plays[0].at - startedAt;
    const hapticAt = log.vibrations[0].at - startedAt;
    assert.equal(soundAt >= 190 && soundAt < 320, true, `音效应在约 0.2 秒响起，实际 ${soundAt}ms`);
    assert.equal(hapticAt >= 390 && hapticAt < 520, true, `轻震应在约 0.4 秒弹出高点，实际 ${hapticAt}ms`);

    // 回房间：只展示原 +1 与光晕，不再发声或震动。
    page.onCloseTodayCompanion();
    assert.equal(page.data.companionStarAwardVisible, true, '关闭信件后房间左上角原 +1 出现');
    // 同日重开：不再收星，也不再播放。
    await page.onOpenTodayCompanion();
    assert.equal(page.data.todayCompanionAwardedStars, 0, '重开信件不得重播收星');
    await page.onTodayCompanionInteract();
    page.onCloseTodayCompanion();
    await wait(520);
    assert.equal(log.plays.length, 1, '回房间与同日重开不得重复音效');
    assert.equal(log.vibrations.length, 1, '回房间与同日重开不得重复震动');

    page.onUnload();
    clearTimeout(page.companionStarAwardTimer);
    assert.equal(log.destroyed, 1, '页面退出时销毁音频');
  }

  // 2. 收星请求失败：不播放、不震动。
  {
    const log = newLog();
    const { page, fixture } = loadRoomPage(log);
    await page.loadCompanionStar();
    await page.onOpenTodayCompanion();
    page.setData({ todayCompanionStarView: fixture.starUnlockViewFor('ERROR') });
    const result = await page.onTodayCompanionInteract();
    assert.equal(result.ok, false);
    assert.equal(page.data.todayCompanionAwardedStars, 0);
    await wait(520);
    assert.equal(log.plays.length + log.vibrations.length, 0, '失败的收星请求不得触发声音或震动');
    page.onUnload();
  }

  // 3. 成功后 0.4 秒内关闭信件或切后台：待触发的声音和震动一并取消。
  {
    const log = newLog();
    const { page } = loadRoomPage(log);
    await page.loadCompanionStar();
    await page.onOpenTodayCompanion();
    await page.onTodayCompanionInteract();
    page.onHide();
    await wait(520);
    assert.equal(log.plays.length + log.vibrations.length, 0, '切后台后不得补播');
    assert.equal(log.destroyed, 1, '切后台时释放音频');
    page.onUnload();
    clearTimeout(page.companionStarAwardTimer);
  }

  // 4. 减少动态效果：保留 +1 与音效，不震动。
  {
    const log = newLog();
    const { page } = loadRoomPage(log, { reducedMotion: true });
    await page.loadCompanionStar();
    await page.onOpenTodayCompanion();
    await page.onTodayCompanionInteract();
    await wait(520);
    assert.equal(page.data.todayCompanionAwardedStars, 1);
    assert.equal(log.plays.length, 1, '减少动态效果时仍按系统静音规则播放音效');
    assert.equal(log.vibrations.length, 0, '减少动态效果时不震动');
    page.onUnload();
    clearTimeout(page.companionStarAwardTimer);
  }

  console.log('陪伴星星收星反馈校验通过：成功收星各一次声音与轻震，失败、重开、回房间不重复，退出时清理音频。');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
