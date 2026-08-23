# 场景素材分层总表

> **历史生产归档，不是当前运行规范。** 当前破壳前环境使用 36 张完整房间背景 + 各 36 张透明蛋体／窝垫；当前破壳后使用 36 张连续空房全景与已审核的完整动作全景，不再采用“三屏独立背景 + 透明角色姿态”方案。运行时路径与可用范围只以 `miniprogram/config/pre-hatch-assets.js`、`miniprogram/config/post-hatch-assets.js` 和 `docs/eggbabe-DESIGN.md` 为准。下文保留用于追溯 2026-08-01 的生产过程。

这里是后续 Nano Banana Pro 正式素材的投放目录。图片已按破壳前后和图层层级归档；破壳后运行时素材路径统一在 `miniprogram/config/post-hatch-assets.js` 管理。

## 层级规则

从后向前统一使用以下编号：

1. `10-background`：不含蛋、角色和可交互家具的环境底图。
2. `20-room-objects`：床、桌、灯、窗框、装饰区等可独立摆放的中景物件。
3. `30-character`：透明底蛋体或破壳后的角色姿态。
4. `40-interaction-fx`：动作反馈、光晕、粒子等前景效果。
5. `50-overlays`：魔法窗、心情表情、纪念品、明信片等界面上层素材。

`pre-hatch` 与 `post-hatch` 完全分开。正式图片建议导出为透明 WebP/PNG；背景建议同一套昼夜、季节图保持相同画幅和机位。

破壳后三屏背景采用“同一母版制作、三屏独立运行”，中屏复用破壳前状态图，左、右按相同 scene key 成套扩图。权威生产与验收规范见 `post-hatch/10-background/THREE_PANEL_SCENE_SET_SPEC.md`。

## 已锁定视觉基准（2026-08-01）

以下规则是后续所有批次的默认基准。除非产品负责人明确批准重新设计，否则不得改变固定机位、构图锚点、角色比例、材质、主光方向或整体色彩体系。

### 窗外天气背景

- 基准文件：`shared/10-background/window-weather/w_01_clear_day.webp`、`w_02_clear_sunset.webp`、`w_03_clear_night.webp`；后续天气图沿用同一画面几何关系。
- 固定竖版 `941 × 1672` 画布与同一观察机位。城市天际线高度、远近层次、树冠轮廓、左上枝叶和底部前景叶片的锚点必须保持一致。
- 只允许改变时间、天气、天空亮度与对应环境光；不得漂移镜头、裁切、地平线、建筑轮廓或主要枝叶位置。
- 保持温暖、治愈、精致的写实 CG 质感和自然景深；日落可有自然暖色，其他时段避免不必要的色偏。
- 窗外图不得出现窗框、窗帘、室内物件、角色、文字、Logo 或 UI；四周保留约 15% 出血空间。
- 输出为完全不透明的 WebP，目标体积不超过 `200 KB`。

### 玉兔 Jade Moon Rabbit

- 严格遵循标准角色图：奶油白短绒/毛圈质感，大圆头、两只修长直立圆耳、紧凑梨形身体和短四肢。
- 保留超大黑白高光眼、蓝灰色三角鼻、小嘴，以及左右脸颊各三道蓝灰色纹样；不得增减或改形。
- 不得擅自增加服装、配饰、花纹或改变头身比、耳长、体宽和四肢尺寸。

### 锦鲤 Boon Koi

- 严格遵循标准角色图：奶油白椭圆鱼身、织物压纹/细鳞质感、突出的大眼睛和弧形微笑。
- 保留棕橙色条纹胸鳍、背鳍和下鳍、奶油白分叉尾、极短双腿及芥末黄色靴子。
- 不得增加手臂、配件或新结构；不得改变鱼身长宽比、眼睛尺寸、鱼鳍位置、腿长和靴子比例。

### 角色姿态图与透明交付

- 玉兔和锦鲤统一使用 `1254 × 1254` 固定画布；后续动作须锁定角色整体缩放、脚底锚点和轮廓尺寸。
- 统一使用自然柔和的右上方暖光，保持毛绒/织物材质细节和一致的黑位、白位与饱和度。
- `post-hatch/30-character/jade-rabbit/stare.webp` 与 `post-hatch/30-character/boon-koi/stare.webp` 是已确认的角色表现基准。
- 洋红底只允许作为生成与抠图的中间态。正式 WebP 必须是真实透明通道，边缘无洋红残留、四角透明、无整图投影。
- 脚或靴子必须落地，不得悬浮；底部预留约 8% 安全区。

### 孵化室背景

- 房间构图延续原始参考：左侧可见墙面宽度不得改变，只保留左侧窗帘，右侧不得新增窗帘。
- 桌面木材的明度、色相和饱和度须贴合原始参考，不得偏橙、偏红或整体变暗。
- 窗口区域保持真实透明，窗外天气作为独立图层叠加；不得把天空或城市直接烘焙进房间底图。
- `room_base_candidate_v2.webp` 当前作为校准候选，未经确认不得覆盖正式 `room_base.webp`。

## 现有图片审计

### 当前正式运行时分层

- 房间：`pre-hatch/10-background/incubation-room/room_base_candidate_v2.webp`。
- 窗景：`shared/10-background/window-weather/w_01`～`w_07`。
- 天气：雾、雨、雪由首页窗户 Canvas 实时绘制；`shared/40-interaction-fx/weather-overlays/` 旧图已删除，不得重新引用。
- 窝垫：`pre-hatch/20-room-objects/window-and-nest/nest_pad.webp`。
- 蛋体：`pre-hatch/30-character/egg/egg_on_nest.webp`。
- 旧 `assets/scenes/incubation/` 合成素材已退出运行时，不得重新引用。

### 可继续复用

- `post-hatch/10-background/panorama-three-screen/post_hatch_room_panorama_empty_day_placeholder.webp`：当前作为破壳后三屏空间的稳定占位底图。
- `post-hatch/50-overlays/magic-window/magic_window_dali_with_jade_rabbit_back_placeholder.png`：当前作为魔法窗“大理”方向的临时占位图。

### 仅作构图参考，不作为正式分层素材

- `pre-hatch/30-character/egg/egg_base_chroma_reference.png`：绿色底蛋体参考，需要重新导出透明底。
- `pre-hatch/10-background/incubation-room/incubation_room_empty_day_reference.png`：破壳前空房构图参考，窗景仍与房间烘焙在一起。
- `pre-hatch/90-reference-composites/incubation_room_with_egg_day_reference.png`：破壳前合成参考，蛋体已烘焙进背景。
- `post-hatch/90-reference-composites/center-desk/post_hatch_center_desk_with_jade_rabbit_reference.png`：破壳后中屏构图参考，玉兔已烘焙进背景。
- `post-hatch/90-reference-composites/left-living/post_hatch_left_living_with_jade_rabbit_reference.png`：破壳后左屏构图参考，玉兔已烘焙进背景。

不再使用的重复稿、旧稿和 V3.5 六场景合成图已移动到 `assets/scenes/archived/`，不进入运行时。完整来源与去向见 `assets/scenes/_organization_manifest_20260801.csv`。

每个子目录的 README 列出了建议文件名和是否仍待补充。
