const SCENES = [
  { key: 'grass', label: '草地', subtitle: '晒一下午太阳', image: '/assets/scenes/grass_with_egg.jpg', petLine: '我把尾巴埋进草丛里，晒了一下午太阳。' },
  { key: 'snow', label: '雪地', subtitle: '踩出一串小脚印', image: '/assets/scenes/snow_with_egg.jpg', petLine: '我踩着雪印，走一步，就回头看你一眼。' },
  { key: 'room', label: '房间', subtitle: '窝在窗边听钟声', image: '/assets/scenes/room_with_egg.jpg', petLine: '我窝在窗边，听着屋里的钟走得很慢。' },
  { key: 'seaside', label: '海边', subtitle: '看海浪来了又退', image: '/assets/scenes/sea_with_egg.jpg', petLine: '我蹲在礁石上，看海浪来了又退。' },
  { key: 'desk', label: '书桌', subtitle: '陪你写下今天', image: '/assets/scenes/desk_with_egg.jpg', petLine: '我趴在桌上，看纸页轻轻翻过去。' },
  { key: 'roof', label: '天台', subtitle: '一起数路过的云', image: '/assets/scenes/rooftop_with_egg.jpg', petLine: '我坐在天台边缘，数着路过的云。' }
];

const HOTSPOTS = {
  grass: [{ x: '73%', y: '80%', label: '小花', line: '小花轻轻摇晃了一下。' }, { x: '50%', y: '16%', label: '蝴蝶', line: '一只蝴蝶刚好飞了过去。' }, { x: '65%', y: '20%', label: '阳光', line: '光斑在草叶上闪了一下。' }],
  snow: [{ x: '50%', y: '12%', label: '雪花', line: '雪花又轻轻飘落了几片。', effect: 'snowfall' }, { x: '20%', y: '60%', label: '雪堆', line: '雪堆抖落了一点雪。', effect: 'snow-puff' }, { x: '63%', y: '50%', label: '白气', line: '我呼出了一小口白气。', effect: 'breath' }],
  room: [{ x: '81%', y: '70%', label: '壁灯', line: '壁灯轻轻亮了一下。', effect: 'lamp-glow' }, { x: '32%', y: '80%', label: '小被子', line: '小被子鼓起来一点。', effect: 'blanket-lift' }, { x: '13%', y: '24%', label: '窗帘', line: '窗帘被风吹动了一下。', effect: 'curtain-sway' }],
  seaside: [{ x: '50%', y: '56%', label: '海浪', line: '海浪轻轻拍上了岸边。', effect: 'wave-splash' }, { x: '66%', y: '76%', label: '贝壳', line: '贝壳在阳光下亮了一下。', effect: 'shell-sparkle' }, { x: '66%', y: '28%', label: '小船', line: '远处的小船轻轻晃了一下。', effect: 'boat-bob' }],
  desk: [{ x: '25%', y: '70%', label: '纸张', line: '纸张被轻轻翻动了一页。', effect: 'paper-flip' }, { x: '42%', y: '76%', label: '便签', line: '便签上冒出了一句小小的话。', effect: 'note-pop' }, { x: '82%', y: '54%', label: '杯子', line: '杯子冒出了一点热气。', effect: 'steam-rise' }],
  roof: [{ x: '18%', y: '20%', label: '风铃', line: '风铃轻轻响了一下。', effect: 'chime-sway' }, { x: '36%', y: '40%', label: '纸飞机', line: '一架纸飞机飞了过去。', effect: 'plane-flight' }, { x: '65%', y: '18%', label: '云', line: '云朵慢慢飘远了一点。', effect: 'cloud-drift' }]
};

const KOI_SCENE_IMAGES = {
  grass: '/assets/scenes/grass_with_egg_koi.jpg',
  snow: '/assets/scenes/snow_with_egg_koi.jpg',
  room: '/assets/scenes/room_with_egg_koi.jpg',
  seaside: '/assets/scenes/sea_with_egg_koi.jpg',
  desk: '/assets/scenes/desk_with_egg_koi.jpg',
  roof: '/assets/scenes/rooftop_with_egg_koi.jpg'
};

function getScene(key, character) {
  const scene = SCENES.find(item => item.key === key) || SCENES[0];
  return character === '锦鲤' ? Object.assign({}, scene, { image: KOI_SCENE_IMAGES[scene.key] }) : scene;
}

function getScenesForCharacter(character) {
  return SCENES.map(scene => scene.key).map(key => getScene(key, character));
}

module.exports = { SCENES, HOTSPOTS, KOI_SCENE_IMAGES, getScene, getScenesForCharacter };
