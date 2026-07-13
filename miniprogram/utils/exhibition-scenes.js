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

const CARD_POOLS = {
  玉兔: {
    grass: [{ cardId: 'rabbit-grass-sun', name: '草叶上的午后', rarity: '普通', tint: '#DDE9B9', mark: '草' }, { cardId: 'rabbit-grass-butterfly', name: '蝴蝶来信', rarity: '普通', tint: '#F1EC9A', mark: '蝶' }],
    snow: [{ cardId: 'rabbit-snow-footprint', name: '雪地小脚印', rarity: '普通', tint: '#DCEBF0', mark: '雪' }, { cardId: 'rabbit-snow-breath', name: '冬日白气', rarity: '普通', tint: '#E8EEF7', mark: '冬' }],
    room: [{ cardId: 'rabbit-room-window', name: '窗边慢时光', rarity: '普通', tint: '#F3DFCC', mark: '窗' }, { cardId: 'rabbit-room-blanket', name: '被窝里的秘密', rarity: '普通', tint: '#FFC5BA', mark: '暖' }],
    seaside: [{ cardId: 'rabbit-sea-wave', name: '海浪来过', rarity: '普通', tint: '#CDE8EA', mark: '浪' }, { cardId: 'rabbit-sea-shell', name: '发光的贝壳', rarity: '普通', tint: '#F4D9C9', mark: '贝' }],
    desk: [{ cardId: 'rabbit-desk-note', name: '写给今天', rarity: '普通', tint: '#F1EC9A', mark: '笺' }, { cardId: 'rabbit-desk-tea', name: '一杯热气', rarity: '普通', tint: '#E8D7C8', mark: '茶' }],
    roof: [{ cardId: 'rabbit-roof-cloud', name: '路过的云', rarity: '普通', tint: '#DDE7F0', mark: '云' }, { cardId: 'rabbit-roof-plane', name: '纸飞机远行', rarity: '普通', tint: '#FFC5BA', mark: '飞' }]
  }
};

function getScene(key) {
  return SCENES.find(scene => scene.key === key) || SCENES[0];
}

function getScenesForCharacter(character) {
  const keys = CHARACTER_SCENE_GROUPS[character] || [];
  return keys.map(getScene);
}

function getCardPool(character, sceneKey) {
  const characterPools = CARD_POOLS[character] || CARD_POOLS.玉兔;
  return characterPools[sceneKey] || [];
}

module.exports = { SCENES, HOTSPOTS, CHARACTER_SCENE_GROUPS, CARD_POOLS, getScene, getScenesForCharacter, getCardPool };
