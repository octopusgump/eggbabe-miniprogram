# 破壳后三屏场景套装规范

## 1. 已确认方案

破壳后采用“同一母版制作、三屏独立运行”的混合方案：

- 美术以中屏现有破壳前正式场景为视觉锚点，向左、向右扩展成一张连续三屏母版。
- 运行时分别加载左屏起居区、中屏桌面、右屏布置区。
- 中屏直接复用对应破壳前正式场景，不重新生成。
- 每个状态只新增一张左屏和一张右屏，共需新增 `20 × 2 = 40` 张正式图片。
- 左、右两张必须作为同一个 `sceneSetId` 一起验收、一起启用；不得只上线半套或跨状态混搭。
- 当前三屏全景占位图只用于正式套装未齐时兜底，不是正式母版。

## 2. 产品和运行时边界

- 三屏结构固定：左屏为起居区，中屏为桌面，右屏为布置区。
- 季节、天气和时段只来自 `miniprogram/config/pre-hatch-assets.js` 中真实启用的 20 个状态，不做笛卡尔积扩张。
- 场景套装只决定房间环境、窗景和整体光照，不决定蛋宝宝的 5 小时生活状态。
- 蛋宝宝角色、动作道具、被子前后状态、灯光反馈、天气粒子、文案、热点和 UI 必须保持独立图层。
- 旅行、打工、上学时仍显示同一套空着的家，不生成或展示外出目的地背景。
- 右屏只能保留空的布置空间，不把用户家具、纪念物或未确认功能烘焙进背景。

## 3. 画布与切图

| 项目 | 规范 |
| --- | --- |
| 单屏尺寸 | `941 × 1672 px` |
| 三屏母版 | `2823 × 1672 px` |
| 色彩空间 | sRGB |
| 母版格式 | PNG，无损，保存在 `_masters/`，不进入运行时 |
| 运行时格式 | WebP，单屏目标不超过 `240 KB`；超过 `320 KB` 必须重新压缩或说明原因 |
| 切图边界 | 左 `x=0–940`；中 `x=941–1881`；右 `x=1882–2822` |
| 缩放规则 | 三张使用相同尺寸、同一缩放算法和同一导出参数，禁止分别二次裁图 |

母版建议文件名：

```text
_masters/{scene_key}_three_panel_source_v01.png
```

运行时文件名：

```text
left-living/scene-sets/{scene_key}_left_living.webp
right-decor/scene-sets/{scene_key}_right_decor.webp
```

中屏不复制文件，直接复用 `pre-hatch-assets.js` 中该状态的 `background` 路径。

## 4. 固定机位和连续性

中屏是不可漂移的锚点。生成左右扩展时必须锁定：

- 相机高度、俯仰角、焦距感和垂直线；
- 桌面高度、墙面交线、地平线和窗台高度；
- 木材色相、纹理尺度、墙面材质及景深；
- 主光方向、影子软硬、曝光、白平衡和黑位；
- 左/中、 中/右交界处的墙线、桌边、地板纹理和光照延续。

禁止分别生成三张互不相关的图。左右屏必须以对应中屏原图作为不可修改的参考进行扩图。

## 5. 各屏内容边界

### 左屏：起居区

可以烘焙：墙面、床架、固定枕头、固定床品、静态边柜和不会变化的后景物件。

不得烘焙：蛋宝宝、角色阴影、`blanket_open`、`blanket_covered`、关灯暗层、交互光晕、文字、按钮和热点。

构图要求：给睡觉和赖床姿态预留完整落点；角色安全区内不得出现高对比细碎物；床铺不能遮住底部操作区。

### 中屏：桌面

- 直接复用对应破壳前正式场景，不重新生成或修脸式修改。
- 杯子、画纸、游戏屏幕及其动作状态继续作为独立物件层。
- 若母版生产需要补齐左右画面，中屏区域必须逐像素保持原参考构图，不得让生成模型重绘。

### 右屏：布置区

可以烘焙：墙面、桌面或地面、窗框、固定边几和不会变化的后景结构。

不得烘焙：蛋宝宝、窗外动效、天气粒子、用户家具、纪念物、魔法窗景区、文字、按钮和热点。

构图要求：保留一块低视觉噪声的空区域；窗户位置和上海天气方向必须与中屏一致；不得把旅行景区放入窗外。

## 6. 状态变化规则

- `clear_day`：自然日光，保持中性暖木色，不额外偏黄。
- `clear_sunset`：只改变夕阳方向、强度和室内反射色，不改变家具位置。
- `clear_night`：保留可辨识室内层次；台灯开关效果仍由独立图层负责。
- `cloudy_day`：降低直射光和硬阴影，不用灰色遮罩压暗整屏。
- `rain_day`：背景只表现雨天环境光；雨线和玻璃水珠由动态层负责。
- `storm_night`：背景表现雷雨夜基础环境，闪电仍由动态层负责。
- `snow_day` / `snow_night`：窗外可有积雪环境，飘雪仍由动态层负责。
- `post_snow_day`：表现雪后初晴反射光，不绘制动画式闪点。

同一状态的三屏必须共用一份光照说明。不得出现左屏白天、中屏日落、右屏夜晚等混搭。

## 7. 需要生成的左屏和右屏

下表严格对应当前破壳前配置的 20 个状态。中屏列仅说明复用关系，不是新增生成任务。

| # | 状态 | scene key | 左屏新增文件 | 中屏 | 右屏新增文件 |
| ---: | --- | --- | --- | --- | --- |
| 1 | 春季·晴朗·日间 | `spring_clear_day` | `spring_clear_day_left_living.webp` | 复用同 key 破壳前图 | `spring_clear_day_right_decor.webp` |
| 2 | 春季·晴朗·日落 | `spring_clear_sunset` | `spring_clear_sunset_left_living.webp` | 复用同 key 破壳前图 | `spring_clear_sunset_right_decor.webp` |
| 3 | 春季·晴朗·夜晚 | `spring_clear_night` | `spring_clear_night_left_living.webp` | 复用配置中的月光版 | `spring_clear_night_right_decor.webp` |
| 4 | 春季·阴天·日间 | `spring_cloudy_day` | `spring_cloudy_day_left_living.webp` | 复用同 key 破壳前图 | `spring_cloudy_day_right_decor.webp` |
| 5 | 春季·雨天·日间 | `spring_rain_day` | `spring_rain_day_left_living.webp` | 复用同 key 破壳前图 | `spring_rain_day_right_decor.webp` |
| 6 | 夏季·晴朗·日间 | `summer_clear_day` | `summer_clear_day_left_living.webp` | 复用同 key 破壳前图 | `summer_clear_day_right_decor.webp` |
| 7 | 夏季·晴朗·日落 | `summer_clear_sunset` | `summer_clear_sunset_left_living.webp` | 复用同 key 破壳前图 | `summer_clear_sunset_right_decor.webp` |
| 8 | 夏季·晴朗·夜晚 | `summer_clear_night` | `summer_clear_night_left_living.webp` | 复用同 key 破壳前图 | `summer_clear_night_right_decor.webp` |
| 9 | 夏季·阴天·日间 | `summer_cloudy_day` | `summer_cloudy_day_left_living.webp` | 复用同 key 破壳前图 | `summer_cloudy_day_right_decor.webp` |
| 10 | 夏季·雷雨·夜晚 | `summer_storm_night` | `summer_storm_night_left_living.webp` | 复用同 key 破壳前图 | `summer_storm_night_right_decor.webp` |
| 11 | 秋季·晴朗·日间 | `autumn_clear_day` | `autumn_clear_day_left_living.webp` | 复用同 key 破壳前图 | `autumn_clear_day_right_decor.webp` |
| 12 | 秋季·晴朗·日落 | `autumn_clear_sunset` | `autumn_clear_sunset_left_living.webp` | 复用同 key 破壳前图 | `autumn_clear_sunset_right_decor.webp` |
| 13 | 秋季·晴朗·夜晚 | `autumn_clear_night` | `autumn_clear_night_left_living.webp` | 复用同 key 破壳前图 | `autumn_clear_night_right_decor.webp` |
| 14 | 秋季·雨天·日间 | `autumn_rain_day` | `autumn_rain_day_left_living.webp` | 复用同 key 破壳前图 | `autumn_rain_day_right_decor.webp` |
| 15 | 冬季·晴朗·日间 | `winter_clear_day` | `winter_clear_day_left_living.webp` | 复用同 key 破壳前图 | `winter_clear_day_right_decor.webp` |
| 16 | 冬季·晴朗·夜晚 | `winter_clear_night` | `winter_clear_night_left_living.webp` | 复用同 key 破壳前图 | `winter_clear_night_right_decor.webp` |
| 17 | 冬季·阴天·日间 | `winter_cloudy_day` | `winter_cloudy_day_left_living.webp` | 复用同 key 破壳前图 | `winter_cloudy_day_right_decor.webp` |
| 18 | 冬季·降雪·日间 | `winter_snow_day` | `winter_snow_day_left_living.webp` | 复用同 key 破壳前图 | `winter_snow_day_right_decor.webp` |
| 19 | 冬季·降雪·夜晚 | `winter_snow_night` | `winter_snow_night_left_living.webp` | 复用同 key 破壳前图 | `winter_snow_night_right_decor.webp` |
| 20 | 冬季·雪后·日间 | `winter_post_snow_day` | `winter_post_snow_day_left_living.webp` | 复用同 key 破壳前图 | `winter_post_snow_day_right_decor.webp` |

合计：左屏 20 张、右屏 20 张，新增正式运行时素材共 40 张；中屏复用 20 张现有素材。

## 8. 生产顺序

1. 先只制作 `spring_clear_day` 的一张三屏母版和左右两张切图，完成机位与接缝验收。
2. 锁定母版结构后制作四季晴朗日间，验证季节变化不会导致家具漂移。
3. 再制作日落与夜晚。
4. 最后制作阴天、雨、雷雨、雪和雪后状态。
5. 每个状态完成后先放入对应 `scene-sets/` 目录；只有左右两张都通过检查，才在 `READY_PANEL_SCENE_KEYS` 中加入该 key。

不得一次性生成 40 张后再统一检查；首套机位未锁定前不得批量扩图。

## 9. 验收清单

- 文件名、尺寸、格式和 scene key 完全匹配。
- 中屏与破壳前当前正式素材一致。
- 左中、 中右边界在原尺寸及常见窄屏/宽屏裁切下没有明显跳线。
- 三屏家具比例、木纹尺度、透视和主光方向一致。
- 没有角色、文字、Logo、UI、按钮、热点或未经确认的物品。
- 角色落点、系统胶囊、“看看回忆”和底部输入区域没有高对比视觉干扰。
- 雨、雪、雾、闪电等动态内容没有被重复烘焙。
- 左右两张未同时通过前，运行时继续使用整张 panorama 兜底。
