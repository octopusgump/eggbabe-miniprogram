# 纪念物剩余 29 张 · 3D 四视图生成日志

生成日期：2026-08-02
执行方式：Codex 内置 ImageGen；生成源为 PNG，随后使用 `cwebp` 转为 WebP。
视觉基准：`keepsake_jade_rabbit_helmet_four_view_3d.png`、`keepsake_boon_koi_paper_pinwheel_four_view_3d_v2.png`。

## 范围说明

- PRD §6 正式清单为 31 件。
- K-K03 纸风车已有正式四视图，本轮不重复生成。
- 玉兔头盔作为额外场景衍生候选保留，用作风格基准，不属于 PRD 当前 31 件正式清单。
- “云南特产”没有定义具体物件形态，为避免擅自设定，本轮暂不生成。
- 因此本轮实际新增 29 张四视设计图。

## 统一生成标准

- 16:9 横向画布，1672×941。
- 同一件物品依次展示前视、3/4 前视、右侧视、背视。
- 四个视角保持结构、比例、颜色、材质、磨损与装配关系一致。
- 暖象牙白无缝棚拍背景、右上方柔和自然光、轻柔接触阴影。
- 温暖治愈的精致 3D CG 微缩收藏品质；禁止水彩风格漂移。
- 无人物、无场景、无标签、无 Logo、无水印、无额外道具。
- 输出 WebP，质量参数 92；所有文件已验证为有效的 1672×941 WebP。

## 文件清单

### A 线 · 通用祈愿物（6）

1. `webp/keepsake_k-a01_prayer_stick_four_view_3d.webp` — 祈福签
2. `webp/keepsake_k-a02_copper_coin_four_view_3d.webp` — 铜钱
3. `webp/keepsake_k-a03_peace_amulet_four_view_3d.webp` — 平安符
4. `webp/keepsake_k-a04_sachet_four_view_3d.webp` — 香囊
5. `webp/keepsake_k-a05_red_string_bracelet_four_view_3d.webp` — 红绳
6. `webp/keepsake_k-a06_small_brass_bell_four_view_3d.webp` — 小铃铛

### B 线 · 玉兔定制物（11）

1. `webp/keepsake_k-r01_yellow_rubber_duck_four_view_3d.webp` — 小黄鸭
2. `webp/keepsake_k-r02_bicycle_bell_four_view_3d.webp` — 自行车铃铛
3. `webp/keepsake_k-r04_traditional_shuttlecock_four_view_3d.webp` — 毽子
4. `webp/keepsake_k-r05_old_newspaper_corner_four_view_3d.webp` — 一角旧报纸
5. `webp/keepsake_k-r06_incense_and_holder_four_view_3d.webp` — 线香与香座
6. `webp/keepsake_k-r07_rabbit_silhouette_badge_four_view_3d.webp` — 小徽章
7. `webp/keepsake_k-r08_blue_paw_print_card_four_view_3d.webp` — 爪印卡
8. `webp/keepsake_jade_rabbit_mini_jade_pestle_four_view_3d.webp` — 迷你玉杵
9. `webp/keepsake_jade_rabbit_osmanthus_branch_four_view_3d.webp` — 桂花枝
10. `webp/keepsake_jade_rabbit_moon_phase_cards_four_view_3d.webp` — 月相卡
11. `webp/keepsake_jade_rabbit_herb_pouch_four_view_3d.webp` — 药草包

### B 线 · 锦鲤定制物（11，本轮不含已有 K-K03）

1. `webp/keepsake_k-k01_lotus_leaf_bookmark_four_view_3d.webp` — 荷叶书签
2. `webp/keepsake_k-k02_polaroid_stone_bridge_four_view_3d.webp` — 拍立得照片
3. `webp/keepsake_k-k04_origami_paper_boat_four_view_3d.webp` — 折纸船
4. `webp/keepsake_k-k05_coffee_cup_sleeve_four_view_3d.webp` — 咖啡杯套
5. `webp/keepsake_k-k06_fish_shaped_bobber_four_view_3d.webp` — 鱼形浮漂
6. `webp/keepsake_k-k07_dried_paint_palette_four_view_3d.webp` — 干掉的调色盘
7. `webp/keepsake_k-k08_burnt_candle_stub_four_view_3d.webp` — 蜡烛头
8. `webp/keepsake_boon_koi_fish_wooden_plaque_four_view_3d.webp` — 鱼形木牌
9. `webp/keepsake_boon_koi_fortune_bead_four_view_3d.webp` — 转运珠
10. `webp/keepsake_boon_koi_water_ripple_jade_pendant_four_view_3d.webp` — 水纹玉佩
11. `webp/keepsake_boon_koi_lotus_lantern_four_view_3d.webp` — 莲花灯

### 保留物（1）

1. `webp/keepsake_retained_sugar_painting_ladle_four_view_3d.webp` — 糖画勺

## QA 结果

- 数量：29/29。
- 文件格式：全部为 WebP。
- 尺寸：全部为 1672×941。
- 画布与风格：暖白棚拍背景、四视横排、统一柔光与材质体系。
- 内容：未加入人物、品牌、Logo、标签或水印。
- 原始参考与既有 PNG 未覆盖。

## 修订记录

- K-R05 旧报纸新增 `webp/keepsake_k-r05_vintage_moon_rabbit_newspaper_four_view_3d_v2.webp`：将原先过小的三角形报纸角改为完整的民国／20 世纪初期折叠报纸，头版加入圆月与胖玉兔旧式木刻插图。
- K-R05 最终指定报头版为 `webp/keepsake_k-r05_vintage_moon_rabbit_newspaper_four_view_3d_v3.webp`：正面与 3/4 视图的报头均准确显示四字“蛋宝宝报”；后续应优先使用 v3。
- K-R05 原版与 v2 均保留，分别作为旧构图和无指定报头版本回退。
- K-R07 小徽章新增 `webp/keepsake_k-r07_rabbit_silhouette_badge_four_view_3d_v2.webp`。
- v2 仅将正面蓝色图案由“兔子侧身全身剪影”改为“玉兔胖圆头像剪影”：正面圆润大头、两只长圆耳，无身体、肩膀、五官或内耳细节。
- 黄铜边框、奶油色珐琅、徽章厚度、背面别针、四视结构、光照和背景保持一致。
- v1 保留作为可回退版本；后续应优先使用 v2。

## 后续交付边界

本轮产物是四视设计稿。若进入小程序运行时资产阶段，应另行依据选定视角导出“单件居中、透明背景、无投影”的 WebP，不直接将本轮暖白背景四视图用于 UI。

## 收藏卡透明 PNG 扩展批次（2026-08-02）

### 范围与执行方式

- 本批次将头盔之外的 30 件现有正式纪念物四视稿转换为收藏卡单件资产：原 29 件清单，加上已有 K-K03 高饱和纸风车。
- 使用 Codex 内置 ImageGen，每件物品独立调用一次；四视稿作为结构、比例、颜色和材质参考，输出单件 3/4 视角色键源。
- 含绿色主体的物品使用洋红色键，其余使用绿色键；随后在本地移除色键并规范化方形画布。
- 色键源和 Alpha 中间文件保存在 `01_MiniProgram_MVP/tmp/imagegen/keepsakes/`，未覆盖任何既有 PNG 或 WebP。

### 统一输出标准

- 1024×1024，RGBA PNG，透明背景。
- 单件居中，保持原比例，最长边规范化至不超过 840 px。
- 使用参考稿的前左 3/4 视角；保留结构、配色、材质、纹理、磨损和装配关系。
- 保留物体自身柔和立体照明；无地面、无接触阴影、无投影、无反射、无背景光晕。
- 无人物、手、场景、底座、UI、标签、Logo、水印或非指定文字。
- 输出目录：`turnarounds/png/`。

### 文件清单

#### A 线 · 通用祈愿物（6）

1. `png/keepsake_k-a01_prayer_stick_card_square_3d_transparent_v01.png`
2. `png/keepsake_k-a02_copper_coin_card_square_3d_transparent_v01.png`
3. `png/keepsake_k-a03_peace_amulet_card_square_3d_transparent_v01.png`
4. `png/keepsake_k-a04_sachet_card_square_3d_transparent_v01.png`
5. `png/keepsake_k-a05_red_string_bracelet_card_square_3d_transparent_v01.png`
6. `png/keepsake_k-a06_small_brass_bell_card_square_3d_transparent_v01.png`

#### B 线 · 玉兔定制物（11）

1. `png/keepsake_k-r01_yellow_rubber_duck_card_square_3d_transparent_v01.png`
2. `png/keepsake_k-r02_bicycle_bell_card_square_3d_transparent_v01.png`
3. `png/keepsake_k-r04_traditional_shuttlecock_card_square_3d_transparent_v01.png`
4. `png/keepsake_k-r05_vintage_moon_rabbit_newspaper_card_square_3d_transparent_v01.png`
5. `png/keepsake_k-r06_incense_and_holder_card_square_3d_transparent_v01.png`
6. `png/keepsake_k-r07_rabbit_silhouette_badge_card_square_3d_transparent_v01.png`
7. `png/keepsake_k-r08_blue_paw_print_card_card_square_3d_transparent_v01.png`
8. `png/keepsake_jade_rabbit_mini_jade_pestle_card_square_3d_transparent_v01.png`
9. `png/keepsake_jade_rabbit_osmanthus_branch_card_square_3d_transparent_v01.png`
10. `png/keepsake_jade_rabbit_moon_phase_cards_card_square_3d_transparent_v01.png`
11. `png/keepsake_jade_rabbit_herb_pouch_card_square_3d_transparent_v01.png`

#### B 线 · 锦鲤定制物（12，含 K-K03）

1. `png/keepsake_k-k01_lotus_leaf_bookmark_card_square_3d_transparent_v01.png`
2. `png/keepsake_k-k02_polaroid_stone_bridge_card_square_3d_transparent_v01.png`
3. `png/keepsake_boon_koi_paper_pinwheel_card_square_3d_transparent_v01.png`
4. `png/keepsake_k-k04_origami_paper_boat_card_square_3d_transparent_v01.png`
5. `png/keepsake_k-k05_coffee_cup_sleeve_card_square_3d_transparent_v01.png`
6. `png/keepsake_k-k06_fish_shaped_bobber_card_square_3d_transparent_v01.png`
7. `png/keepsake_k-k07_dried_paint_palette_card_square_3d_transparent_v04.png`
8. `png/keepsake_k-k08_burnt_candle_stub_card_square_3d_transparent_v01.png`
9. `png/keepsake_boon_koi_fish_wooden_plaque_card_square_3d_transparent_v01.png`
10. `png/keepsake_boon_koi_fortune_bead_card_square_3d_transparent_v01.png`
11. `png/keepsake_boon_koi_water_ripple_jade_pendant_card_square_3d_transparent_v01.png`
12. `png/keepsake_boon_koi_lotus_lantern_card_square_3d_transparent_v01.png`

#### 保留物（1）

1. `png/keepsake_retained_sugar_painting_ladle_card_square_3d_transparent_v01.png`

### 指定版本继承与修订

- K-R05 旧报纸以四视稿 v3 为唯一参考，收藏卡正面继续显示四字“蛋宝宝报”。
- K-R07 玉兔徽章以四视稿 v2 为唯一参考，保留无身体、无五官、无内耳细节的胖圆玉兔头像剪影。
- K-K07 调色盘首次洋红键软遮罩造成浅木主体半透明；v2、v3 为参数修订过程稿，最终优先使用 `png/keepsake_k-k07_dried_paint_palette_card_square_3d_transparent_v04.png`。v4 使用严格洋红键判定并收缩 1 px Alpha 边缘。
- 头盔试制资产另存为 `png/keepsake_jade_rabbit_helmet_card_square_3d_transparent_v01.png`；与本批次 30 件合计形成 31 件收藏卡透明 PNG。

### QA 结果

- 正式选定数量：30/30。
- 所有正式选定文件均为可解码的 1024×1024 RGBA PNG。
- 所有文件四角 Alpha 均为 0，主体 Alpha 包围盒非空。
- 视觉联系表复核通过：单件构图完整，无四视重复、人物、手、场景、底座、UI、Logo 或水印。
- 细结构复核通过：风车木杆、祈福签、香枝、流苏、绳结、金属环和徽章别针关系均未因去背丢失。

## 剧情纪念物扩展批次 · 10 件（2026-08-02）

### 范围与执行方式

- 本批次依据 `miniprogram/utils/life-scenes.js` 中已定义的剧情纪念物，新增 10 件收藏卡 3D 单物件资产。
- 使用 Codex 内置 ImageGen，每件物品独立生成；统一采用温暖治愈的微缩产品渲染、正方形画布和前左 3/4 视角。
- 先生成纯色色键背景原图，再在本地移除色键、规范化透明画布；彩虹擦车布使用洋红色键，其余物品使用绿色键。
- PNG 为透明母版；WebP 均从对应 PNG 导出，因此两种格式的结构、比例、颜色、材质和构图完全一致。
- 色键源与 Alpha 中间文件保存在 `01_MiniProgram_MVP/tmp/imagegen/keepsakes/expansion_10_20260802/`，未覆盖既有资产。

### 统一输出标准

- 1024×1024，正方形收藏卡单物件。
- PNG：RGBA，透明背景。
- WebP：带 Alpha，质量 92、Alpha 质量 100。
- 单件居中，最长边不超过 840 px，保留物体自身暖柔立体照明。
- 无地面、接触阴影、投影、反射、角色、手、场景、底座、UI、可辨认文字、Logo 或水印。
- PNG 输出目录：`turnarounds/png/`。
- WebP 输出目录：`turnarounds/webp/`。

### 文件清单

1. 苍山脚下的云石
   - `png/keepsake_dali_cloud_stone_card_square_3d_transparent_v01.png`
   - `webp/keepsake_dali_cloud_stone_card_square_3d_transparent_v01.webp`
2. 雨林里的种荚
   - `png/keepsake_rainforest_seed_pod_card_square_3d_transparent_v01.png`
   - `webp/keepsake_rainforest_seed_pod_card_square_3d_transparent_v01.webp`
3. 小拨浪鼓
   - `png/keepsake_small_wood_rattle_card_square_3d_transparent_v01.png`
   - `webp/keepsake_small_wood_rattle_card_square_3d_transparent_v01.webp`
4. 旧木纽扣
   - `png/keepsake_old_wooden_button_card_square_3d_transparent_v01.png`
   - `webp/keepsake_old_wooden_button_card_square_3d_transparent_v01.webp`
5. 短短的铅笔
   - `png/keepsake_short_pencil_card_square_3d_transparent_v01.png`
   - `webp/keepsake_short_pencil_card_square_3d_transparent_v01.webp`
6. 晒干的茶签
   - `png/keepsake_dried_tea_tag_card_square_3d_transparent_v01.png`
   - `webp/keepsake_dried_tea_tag_card_square_3d_transparent_v01.webp`
7. 软木杯垫
   - `png/keepsake_cork_coaster_card_square_3d_transparent_v01.png`
   - `webp/keepsake_cork_coaster_card_square_3d_transparent_v01.webp`
8. 红色订单夹
   - `png/keepsake_red_order_clip_card_square_3d_transparent_v01.png`
   - `webp/keepsake_red_order_clip_card_square_3d_transparent_v01.webp`
9. 一片银杏叶
   - `png/keepsake_ginkgo_leaf_card_square_3d_transparent_v01.png`
   - `webp/keepsake_ginkgo_leaf_card_square_3d_transparent_v01.webp`
10. 彩虹擦车布
    - `png/keepsake_rainbow_carwash_cloth_card_square_3d_transparent_v01.png`
    - `webp/keepsake_rainbow_carwash_cloth_card_square_3d_transparent_v01.webp`

### QA 结果

- 生成数量：10/10；交付文件：PNG 10 个、WebP 10 个。
- 所有 PNG 和 WebP 均可解码为 1024×1024 RGBA 图像。
- 所有文件四角 Alpha 均为 0，主体 Alpha 包围盒非空；同物品 PNG 与 WebP 的 Alpha 包围盒一致。
- 视觉联系表复核通过：10 件均为单物件、完整轮廓、统一 3/4 构图，透明边缘未出现明显绿边或洋红边。
- 联系表：`01_MiniProgram_MVP/tmp/imagegen/keepsakes/expansion_10_20260802/keepsake_expansion_10_transparent_contact_sheet.png`。
