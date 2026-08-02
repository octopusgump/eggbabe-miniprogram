# 蛋宝宝 · 3D 功能 UI 生成日志

日期：2026-08-02

## 批次范围

本批次制作 5 个功能入口的透明 3D UI：

1. 早教班
2. 画画
3. 许愿池
4. 我的
5. 时间表

当前只交付图片资产；没有替换原有 SVG、Tab PNG，也没有修改页面或导航代码。

## 执行方式

- 使用 Codex 内置 ImageGen，每个功能独立调用一次。
- 先以“早教班”的打开式启蒙书建立风格锚点；完成 40px、66px、96px 和 256px 可读性检查后，再将它作为其余四项的固定风格参考。
- 五张原图均生成在纯洋红色色键背景上，以保护共用的苔藓绿和青玉绿色彩。
- 使用 ImageGen 技能提供的本地色键移除流程生成 Alpha，再统一规范为正方形透明画布。
- PNG 为透明母版；WebP 和运行时版本均由对应 PNG 导出，因此格式之间不存在造型漂移。

## 统一视觉标准

- 温暖、治愈、精致的微缩 3D 功能图标。
- 前左 3/4 视角，略微俯视；右上方暖柔主光。
- 温暖象牙白与苔藓绿为共用基色，蜂蜜黄、珊瑚红、青玉绿和旧黄铜作为功能点缀。
- 圆润、略带玩具感的真实材质；减少细碎纹理，确保 40–66px 下仍能辨认。
- 单个紧凑组合图标，透明背景，不带统一底板。
- 无地面、接触阴影、投影、反射、角色、手、场景、Logo、水印、可辨认文字、字母或数字。

## Prompt 集

### 共用骨架

- Use case：`stylized-concept`。
- Asset type：蛋宝宝小程序 40–66px 可读的透明 3D 功能 UI。
- 固定参考：“早教班”打开式启蒙书。
- 固定项：相同的温暖微缩 3D 质感、圆润比例、前左 3/4 镜头、右上暖光、主体占比、留白、边缘锐度与细节简化程度。
- 色键背景：纯 `#ff00ff`，无渐变、阴影、地面、反射或光晕。

### 功能造型

- 早教班：苔藓绿厚封皮、暖象牙白鼓起书页、蜂蜜黄色星形书签的打开式启蒙书。
- 画画：暖白圆角画本、斜放的太阳黄短铅笔，以及绿／黄／珊瑚红组成的抽象弧形笔触。
- 许愿池：暖象牙色圆石池沿、青玉绿珐琅水纹和中心旧金色硬币。
- 我的：蛋形旧黄铜边框、暖白珐琅内嵌、苔藓绿圆头和肩线的无五官头像徽章。
- 时间表：暖白翻页日历、苔藓绿背板、旧黄铜装订环和无数字的 10:10 时针。

## 最终推荐文件

### 1024×1024 RGBA PNG 母版

1. `png/ui_3d_early_learning_open_book_v01.png`
2. `png/ui_3d_drawing_sketchbook_pencil_v01.png`
3. `png/ui_3d_wishing_pool_coin_v01.png`
4. `png/ui_3d_profile_egg_cameo_v03.png`
5. `png/ui_3d_schedule_calendar_clock_v01.png`

### 1024×1024 带 Alpha WebP

1. `webp/ui_3d_early_learning_open_book_v01.webp`
2. `webp/ui_3d_drawing_sketchbook_pencil_v01.webp`
3. `webp/ui_3d_wishing_pool_coin_v01.webp`
4. `webp/ui_3d_profile_egg_cameo_v03.webp`
5. `webp/ui_3d_schedule_calendar_clock_v01.webp`

WebP 参数：质量 92，Alpha 质量 100。

### 256×256 运行时 WebP

1. `runtime/ui_3d_early_learning_open_book_256_v01.webp`
2. `runtime/ui_3d_drawing_sketchbook_pencil_256_v01.webp`
3. `runtime/ui_3d_wishing_pool_coin_256_v01.webp`
4. `runtime/ui_3d_profile_egg_cameo_256_v03.webp`
5. `runtime/ui_3d_schedule_calendar_clock_256_v01.webp`

运行时 WebP 参数：质量 90，Alpha 质量 100。

### “我的”Tab 专用版本

- `runtime/ui_3d_profile_egg_cameo_96_v03.png` — 96×96 RGBA PNG。

## “我的”透明边缘修订

- 首次软遮罩版本将黄铜和象牙白误判为大面积半透明；相关过程稿已移至 `01_MiniProgram_MVP/tmp/imagegen/ui-3d-actions/drafts/profile_soft_matte_v01/`，不作为正式资产。
- v2 改用严格洋红键，完整恢复金属与珐琅材质；保留为回退版本。
- v3 在 v2 基础上收缩 1px Alpha 边缘，去除极细洋红色边线；最终优先使用 v3。

## QA 结果

- 正式推荐数量：5/5。
- PNG 母版：5/5，均为 1024×1024 RGBA。
- WebP 母版：5/5，均为 1024×1024 RGBA。
- 运行时 WebP：5/5，均为 256×256 RGBA。
- “我的”Tab PNG：1/1，96×96 RGBA。
- 所有正式文件四角 Alpha 均为 0，主体 Alpha 包围盒非空；同物品 PNG 与 WebP 的 Alpha 包围盒一致。
- 40px、66px、96px 缩略检查通过，五项均保持可辨认轮廓。
- 未覆盖既有 SVG、Tab PNG 或其他 UI 资产。

## 视觉联系表

- 母版联系表：`01_MiniProgram_MVP/tmp/imagegen/ui-3d-actions/previews/ui_3d_actions_master_contact_sheet_v02.png`
- 小尺寸 QA：`01_MiniProgram_MVP/tmp/imagegen/ui-3d-actions/previews/ui_3d_actions_small_size_qa_v02.png`

## UI 接入记录

日期：2026-08-02

- `config/pre-hatch-assets.js` 中的 `wish`、`learn`、`draw` 已由旧 SVG 路径切换为本批次 256×256 WebP：许愿池、早教班和画画首页入口会直接使用新的透明 3D 图标。
- `app.json` 与 `custom-tab-bar/index.js` 中“我的”图标已切换为 `runtime/ui_3d_profile_egg_cameo_96_v03.png`。
- 时间表图标已注册为 `PRE_HATCH.interactionIcons.schedule`，路径为 `runtime/ui_3d_schedule_calendar_clock_256_v01.webp`。
- 当前项目没有时间表页面、路由或既有入口；未将该图标错误绑定到“回忆”页面，也未新增无行为按钮。
- 原有 SVG 和 `assets/tab/me*.png` 均保留，未覆盖或删除，可随时回退。
