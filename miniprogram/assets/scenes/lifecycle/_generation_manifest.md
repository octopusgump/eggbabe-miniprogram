# 蛋宝宝生命周期图片生成清单

更新时间：2026-08-01
依据：主 PRD §11、辅助 PRD §10.11、`lifecycle/README.md` 锁定基准。
统一交付：WebP；透明素材必须带真实 Alpha；角色固定 `1254 × 1254`；窗外素材固定 `941 × 1672`。

## 总进度

- 固定清单：47 张。
- 已就绪：19 张，其中复用并复核 10 张，本轮正式新增 9 张。
- 待生成：28 张。
- 角色基准：玉兔与锦鲤标准参考均已确认；锦鲤无需标记“参考不足”。

## 逐项状态

| # | 文件路径（相对 lifecycle） | 章节 / 图层 | 尺寸 / 字节 | Alpha | 状态 |
|---:|---|---|---|---|---|
| 1 | `shared/10-background/window-weather/w_01_clear_day.webp` | 共用窗外 / 背景 | 941×1672 / 162032 | 不透明 RGB | 正式·复用 |
| 2 | `shared/10-background/window-weather/w_02_clear_sunset.webp` | 共用窗外 / 背景 | 941×1672 / 168892 | 不透明 RGB | 正式·复用 |
| 3 | `shared/10-background/window-weather/w_03_clear_night.webp` | 共用窗外 / 背景 | 941×1672 / 75306 | 不透明 RGB | 正式·复用 |
| 4 | `shared/10-background/window-weather/w_04_cloudy_day.webp` | 共用窗外 / 背景 | 941×1672 / 169864 | 不透明 RGB | 正式·复用 |
| 5 | `shared/10-background/window-weather/w_05_cloudy_night.webp` | 共用窗外 / 背景 | 941×1672 / 79768 | 不透明 RGB | 正式·复用 |
| 6 | `shared/10-background/window-weather/w_06_snow_day.webp` | 共用窗外 / 背景 | 941×1672 / 175980 | 不透明 RGB | 正式·复用 |
| 7 | `shared/10-background/window-weather/w_07_snow_night.webp` | 共用窗外 / 背景 | 941×1672 / 111392 | 不透明 RGB | 正式·复用 |
| 8–10 | 雾 / 雨 / 雪 overlay | 共用天气 / 前景 FX | — | 改由首页窗户 Canvas 绘制 | 已删除 |
| 11 | `post-hatch/50-overlays/magic-window/dali.webp` | 魔法窗 / 窗景 | — | 待检 | 待生成 |
| 12 | `post-hatch/50-overlays/magic-window/beijing.webp` | 魔法窗 / 窗景 | — | 待检 | 待生成 |
| 13 | `post-hatch/50-overlays/magic-window/xishuangbanna.webp` | 魔法窗 / 窗景 | — | 待检 | 待生成 |
| 14 | `pre-hatch/10-background/incubation-room/room_base.webp` | 破壳前 / 房间背景 | 941×1672 / 114454 | RGBA，窗洞透明 | 正式·复用 |
| 15 | `pre-hatch/20-room-objects/window-and-nest/nest_pad.webp` | 破壳前 / 中景物件 | 1254×1254 / 69190 | RGBA，四角透明 | 正式·新增 |
| 16 | `pre-hatch/30-character/egg/egg_on_nest.webp` | 破壳前 / 蛋体 | 1254×1254 / 64580 | RGBA，四角透明 | 正式·新增 |
| 17 | `pre-hatch/30-character/egg/egg_window_back.webp` | 破壳前 / 蛋体 | — | 待检 | 待生成 |
| 18 | `pre-hatch/20-room-objects/interactive-props/table_lamp.webp` | 破壳前 / 互动小物 | 1254×1254 / 63260 | RGBA，四角透明 | 正式·新增 |
| 19 | `pre-hatch/20-room-objects/interactive-props/coffee_machine.webp` | 破壳前 / 互动小物 | 1254×1254 / 43274 | RGBA，四角透明 | 正式·新增 |
| 20 | `pre-hatch/20-room-objects/interactive-props/drawing_paper_set.webp` | 破壳前 / 互动小物 | 1254×1254 / 47810 | RGBA，四角透明 | 正式·新增 |
| 21 | `pre-hatch/20-room-objects/interactive-props/scarf.webp` | 破壳前 / 互动小物 | 1254×1254 / 76220 | RGBA，四角透明 | 正式·新增 |
| 22 | `post-hatch/10-background/left-living/left_living.webp` | 破壳后 / 左屏背景 | — | 待检 | 待生成 |
| 23 | `post-hatch/10-background/right-decor/right_decor.webp` | 破壳后 / 右屏背景 | — | 待检 | 待生成 |
| 24 | `post-hatch/30-character/jade-rabbit/sleep.webp` | 玉兔 / 角色 | — | 待检 | 待生成 |
| 25 | `post-hatch/30-character/jade-rabbit/lazy.webp` | 玉兔 / 角色 | — | 待检 | 待生成 |
| 26 | `post-hatch/30-character/jade-rabbit/stare.webp` | 玉兔 / 角色 | 1254×1254 / 93122 | RGBA，四角透明 | 正式·复用基准 |
| 27 | `post-hatch/30-character/jade-rabbit/tea.webp` | 玉兔 / 角色 | — | 待检 | 待生成 |
| 28 | `post-hatch/30-character/jade-rabbit/drawing.webp` | 玉兔 / 角色 | — | 待检 | 待生成 |
| 29 | `post-hatch/30-character/jade-rabbit/gaming.webp` | 玉兔 / 角色 | — | 待检 | 待生成 |
| 30 | `post-hatch/30-character/jade-rabbit/window_back.webp` | 玉兔 / 角色 | — | 待检 | 待生成 |
| 31 | `post-hatch/30-character/boon-koi/sleep.webp` | 锦鲤 / 角色 | — | 待检 | 待生成 |
| 32 | `post-hatch/30-character/boon-koi/lazy.webp` | 锦鲤 / 角色 | — | 待检 | 待生成 |
| 33 | `post-hatch/30-character/boon-koi/stare.webp` | 锦鲤 / 角色 | 1254×1254 / 80776 | RGBA，四角透明 | 正式·复用基准 |
| 34 | `post-hatch/30-character/boon-koi/tea.webp` | 锦鲤 / 角色 | — | 待检 | 待生成 |
| 35 | `post-hatch/30-character/boon-koi/drawing.webp` | 锦鲤 / 角色 | — | 待检 | 待生成 |
| 36 | `post-hatch/30-character/boon-koi/gaming.webp` | 锦鲤 / 角色 | — | 待检 | 待生成 |
| 37 | `post-hatch/30-character/boon-koi/window_back.webp` | 锦鲤 / 角色 | — | 待检 | 待生成 |
| 38 | `post-hatch/20-room-objects/left-living/blanket_open.webp` | 互动反馈 / 左屏物件 | — | 待检 | 待生成 |
| 39 | `post-hatch/20-room-objects/left-living/blanket_covered.webp` | 互动反馈 / 左屏物件 | — | 待检 | 待生成 |
| 40 | `post-hatch/20-room-objects/left-living/lamp_dark_overlay.webp` | 互动反馈 / 左屏叠加 | — | 待检 | 待生成 |
| 41 | `post-hatch/20-room-objects/center-desk/paper_back.webp` | 互动反馈 / 中屏物件 | — | 待检 | 待生成 |
| 42 | `post-hatch/20-room-objects/center-desk/paper_front.webp` | 互动反馈 / 中屏物件 | — | 待检 | 待生成 |
| 43 | `post-hatch/20-room-objects/center-desk/game_screen_idle.webp` | 互动反馈 / 中屏物件 | — | 待检 | 待生成 |
| 44 | `post-hatch/20-room-objects/center-desk/game_screen_active.webp` | 互动反馈 / 中屏物件 | — | 待检 | 待生成 |
| 45 | `post-hatch/40-interaction-fx/tea_steam.webp` | 互动反馈 / 前景 FX | — | 待检 | 待生成 |
| 46 | `post-hatch/50-overlays/magic-window/jade_rabbit_back_silhouette.webp` | 魔法窗 / 角色背影 | — | 待检 | 待生成 |
| 47 | `post-hatch/50-overlays/magic-window/boon_koi_back_silhouette.webp` | 魔法窗 / 角色背影 | — | 待检 | 待生成 |

## 本轮完整生成提示词

### `egg_on_nest.webp`

本文件未重新生成角色造型。以 `egg_base_chroma_reference.png` 为唯一造型来源，执行背景提取：自动采样绿色边界、柔化蒙版、去除绿色溢色、转换为 1254×1254 RGBA WebP。视觉检查确认奶白织物纹理、闭眼五官和原始比例未改变，四角 Alpha=0，正式文件不含窝垫或房间。

### 雾、雨、雪窗户天气

本组透明 overlay 图片已删除，不再生成。运行时由首页 `windowWeatherCanvas` 绘制均匀雾幕、动态雨线和雪粒。

### `nest_pad.webp`

```text
Use case: stylized-concept
Asset type: isolated reusable foreground object for the EggBaby WeChat mini-program
Primary request: generate one soft circular egg nest pad only, matching the established EggBaby pre-hatch room visual style. The pad is low and gently rounded, made from cream-white bouclé looped fabric with a subtly quilted floral/organic embossed texture, designed for the existing cream fabric egg to stand centered on it.
Scene/backdrop: a perfectly flat uniform chroma-key magenta #FF00FF field covering every background pixel.
Style/medium: premium tactile cinematic 3D CG, warm healing collectible-toy world, physically plausible soft fabric fibers, clean product-quality render.
Composition/framing: square 1:1 canvas, object centered, slight front three-quarter top-down view matching a desktop camera; pad occupies about 72% of canvas width and 38% of canvas height; generous safety margin on all sides; exact horizontal center and stable bottom anchor.
Lighting/mood: soft natural warm daylight from upper right, gentle contact shading within the object only, neutral cream whites without yellow or orange color drift.
Constraints: nest pad only; no egg, no room, no desk, no window, no characters, no props, no text, no UI, no logo, no watermark, no floor, no separate cast shadow outside the object. The magenta background must be perfectly uniform with no gradient, texture, shadow, glow or vignette. Magenta may appear nowhere in the object. Output only one image.
```

### `table_lamp.webp`

```text
Use case: stylized-concept
Asset type: isolated reusable interactive prop for the EggBaby WeChat mini-program
Primary request: generate one compact tabletop lamp only, matching the established warm EggBaby pre-hatch room. Design: softly rounded light-oak wooden base, short cream ceramic stem, small tapered warm ivory linen shade; charming but realistic miniature scale, no face and no character styling.
Scene/backdrop: a perfectly flat uniform chroma-key magenta #FF00FF field covering every background pixel.
Style/medium: premium tactile cinematic 3D CG, clean product render, warm healing miniature interior aesthetic, physically plausible wood grain, ceramic and woven linen.
Composition/framing: square 1:1 canvas, lamp centered and fully visible, front three-quarter view slightly from above, occupies about 55% canvas height, generous transparent safety margin, stable bottom anchor.
Lighting/mood: soft natural warm daylight from upper right; lamp is switched off; neutral cream and light honey wood consistent with the existing room, no orange or red color drift.
Constraints: lamp only; no desk, no room, no cable, no switch text, no characters, no other objects, no floor, no text, no UI, no logo, no watermark, no separate cast shadow outside the object. Magenta background perfectly uniform with no gradient, texture, shadow, glow or vignette; magenta nowhere in object. Output only one image.
```

### `coffee_machine.webp`

```text
Use case: stylized-concept
Asset type: isolated reusable interactive prop for the EggBaby WeChat mini-program
Primary request: generate one compact countertop coffee machine only, matching the established warm EggBaby pre-hatch room. Design: softly rounded cream ceramic body with subtle speckles, light-oak trim and base, small dark coffee outlet, one simple unmarked round control, and a tiny removable cream cup resting beneath the spout. Friendly domestic miniature proportions, no face.
Scene/backdrop: a perfectly flat uniform chroma-key magenta #FF00FF field covering every background pixel.
Style/medium: premium tactile cinematic 3D CG, clean product render, warm healing miniature interior aesthetic, physically plausible ceramic, wood and matte metal.
Composition/framing: square 1:1 canvas, machine centered and fully visible, front three-quarter view slightly from above, occupies about 58% canvas height, generous safety margin, stable bottom anchor.
Lighting/mood: soft natural warm daylight from upper right; neutral cream and light honey wood consistent with the existing room; no orange/red drift.
Constraints: one coffee machine and its tiny cup only; no desk, no room, no cable, no steam, no coffee beans, no readable markings, no characters, no other props, no floor, no text, no UI, no logo, no watermark, no separate cast shadow outside the object. Magenta background perfectly uniform with no gradient, texture, shadow, glow or vignette; magenta nowhere in object. Output only one image.
```

### `drawing_paper_set.webp`

```text
Use case: stylized-concept
Asset type: isolated reusable interactive prop set for the EggBaby WeChat mini-program
Primary request: generate one cohesive drawing-paper set only: a single warm off-white sheet with gently curled lower corners, one cream lacquered wooden pencil with a small matte silver tip placed diagonally to the right, and one tiny light-wood handheld pencil sharpener placed to the left. On the paper, include only extremely faint childlike line doodles of a star, a moon and simple leaves; absolutely no letters, numbers or readable text.
Scene/backdrop: a perfectly flat uniform chroma-key magenta #FF00FF field covering every background pixel.
Style/medium: premium tactile cinematic 3D CG, clean product render, warm healing miniature interior aesthetic, fine paper fibers and natural light wood matching the established EggBaby desk scene.
Composition/framing: square 1:1 canvas, complete set centered in a shallow top-down three-quarter desktop perspective; paper occupies about 58% width, pencil and sharpener fully inside frame; generous safety margin; coherent shared bottom anchor.
Lighting/mood: soft natural warm daylight from upper right; neutral cream and light honey wood; no orange/red drift.
Constraints: exactly one paper, one pencil and one sharpener only; no desk, no room, no characters, no cup, no extra stationery, no text, no UI, no logo, no watermark, no floor, no separate cast shadow outside the objects. Magenta background perfectly uniform with no gradient, texture, shadow, glow or vignette; magenta nowhere in objects. Output only one image.
```

### `scarf.webp`

```text
Use case: stylized-concept
Asset type: isolated reusable interactive prop for the EggBaby WeChat mini-program
Primary request: generate one small cozy scarf only, matching the established warm EggBaby pre-hatch room. Design: softly folded pale mist-blue knitted scarf with subtle fine rib texture, rounded ends and short tidy fringe; compact childlike scale; no pattern, badge, character face or decoration.
Scene/backdrop: a perfectly flat uniform chroma-key magenta #FF00FF field covering every background pixel.
Style/medium: premium tactile cinematic 3D CG, clean product render, warm healing miniature interior aesthetic, physically plausible soft yarn fibers.
Composition/framing: square 1:1 canvas, scarf arranged in a gentle loose S fold and fully visible, shallow top-down three-quarter view matching a desktop camera, occupies about 65% width, generous safety margin, stable center and bottom anchor.
Lighting/mood: soft natural warm daylight from upper right; pale desaturated blue with neutral cream highlights; no cyan, purple, orange or red drift.
Constraints: scarf only; no desk, no room, no hooks, no characters, no other props, no floor, no text, no UI, no logo, no watermark, no separate cast shadow outside the object. Magenta background perfectly uniform with no gradient, texture, shadow, glow or vignette; magenta nowhere in object. Output only one image.
```

## 质检记录

- 天气叠加层：均为 941×1672 RGBA WebP，文件小于 150000 字节；分别叠加到既有窗景检查，无洋红残边。
- 蛋窝与四件互动小物：均为 1254×1254 RGBA WebP，四角 Alpha=0；视觉检查未发现文字、UI、Logo 或额外场景。
- `coffee_machine.webp` 使用边界连通蒙版修正过度半透明问题；主体保持不透明，透明储水槽的视觉材质由 RGB 高光保留。
- 后续每生成一项，即补写完整提示词、尺寸、字节、Alpha 与正式/候选状态。
