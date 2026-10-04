// 正式纪念物清单的长期主题库；未核对内容、素材的主题不进入邀请池。
const { petKey } = require('./companion-photo-catalog');
const INVENTORY = [
  ['K-A01', '祈福签', 'shared'], ['K-A02', '铜钱', 'shared'],
  ['K-A03', '平安符', 'shared'], ['K-A04', '香囊', 'shared'],
  ['K-A05', '红绳', 'shared'], ['K-A06', '小铃铛', 'shared'],
  ['K-R01', '小黄鸭', 'jade-rabbit'], ['K-R02', '自行车铃铛', 'jade-rabbit'],
  ['K-R04', '毽子', 'jade-rabbit'], ['K-R05', '一角旧报纸', 'jade-rabbit'],
  ['K-R06', '线香与香座', 'jade-rabbit'], ['K-R07', '小徽章', 'jade-rabbit'],
  ['K-R08', '爪印卡', 'jade-rabbit'], ['R-JADE', '迷你玉杵', 'jade-rabbit'],
  ['R-OSMANTHUS', '桂花枝', 'jade-rabbit'], ['R-MOON', '月相卡', 'jade-rabbit'],
  ['R-HERBS', '药草包', 'jade-rabbit'],
  ['K-K01', '荷叶书签', 'boon-koi'], ['K-K02', '拍立得照片', 'boon-koi'],
  ['K-K03', '纸风车', 'boon-koi'], ['K-K04', '折纸船', 'boon-koi'],
  ['K-K05', '咖啡杯套', 'boon-koi'], ['K-K06', '鱼形浮漂', 'boon-koi'],
  ['K-K07', '干掉的调色盘', 'boon-koi'], ['K-K08', '蜡烛头', 'boon-koi'],
  ['K-FISH', '鱼形木牌', 'boon-koi'], ['K-BEAD', '转运珠', 'boon-koi'],
  ['K-JADE', '水纹玉佩', 'boon-koi'], ['K-LANTERN', '莲花灯', 'boon-koi'],
  // 保留物尚未明确宠物归属；未准备时不开放，也不擅自归入通用池。
  ['RETAINED-LADLE', '糖画勺', 'retained'], ['RETAINED-YUNNAN', '云南特产', 'retained']
];
const THEMES = INVENTORY.map(([id, name, pet]) => ({
  id, name, pet, approved: false, steps: [], artwork: ''
}));
const ART_ROOT = '/assets/scenes/lifecycle/post-hatch/50-overlays/theme-drawings/';
// 首批主题与布局已认可；完整图按用户修正使用单色线稿，其他主题保持关闭。
for (const id of ['K-R01', 'K-K03', 'K-A06']) {
  const theme = THEMES.find(item => item.id === id);
  theme.approved = true;
  const file = id.toLowerCase();
  theme.artwork = `${ART_ROOT}${file}_full_v02.png`;
  theme.steps = [1,2,3].map(step => ({ image: `${ART_ROOT}${file}_step${step}_v02.png` }));
}
function isReady(theme) {
  return Boolean(theme && theme.approved && theme.id && theme.name &&
    /^\/assets\/.+\.png$/i.test(theme.artwork || '') &&
    Array.isArray(theme.steps) && theme.steps.length === 3 &&
    theme.steps.every(step => step && /^\/assets\/.+\.png$/i.test(step.image || '')));
}
function readyThemes(pet, catalog) {
  const key = petKey(pet);
  return (catalog || THEMES).filter(theme => isReady(theme) &&
    (theme.pet === 'shared' || theme.pet === key));
}
module.exports = { THEMES, isReady, readyThemes };
