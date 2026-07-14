const assert = require('assert');

const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const runtime = require('../miniprogram/services/runtime-context');
const petStore = require('../miniprogram/utils/pet-store');
const sceneConfig = require('../miniprogram/utils/exhibition-scenes');
const sceneCards = require('../miniprogram/services/scene-card-store');
const setCardPreview = require('../miniprogram/services/set-card-preview');
const storageMigration = require('../miniprogram/services/storage-migration');
const fs = require('fs');
const path = require('path');

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
  petStore.saveUser({ id: 'test-user', nickname: '测试蛋友', registeredAt: Date.now() });
  const bound = petStore.bindPet('DEMO-KOI', Date.now());
  assert.equal(bound.ok, true, '正式模式应能绑定测试蛋');
  const livePetId = bound.pet.id;

  const demoPet = petStore.startExhibitionDemo();
  const faceContract = JSON.parse(fs.readFileSync(path.join(__dirname, '../h5/birth-card/card-face-contract.json'), 'utf8'));
  assert.equal(runtime.getMode(), 'demo', '展会体验必须切换到 demo');
  assert.equal(demoPet.demoMode, true, '展会宠物必须标记 demoMode');
  assert.notEqual(demoPet.id, livePetId, '展会宠物不得复用正式宠物 ID');

  const previewCards = setCardPreview.buildPreviewCards(demoPet);
  assert.equal(previewCards.length, 10, '展会模式必须可以预览 YT-S01 全部十张完整卡面');
  assert.equal(previewCards[0].name, '月团', '预览卡必须使用当前展会角色名');
  assert.equal(previewCards[0].birthday, demoPet.collectionCard.birthday, '预览卡必须使用已生成的生日');
  assert.equal(setCardPreview.formatBirthday(faceContract.displayExamples.birthday.raw), faceContract.displayExamples.birthday.label, '卡面生日格式器必须服从共享示例契约');
  assert.equal(previewCards[0].birthdayLabel, setCardPreview.formatBirthday(previewCards[0].birthday), '展会卡生日标签必须从当前真实生日动态生成');
  assert.equal(previewCards[0].constellation, demoPet.collectionCard.zodiac, '预览卡必须使用已生成的星座');
  assert.equal(setCardPreview.formatConstellation(faceContract.displayExamples.constellation.raw), faceContract.displayExamples.constellation.label, '卡面星座格式器必须服从共享示例契约');
  assert.equal(previewCards[0].constellationLabel, setCardPreview.formatConstellation(previewCards[0].constellation), '展会卡星座标签必须从当前真实星座动态生成');
  assert.equal(previewCards[0].mbti, demoPet.collectionCard.mbti, '预览卡必须使用已生成的 MBTI');

  for (const scene of sceneConfig.getScenesForCharacter('玉兔')) {
    assert.equal(sceneConfig.getCardPool('玉兔', scene.key).length > 0, true, `${scene.label}必须配置场景卡池`);
  }

  const firstSet = sceneConfig.getCardSet('YT-S01');
  const h5Set = JSON.parse(fs.readFileSync(path.join(__dirname, '../h5/birth-card/assets/sets/YT-S01.json'), 'utf8'));
  const cloudSet = require('../cloudfunctions/sceneCardDrop/card-catalog').SET;
  assert.equal(firstSet.setName, '玉兔初见·水彩日常', '第一季套卡名称必须固定');
  assert.equal(firstSet.cards.length, 10, 'YT-S01 必须恰好包含 10 张基础卡');
  assert.deepEqual(firstSet.cards.map(card => card.collectorNumber), [1,2,3,4,5,6,7,8,9,10], '清单编号必须连续且不可复用');
  assert.equal(firstSet.cards.every(card => card.treatment === 'BASE' && !card.rarity), true, 'MVP 只能使用 BASE，不得显示人为稀有度');
  assert.equal(firstSet.cards.every(card => card.checklistNumber === card.collectorNumber && card.checklistTotal === 10), true, '每张副本定义必须独立保存 checklist 数值字段');
  const frozenIdentity = cards => cards.map(card => [card.cardId || card.card_key || card.cardDefinitionId, card.collectorNumber || card.collector_number, card.collectorLabel || card.collector_label, card.name || card.title, card.heroAssetId || card.hero_asset_id, card.treatment]);
  const runtimeIdentity = cards => cards.map(card => ({
    cardId: card.cardId || card.card_key,
    collectorNumber: card.collectorNumber || card.collector_number,
    collectorLabel: card.collectorLabel || card.collector_label,
    checklistNumber: card.checklistNumber || card.checklist_number,
    checklistTotal: card.checklistTotal || card.checklist_total,
    name: card.name,
    heroAssetId: card.heroAssetId || card.hero_asset_id,
    treatment: card.treatment,
    setCode: card.setCode || card.set_code,
    image: card.image,
    mark: card.mark,
    sceneKeys: (card.sceneKeys || card.scene_keys || []).slice().sort()
  }));
  assert.deepEqual(frozenIdentity(firstSet.cards), frozenIdentity(h5Set.cards), '小程序卡池必须与 H5 冻结 checklist 身份完全一致');
  assert.deepEqual(runtimeIdentity(firstSet.cards), runtimeIdentity(cloudSet.cards), '云端卡池必须与小程序完整运行时清单一致');
  firstSet.cards.forEach(card => {
    assert.equal(fs.existsSync(path.join(__dirname, '../miniprogram', card.image)), true, `${card.collectorLabel} 必须有可打包的小程序预览图`);
  });

  await sceneCards.attemptDrop('grass', '小花', '玉兔');
  await sceneCards.attemptDrop('grass', '蝴蝶', '玉兔');
  assert.equal(sceneCards.list().length >= 1, true, '展会第二次互动前必须至少掉落一张场景卡');
  const attemptsBeforeRepeat = sceneCards.dailyState().attempts;
  const repeated = await sceneCards.attemptDrop('grass', '小花', '玉兔');
  assert.equal(repeated.repeated, true, '重复点击同一互动点不得再次参与掉落判定');
  assert.equal(sceneCards.dailyState().attempts, attemptsBeforeRepeat, '重复点击不得增加掉落尝试次数');
  for (let index = 0; index < 20; index += 1) await sceneCards.attemptDrop('grass', `互动${index}`, '玉兔');
  assert.equal(sceneCards.list().length <= 2, true, '场景卡每日掉落不得超过 2 张');
  const firstCard = sceneCards.list()[0];
  assert.equal(firstCard.setCode, 'YT-S01', '掉落卡必须记录套装代码');
  assert.match(firstCard.uniqueCode, /^EGG-YT-\d{8}-[A-Z0-9]{6}$/, '掉落副本必须生成稳定格式的唯一编号');
  const summary = sceneCards.collectionSummary('玉兔');
  assert.equal(summary.setCode, 'YT-S01', '收藏完成度必须按套装统计');
  assert.equal(summary.slots.length, 10, '卡册必须保留十个固定卡位');
  assert.equal(summary.ownedUnique, new Set(sceneCards.list().map(card => card.cardId)).size, '重复副本不得重复计算套装完成度');
  assert.equal(summary.total, 10, 'YT-S01 完成目标必须固定为 10');
  const beforeDuplicate = sceneCards.list();
  wx.setStorageSync(runtime.scopedKey('scene_cards'), beforeDuplicate.concat(Object.assign({}, firstCard, { id: `${firstCard.id}-duplicate`, uniqueCode: 'EGG-YT-20260714-999999' })));
  const duplicatedSummary = sceneCards.collectionSummary('玉兔');
  assert.equal(duplicatedSummary.ownedUnique, summary.ownedUnique, '重复副本不得增加 checklist 完成度');
  assert.equal(duplicatedSummary.duplicateCount, summary.duplicateCount + 1, '重复副本必须折叠并单独计数');

  const scenePage = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/exhibition-scene/exhibition-scene.js'), 'utf8');
  assert.equal(scenePage.includes("petStore.getStage(pet) !== 'hatched'"), true, '正式已破壳宠物进入场景时不得切换到 demo');
  const sceneTemplate = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/exhibition-scene/exhibition-scene.wxml'), 'utf8');
  assert.equal(sceneTemplate.includes('cardDrop.image && !cardImageFailed'), true, '掉卡弹层必须支持正式图片失败后的占位回退');
  assert.equal(sceneTemplate.includes('drop-panel--{{cardRevealPhase}}'), true, '掉卡弹层必须绑定揭晓阶段样式');
  const sceneStyles = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/exhibition-scene/exhibition-scene.wxss'), 'utf8');
  assert.equal(sceneStyles.includes('@keyframes drop-card-wait'), true, '抽卡必须有克制的等待动效');
  assert.equal(sceneStyles.includes('.drop-panel--revealed'), true, '抽卡必须有揭晓完成态');
  const albumTemplate = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/album/album.wxml'), 'utf8');
  const albumPageSource = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/album/album.js'), 'utf8');
  assert.equal(albumTemplate.includes('item.image && !item.imageFailed'), true, '卡册必须显示正式场景卡图片并支持加载失败回退');
  assert.equal(albumTemplate.includes('setSlots'), true, '卡册必须渲染固定 checklist 卡位，而不是只显示已拥有副本');
  assert.equal(albumTemplate.includes('summary.ownedUnique'), true, '卡册必须显示去重后的套装完成度');
  assert.equal(albumTemplate.includes('item.obtainedLabel'), true, '已拥有卡位必须显示获得时间');
  assert.equal(albumTemplate.includes('onOpenCopies'), true, '重复副本必须可以查看折叠明细');
  assert.equal(albumTemplate.includes('mode="aspectFit"'), true, '固定完整 Hero 不得在卡册中被裁切');
  assert.equal(albumTemplate.includes('展会预览 · 查看全部收藏卡'), true, '展会收藏页必须提供全部完整卡面总入口');
  assert.equal(albumTemplate.includes('标记'), false, '卡册不得继续显示无实际价值的标记功能');
  assert.equal(albumTemplate.includes('onSaveSceneCard'), false, '卡册不得保留标记交互入口');
  assert.equal(albumPageSource.includes('onSaveSceneCard'), false, '卡册页面不得保留已下线的标记处理逻辑');
  const appConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../miniprogram/app.json'), 'utf8'));
  assert.equal(appConfig.pages.includes('pages/set-card-preview/set-card-preview'), true, '小程序必须注册展会完整卡面预览页');
  const previewTemplate = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/set-card-preview/set-card-preview.wxml'), 'utf8');
  assert.deepEqual(faceContract.fields, ['name', 'birthday', 'constellation', 'mbti', 'collectorLabel'], '收藏卡正面字段契约必须保持精简');
  ['current.name', 'current.mbti', 'current.constellationLabel', 'current.birthdayLabel', 'current.collectorLabel', 'current.image'].forEach(field => {
    assert.equal(previewTemplate.includes(field), true, `完整卡面预览缺少 ${field}`);
  });
  assert.equal(previewTemplate.includes(faceContract.brandName), true, '小程序完整卡面品牌名必须服从 H5 卡面契约');
  assert.equal(previewTemplate.includes('mode="aspectFill"'), true, '完整卡面的 4:5 Hero 必须铺满插画视口');
  assert.equal(previewTemplate.includes('bloodType'), false, '完整套卡正面不得显示血型');
  ['card-dots', 'set-number', 'card-footer', 'current.statusLabel', 'current.uniqueCode'].forEach(content => {
    assert.equal(previewTemplate.includes(content), false, `完整卡面不得继续显示 ${content}`);
  });
  const miniBindings = { mbti: 'current.mbti', constellation: 'current.constellationLabel', birthday: 'current.birthdayLabel' };
  const miniStatPositions = faceContract.statOrder.map(field => previewTemplate.indexOf(miniBindings[field]));
  assert.equal(miniStatPositions.every((position, index) => position >= 0 && (!index || position > miniStatPositions[index - 1])), true, '小程序信息顺序必须服从共享卡面契约');
  ['stat-row', 'stat-icon--mbti', 'stat-icon--constellation', 'stat-icon--birthday'].forEach(className => {
    assert.equal(previewTemplate.includes(className), true, `小程序卡面缺少参考图信息行 ${className}`);
  });
  const previewStyles = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/set-card-preview/set-card-preview.wxss'), 'utf8');
  const h5Template = fs.readFileSync(path.join(__dirname, '../h5/birth-card/index.html'), 'utf8');
  const h5Styles = fs.readFileSync(path.join(__dirname, '../h5/birth-card/styles.css'), 'utf8');
  assert.equal(previewStyles.includes('width: 675rpx; height: 1200rpx'), true, '小程序完整卡面必须为 4:5 插画留出竖版空间');
  assert.match(previewStyles, /\.card-illustration-section\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/, '小程序插画视口必须锁定 4:5');
  assert.equal(/\.preview-card\s*\{[^}]*outline:/s.test(previewStyles), false, '完整卡面不得显示黑色内描边');
  assert.equal(previewStyles.toLowerCase().includes('border: 3rpx solid #94ab61'), true, '信息区必须使用参考图的绿色圆角边框');
  ['card-title-section', 'card-illustration-section', 'hero-figure', 'collect-badge', 'card-data-section', 'stat-grid'].forEach(className => {
    assert.equal(previewTemplate.includes(className), true, `小程序卡面缺少 H5 对齐结构 ${className}`);
    assert.equal(h5Template.includes(className), true, `H5 卡面缺少共享结构 ${className}`);
  });
  const normalizedMiniStyles = previewStyles.toLowerCase();
  const normalizedH5Styles = h5Styles.toLowerCase();
  faceContract.colors.forEach(color => {
    assert.equal(normalizedMiniStyles.includes(color), true, `小程序卡面缺少共享颜色 ${color}`);
    assert.equal(normalizedH5Styles.includes(color), true, `H5 卡面缺少共享颜色 ${color}`);
  });
  assert.match(h5Styles, /\.birth-card\s*\{[^}]*aspect-ratio:\s*9\s*\/\s*16/, 'H5 卡面必须为 4:5 插画留出竖版空间');
  assert.match(h5Styles, /\.illustration-frame\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/, 'H5 插画视口必须锁定 4:5');
  assert.equal(/\.birth-card\s*\{[^}]*outline:/s.test(h5Styles), false, 'H5 卡面不得显示黑色内描边');
  const previewPageSource = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/set-card-preview/set-card-preview.js'), 'utf8');
  assert.equal(previewPageSource.includes('startExhibitionDemo'), false, '直接访问预览页不得静默切换展会模式');
  assert.equal(previewPageSource.includes("navigateTo({ url: '/pages/album/album?tab=scene'"), false, '从预览返回卡册不得重复压入页面栈');
  assert.equal(sceneTemplate.includes('onOpenFullCard'), true, '展会抽卡揭晓必须可以直接打开完整卡面');
  assert.equal(scenePage.includes('/pages/set-card-preview/set-card-preview'), true, '展会抽卡入口必须跳转到完整卡面预览页');
  const cloudDrop = fs.readFileSync(path.join(__dirname, '../cloudfunctions/sceneCardDrop/index.js'), 'utf8');
  assert.equal(cloudDrop.includes('unique_code'), true, '正式模式掉落也必须生成唯一副本编号');
  assert.equal(cloudDrop.includes('set_code'), true, '正式模式掉落必须写入套装身份');
  assert.equal(cloudDrop.includes("rarity: template.rarity"), false, '正式模式不得继续写入旧的人为稀有度');
  assert.equal(cloudDrop.includes("collection('scene_card_pools')"), false, '冻结 checklist 不得被运营数据库覆盖卡牌定义');
  ['checklist_number', 'checklist_total', 'hero_asset_version', 'card_template_version', 'card_snapshot_hash', 'provenance_events', 'owner_id'].forEach(field => {
    assert.equal(cloudDrop.includes(field), true, `正式副本必须从第一天保存 ${field}`);
  });

  let scenePageDefinition;
  const scenePagePath = require.resolve('../miniprogram/pages/exhibition-scene/exhibition-scene.js');
  global.Page = definition => { scenePageDefinition = definition; };
  delete require.cache[scenePagePath];
  require(scenePagePath);
  delete global.Page;
  const createScenePage = () => {
    const page = Object.assign({}, scenePageDefinition);
    page.data = Object.assign({}, scenePageDefinition.data, {
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
  const revealPage = createScenePage();
  revealPage.onTapHotspot({ currentTarget: { dataset: { index: 0 } } });
  revealPage.onTapHotspot({ currentTarget: { dataset: { index: 1 } } });
  assert.equal(requestCount, 1, '掉卡请求完成前必须锁定后续抽卡请求，避免卡片互相覆盖');
  firstRequest.resolve({ ok: true, dropped: true, card: { id: 'card-1', image: '/missing.png', mark: '草' } });
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(revealPage.data.cardRevealPhase, 'revealed', '掉卡必须从期待提示进入正式揭晓态');
  revealPage.onCardImageError();
  assert.equal(revealPage.data.cardImageFailed, true, '正式卡图加载失败时必须切换到字标占位');
  revealPage.onCloseCardDrop();

  const staleRequest = deferred();
  sceneCards.attemptDrop = () => staleRequest.promise;
  const lifecyclePage = createScenePage();
  lifecyclePage.onTapHotspot({ currentTarget: { dataset: { index: 0 } } });
  lifecyclePage.onHide();
  lifecyclePage.onShow();
  staleRequest.resolve({ ok: true, dropped: true, card: { id: 'stale-card' } });
  await Promise.resolve();
  assert.equal(lifecyclePage.data.cardDrop, null, '页面隐藏前发出的旧掉卡请求不得在返回页面后重新弹出');
  sceneCards.attemptDrop = originalAttemptDrop;

  petStore.endExhibitionDemo();
  assert.equal(runtime.getMode(), 'live', '退出展会必须恢复 live');
  assert.equal(petStore.getPet().id, livePetId, '退出展会必须保留原正式宠物');

  runtime.setMode('demo');
  const localPreview = petStore.bindPet('DEMO-RABBIT', Date.now());
  assert.equal(localPreview.ok, true, '本地预览蛋必须可以写入 demo 空间');
  const localPreviewId = localPreview.pet.id;
  const exhibitionFromPreview = petStore.startExhibitionDemo();
  assert.equal(exhibitionFromPreview.exhibitionMode, true, '本地预览进入展会时必须创建独立的快速体验宠物');
  const restoredPreview = petStore.endExhibitionDemo();
  assert.equal(runtime.getMode(), 'demo', '从本地预览进入展会后退出，必须留在原 demo 运行空间');
  assert.equal(restoredPreview.id, localPreviewId, '从本地预览退出展会后必须恢复原孵化进度');
  petStore.resetDemo();
  runtime.setMode('live');

  const wrongBrand = new RegExp(oldBrand, 'i');
  const sourceRoots = ['miniprogram', 'cloudfunctions', 'docs', 'README.md', 'project.config.json'];
  const scan = target => {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) return fs.readdirSync(target).forEach(name => scan(path.join(target, name)));
    if (!/\.(js|json|md|wxml|wxss)$/.test(target)) return;
    if (path.basename(target) === '蛋宝宝小程序_V2_PRD.md') return;
    assert.equal(wrongBrand.test(fs.readFileSync(target, 'utf8')), false, `仍有错误品牌拼写：${target}`);
  };
  sourceRoots.forEach(root => scan(path.join(__dirname, '..', root)));
  console.log('V2 校验通过：数据隔离、角色场景卡池、掉落与每日上限正常。');
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
