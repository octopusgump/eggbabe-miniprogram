const assert = require('assert');
const fs = require('fs');
const path = require('path');

const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const root = path.resolve(__dirname, '..');
const runtime = require('../miniprogram/services/runtime-context');
const time = require('../miniprogram/services/time-service');
const petStore = require('../miniprogram/utils/pet-store');
const sceneConfig = require('../miniprogram/utils/life-scenes');
const sceneCards = require('../miniprogram/services/scene-card-store');
const storageMigration = require('../miniprogram/services/storage-migration');
const analytics = require('../miniprogram/services/analytics');
const cloudApi = require('../miniprogram/services/cloud-api');
const config = require('../miniprogram/config/v2');

function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }

async function main() {
  const oldBrand = ['egg', 'baby'].join('');
  const oldKey = `${oldBrand}_migration_test_v1`;
  const newKey = 'eggbabe_migration_test_v1';
  wx.setStorageSync(oldKey, { preserved: true });
  assert.deepEqual(storageMigration.read(newKey, null), { preserved: true }, '品牌纠错后必须自动读取旧存储数据');
  assert.deepEqual(wx.getStorageSync(newKey), { preserved: true }, '旧存储数据必须迁移到 eggbabe 新键');
  assert.deepEqual(wx.getStorageSync(oldKey), { preserved: true }, '迁移期必须保留旧键，确保旧版本回退后仍能读取数据');
  const quotaOldKey = `${oldBrand}_quota_test_v1`;
  const quotaNewKey = 'eggbabe_quota_test_v1';
  wx.setStorageSync(quotaOldKey, { stillReadable: true });
  const originalSetStorage = wx.setStorageSync;
  wx.setStorageSync = (key, value) => {
    if (key === quotaNewKey) throw new Error('STORAGE_QUOTA');
    originalSetStorage(key, value);
  };
  assert.deepEqual(storageMigration.read(quotaNewKey, null), { stillReadable: true }, '迁移写入遇到容量限制时仍必须返回旧数据');
  wx.setStorageSync = originalSetStorage;

  runtime.setMode('live');
  const oldScopedPetKey = `${oldBrand}_live_${oldBrand}_mvp_pet_v1_v2`;
  wx.setStorageSync(oldScopedPetKey, { id: 'legacy-pet', ownerId: '', prototype: '玉兔' });
  assert.equal(petStore.getPet().id, 'legacy-pet', '旧品牌命名空间里的宠物数据必须可读取');
  petStore.resetDemo();
  assert.equal(petStore.getPet(), null, '迁移后的数据必须可以正常重置，不能从旧键复活');

  runtime.setMode('demo');
  petStore.resetDemo();
  const removedModeField = ['exhib', 'itionMode'].join('');
  const removedBackupKey = runtime.scopedKey(['eggbabe_', 'exhib', 'ition_backup_v1'].join(''), 'demo');
  wx.setStorageSync(runtime.scopedKey('eggbabe_mvp_pet_v1', 'demo'), {
    id: 'expo-legacy',
    demoMode: true,
    [removedModeField]: true,
    hatchAt: time.now() - 1000
  });
  wx.setStorageSync(removedBackupKey, { pet: { id: 'old-incubating-pet' } });
  assert.equal(petStore.getPet(), null, '升级后必须清除可绕过当前测试码的旧直达宠物');
  assert.equal(wx.getStorageSync(removedBackupKey), undefined, '升级后必须清除旧模式遗留备份');
  wx.setStorageSync(removedBackupKey, { pet: { id: 'orphaned-old-pet' } });
  assert.equal(petStore.getPet(), null, '没有当前宠物时仍应维持未绑定状态');
  assert.equal(wx.getStorageSync(removedBackupKey), undefined, '升级后必须单独清除无当前宠物的孤立旧备份');
  petStore.saveUser({ id: 'test-user', nickname: '测试蛋友', registeredAt: time.now() });
  runtime.setMode('live');
  assert.equal(petStore.getUser(), null, 'demo 用户不得进入 live 命名空间');
  assert.equal(petStore.getIdentityId(), '', 'demo 身份不得被 live 授权复用');
  runtime.setMode('demo');
  assert.equal(petStore.getUser().id, 'test-user', '切回 demo 后必须仍能读取隔离的测试用户');
  const invalid = petStore.bindPet('NOT-A-VALID-CODE', time.now());
  assert.equal(invalid.ok, false, '本地完整版不得接受其他激活码');
  assert.equal(invalid.reason, 'INVALID', '非本地验收码必须返回统一无效码原因');
  const bound = petStore.bindPet(' fuhuaqian ', time.now());
  assert.equal(bound.ok, true, '孵化前测试必须接受 FUHUAQIAN，且大小写与首尾空格不敏感');
  assert.equal(bound.pet.prototype, '玉兔', 'FUHUAQIAN 当前固定绑定玉兔原型');
  assert.equal(bound.pet.collectionCard, null, '完整版激活不得跳过孵化直接生成收藏卡');
  assert.equal(bound.pet.hatchAt > bound.pet.createdAt, true, '完整版激活必须进入正常孵化周期');
  assert.equal(sceneCards.list().length, 0, 'FUHUAQIAN 不得预置任何收集系列卡');
  assert.equal(petStore.shouldPromptNickname(), true, '未命名蛋首次进入必须显示命名弹层');
  assert.equal(petStore.dismissNicknamePrompt().ok, true, '用户必须可以选择暂不命名');
  assert.equal(petStore.shouldPromptNickname(), false, '同一北京时间日内暂不命名后不得重复弹出');
  assert.equal(petStore.updateNickname('望舒').ok, true, '首次命名必须成功');
  assert.equal(petStore.updateNickname('皎皎').code, 'DAILY_RENAME_LIMIT', '改名每天最多一次');
  assert.equal(petStore.completeTalk('今天也很期待见到你').added, 5, '每天第一次说话必须增加 5%');
  assert.equal(petStore.completeTalk('我还想再说一句').added, 0, '同一天后续说话不得重复增加进度');

  const pet = bound.pet;
  pet.hatchAt = time.now() - 1000;
  pet.progressEarned = 180;
  pet.progress = 100;
  petStore.savePet(pet);
  const created = petStore.createCollectionCard();
  assert.equal(created.ok, true, '达到破壳条件后必须可以承接身份收藏卡');
  const hatchedPet = petStore.getPet();
  assert.equal(hatchedPet.collectionCard.hatchQuality, '完整孵化', '完成理论动作的周期必须按归一化规则记为完整孵化');
  assert.equal(petStore.ensureFullDemoState(hatchedPet).ok, false, 'FUHUAQIAN 正常孵化完成后仍不得被完全状态修复逻辑预置十张卡');
  assert.equal(sceneCards.list().length, 0, 'FUHUAQIAN 破壳后必须继续通过互动逐张遇见收藏卡');

  for (const character of ['玉兔', '锦鲤']) {
    const scenes = sceneConfig.getScenesForCharacter(character);
    assert.equal(scenes.length, 6, `${character}必须登记 6 个生活场景`);
    scenes.forEach(scene => assert.equal(sceneConfig.getCardPool(character, scene.key).length > 0, true, `${character}${scene.label}必须配置收藏卡池`));
    const set = sceneConfig.getCardSetForCharacter(character);
    assert.equal(set.cards.length, 10, `${character}必须登记 10 张固定收藏卡`);
    assert.deepEqual(set.cards.map(card => card.collectorNumber), [1,2,3,4,5,6,7,8,9,10], `${character}收藏位编号必须连续`);
    set.cards.forEach(card => assert.equal(fs.existsSync(path.join(root, 'miniprogram', card.image)), true, `${card.collectorLabel} 必须有小程序预览图`));
  }

  const ytSet = sceneConfig.getCardSet('YT-S01');
  const h5Set = JSON.parse(read('h5/birth-card/assets/sets/YT-S01.json'));
  const faceContract = JSON.parse(read('h5/birth-card/card-face-contract.json'));
  assert.deepEqual(faceContract.fields, ['prototypeLabel', 'name', 'birthday', 'constellation', 'genderSymbol', 'mbti', 'signature', 'bloodType', 'collectorLabel'], '收藏卡正面字段契约必须移除头像并保留其余身份字段与系列编号');
  assert.equal(faceContract.recordFields.includes('avatarId'), true, '头像字段必须仅保留在数据记录中');
  assert.equal(ytSet.setName, '玉兔初见·水彩日常', '第一季收藏系列名称必须固定');
  assert.equal(ytSet.cards.every(card => card.treatment === 'BASE' && !card.rarity), true, 'MVP 只能使用 BASE，不得显示人为稀有度');
  assert.equal(ytSet.cards.every(card => card.checklistNumber === card.collectorNumber && card.checklistTotal === 10), true, '每张副本定义必须独立保存固定收藏位字段');
  const frozenIdentity = cards => cards.map(card => [card.cardId || card.cardDefinitionId, card.collectorNumber, card.collectorLabel, card.name || card.title, card.heroAssetId, card.treatment]);
  assert.deepEqual(frozenIdentity(ytSet.cards), frozenIdentity(h5Set.cards), '小程序与 H5 的固定收藏位必须一致');

  await sceneCards.attemptDrop('grass', '小花', '玉兔');
  await sceneCards.attemptDrop('grass', '蝴蝶', '玉兔');
  assert.equal(sceneCards.list().length >= 1, true, '内部验收数据第二次互动前必须至少遇见一张收藏卡');
  const attemptsBeforeRepeat = sceneCards.dailyState().attempts;
  const repeated = await sceneCards.attemptDrop('grass', '小花', '玉兔');
  assert.equal(repeated.repeated, true, '重复点击同一互动点不得再次参与判定');
  assert.equal(sceneCards.dailyState().attempts, attemptsBeforeRepeat, '重复点击不得增加尝试次数');
  for (let index = 0; index < 20; index += 1) await sceneCards.attemptDrop('grass', `互动${index}`, '玉兔');
  assert.equal(sceneCards.list().length <= 2, true, '每日最多遇见 2 张收藏卡');
  assert.equal(new Set(sceneCards.list().map(card => card.cardId)).size, sceneCards.list().length, '已拥有的收藏位不得重复遇见');
  const firstCard = sceneCards.list()[0];
  assert.equal(firstCard.setCode, 'YT-S01', '遇见的收藏卡必须记录系列代码');
  assert.match(firstCard.uniqueCode, /^EGG-YT-\d{8}-[A-Z0-9]{6}$/, '收藏卡副本必须生成稳定格式的唯一编号');
  const summary = sceneCards.collectionSummary('玉兔');
  assert.equal(summary.setCode, 'YT-S01', '收藏完成度必须按系列统计');
  assert.equal(summary.slots.length, 10, '卡册必须保留十个固定收藏位');
  assert.equal(summary.ownedUnique, new Set(sceneCards.list().map(card => card.cardId)).size, '已拥有定义必须按唯一收藏位计算');
  assert.equal(summary.total, 10, 'YT-S01 完成目标必须固定为 10');
  const beforeDuplicate = sceneCards.list();
  wx.setStorageSync(runtime.scopedKey('scene_cards'), beforeDuplicate.concat(Object.assign({}, firstCard, { id: `${firstCard.id}-duplicate`, uniqueCode: 'EGG-YT-20260714-999999' })));
  const duplicatedSummary = sceneCards.collectionSummary('玉兔');
  assert.equal(duplicatedSummary.ownedUnique, summary.ownedUnique, '旧数据中的重复副本不得增加收藏完成度');
  assert.equal(duplicatedSummary.duplicateCount, 0, '前端不得展示或计算重复获取');

  const lifePage = read('miniprogram/pages/life-scene/life-scene.js');
  const lifeTemplate = read('miniprogram/pages/life-scene/life-scene.wxml');
  const lifeStyles = read('miniprogram/pages/life-scene/life-scene.wxss');
  const removedStarter = ['start', 'Exhib', 'itionDemo'].join('');
  assert.equal(lifePage.includes(removedStarter), false, '生活场景不得创建绕过孵化的宠物');
  assert.equal(lifePage.includes("petStore.getStage(pet) !== 'hatched'"), true, '未破壳宠物不得进入生活场景');
  assert.equal(lifePage.includes('/pages/h5-card/h5-card?sceneCardId='), true, '收藏卡揭晓必须进入统一 H5 卡面容器');
  assert.equal(lifeTemplate.includes('cardDrop.image && !cardImageFailed'), true, '卡图加载失败必须显示占位回退');
  assert.equal(lifeTemplate.includes('drop-panel--{{cardRevealPhase}}'), true, '收藏卡弹层必须绑定揭晓阶段样式');
  assert.equal(lifeStyles.includes('@keyframes drop-card-wait'), true, '收藏卡必须有克制的等待动效');
  assert.equal(lifeStyles.includes('.drop-panel--revealed'), true, '收藏卡必须有揭晓完成态');

  const app = JSON.parse(read('miniprogram/app.json'));
  assert.equal(app.pages.includes('pages/life-scenes/life-scenes'), true, '必须注册生活场景选择页');
  assert.equal(app.pages.includes('pages/life-scene/life-scene'), true, '必须注册生活场景详情页');
  assert.equal(app.pages.includes('pages/shop/shop'), true, '当前 V2.0 必须注册露珠商店');
  assert.equal(app.pages.includes('pages/bag/bag'), true, '当前 V2.0 必须注册背包');
  assert.equal(app.pages.includes('pages/hatch-guide/hatch-guide'), false, '独立孵化手册页必须下线，由首页任务列表承接');
  const removedRouteFragments = [['exhib', 'ition'].join(''), ['set-card-', 'preview'].join('')];
  assert.equal(app.pages.some(page => removedRouteFragments.some(fragment => page.includes(fragment))), false, '不得注册任何旧直达或全卡预览页面');

  const album = read('miniprogram/pages/album/album.wxml');
  const albumPage = read('miniprogram/pages/album/album.js');
  assert.equal(album.includes('item.image && !item.imageFailed'), true, '卡册必须显示正式收藏卡图片并支持加载失败回退');
  assert.equal(album.includes('setSlots'), true, '我的收藏卡必须显示固定收藏位');
  assert.equal(album.includes('summary.ownedUnique'), true, '卡册必须显示去重后的系列完成度');
  assert.equal(album.includes('item.obtainedLabel'), true, '已拥有收藏位必须显示获得时间');
  assert.equal(album.includes('尚未遇见'), true, '未获得位必须显示尚未遇见');
  assert.equal(album.includes('不会重复出现'), true, '卡册必须明确已遇见的收藏卡不会重复出现');
  assert.equal(album.includes('mode="aspectFit"'), true, '固定完整插画不得在卡册中被裁切');
  assert.equal(album.includes('预览全部'), false, '正式卡册不得保留绕过收集流程的全部预览入口');
  assert.equal(album.includes('标记'), false, '卡册不得显示无实际价值的标记功能');
  assert.equal(albumPage.includes('onSaveSceneCard'), false, '卡册页面不得保留已下线的标记处理逻辑');

  const homeTemplate = read('miniprogram/pages/home/home.wxml');
  const homePage = read('miniprogram/pages/home/home.js');
  const homeStyles = read('miniprogram/pages/home/home.wxss');
  assert.equal(homeTemplate.includes('src="{{sceneImage}}"'), true, '破壳后主页必须使用角色对应的生活场景图');
  assert.equal(homePage.includes("sceneConfig.getScene('grass', pet.prototype).image"), true, '主页场景图必须按当前角色配置读取');
  assert.equal(homeTemplate.includes('一起待一会儿'), true, '孵化首页必须使用无任务压力的自由陪伴入口');
  assert.equal((homePage.match(/interaction_(?:touch|talk|quiet|window|wish|learn|draw|secret)\.svg/g) || []).length, 8, '孵化首页必须接入 8 个独立互动图标');
  assert.equal(/task-row|task-reward|今天陪我做的事/.test(homeTemplate), false, '自由陪伴入口不得显示每日任务、完成状态或奖励比例');
  assert.equal(homeTemplate.includes('id="homeEggBaseCanvas"') && homeTemplate.includes('id="homeEggArtCanvas"'), true, '孵化首页必须以 Canvas 使用交付蛋体并回显蛋壳绘图');
  assert.equal(homePage.includes("require('../../services/egg-shell-art')"), true, '孵化首页必须通过统一蛋壳绘图渲染器使用透明蛋主体');
  assert.equal(homeStyles.includes('.egg-contact-shadow'), true, '蛋宝宝必须在 U 形孵化窝中具有接触阴影');
  assert.equal(homeTemplate.includes('跟我说说话'), true, '孵化期首页必须提供常驻说话入口');
  assert.equal(homeTemplate.includes('这是我的孵化进度'), true, '进度圆环必须提供轻量说明');
  assert.equal(homeTemplate.includes('conic-gradient'), true, '进度圆环必须按孵化百分比填充');
  assert.equal(homeTemplate.includes('class="dew-balance'), true, '首页右上角必须有独立露珠余额组件');
  assert.equal(homeTemplate.includes('今日通过点击已收集'), true, '露珠余额入口必须只展示今日点击收集进度');
  assert.equal(homeTemplate.includes('class="dew-drop-flight"'), true, '露珠到账必须从点击位置飞向余额');
  assert.equal(homeTemplate.includes('class="dew-gain"'), true, '露珠到账必须显示 +1 露珠反馈');
  assert.equal(homePage.includes('currency.tapEgg(requestId)'), true, '每次轻触必须携带唯一请求 ID 通过服务适配层判定露珠');
  assert.equal(homeStyles.includes('@keyframes dew-flight'), true, '首页必须实现露珠柔和飞行动效');
  assert.equal(homeStyles.includes('.dew-drop-flight { animation: dew-fade-in'), true, '弱动效模式必须将露珠飞行降级为淡入');
  assert.equal(homeTemplate.includes("stage === 'prepared'") && homeTemplate.includes("stage === 'soon'"), true, '准备完成与即将破壳状态必须显示等待按钮');
  assert.equal(homePage.includes('/pages/nickname/nickname'), true, '破壳后必须保留可达的每日改名入口');
  assert.equal(homeTemplate.includes("stage === 'hatched' && dailyStatus"), true, '每日状态只能在破壳后显示');
  assert.equal(homePage.includes('getCountdown'), false, '首页不得显示天数或时分倒计时');

  let lifePageDefinition;
  const lifePagePath = require.resolve('../miniprogram/pages/life-scene/life-scene.js');
  global.Page = definition => { lifePageDefinition = definition; };
  delete require.cache[lifePagePath];
  require(lifePagePath);
  delete global.Page;
  const createLifePage = () => {
    const page = Object.assign({}, lifePageDefinition);
    page.data = Object.assign({}, lifePageDefinition.data, {
      scene: { key: 'grass', label: '草地' },
      pet: { prototype: '玉兔' },
      hotspots: [{ label: '小花' }, { label: '蝴蝶' }],
      isActive: true,
      cardDrop: null
    });
    page.setData = changes => { page.data = Object.assign({}, page.data, changes); };
    page.showReaction = () => {};
    page.showFlowerSway = () => {};
    page.showButterflyFlight = () => {};
    page.showSceneEffect = () => {};
    page.pageActive = true;
    page.dropPending = false;
    page.dropRequestToken = 0;
    page.cardRevealDelay = 1;
    page.encounterDelay = 1;
    return page;
  };
  const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
  };
  const originalAttemptDrop = sceneCards.attemptDrop;
  const firstRequest = deferred();
  let requestCount = 0;
  sceneCards.attemptDrop = () => { requestCount += 1; return firstRequest.promise; };
  const revealPage = createLifePage();
  revealPage.onTapHotspot({ currentTarget: { dataset: { index: 0 } } });
  revealPage.onTapHotspot({ currentTarget: { dataset: { index: 1 } } });
  assert.equal(requestCount, 1, '收藏卡请求完成前必须锁定后续请求，避免卡片互相覆盖');
  firstRequest.resolve({ ok: true, dropped: true, card: { id: 'card-1', image: '/missing.png', mark: '草' } });
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(revealPage.data.cardRevealPhase, 'revealed', '收藏卡必须从期待提示进入正式揭晓态');
  revealPage.onCardImageError();
  assert.equal(revealPage.data.cardImageFailed, true, '正式卡图加载失败时必须切换到字标占位');
  revealPage.onCloseCardDrop();

  const staleRequest = deferred();
  sceneCards.attemptDrop = () => staleRequest.promise;
  const lifecyclePage = createLifePage();
  lifecyclePage.onTapHotspot({ currentTarget: { dataset: { index: 0 } } });
  lifecyclePage.onHide();
  lifecyclePage.onShow();
  staleRequest.resolve({ ok: true, dropped: true, card: { id: 'stale-card' } });
  await Promise.resolve();
  assert.equal(lifecyclePage.data.cardDrop, null, '页面隐藏前发出的旧请求不得在返回页面后重新弹出');
  sceneCards.attemptDrop = originalAttemptDrop;

  assert.equal(fs.existsSync(path.join(root, 'cloudfunctions')), false, 'Bohao 侧不得保留 cloudfunctions');
  const frontEndSources = ['miniprogram/app.js', 'miniprogram/services/cloud-api.js', 'miniprogram/services/analytics.js', 'miniprogram/services/time-service.js'].map(read).join('\n');
  assert.equal(/wx\.cloud/.test(frontEndSources), false, '前端不得调用 wx.cloud.*');

  const forbiddenSources = [
    read('miniprogram/app.json'), read('miniprogram/pages/home/home.js'), read('miniprogram/pages/home/home.wxml'),
    read('miniprogram/pages/my/my.js'), read('miniprogram/pages/my/my.wxml'), read('README.md')
  ].join('\n');
  const removedCopy = new RegExp([['展', '会'].join(''), ['EXHIB', 'ITION'].join(''), ['exhib', 'ition'].join(''), ['快速', '体验'].join('')].join('|'));
  assert.equal(removedCopy.test(forbiddenSources), false, '用户入口、当前 PRD 与说明不得残留旧公开直达模式');
  assert.equal(read('miniprogram/config/v2.js').includes("localActivationCode: 'FUHUAQIAN'"), true, '孵化前测试码必须固定为 FUHUAQIAN');
  assert.equal(read('miniprogram/config/v2.js').includes("localHatchedActivationCode: 'FUHUAHOU'"), true, '孵化后完全状态测试码必须固定为 FUHUAHOU');
  const currencySource = read('miniprogram/services/currency-store.js');
  const cloudApiSource = read('miniprogram/services/cloud-api.js');
  const shopSource = read('miniprogram/pages/shop/shop.js');
  const bagTemplate = read('miniprogram/pages/bag/bag.wxml');
  assert.equal(currencySource.includes('DEMO_CLICK_THRESHOLDS = [1, 2, 1, 2, 3, 2, 3, 3, 4, 5]'), true, 'demo 应以独立固定序列复现约 26 次收齐 10 个露珠');
  assert.equal(/daily_visit|daily_status_view/.test(currencySource), false, '当前版本不得从签到、到访或查看状态发露珠');
  assert.equal(currencySource.includes("runtime.getMode() === 'live'"), true, 'live 与 demo 经济必须隔离');
  assert.equal(currencySource.includes('processedRequestIds'), true, 'demo 适配层也必须校验请求幂等');
  assert.equal(currencySource.includes("write(DEMO_ECONOMY_KEY, snapshot)"), true, 'demo 余额、流水、点击状态与库存必须通过单快照写入');
  assert.equal(currencySource.includes("result.mode !== 'live'"), true, 'live 必须拒绝非 live 模式的后端数据');
  assert.equal(currencySource.includes('item_used'), false, '未列入 §18.9 的投喂行为不得新增埋点');
  assert.equal(cloudApiSource.includes("call('tapEggCurrency', { request_id: requestId, mode: 'live' })"), true, 'live 点击必须把唯一请求 ID 与 mode 交给 CTO 接口');
  assert.equal(shopSource.indexOf('currency.purchase(item.id)') < shopSource.indexOf("title: '已经放进背包'"), true, '购买成功反馈必须晚于服务确认');
  assert.equal(bagTemplate.includes('{{item.actionLabel}}'), true, '背包必须区分装配、卸下、摆放、收起与投喂');
  const prdSource = read('docs/蛋宝宝小程序_V2_PRD.md');
  assert.equal(prdSource.includes('当前版本 | v2.27'), true, '仓库 PRD 必须同步为 v2.27');
  assert.equal(prdSource.includes('普通版整章停用（v2.27'), true, 'PRD 必须明确冻结普通版露珠、商店与背包');
  assert.equal(prdSource.includes('禁止仅替换“掉落 / 抽卡”为“遇见 / 收集”'), true, 'PRD 必须按实际机制而非替换文案判断游戏风险');
  assert.equal(prdSource.includes('普通小程序走到游戏小程序不是“在原账号里打开功能开关”'), true, 'PRD 必须保留普通版到独立游戏版的迁移门禁');
  assert.equal(read('miniprogram/config/v2.js').includes("version: '2.26.0-preview'"), true, '小程序前端版本必须升级为 2.26');

  const wrongBrand = new RegExp(oldBrand, 'i');
  const sourceRoots = ['miniprogram', 'docs', 'README.md', 'project.config.json'];
  const scan = target => {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) return fs.readdirSync(target).forEach(name => scan(path.join(target, name)));
    if (!/\.(js|json|md|wxml|wxss)$/.test(target)) return;
    if (path.basename(target) === '蛋宝宝小程序_V2_PRD.md') return;
    assert.equal(wrongBrand.test(fs.readFileSync(target, 'utf8')), false, `仍有错误品牌拼写：${target}`);
  };
  sourceRoots.forEach(source => scan(path.join(root, source)));

  petStore.resetDemo();
  assert.deepEqual(wx.getStorageSync(runtime.scopedKey('scene_cards')), undefined, '重置本地体验必须同时清除旧会话收藏卡');
  runtime.setMode('demo');
  const hatched = petStore.bindPet(' fuhuahou ', time.now());
  assert.equal(hatched.ok, true, 'FUHUAHOU 必须作为本地孵化后完全状态测试码');
  assert.equal(petStore.getStage(hatched.pet), 'hatched', 'FUHUAHOU 必须直接进入已孵化状态');
  assert.equal(!!hatched.pet.collectionCard, true, 'FUHUAHOU 必须同时生成身份收藏卡，保证具体卡面可用');
  assert.equal(hatched.pet.testPreset, 'hatched_full', 'FUHUAHOU 必须保存完全状态标记，以便旧数据缺卡时自动恢复');
  const fullCards = sceneCards.list();
  assert.equal(fullCards.length, 10, 'FUHUAHOU 必须把当前角色 10 张收藏卡全部写入测试卡册');
  const fullSummary = sceneCards.collectionSummary('玉兔');
  assert.equal(fullSummary.ownedUnique, 10, 'FUHUAHOU 卡册必须显示 10/10，而不是 0/10');
  assert.equal(fullSummary.slots.every(slot => slot.owned && slot.instanceId), true, 'FUHUAHOU 的 10 个卡位必须都可点击具体卡面');
  assert.equal(new Set(fullCards.map(card => card.cardId)).size, 10, 'FUHUAHOU 必须写入 10 个不同收藏位');
  assert.equal(new Set(fullCards.map(card => card.uniqueCode)).size, 10, 'FUHUAHOU 每张测试卡必须有不同的副本编号');
  assert.equal(fullCards.every(card => card.mode === 'demo' && card.character === '玉兔'), true, 'FUHUAHOU 全卡数据必须保持为玉兔 demo 测试数据');

  // 回归：旧版本的“孵化后”测试宠物可能已存在，但当时没有成功写入十张收藏卡。
  // 打开卡册时必须恢复 FUHUAHOU 的 10/10 完全状态，并让每张卡可进入预览。
  wx.removeStorageSync(runtime.scopedKey('scene_cards'));
  const legacyDirectHatchPet = Object.assign({}, petStore.getPet());
  delete legacyDirectHatchPet.testPreset;
  petStore.savePet(legacyDirectHatchPet);
  const repeatFullActivation = petStore.bindPet('FUHUAHOU');
  assert.equal(repeatFullActivation.ok, true, '历史立即孵化测试宠物再次输入 FUHUAHOU 时必须修复完全状态，而不是返回 BOUND');
  assert.equal(sceneCards.collectionSummary('玉兔').ownedUnique, 10, '再次输入 FUHUAHOU 后必须恢复 10/10');
  wx.removeStorageSync(runtime.scopedKey('scene_cards'));
  let albumPageDefinition;
  const albumPagePath = require.resolve('../miniprogram/pages/album/album.js');
  global.Page = definition => { albumPageDefinition = definition; };
  delete require.cache[albumPagePath];
  require(albumPagePath);
  delete global.Page;
  const albumInstance = Object.assign({}, albumPageDefinition);
  albumInstance.data = Object.assign({}, albumPageDefinition.data);
  albumInstance.setData = changes => { albumInstance.data = Object.assign({}, albumInstance.data, changes); };
  albumInstance.onShow();
  assert.equal(albumInstance.data.summary.ownedUnique, 10, '历史 FUHUAHOU 宠物打开卡册时必须自动恢复 10/10');
  assert.equal(albumInstance.data.setSlots.every(slot => slot.owned && slot.image && slot.instanceId), true, 'FUHUAHOU 十张卡必须都有图片且可点击');
  let previewUrl = '';
  wx.navigateTo = ({ url }) => { previewUrl = url; };
  albumInstance.onOpenSetCard({ currentTarget: { dataset: { id: albumInstance.data.setSlots[0].instanceId } } });
  assert.match(previewUrl, /^\/pages\/(h5-card\/h5-card|collection-card\/collection-card)\?/, 'FUHUAHOU 收藏卡必须可进入具体卡面预览');
  petStore.resetDemo();

  const originalBackendEnabled = config.backendEnabled;
  const originalServerTime = cloudApi.serverTime;
  const originalTrackEvents = cloudApi.trackEvents;
  let uploadedEvents = null;
  config.backendEnabled = true;
  cloudApi.serverTime = () => Promise.resolve({ ok: true, serverTs: Date.now() });
  cloudApi.trackEvents = events => { uploadedEvents = events; return Promise.resolve({ ok: true }); };
  runtime.setMode('live');
  await time.sync();
  wx.setStorageSync('eggbabe_analytics_queue_v2', [
    { event_id: 'demo-complete', event_name: 'card_set_complete', mode: 'demo', server_ts: time.now() },
    { event_id: 'live-control', event_name: 'live_control', mode: 'live', server_ts: time.now() }
  ]);
  const flushed = await analytics.flush();
  assert.equal(flushed.ok, true, '正式统计队列必须可以正常上传 live 事件');
  assert.deepEqual(uploadedEvents.map(event => event.event_id), ['live-control'], 'demo 完全状态事件不得进入正式统计上传');
  assert.deepEqual(wx.getStorageSync('eggbabe_analytics_queue_v2'), [], '已处理的 demo 与 live 事件必须从本地待上传队列清除');
  config.backendEnabled = originalBackendEnabled;
  cloudApi.serverTime = originalServerTime;
  cloudApi.trackEvents = originalTrackEvents;
  console.log('V2.27 文档与历史前端校验通过：普通版合规冻结门禁、既有 demo 能力及测试码状态正常。');
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
