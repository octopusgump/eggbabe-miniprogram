# 交接说明：UI 设计审计与修复（Claude → Codex）

本文交接一次 UI 设计一致性审计的结果与已完成的修复。分三部分读：

- **第 1 节 已完成的修改** —— 已经落在工作区、验证全绿。**不要重做、不要回退。**
- **第 2 节 已拍板的决定** —— 产品负责人已明确表态的事项。**不要重新提议相反方案。**
- **第 3 节 待处理清单** —— 你要逐一处理的问题。

---

## 0 · 现状

| 项 | 值 |
| --- | --- |
| 仓库 | `01_MiniProgram_MVP` |
| 分支 | `release/miniprogram-mvp-v3.6-20260802` |
| HEAD | `8ecb957 docs: refresh design baseline` |
| 状态 | 全部改动**在工作区未提交**，31 个文件，+498 / −178 |
| 判据 | `docs/eggbabe-DESIGN.md`；上位文档为 `../PRD归档/蛋宝宝小程序_V3_6_PRD.md` |
| 冲突优先级 | V3.6 主 PRD → 专项规格 → eggbabe-DESIGN.md → 当前代码 |

### 验证方式（每次改完必须全绿）

```bash
for f in miniprogram/services/tests/*.test.js; do node "$f" || exit 1; done
node scripts/verify-project.js
node scripts/verify-v2.js
node scripts/verify-h5.js
node scripts/verify-v211.js
node scripts/verify-egg-shell-art.js
node scripts/verify-home-egg-layout.js
node scripts/verify-incubation-practice-v35.js
node scripts/verify-environment-assets.js
node scripts/verify-package-assets.js
git diff --check
```

当前：**20 个单测 + 9 个脚本全绿**。

### 严重度定义

| 级别 | 判据 |
| --- | --- |
| Blocker | 违反 design.md 明文硬规则且用户可见；显示错误素材／角色／天气；出现任务化或催回访表达；候选与开发资源进入正式包 |
| Major | 违反规则但触发路径较窄；缺失必需的失败／重试／可返回状态；无障碍语义缺失 |
| Minor | 数值偏差（色值、字号、时长、尺寸），不影响功能语义 |
| Info | 文档与实现口径不一致，应修文档而非改代码 |

---

## 1 · 已完成的修改（不要重做／回退）

### 1.1 Blocker

#### B1 · 动作全景跨季节复用 → 改为按环境键精确匹配

**原问题**：`panoramaByPeriod` 只按 `day/sunset/night` 建索引，`resolveActionPanorama` 只校验 `weather === 'sunny'` + `period`，**完全不校验季节**。实测 `home_bedroom_read_day_v01.webp` 窗外是浅绿嫩叶，却会被送给 `winter_clear_day`（空房图窗外是雪景）和 `autumn_clear_day`（金黄）。

**改动**（`miniprogram/config/post-hatch-assets.js`）：

- 新增 `GENERIC_ACTION_SCENE_KEYS`，把 3 张通用晴朗图登记到实际烘焙的春季环境键：
  ```js
  const GENERIC_ACTION_SCENE_KEYS = Object.freeze({
    day: 'spring_clear_day',
    sunset: 'spring_clear_sunset',
    night: 'spring_clear_night'
  });
  ```
- `actionPanoramaScenesFor()` 不再产出 `panoramaByPeriod` / `panoramaAfterAction`，改为产出
  `panoramaBySceneKey` / `panoramaAfterActionBySceneKey`（键为环境键）。
- `resolveActionPanorama()` 只按 `environment.sceneKey` 查表，查不到返回 `null`，由调用方回落同环境空房全景。

**影响**：41 张动作图现绑定在 7 个环境键上（`spring_clear_day/sunset/night` + 4 张已审核特殊天气）。其余 29 个环境键回落空房图。

**扩展方式**：新季节动作图到位后，在 `GENERIC_ACTION_SCENE_KEYS` 加键，或在 `ACTION_PANORAMA_SCENE_KEY_FILES` 逐张登记。**不要改回按时段匹配。**

**连带改动**：
- `scripts/print-environment-cdn-manifest.js` 改读新字段。
- `miniprogram/services/tests/post-hatch-panel-scenes.test.js` 增加回归锁：夏／秋／冬晴天不得复用春季图、缺环境键不得按时段猜测、CDN 清单不得同图多键、锦鲤无关灯资产不得复用玉兔版本。

#### B2 · 窗外景色跨天气代用 → 改为只用精确匹配

**原问题**（`miniprogram/services/incubation-environment.js`）：
- `rain` / `storm` → 用 `cloudyDay` / `cloudyNight`
- `postSnow` → 用 `snowDay` / `snowNight`
- 非晴朗日落 → **直接把 941×1672 的房间中央场景当作"窗外"图**

用户在全屏「日常窗外详情」看到顶栏写「窗外 · 下雨 · 日落」，画面却是多云图或整间房间图。

**改动**：`windowAssetPath()` 改为精确查表，无匹配返回空串：

```js
const byWeather = {
  sunny:  { day: …clearDay,  sunset: …clearSunset, night: …clearNight },
  cloudy: { day: …cloudyDay, night: …cloudyNight },
  snow:   { day: …snowDay,   night: …snowNight }
};
return (byWeather[weather] || {})[period] || '';
```

`resolve()` 里删掉 sunset 用 `scene.background` 顶替的分支。空串会让 `daily-window-detail` 走 `empty: !source` 分支，显示空态 + 重试 + 返回（组件已有该能力，无需改组件）。

**影响**：36 个环境键中 20 个有精确窗景，16 个进空态。

**扩展方式**：补齐 `shared/10-background/window-weather/` 对应图后，在 `byWeather` 表加行。

#### B3 · 催回访文案

`miniprogram/pages/home/home.js`：`'蛋宝宝还没到早教的年龄，明天来试试吧。'` → `'蛋宝宝还没到早教的年龄。'`

违反 design.md §6「状态切换不显示倒计时、完成率或诱导回访文案」。

**连带**：`scripts/verify-incubation-practice-v35.js`、`scripts/verify-home-egg-layout.js`、
`miniprogram/services/tests/navigation-interactions.test.js` 三处断言同步更新，并加了
`/明天|再来|试试吧|别忘了|连续到访/` 的否定断言，防止回潮。

### 1.2 Major

#### M3 · 首页「减少动态效果」失效

**原问题**：`home.wxss` 的 `@media (prefers-reduced-motion)` 里写 `.egg { animation: none }`（特异性 0,1,0），被文件前部的 `.egg.egg--wobble`、`.egg.egg--warming`、`.egg.egg--quiet`、`.light-morning .time-beam`、`.season-spring .season-piece`（0,2,0）覆盖 —— 摸蛋 wobble、暖蛋 lean、knock、时段光束、季节飘叶在开启后**照常播放**。另有 `.scene-expand-overlay`、`.feedback-bubble`、`.draw-action-spark`、`.egg-aura::after` 根本没纳入。

**改动**：
- `home.wxml` 根节点：`<view class="page {{reducedMotion ? 'page--reduced' : ''}}">`
- `home.js`：`data.reducedMotion`，`onShow` 里 `this.prefersReducedMotion()` 重新读取
- `home.wxss`：新增 `.page--reduced …` 规则块 + 媒体查询双通道，**全部加 `!important`**（这是关键，不加就会被状态类覆盖）

沿用了 `life-scene` 已有的 `.page--reduced` 类名方案 —— 微信 WebView 对 `prefers-reduced-motion` 支持不一致，不能只依赖媒体查询。

**连带**：`scripts/verify-v2.js`、`scripts/verify-home-egg-layout.js` 增加断言，要求两个通道都在、且用 `!important`。

#### M5 · 全屏旅途回放缺单项重试

**原问题**：任一张图 `binderror` 就把 `ready` 置 false、整个 swiper 卸载，错误页只有「返回明信片」，**没有重试**。违反 design.md §6。

**改动**（`miniprogram/pages/journey-scene/`）：
- `.js` 新增 `onRetrySlide()`：把当前索引从 `failedSlideIndexes` 移除并重挂 swiper，不重拉整段旅程、不改 ta 当前状态
- `.wxml` 错误态加「重新看看」按钮，`wx:if="{{slides.length}}"` 保证只在有内容可重试时出现
- `.wxss` 加 `.journey-state__retry`（96rpx 胶囊 `#002900`），`.journey-state__back` 降为次级

#### M6 坐标机制 · 提示层从屏幕百分比改为母图锚点

> ⚠️ **提示层本身按产品决定保留**，见第 2 节。这里改的只是定位机制。

**原问题**：18 处提示位置写死在 CSS 里，用的是**屏幕百分比**（如 `.action-glow--lamp { left:69%; bottom:34% }`），而道具在 `2823×1672` 母图里是固定像素。母图经 `aspectFill` 铺进 `300vw × 100vh`，不同屏幕比例裁切量不同，同一物件会跑到不同的屏幕百分比上：

| 母图定点 | iPhone SE 375×667 | iPhone 14 390×844 | iPad 768×1024 |
| --- | --- | --- | --- |
| (640, 470) 左屏台灯 | left 67.9% | left **50.1%** | left 68.0% / top 20.8% |

19.5:9 上横向偏 ~70px，光斑飘到台灯外面。

**改动**：
- `miniprogram/utils/scene-window-geometry.js` 新增 `mapPanoramaPoints()`，与已有的 `mapPanoramaRegions()` 共用同一套 aspectFill 数学，返回 `{ [id]: { panel, style } }`，`style` 为纯像素 `left/top`。
- `miniprogram/config/post-hatch-assets.js` 新增锚点表：
  ```js
  const SCENE_ANCHORS_PROVISIONAL = true;          // 校准完改为 false
  const DEFAULT_STATE_ANCHORS = { sleep: { character:{x,y}, action:{x,y}, talk:{x,y} }, … };  // 9 个状态
  const CHARACTER_STATE_ANCHORS = { 'jade-rabbit': {}, 'boon-koi': {} };  // 角色差异在这覆盖
  ```
  新增导出 `resolveStateAnchors(pet, currentState)`；外出状态返回全 `null`。
- `miniprogram/pages/life-scene/life-scene.js` 新增 `sceneAnchorPresentation()`，在 `loadSnapshot` 与 `onResize` 时把锚点换算进 data（`characterPanel/Style`、`actionPanel/Style`、`talkPanel/Style`）。
- `life-scene.wxml` 三屏的角色热区、动作光斑、定位圈、说话触点改为按 `xxxPanel === n` 条件渲染 + `style="{{xxxStyle}}"`。
- `life-scene.wxss` 删除 18 条写死位置，改 `transform: translate(-50%,-50%)` 居中；`action-breathe`、`home-locator-pulse`、`talk-nudge-in` 三个 keyframes 的 `transform` 都补上居中位移（**否则动画期间会跳到左上角**）。

**顺带修掉的隐藏 bug**：所在屏现在由锚点自身推出，提示不可能再落到和道具不同的一屏；以前 `currentState.action.screen` 和 CSS 位置两处各写一遍，能对不上。

**连带**：`miniprogram/services/tests/scene-window-geometry.test.js` 新增 64 行断言 —— 4 种机型上锚点必须留在同一屏、每个居家状态三个锚点齐全、锚点推出的屏必须与 `life-scenes.js` 声明的 `screen` 一致、外出状态不得有角色与动作锚点。

> **锚点当前是占位值**，由旧 CSS 百分比在 4.7 寸（比例最接近母图）上反推得到，精度只到"大概那一块"。校准方式见第 3.3 节。

### 1.3 Minor

| # | 改动 | 文件 |
| --- | --- | --- |
| m1 | 删除死配置 `fullScenes`（含 36 键之外的 `spring_clear_night_v2` / `_moonlight` 路径）、`nestPad`、`eggWindowBack` —— 全仓无引用 | `config/pre-hatch-assets.js` |
| m3 | packOptions 补齐漏排的 `spring_clear_day` / `spring_clear_night` 蛋体与窝垫共 4 个文件（其余 18 套早已排包走 CDN） | `project.config.json` |
| m4 | 页面模板不再写死资源路径：蛋壳景深／高光叠加层 → `PRE_HATCH.eggShellOverlays`；百宝箱 4 个图标 → `POST_HATCH.sceneActions.toolboxItems`；绘画工具条 7 个图标 → `PRE_HATCH.doodleToolbar`。模板已无任何 `src="/assets/…"` | `home.wxml/js`、`life-scene.wxml/js`、`doodle.wxml`、`doodle-editor.wxml`、`doodle-definition.js`、两个 config |
| m5 | `.pressable--pressed` `scale(0.99)` → `scale(0.98)`，对齐 design.md §3.3 | `app.wxss` |
| m7 | nav-bar 补 `env(safe-area-inset-left/right)`，横屏与刘海机型让开 | `components/nav-bar/nav-bar.wxss` |
| m8 | 数字时钟去掉 monospace 字体栈，回到统一字体栈 + `font-variant-numeric: tabular-nums` | `home.wxss` |
| m9 | 移除孤儿页 `pages/nickname`（全仓无跳转入口）的 app.json 注册，并加入 packOptions.ignore | `app.json`、`project.config.json` |
| m12 | dev 页 `font-weight: 650` → `600`、`font-size: 16rpx` → `20rpx` | `pages/egg-rotation-sample/egg-rotation-sample.wxss` |
| i4 | release gate 锁死 `magicWindow.enabled === false` 且 destinations 全空 —— 目的地全屏视图代码仍在包内，防止被误打开后把目的地图片放进实时生活空间（违反 §4.2） | `services/tests/release-gate.test.js` |

### 1.4 被同步更新的门禁（都是"断言旧的错误行为"，已改为断言新行为）

`doodle-layout.test.js`、`navigation-interactions.test.js`、`post-hatch-panel-scenes.test.js`、
`release-gate.test.js`、`scene-window-geometry.test.js`、
`scripts/verify-v2.js`、`scripts/verify-v211.js`、`scripts/verify-home-egg-layout.js`、
`scripts/verify-incubation-practice-v35.js`、`scripts/print-environment-cdn-manifest.js`

---

## 2 · 已拍板的决定（不要重新提议相反方案）

| 议题 | 决定 |
| --- | --- |
| B1／B2 造成的覆盖收窄 | **采纳**。宁可回落空房图／空态，也不用代用图。 |
| 空房全景（左屏是书架那 36 张） | **暂不删除**。等床布局的新空房图出来后一起替换。现在删会让外出状态（720/720 组合）和 93.8% 的居家组合白屏。 |
| 提示层（`.action-glow` 等） | **保留，不做收敛**。只把定位机制改成母图锚点（已完成），坐标待出图后校准。 |
| 角色动作图的房间布局 | **床布局为准**，书架布局作废。 |
| `kitchen/` 目录下的图片与文件夹 | **一律不要动**，正在批量生图中。 |

---

## 3 · 待处理清单

### 3.1 需要产品决策，代码侧先不要动

| # | 问题 | 证据 | 说明 |
| --- | --- | --- | --- |
| **M1** | **首页三段横向 Dock 违反上位 PRD**。许愿／早教／画蛋壳做成 `368rpx` 宽、每段 `112rpx` 的横向等权胶囊 | `home.wxml` 的 `companion-primary-dock`、`home.wxss` 同名规则 | V3.6 PRD §5.2.1 要求右侧 `112×248rpx` 竖向双入口 + 独立画蛋壳圆按钮，**明文禁止横向大 Dock**；design.md §4.1 却写三段胶囊。**不能用 design.md 为当前实现自证合规。** 需产品在「恢复 PRD 竖向双入口」与「正式修订 PRD 批准当前 Dock」之间二选一。在此之前发布判断不能是无条件「可发布」 |
| **M4** | 画笔提供 **10 种颜色**，design.md §4.4 写「五种颜色」 | `services/egg-shell-art.js` 的 `BRUSH_COLORS`（10 项）；取色面板 `.brush-color-card { width: 20% }` → 5×2 两行 | 五档粗细、默认 5px、每笔独立存色三项均合格，只有颜色数超规范一倍。需产品定：收敛到 5 色，或修订 design.md §4.4 |
| **M7** | 色值大面积超出 §3.1 色表。全量扫描 `miniprogram/**/*.{wxss,js,wxml,json}`（排除 assets／node_modules）共 **251 个不同 hex**，其中 **230 个**不在 design.md §3.1 十五色 + app.wxss 六个扩展 token 内 | 密度最高：`life-scene.wxss` 52、`home.wxss` 47、`doodle.wxss` 24、`lesson.wxss` 21、`egg-shell-art.js` 20（画笔／贴纸调色板，属美术色）。另有 378 处 `rgba()` | 核心 13 色（主交互 `#002900`、按下 `#001A00`、文字三级、页面底、分隔线、品牌绿黄粉、回忆色、错误色）**逐一核对无误用**。问题是场景页大量自造的暖木色／苔绿色。建议按「场景氛围色」单独立附表纳入 §3，而不是逐个改回 |

### 3.2 需要美术素材，代码侧已就绪

| # | 缺口 | 影响 |
| --- | --- | --- |
| **发布前置** | **16 套蛋体层 + 16 套窝垫层**（同一组 16 个环境键，共 32 个文件） | 按天气池 × 时段穷举，**36 个真实可达组合中 16 个缺图 = 44%**。真实用户会看到「窝垫加载失败」错误页 + 重试。代码行为正确（拒绝代用、显式报错、保留旧场景），但发布前必须补齐 |
| **M2** | 空房全景左屏是**书架**，动作全景左屏是**床**，同机位同桌面道具，仅左屏家具不同 | `sleep`／`lazy` 定位在 screen 0，回退空房图时那里没有床，`.action-glow`（blanket）会亮在书架上。已决定床布局为准，等新图 |
| **B1 扩展** | 夏／秋／冬三季的动作图 | 现在这三季晴天回落空房图 |
| **B2 扩展** | 雨、雷雨、雪后的窗景，以及多云与降雪的日落窗景（共 11 个组合） | 现在这些组合进空态 |

缺图的 16 个环境键：

```
spring_cloudy_sunset    spring_cloudy_night     spring_rain_sunset      spring_rain_night
summer_cloudy_sunset    summer_cloudy_night     summer_storm_day        summer_storm_sunset
autumn_rain_sunset      autumn_rain_night       winter_clear_sunset     winter_cloudy_sunset
winter_cloudy_night     winter_snow_sunset      winter_post_snow_sunset winter_post_snow_night
```

**可选的临时收敛（未实施，等产品拍板）**：把 `miniprogram/services/environment-state.js` 的
`WEATHER_POOLS` 按「该季节+时段是否有完整素材」过滤，让环境根本不落到缺图的键上。
天气变化少一点，但不出错误页，**也不违反任何规则**（是不生成那个环境，不是拿别的图冒充）。
补图后把过滤去掉即可。改动约 15 行。

### 3.3 出图后必须做的校准（机制已就绪）

`miniprogram/config/post-hatch-assets.js` 的 `DEFAULT_STATE_ANCHORS` 目前是占位值。
正式动作图出齐后，对每个状态在 `2823×1672` 母图上量三个中心点：

| 锚点 | 量什么 | 驱动谁 |
| --- | --- | --- |
| `character` | ta 的身体中心 | 轻触热区 + 「找到蛋宝宝」的脉冲圈 |
| `action` | 该状态唯一动作所对应的道具中心（台灯／被子／杯子／画纸／书／屏幕／窗户…） | 呼吸光斑 |
| `talk` | 说话触点，一般在 ta 头侧 | 三点气泡 |

9 个状态 × 3 点 = 27 个数。玉兔与锦鲤摆位不同的，在 `CHARACTER_STATE_ANCHORS` 里按状态覆盖，
只写不同的。全部校准完把 `SCENE_ANCHORS_PROVISIONAL` 改为 `false`。

`scene-window-geometry.test.js` 会在 4 种机型上验证锚点齐全、落屏正确，填错屏直接红。

### 3.4 未修的 Minor（可自行判断是否处理）

| # | 问题 | 位置 |
| --- | --- | --- |
| m2 | `READY_PANORAMA_SCENE_KEYS` 由全部 36 个 sceneKey 构成，`ready` 恒为 true、`panoramaAssetsReady` 恒真，门禁形同虚设。实质由 `verify-environment-assets.js` 逐键校验文件存在覆盖，风险低 | `config/post-hatch-assets.js` |
| m6 | 已由 2026-08-09 范围收缩覆盖：百宝箱弹层和格子不再进入 V3.6 / V3.7 正式界面；相关图片与内容页代码保留 | — |
| m10 | `.light-morning` / `.light-afternoon` / `.time-intro--morning` 是死 CSS —— `lightPhaseFromPeriod` 只产出 `midday/sunset/night` | `home.wxss`、`services/environment-state.js` |
| m11 | 绘画页撤销／清空导轨与画布**外接正方形**右下角有约 `206rpx × 132rpx` 重叠。蛋形是椭圆，实际笔迹区大概率不受影响，**需真机确认** | `doodle.wxss` 的 `.canvas-action-rail`、`.egg-canvas-stack` |
| i5 | `pages/doodle/doodle.wxml/wxss` 与 `components/doodle-editor/doodle-editor.wxml/wxss` **逐字节完全相同**，双份维护。可用 `<include>` / `@import` 去重，但有运行时风险，需真机验证 | — |
| i7 | 建议新增 `scripts/verify-design-tokens.js`（冻结 M7 的表外色清单）与 `scripts/verify-asset-dimensions.js`（覆盖动作全景、明信片、alpha 通道、宽高比 —— 现有 `verify-environment-assets.js` 只查 36+36 张的宽高）。**注意：verify-design-tokens 一建就会因 M7 直接红**，需先决定 M7 怎么处理 | `scripts/` |

### 3.5 文档口径冲突（改文档，不要改代码）

| # | 冲突 |
| --- | --- |
| i1 | `docs/蛋宝宝小程序_V3.5_实现口径.md` 仍在活动仓库内可被检索到（另 3 份文档提及 V3.5）。V3.5 不得作为当前合规依据。不要删除文件 |
| i2 | **动作集合三份文档不一致**。当前产品口径为 8 个居家状态；design.md §4.3 缺赖床、发呆；结构说明 v0.3 与 V3.6 PRD §13.3.1 缺看书、听音乐。建议把 8 状态写入 PRD §13.3.1，再在 design.md §4.3 明确区分「业务状态全集（8）」与「已交付动作全景子集」。 |
| i3 | **窗洞透明架构已被取代**。实现已是「36 键预合成整图 + 独立透明蛋体层 + 独立透明窝垫层 + 只画在窗玻璃范围的天气 Canvas」，分层天气系统（7 底图 + 3 叠加层）不再使用，`weatherOverlayPath()` 恒返回空串。仓库内提到 `room_base.webp` 透明窗洞的 handoff / manifest 属历史资料，**不得据此要求代码恢复透明窗洞** |
| i6 | 主 PRD 内仍混有「20 套环境图」的旧段落，顶部优先修订与当前运行时均为 36 键 |

### 3.6 无法静态验证，需真机

1. `.action-glow` / `.home-locator-focus` 在真机上的视觉强度与落点
2. 绘画导轨遮挡（m11）
3. 微信 WebView 对 `@media (prefers-reduced-motion)` 的实际支持度（`.page--reduced` 类名通道不依赖它）
4. `backdrop-filter: blur()` 在低端安卓的降级（全仓 20+ 处）
5. 三屏 `paging-enabled` 横滑吸附手感、`scrollLeft` 首帧是否跳动
6. `2823×1672` 大图经 CDN 加载的首帧时长
7. 明信片资产（`1600×900` 16:9 不透明、无文字／Logo／水印）—— `POST_HATCH.postcards` 为空，本地无正式素材可测
8. 外出状态在各机型是否都保持左下角留空，且无写信、留言或回信入口
9. 大字号／VoiceOver 下 aria-label 的朗读顺序与焦点可达性

**建议真机矩阵**：iPhone SE 类小屏、6.1 寸主流屏、19.5:9 窄长屏、iPad 兼容模式 + 横竖屏切换、
开启「减少动态效果」（重点复现 M3）、开启大字号、低端安卓、弱网／断网（重点复现 M5）。

---

## 4 · 已确认通过、不要改动的部分

以下在审计中逐条核对通过，改动它们等于制造回归：

- 36 个环境键映射完整、路径唯一、只指向正式运行时目录
- 房间／蛋体／窝垫加载失败进入持久错误态 + 重试 + 安全返回，**不拼 CSS 房间**
- 动作全景已声明 `bakedCharacter` / `bakedProps`，运行时不叠透明角色、CSS 道具或色调层
- 玉兔关灯变体只在玉兔生效，锦鲤缺资产时不复用玉兔版本
- 特殊天气恰好四种，与 design.md §4.3 逐条对上
- 资产尺寸实测全部合格：破壳前中央场景 `941×1672` 不透明；破壳后空房与动作全景 `2823×1672` 不透明；蛋体／窝垫 `1254×1254` 带 alpha
- 候选图、参考合成图、`egg-rotation-sample`、大图目录均已排包；`60-action-scenes` 走 `environment_cdn_base` 不进主包
- 破壳前首页是全屏孵化房间；季节／天气／时段由确定性哈希决定；正式版无手动场景切换
- 锁定态使用灰阶图标 + 遮罩，`.companion-item--locked { opacity: 1 }` 显式钉住整体不透明度
- 首次命名与改名共用同一个底部面板，适配底部安全区
- 进入生活空间直接定位到 ta 所在屏，`.scene-stage` 在就绪前 `opacity: 0`，不从错误屏播放滑入
- 场景切换先隐藏预加载、成功后交叉淡化，失败保留旧场景并给重试
- 大状态只有家／旅行／打工／上学；外出只显示空着的家 + 第一人称文字，无目的地图片
- 每个居家小状态只有一个固定动作，道具都是场景内已有物件
- 八个居家状态都从左下角角色入口进入完整对话页；外出时左下角留空，不显示对话、写信、留言或回信入口
- V3.6 / V3.7 右下角只显示“我的／设置”并直接进入“我的”；百宝箱及收藏卡／明信片／纪念物／旅途回放入口在正式版停用，代码与图片保留
- 绘画：画布 `89vw`、双指缩放坐标反向映射、五档粗细、默认 5px、每笔独立存色、撤销与清空共用同一历史栈、700ms 自动保存、导航栏常驻保存状态、禁用态用专用置灰图且不降按钮透明度
- 纪念物三列缩略图、无锁定格／总数／稀有度／完成度；详情单件主图 + `#FFF6F5` 桃粉色「我还记得」区
- 明信片列表只显示封面／标题／日期，按 `journey_id` 聚合
- 旅途回放无假滑动胶囊、无 `1/N`、无收集提示
- 今日收藏卡只推一张真实收藏卡
- 字体栈统一、无 `700` 或伪粗体、可见辅助文字 ≥ `20rpx`、正文 `24–30rpx`
- 控件规格：单个紧凑 `112rpx` 圆形、成组胶囊每段 `112rpx`、文字主按钮 `96rpx` 胶囊
- 按压统一 `0.16s` + `scale(.98)`，回忆卡高光 `.4s` 正好在上限
- `slot_end` / `slotEnd` 只用于内部刷新定时器，从不进入用户可见文案；全仓无倒计时、完成率、剩余次数角标
- 图形按钮、蛋体、工具入口、导航、场景热区均有 `aria-role` + 中文 `aria-label`，装饰层 `aria-hidden`
- 底部操作与面板全部使用 `env(safe-area-inset-bottom)`
- 四个开发验收器 + 回忆预览切换器全部由 `isDemo`（`envVersion === 'develop'`）保护

---

## 5 · 发布判断

**当前档位：需修复代码后重审。**

| 档位 | 前置条件 |
| --- | --- |
| ❌ 可发布 | 不成立。M1 的上位文档冲突未裁决 |
| ⚠️ 补齐素材后可发布 | 需同时满足：① 补齐 16 套蛋体 + 16 套窝垫；② 新空房图（床布局）替换到位；③ 锚点校准完成、`SCENE_ANCHORS_PROVISIONAL` 置 false；④ M1 由产品负责人二选一 |
| ✅ 需修复代码后重审（当前） | B1／B2／B3、M3、M5 已修复；剩余待办见第 3 节 |
