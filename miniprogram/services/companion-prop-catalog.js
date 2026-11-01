/** 09c 道具简笔 · id 与 line/{id}.webp 对齐；colorFile 指向仓库既有 turnaround。 */
const PROPS = Object.freeze([
  Object.freeze({ id: 'boon_koi_fish_wooden_plaque', name: '鱼形木牌', colorFile: 'keepsake_boon_koi_fish_wooden_plaque_four_view_3d.webp' }),
  Object.freeze({ id: 'boon_koi_fortune_bead', name: '转运珠', colorFile: 'keepsake_boon_koi_fortune_bead_four_view_3d.webp' }),
  Object.freeze({ id: 'boon_koi_lotus_lantern', name: '莲花灯', colorFile: 'keepsake_boon_koi_lotus_lantern_four_view_3d.webp' }),
  Object.freeze({ id: 'boon_koi_paper_pinwheel', name: '纸风车', colorFile: 'keepsake_boon_koi_paper_pinwheel_four_view_3d_v2.png' }),
  Object.freeze({ id: 'boon_koi_water_ripple_jade_pendant', name: '水纹玉佩', colorFile: 'keepsake_boon_koi_water_ripple_jade_pendant_four_view_3d.webp' }),
  Object.freeze({ id: 'cork_coaster', name: '软木杯垫', colorFile: 'keepsake_cork_coaster_card_square_3d_transparent_v01.webp' }),
  Object.freeze({ id: 'dali_cloud_stone', name: '大理云石', colorFile: 'keepsake_dali_cloud_stone_card_square_3d_transparent_v01.webp' }),
  Object.freeze({ id: 'dried_tea_tag', name: '干茶签', colorFile: 'keepsake_dried_tea_tag_card_square_3d_transparent_v01.webp' }),
  Object.freeze({ id: 'ginkgo_leaf', name: '银杏叶', colorFile: 'keepsake_ginkgo_leaf_card_square_3d_transparent_v01.webp' }),
  Object.freeze({ id: 'jade_rabbit_helmet', name: '玉兔头盔', colorFile: 'keepsake_jade_rabbit_helmet_single_3d_preview_v01.webp' }),
  Object.freeze({ id: 'jade_rabbit_herb_pouch', name: '药草包', colorFile: 'keepsake_jade_rabbit_herb_pouch_four_view_3d.webp' }),
  Object.freeze({ id: 'jade_rabbit_mini_jade_pestle', name: '迷你玉杵', colorFile: 'keepsake_jade_rabbit_mini_jade_pestle_four_view_3d.webp' }),
  Object.freeze({ id: 'jade_rabbit_moon_phase_cards', name: '月相卡', colorFile: 'keepsake_jade_rabbit_moon_phase_cards_four_view_3d.webp' }),
  Object.freeze({ id: 'jade_rabbit_osmanthus_branch', name: '桂花枝', colorFile: 'keepsake_jade_rabbit_osmanthus_branch_four_view_3d.webp' }),
  Object.freeze({ id: 'k_a01_prayer_stick', name: '祈福签', colorFile: 'keepsake_k-a01_prayer_stick_four_view_3d.webp' }),
  Object.freeze({ id: 'k_a02_copper_coin', name: '铜钱', colorFile: 'keepsake_k-a02_copper_coin_four_view_3d.webp' }),
  Object.freeze({ id: 'k_a03_peace_amulet', name: '平安符', colorFile: 'keepsake_k-a03_peace_amulet_four_view_3d.webp' }),
  Object.freeze({ id: 'k_a04_sachet', name: '香囊', colorFile: 'keepsake_k-a04_sachet_four_view_3d.webp' }),
  Object.freeze({ id: 'k_a05_red_string_bracelet', name: '红绳手链', colorFile: 'keepsake_k-a05_red_string_bracelet_four_view_3d.webp' }),
  Object.freeze({ id: 'k_a06_small_brass_bell', name: '小铜铃', colorFile: 'keepsake_k-a06_small_brass_bell_four_view_3d.webp' }),
  Object.freeze({ id: 'k_k01_lotus_leaf_bookmark', name: '荷叶书签', colorFile: 'keepsake_k-k01_lotus_leaf_bookmark_four_view_3d.webp' }),
  Object.freeze({ id: 'k_k02_polaroid_stone_bridge', name: '石桥拍立得', colorFile: 'keepsake_k-k02_polaroid_stone_bridge_four_view_3d.webp' }),
  Object.freeze({ id: 'k_k04_origami_paper_boat', name: '折纸船', colorFile: 'keepsake_k-k04_origami_paper_boat_four_view_3d.webp' }),
  Object.freeze({ id: 'k_k05_coffee_cup_sleeve', name: '咖啡杯套', colorFile: 'keepsake_k-k05_coffee_cup_sleeve_four_view_3d.webp' }),
  Object.freeze({ id: 'k_k06_fish_shaped_bobber', name: '鱼形浮漂', colorFile: 'keepsake_k-k06_fish_shaped_bobber_four_view_3d.webp' }),
  Object.freeze({ id: 'k_k07_dried_paint_palette', name: '干颜料盘', colorFile: 'keepsake_k-k07_dried_paint_palette_four_view_3d.webp' }),
  Object.freeze({ id: 'k_k08_burnt_candle_stub', name: '蜡烛头', colorFile: 'keepsake_k-k08_burnt_candle_stub_four_view_3d.webp' }),
  Object.freeze({ id: 'k_r01_yellow_rubber_duck', name: '小黄鸭', colorFile: 'keepsake_k-r01_yellow_rubber_duck_four_view_3d.webp' }),
  Object.freeze({ id: 'k_r02_bicycle_bell', name: '自行车铃', colorFile: 'keepsake_k-r02_bicycle_bell_four_view_3d.webp' }),
  Object.freeze({ id: 'k_r04_traditional_shuttlecock', name: '毽子', colorFile: 'keepsake_k-r04_traditional_shuttlecock_four_view_3d.webp' }),
  Object.freeze({ id: 'k_r05_vintage_moon_rabbit_newspaper', name: '玉兔旧报纸', colorFile: 'keepsake_k-r05_vintage_moon_rabbit_newspaper_four_view_3d_v3.webp' }),
  Object.freeze({ id: 'k_r06_incense_and_holder', name: '香与香插', colorFile: 'keepsake_k-r06_incense_and_holder_four_view_3d.webp' }),
  Object.freeze({ id: 'k_r07_rabbit_silhouette_badge', name: '兔子剪影徽章', colorFile: 'keepsake_k-r07_rabbit_silhouette_badge_four_view_3d_v2.webp' }),
  Object.freeze({ id: 'k_r08_blue_paw_print_card', name: '蓝爪印卡', colorFile: 'keepsake_k-r08_blue_paw_print_card_four_view_3d.webp' }),
  Object.freeze({ id: 'old_wooden_button', name: '旧木纽扣', colorFile: 'keepsake_old_wooden_button_card_square_3d_transparent_v01.webp' }),
  Object.freeze({ id: 'rainbow_carwash_cloth', name: '彩虹洗车布', colorFile: 'keepsake_rainbow_carwash_cloth_card_square_3d_transparent_v01.webp' }),
  Object.freeze({ id: 'rainforest_seed_pod', name: '雨林种子荚', colorFile: 'keepsake_rainforest_seed_pod_card_square_3d_transparent_v01.webp' }),
  Object.freeze({ id: 'red_order_clip', name: '红色单据夹', colorFile: 'keepsake_red_order_clip_card_square_3d_transparent_v01.webp' }),
  Object.freeze({ id: 'retained_sugar_painting_ladle', name: '糖画勺', colorFile: 'keepsake_retained_sugar_painting_ladle_four_view_3d.webp' }),
  Object.freeze({ id: 'short_pencil', name: '短铅笔', colorFile: 'keepsake_short_pencil_card_square_3d_transparent_v01.webp' }),
  Object.freeze({ id: 'small_wood_rattle', name: '小木摇铃', colorFile: 'keepsake_small_wood_rattle_card_square_3d_transparent_v01.webp' })
]);

function hashSeed(input) {
  let hash = 0;
  const text = String(input || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getById(id) {
  return PROPS.find(item => item.id === id) || null;
}

function pickDaily(dateKey, scopeKey) {
  if (!PROPS.length) return null;
  const index = hashSeed(`${dateKey || ''}:${scopeKey || ''}`) % PROPS.length;
  return PROPS[index];
}

module.exports = {
  PROPS,
  getById,
  pickDaily
};
