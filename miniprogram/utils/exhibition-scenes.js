const SCENES = [
  { key: 'grass', label: '草地', subtitle: '晒一下午太阳', image: '/assets/scenes/grass_with_egg.jpg', petLine: '它把尾巴埋进草丛里，晒了一下午太阳。' },
  { key: 'snow', label: '雪地', subtitle: '踩出一串小脚印', image: '/assets/scenes/snow_with_egg.jpg', petLine: '它踩着雪印，走一步，回头看你一眼。' },
  { key: 'room', label: '房间', subtitle: '窝在窗边听钟声', image: '/assets/scenes/room_with_egg.jpg', petLine: '它窝在窗边，听着屋里的钟走得很慢。' },
  { key: 'seaside', label: '海边', subtitle: '看海浪来了又退', image: '/assets/scenes/sea_with_egg.jpg', petLine: '它蹲在礁石上，看海浪来了又退。' },
  { key: 'desk', label: '桌面', subtitle: '陪你写下今天', image: '/assets/scenes/desk_with_egg.jpg', petLine: '它趴在桌上，尾巴扫过你的笔记本。' },
  { key: 'roof', label: '屋顶', subtitle: '一起数路过的云', image: '/assets/scenes/rooftop_with_egg.jpg', petLine: '它坐在屋顶边缘，数着路过的云。' }
];

const HOTSPOTS = {
  grass: [{ x: '73%', y: '80%', label: '小花', line: '小花轻轻摇晃了一下。' }, { x: '50%', y: '16%', label: '蝴蝶', line: '一只蝴蝶刚好飞了过去。' }, { x: '65%', y: '20%', label: '阳光', line: '光斑在草叶上闪了一下。' }],
  snow: [{ x: '50%', y: '12%', label: '雪花', line: '雪花又轻轻飘落了几片。', effect: 'snowfall' }, { x: '20%', y: '60%', label: '雪堆', line: '雪堆抖落了一点雪。', effect: 'snow-puff' }, { x: '63%', y: '50%', label: '白气', line: '它呼出了一小口白气。', effect: 'breath' }],
  room: [{ x: '81%', y: '70%', label: '壁灯', line: '壁灯轻轻亮了一下。', effect: 'lamp-glow' }, { x: '32%', y: '80%', label: '小被子', line: '小被子鼓起来一点。', effect: 'blanket-lift' }, { x: '13%', y: '24%', label: '窗帘', line: '窗帘被风吹动了一下。', effect: 'curtain-sway' }],
  seaside: [{ x: '50%', y: '56%', label: '海浪', line: '海浪轻轻拍上了岸边。', effect: 'wave-splash' }, { x: '66%', y: '76%', label: '贝壳', line: '贝壳在阳光下亮了一下。', effect: 'shell-sparkle' }, { x: '66%', y: '28%', label: '小船', line: '远处的小船轻轻晃了一下。', effect: 'boat-bob' }],
  desk: [{ x: '25%', y: '70%', label: '纸张', line: '纸张被轻轻翻动了一页。', effect: 'paper-flip' }, { x: '42%', y: '76%', label: '便签', line: '便签上冒出了一句小小的话。', effect: 'note-pop' }, { x: '82%', y: '54%', label: '杯子', line: '杯子冒出了一点热气。', effect: 'steam-rise' }],
  roof: [{ x: '18%', y: '20%', label: '风铃', line: '风铃轻轻响了一下。', effect: 'chime-sway' }, { x: '36%', y: '40%', label: '纸飞机', line: '一架纸飞机飞了过去。', effect: 'plane-flight' }, { x: '65%', y: '18%', label: '云', line: '云朵慢慢飘远了一点。', effect: 'cloud-drift' }]
};

const CHARACTER_SCENE_GROUPS = { 玉兔: SCENES.map(scene => scene.key) };

const CARD_SETS = {
  'YT-S01': {
    setCode: 'YT-S01',
    setName: '玉兔初见·水彩日常',
    character: '玉兔',
    status: 'frozen-mvp',
    treatment: 'BASE',
    cards: [
      { cardId: 'yt-s01-001', cardDefinitionId: 'yt-s01-001', collectorNumber: 1, collectorLabel: '001/010', name: '花间初见', heroAssetId: 'YT__watercolor__hi', image: '/assets/cards/YT-S01/yt-s01-001.webp', mark: '花', sceneKeys: ['grass'] },
      { cardId: 'yt-s01-002', cardDefinitionId: 'yt-s01-002', collectorNumber: 2, collectorLabel: '002/010', name: '竹林问候', heroAssetId: 'YT__watercolor__salute', image: '/assets/cards/YT-S01/yt-s01-002.webp', mark: '竹', sceneKeys: ['grass', 'roof'] },
      { cardId: 'yt-s01-003', cardDefinitionId: 'yt-s01-003', collectorNumber: 3, collectorLabel: '003/010', name: '轻盈起舞', heroAssetId: 'YT__watercolor__dance', image: '/assets/cards/YT-S01/yt-s01-003.webp', mark: '舞', sceneKeys: ['grass'] },
      { cardId: 'yt-s01-004', cardDefinitionId: 'yt-s01-004', collectorNumber: 4, collectorLabel: '004/010', name: '纸箱躲猫猫', heroAssetId: 'YT__watercolor__box', image: '/assets/cards/YT-S01/yt-s01-004.webp', mark: '箱', sceneKeys: ['room'] },
      { cardId: 'yt-s01-005', cardDefinitionId: 'yt-s01-005', collectorNumber: 5, collectorLabel: '005/010', name: '古镇骑行', heroAssetId: 'YT__watercolor__cycle', image: '/assets/cards/YT-S01/yt-s01-005.webp', mark: '骑', sceneKeys: ['seaside', 'roof'] },
      { cardId: 'yt-s01-006', cardDefinitionId: 'yt-s01-006', collectorNumber: 6, collectorLabel: '006/010', name: '晨间读报', heroAssetId: 'YT__watercolor__newspaper', image: '/assets/cards/YT-S01/yt-s01-006.webp', mark: '报', sceneKeys: ['room', 'desk'] },
      { cardId: 'yt-s01-007', cardDefinitionId: 'yt-s01-007', collectorNumber: 7, collectorLabel: '007/010', name: '月下冥想', heroAssetId: 'YT__watercolor__meditate', image: '/assets/cards/YT-S01/yt-s01-007.webp', mark: '月', sceneKeys: ['snow', 'roof'] },
      { cardId: 'yt-s01-008', cardDefinitionId: 'yt-s01-008', collectorNumber: 8, collectorLabel: '008/010', name: '初次滑板', heroAssetId: 'YT__watercolor__skateboard', image: '/assets/cards/YT-S01/yt-s01-008.webp', mark: '滑', sceneKeys: ['seaside', 'roof'] },
      { cardId: 'yt-s01-009', cardDefinitionId: 'yt-s01-009', collectorNumber: 9, collectorLabel: '009/010', name: '月宫实验', heroAssetId: 'YT__watercolor__chemistry', image: '/assets/cards/YT-S01/yt-s01-009.webp', mark: '试', sceneKeys: ['desk'] },
      { cardId: 'yt-s01-010', cardDefinitionId: 'yt-s01-010', collectorNumber: 10, collectorLabel: '010/010', name: '月夜泡泡浴', heroAssetId: 'YT__watercolor__bath', image: '/assets/cards/YT-S01/yt-s01-010.webp', mark: '浴', sceneKeys: ['room', 'snow'] }
    ]
  }
};

Object.keys(CARD_SETS).forEach(setCode => {
  const set = CARD_SETS[setCode];
  set.cards = set.cards.map(card => Object.assign({ setCode, setName: set.setName, treatment: set.treatment, tint: '#F6F2E8', checklistNumber: card.collectorNumber, checklistTotal: set.cards.length }, card));
});

const CHARACTER_CARD_SETS = { 玉兔: 'YT-S01' };

function getScene(key) {
  return SCENES.find(scene => scene.key === key) || SCENES[0];
}

function getScenesForCharacter(character) {
  const keys = CHARACTER_SCENE_GROUPS[character] || [];
  return keys.map(getScene);
}

function getCardPool(character, sceneKey) {
  const setCode = CHARACTER_CARD_SETS[character] || CHARACTER_CARD_SETS.玉兔;
  const set = CARD_SETS[setCode];
  return set ? set.cards.filter(card => card.sceneKeys.includes(sceneKey)) : [];
}

function getCardSet(setCode) {
  return CARD_SETS[setCode] || null;
}

function getCardSetForCharacter(character) {
  return getCardSet(CHARACTER_CARD_SETS[character] || CHARACTER_CARD_SETS.玉兔);
}

module.exports = { SCENES, HOTSPOTS, CHARACTER_SCENE_GROUPS, CHARACTER_CARD_SETS, CARD_SETS, getScene, getScenesForCharacter, getCardPool, getCardSet, getCardSetForCharacter };
