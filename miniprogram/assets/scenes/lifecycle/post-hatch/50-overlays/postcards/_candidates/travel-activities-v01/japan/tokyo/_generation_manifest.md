# EggBaby 东京旅行明信片候选图生成清单

## 产品状态（2026-08-07）

- 东京已确认为 V3.6 正式旅行目的地。
- 采用“旅行期间主页显示空房＋第一人称文字；ta 回家后通过独立明信片展示旅途画面”的产品方案。
- 开发验收采用一个“东京之旅”列表入口；进入后连续浏览咖啡巷与城市露台两组候选图，滑动不改变玉兔当前状态。
- 本目录图片仍全部是候选，不因目的地转正而自动进入运行时。
- 正式内容、美术、命名、验收与上线门禁见 `01_MiniProgram_MVP/docs/蛋宝宝旅行明信片内容与美术规格_v1.0.md`。

- 生成日期：2026-08-07（Asia/Singapore）
- 生成方式：Codex 内置 ImageGen；每张独立生成，只使用玉兔四视图与对应锁定底图两张参考输入
- 输出处理：ImageGen 原始 RGB PNG（1672×941）仅作工具侧中间文件；项目目录只写入 1600×900、不透明 WebP、q82
- 使用状态：全部为 `_candidates` 候选素材；仅接入微信开发版的三态验收预览，未修改正式目的地或明信片运行时配置，trial / release 不展示；未提交、未推送

## 锁定参考图

### 玉兔身份参考（所有图片）

`/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/01_IP角色设计/01_玉兔 Jade Moon Rabbit/00_View_References/01_Character_Turnaround/JadeRabbit_ReferenceSheet_Standard_02.webp`

### 咖啡巷底图

`scene_base_travel_tokyo_detailed_cafe_alley_45deg_v12.webp`

### 暮色露台底图

`scene_base_travel_tokyo_tower_fuji_compact_terrace_v10.webp`

### 清晨露台底图

`scene_base_travel_tokyo_tower_fuji_morning_compact_terrace_v11.webp`

## 共享提示词

```text
Use case: precise-object-edit / compositing.
Image 1 is ONLY the locked Jade Moon Rabbit identity reference.
Image 2 is the LOCKED EDIT TARGET.
preserve base image composition exactly; change only by adding one Jade Moon Rabbit and this action.

Treat every pixel outside the inserted character, required action prop, and contact-shadow region as protected. Preserve the locked base camera, crop, lens, horizon, vanishing point, ground height and geometry, buildings, Tokyo Tower, Mount Fuji where present, wooden architecture, unbranded vending machine, furniture, cushion, throw, lantern, paper bag, radio, plants, vines, pipes, equipment, ambient lights, paving seams, leaves, color grade, light direction and existing shadows. No camera move, reframing, zoom, relighting, environmental redesign, object movement, added scenery, or blur.

Add exactly one Jade Moon Rabbit matching Image 1: warm cream bouclé with distinct yarn loops; compact broad egg-shaped one-piece silhouette, never thin or elongated; two long ears; huge glossy dark eyes with crisp white catchlights; small blue nose; three blue embroidered cheek marks per side; short rounded paws; two small feet; no clothes. Match the scene perspective, light, occlusion and tight contact shadow. Feet, paws or seated support must physically contact the intended surface. No floating, white halo, sticker or transparent-cutout appearance.

Target complete rabbit height 32%–36% of image height; hard tolerance not below 30% and not above 38%. Tactile, crisp, high-end cozy 2.5D room-render clarity: bouclé loops, wood grain, cloth, ceramics, foliage, paving/deck texture and contact shadow must remain readable with soft but clear depth.

No text, labels, brands, logos, QR codes, UI, watermark, frame, caption, second character, clothing, extra limbs, missing ears, detached parts, or props beyond the action prop. Opaque 16:9 image.
```

说明：模型对角色尺度的响应会随动作和家具位置变化，因此单张重试时只调整尺度、位置或动作可信度；每次仍从同一四视图和锁定底图重新生成，没有把上一张动作图作为环境参考。

## 已通过并保存

| 文件 | 场景底图 | 本张动作提示补充 | 状态 | 验收结论 |
|---|---|---|---|---|
| `postcard_travel_tokyo_alley_bench_selfie_jade_rabbit_v02.webp` | v12 咖啡巷 | Sit securely on the existing wooden bench/stool; hold one tiny blank unbranded selfie camera/phone and wave with the other paw. | accepted | 坐姿有家具承重；比例在硬范围内；无第二角色、Logo 或 UI。 |
| `postcard_travel_tokyo_alley_leaf_hop_jade_rabbit_v02.webp` | v12 咖啡巷 | Make a tiny low believable hop over existing dry leaves; feet only centimeters above stone; tight landing shadow directly below and minimal local leaf motion. | accepted-tolerance | 角色约 36%–37%，低于 38% 硬上限；低跳和落地阴影清楚；未使用旧动作图作参考。 |
| `postcard_travel_tokyo_alley_peace_tower_jade_rabbit_v02.webp` | v12 咖啡巷 | Turn the body 3/4 toward Tokyo Tower, face the camera, keep both feet planted, and make a clear two-finger V sign near the cheek. | accepted-tolerance | 比例约 36%；东京塔未遮挡；剪刀手、蓝色五官和接地阴影清楚。 |
| `postcard_travel_tokyo_alley_bench_hot_drink_jade_rabbit_v02.webp` | v12 咖啡巷 | Sit securely on the existing wooden bench/stool and hold one plain ceramic mug with both paws; faint steam only. | accepted | 角色约 32%；座面承重和杯子握持可信；无字无品牌。 |
| `postcard_travel_tokyo_alley_wish_jade_rabbit_v02.webp` | v12 咖啡巷 | Stand back/3/4 back toward camera facing Tokyo Tower, feet planted, paws clasped at chest, round tail visible. | accepted | 角色约 35%；尾巴可见；东京塔、道路与受光方向稳定。 |
| `postcard_travel_tokyo_alley_camera_playback_jade_rabbit_v02.webp` | v12 咖啡巷 | Stand grounded in the mid-road, hold one small plain unbranded compact camera with both paws and look down at its blank rear playback screen. | accepted | 角色约 34%；相机无 UI/品牌；阴影和道路透视一致。 |
| `postcard_travel_tokyo_alley_morning_stretch_jade_rabbit_v02.webp` | v12 咖啡巷 | Stand with both feet flat in the mid-road and stretch both paws upward/outward while keeping compact canonical proportions. | accepted-tolerance | 角色约 36%–37%，低于 38% 硬上限；双脚落地、耳朵和头身比例稳定。 |
| `postcard_travel_tokyo_alley_back_tower_jade_rabbit_v02.webp` | v12 咖啡巷 | Stand fully back-facing toward Tokyo Tower, both feet planted, paws relaxed, exact round white tail clearly visible. | accepted | 角色约 32%；小尾巴清楚；东京塔未遮挡；接地阴影稳定。 |
| `postcard_travel_tokyo_night_terrace_selfie_jade_rabbit_v02.webp` | v10 暮色露台 | Stand center-left on the deck, hold one tiny blank unbranded selfie camera/phone and wave; keep Tokyo Tower and Fuji unobstructed. | accepted-tolerance | 角色约 36%；脚落在木地板；暮色受光和城市灯光匹配。 |
| `postcard_travel_tokyo_morning_terrace_hot_drink_view_jade_rabbit_v02.webp` | v11 清晨露台 | Sit center-left, 3/4 back looking at Fuji, hold one plain mug with both paws, tail visible; keep Tower and Fuji unobstructed. | accepted-tolerance | 角色约 36%–37%，低于 38% 硬上限；坐姿、杯子、尾巴与清晨光影可信。 |
| `postcard_travel_tokyo_night_terrace_wish_jade_rabbit_v02.webp` | v10 暮色露台 | Stand back/3/4 back facing Fuji, feet planted, paws clasped at chest, round tail visible; skyline unobstructed. | accepted-tolerance | 角色约 37%，低于 38% 硬上限；尾巴和地板接触清楚；暮色光影匹配。 |
| `postcard_travel_tokyo_morning_terrace_morning_stretch_jade_rabbit_v02.webp` | v11 清晨露台 | Stand on both feet near center, turn 3/4 toward Fuji and stretch both paws upward/outward. | accepted | 角色约 33%；双脚压地、阴影清楚；富士山和东京塔未遮挡。 |

## 用户复核淘汰并删除（2026-08-07）

以下结论优先级高于此前的自动验收，后续生成必须把对应问题作为明确反例：

| 已删除文件 | 用户确认的问题 | 后续必须避免 |
|---|---|---|
| `postcard_travel_tokyo_alley_hug_drink_jade_rabbit_v02.webp` | 图片被压扁 | 禁止非等比缩放；生成后核对画布比例、圆形眼睛与蛋形头身是否保持自然纵横比。 |
| `postcard_travel_tokyo_alley_morning_stretch_jade_rabbit_v01.webp` | 视角偏移，导致图片过大 | 严格锁定 v12 镜头、裁切、地平线和地面位置；不得以动作需求重构或放大底图。 |
| `postcard_travel_tokyo_alley_paper_bag_walk_jade_rabbit_v01.webp` | 玉兔比例过大 | 完整身高锁定 32%–36%，超过 38% 直接淘汰。 |
| `postcard_travel_tokyo_alley_paper_bag_walk_jade_rabbit_v02.webp` | 玉兔比例太小 | 完整身高锁定 32%–36%，低于 30% 直接淘汰。 |
| `postcard_travel_tokyo_alley_peace_tower_jade_rabbit_v01.webp` | 玉兔比例过大 | 完整身高锁定 32%–36%，超过 38% 直接淘汰。 |
| `postcard_travel_tokyo_alley_peek_cafe_table_jade_rabbit_v02.webp` | 玉兔被压缩 | 禁止压扁、压缩或拉伸角色；核对耳朵、眼睛、蛋形身体和四肢的标准比例。 |
| `postcard_travel_tokyo_alley_two_drinks_jade_rabbit_v02.webp` | 玉兔形变 | 严格匹配四视图的一体式蛋形头身、耳朵与四肢结构；任何角色形变直接淘汰。 |
| `postcard_travel_tokyo_alley_vending_face_jade_rabbit_v02.webp` | 玉兔形变 | 严格匹配四视图；动作不得改变标准头身、五官、耳朵或四肢比例。 |
| `postcard_travel_tokyo_alley_vending_tiptoe_jade_rabbit_v02.webp` | 玉兔身体比例太小 | 不仅核对总身高，还要核对身体相对耳朵和头部的体积；保持宽圆蛋形躯干。 |
| `postcard_travel_tokyo_alley_wish_jade_rabbit_v01.webp` | 视角偏移 | 严格以 v12 原底图为唯一构图基准，不得改变建筑、道路、东京塔、镜头高度或透视。 |
| `postcard_travel_tokyo_alley_hug_knees_jade_rabbit_v02.webp` | 玉兔腿太长或腿部弯曲 | 腿必须保持四视图中的短小、圆润、近乎直立结构；不得拉长、折弯或产生膝关节式肢体。 |
| `postcard_travel_tokyo_alley_leaf_hop_jade_rabbit_v01.webp` | 玉兔身材比例太小 | 即使是跳跃动作，耳尖到脚底仍须锁定画高 32%–36%；不得用缩小角色来制造跳跃空间。 |
| `postcard_travel_tokyo_alley_draw_postcard_jade_rabbit_v02.webp` | 桌子方向和坐姿逻辑错误，玉兔屁股朝向自动贩卖机不合理 | 生成前先验证桌椅朝向、座位可达性、身体朝向与操作面的空间逻辑；玉兔必须面向桌面自然落座并能合理绘画。 |

## 未保存 / 淘汰

| 计划动作 | 参考底图 | 状态 | 验收结论 |
|---|---|---|---|
| 暮色露台做鬼脸 | v10 暮色露台 | rejected | 多次从四视图 + v10 独立重生后，尺度响应在约 26% 与约 50% 画高之间跳变，始终没有落入 30%–38% 硬范围；不写入 v02 WebP。 |
| 清晨露台倒立 | v11 清晨露台 | rejected | 生成结果让长耳承担落地支撑，未实现“双爪压地、比例不变”的可信倒立结构；按“动作可信才保留”规则淘汰。 |

## 验收备注

- 所有保存文件均为模型一次同图生成的角色、动作、道具、环境和阴影，没有透明抠图后贴。
- 保存项均无可见文字、品牌、Logo、二维码、UI、第二角色或白边。
- 构图验收采用与锁定底图逐张视觉对照：镜头高度、主透视、地面位置、东京塔／富士山、主要家具和光向保持一致。ImageGen 为模型原生编辑，不能声明逐像素哈希一致；本清单中的“构图稳定”指视觉结构和主要物体关系通过候选级检查。
- 2026-08-07 用户复核后，已按要求删除上表 13 张不合格图片；其余 v01、v02 与 `_candidate/` 排除参考均未在这些删除操作中改动。
