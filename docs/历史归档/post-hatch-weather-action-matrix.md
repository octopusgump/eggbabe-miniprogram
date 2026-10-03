# 破壳后居家天气动作图完整清单（历史候选，已停止执行）

> **状态：历史候选／停止执行。** 本文完整保留早期 648 张季节／天气动作矩阵，供设计决策追溯；它不是当前 PRD、出图排期、运行时配置或验收依据，不得继续按本文生成图片或恢复 `weather-matrix/` 运行时路径。
>
> 当前正式实现只按 `day`、`sunset`、`night` 三个时段选择资源：玉兔 24 张 + 锦鲤 24 张 = 48 张居家动作全景；角色外出时共用 3 张空房全景。破壳后的动作映射不再组合季节或天气。破壳前仍独立保留 36 个季节／天气／时段环境映射，两套资产不得混算。

## 范围

- **历史提案量为 648 张**：2 个角色（玉兔、锦鲤）× 8 个居家状态 × 36 个季节／天气／时段环境。
- 本文件只作为历史生成与验收提案存档，**不是当前运行时配置或待执行清单**；列出的矩阵未成为本版正式实现。
- 历史提案目标目录：`miniprogram/assets/scenes/lifecycle/post-hatch/60-action-scenes/<character>/home-bedroom/weather-matrix/`；当前版本不得创建或接入该目录。

## 视觉母版锁定

以本轮用户确认的卧室参考图为唯一母版，所有 648 张必须保留以下固定室内构图与物件：

1. 左侧低矮木床、白色枕头、浅蓝色兔子图案被子。
2. 床上方圆角木质书架／床头结构，**顶部暖色台灯必须始终存在**；同时保留竖放书籍。
3. 窗边植物、玻璃罐、木质收纳盒、右侧咖啡杯、小圆桌与书本。
4. 只能改变窗外季节、天气、昼夜光线，以及角色和对应动作；不得删改床、被子、家具或台灯，不得裁切或改变 2823×1672 横向全景构图。

## 文件命名

home_bedroom_<action-key>_<environment-key>_v01.webp

角色目录分别为 jade-rabbit 与 boon-koi。每一行精确列出两张应生成图，合计 648 张。

## 春季 · 晴朗 · 日间（spring_clear_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_spring_clear_day_v01.webp | boon-koi/home_bedroom_nap_spring_clear_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_spring_clear_day_v01.webp | boon-koi/home_bedroom_lazy_spring_clear_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_spring_clear_day_v01.webp | boon-koi/home_bedroom_stare_spring_clear_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_spring_clear_day_v01.webp | boon-koi/home_bedroom_draw_spring_clear_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_spring_clear_day_v01.webp | boon-koi/home_bedroom_read_spring_clear_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_spring_clear_day_v01.webp | boon-koi/home_bedroom_game_spring_clear_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_spring_clear_day_v01.webp | boon-koi/home_bedroom_music_spring_clear_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_spring_clear_day_v01.webp | boon-koi/home_bedroom_window_spring_clear_day_v01.webp |

## 春季 · 晴朗 · 落日（spring_clear_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_spring_clear_sunset_v01.webp | boon-koi/home_bedroom_nap_spring_clear_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_spring_clear_sunset_v01.webp | boon-koi/home_bedroom_lazy_spring_clear_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_spring_clear_sunset_v01.webp | boon-koi/home_bedroom_stare_spring_clear_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_spring_clear_sunset_v01.webp | boon-koi/home_bedroom_draw_spring_clear_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_spring_clear_sunset_v01.webp | boon-koi/home_bedroom_read_spring_clear_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_spring_clear_sunset_v01.webp | boon-koi/home_bedroom_game_spring_clear_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_spring_clear_sunset_v01.webp | boon-koi/home_bedroom_music_spring_clear_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_spring_clear_sunset_v01.webp | boon-koi/home_bedroom_window_spring_clear_sunset_v01.webp |

## 春季 · 晴朗 · 夜晚（spring_clear_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_spring_clear_night_v01.webp | boon-koi/home_bedroom_nap_spring_clear_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_spring_clear_night_v01.webp | boon-koi/home_bedroom_lazy_spring_clear_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_spring_clear_night_v01.webp | boon-koi/home_bedroom_stare_spring_clear_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_spring_clear_night_v01.webp | boon-koi/home_bedroom_draw_spring_clear_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_spring_clear_night_v01.webp | boon-koi/home_bedroom_read_spring_clear_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_spring_clear_night_v01.webp | boon-koi/home_bedroom_game_spring_clear_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_spring_clear_night_v01.webp | boon-koi/home_bedroom_music_spring_clear_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_spring_clear_night_v01.webp | boon-koi/home_bedroom_window_spring_clear_night_v01.webp |

## 春季 · 多云 · 日间（spring_cloudy_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_spring_cloudy_day_v01.webp | boon-koi/home_bedroom_nap_spring_cloudy_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_spring_cloudy_day_v01.webp | boon-koi/home_bedroom_lazy_spring_cloudy_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_spring_cloudy_day_v01.webp | boon-koi/home_bedroom_stare_spring_cloudy_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_spring_cloudy_day_v01.webp | boon-koi/home_bedroom_draw_spring_cloudy_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_spring_cloudy_day_v01.webp | boon-koi/home_bedroom_read_spring_cloudy_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_spring_cloudy_day_v01.webp | boon-koi/home_bedroom_game_spring_cloudy_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_spring_cloudy_day_v01.webp | boon-koi/home_bedroom_music_spring_cloudy_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_spring_cloudy_day_v01.webp | boon-koi/home_bedroom_window_spring_cloudy_day_v01.webp |

## 春季 · 多云 · 落日（spring_cloudy_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_spring_cloudy_sunset_v01.webp | boon-koi/home_bedroom_nap_spring_cloudy_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_spring_cloudy_sunset_v01.webp | boon-koi/home_bedroom_lazy_spring_cloudy_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_spring_cloudy_sunset_v01.webp | boon-koi/home_bedroom_stare_spring_cloudy_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_spring_cloudy_sunset_v01.webp | boon-koi/home_bedroom_draw_spring_cloudy_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_spring_cloudy_sunset_v01.webp | boon-koi/home_bedroom_read_spring_cloudy_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_spring_cloudy_sunset_v01.webp | boon-koi/home_bedroom_game_spring_cloudy_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_spring_cloudy_sunset_v01.webp | boon-koi/home_bedroom_music_spring_cloudy_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_spring_cloudy_sunset_v01.webp | boon-koi/home_bedroom_window_spring_cloudy_sunset_v01.webp |

## 春季 · 多云 · 夜晚（spring_cloudy_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_spring_cloudy_night_v01.webp | boon-koi/home_bedroom_nap_spring_cloudy_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_spring_cloudy_night_v01.webp | boon-koi/home_bedroom_lazy_spring_cloudy_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_spring_cloudy_night_v01.webp | boon-koi/home_bedroom_stare_spring_cloudy_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_spring_cloudy_night_v01.webp | boon-koi/home_bedroom_draw_spring_cloudy_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_spring_cloudy_night_v01.webp | boon-koi/home_bedroom_read_spring_cloudy_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_spring_cloudy_night_v01.webp | boon-koi/home_bedroom_game_spring_cloudy_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_spring_cloudy_night_v01.webp | boon-koi/home_bedroom_music_spring_cloudy_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_spring_cloudy_night_v01.webp | boon-koi/home_bedroom_window_spring_cloudy_night_v01.webp |

## 春季 · 下雨 · 日间（spring_rain_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_spring_rain_day_v01.webp | boon-koi/home_bedroom_nap_spring_rain_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_spring_rain_day_v01.webp | boon-koi/home_bedroom_lazy_spring_rain_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_spring_rain_day_v01.webp | boon-koi/home_bedroom_stare_spring_rain_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_spring_rain_day_v01.webp | boon-koi/home_bedroom_draw_spring_rain_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_spring_rain_day_v01.webp | boon-koi/home_bedroom_read_spring_rain_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_spring_rain_day_v01.webp | boon-koi/home_bedroom_game_spring_rain_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_spring_rain_day_v01.webp | boon-koi/home_bedroom_music_spring_rain_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_spring_rain_day_v01.webp | boon-koi/home_bedroom_window_spring_rain_day_v01.webp |

## 春季 · 下雨 · 落日（spring_rain_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_spring_rain_sunset_v01.webp | boon-koi/home_bedroom_nap_spring_rain_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_spring_rain_sunset_v01.webp | boon-koi/home_bedroom_lazy_spring_rain_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_spring_rain_sunset_v01.webp | boon-koi/home_bedroom_stare_spring_rain_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_spring_rain_sunset_v01.webp | boon-koi/home_bedroom_draw_spring_rain_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_spring_rain_sunset_v01.webp | boon-koi/home_bedroom_read_spring_rain_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_spring_rain_sunset_v01.webp | boon-koi/home_bedroom_game_spring_rain_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_spring_rain_sunset_v01.webp | boon-koi/home_bedroom_music_spring_rain_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_spring_rain_sunset_v01.webp | boon-koi/home_bedroom_window_spring_rain_sunset_v01.webp |

## 春季 · 下雨 · 夜晚（spring_rain_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_spring_rain_night_v01.webp | boon-koi/home_bedroom_nap_spring_rain_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_spring_rain_night_v01.webp | boon-koi/home_bedroom_lazy_spring_rain_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_spring_rain_night_v01.webp | boon-koi/home_bedroom_stare_spring_rain_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_spring_rain_night_v01.webp | boon-koi/home_bedroom_draw_spring_rain_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_spring_rain_night_v01.webp | boon-koi/home_bedroom_read_spring_rain_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_spring_rain_night_v01.webp | boon-koi/home_bedroom_game_spring_rain_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_spring_rain_night_v01.webp | boon-koi/home_bedroom_music_spring_rain_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_spring_rain_night_v01.webp | boon-koi/home_bedroom_window_spring_rain_night_v01.webp |

## 夏季 · 晴朗 · 日间（summer_clear_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_summer_clear_day_v01.webp | boon-koi/home_bedroom_nap_summer_clear_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_summer_clear_day_v01.webp | boon-koi/home_bedroom_lazy_summer_clear_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_summer_clear_day_v01.webp | boon-koi/home_bedroom_stare_summer_clear_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_summer_clear_day_v01.webp | boon-koi/home_bedroom_draw_summer_clear_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_summer_clear_day_v01.webp | boon-koi/home_bedroom_read_summer_clear_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_summer_clear_day_v01.webp | boon-koi/home_bedroom_game_summer_clear_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_summer_clear_day_v01.webp | boon-koi/home_bedroom_music_summer_clear_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_summer_clear_day_v01.webp | boon-koi/home_bedroom_window_summer_clear_day_v01.webp |

## 夏季 · 晴朗 · 落日（summer_clear_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_summer_clear_sunset_v01.webp | boon-koi/home_bedroom_nap_summer_clear_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_summer_clear_sunset_v01.webp | boon-koi/home_bedroom_lazy_summer_clear_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_summer_clear_sunset_v01.webp | boon-koi/home_bedroom_stare_summer_clear_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_summer_clear_sunset_v01.webp | boon-koi/home_bedroom_draw_summer_clear_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_summer_clear_sunset_v01.webp | boon-koi/home_bedroom_read_summer_clear_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_summer_clear_sunset_v01.webp | boon-koi/home_bedroom_game_summer_clear_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_summer_clear_sunset_v01.webp | boon-koi/home_bedroom_music_summer_clear_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_summer_clear_sunset_v01.webp | boon-koi/home_bedroom_window_summer_clear_sunset_v01.webp |

## 夏季 · 晴朗 · 夜晚（summer_clear_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_summer_clear_night_v01.webp | boon-koi/home_bedroom_nap_summer_clear_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_summer_clear_night_v01.webp | boon-koi/home_bedroom_lazy_summer_clear_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_summer_clear_night_v01.webp | boon-koi/home_bedroom_stare_summer_clear_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_summer_clear_night_v01.webp | boon-koi/home_bedroom_draw_summer_clear_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_summer_clear_night_v01.webp | boon-koi/home_bedroom_read_summer_clear_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_summer_clear_night_v01.webp | boon-koi/home_bedroom_game_summer_clear_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_summer_clear_night_v01.webp | boon-koi/home_bedroom_music_summer_clear_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_summer_clear_night_v01.webp | boon-koi/home_bedroom_window_summer_clear_night_v01.webp |

## 夏季 · 多云 · 日间（summer_cloudy_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_summer_cloudy_day_v01.webp | boon-koi/home_bedroom_nap_summer_cloudy_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_summer_cloudy_day_v01.webp | boon-koi/home_bedroom_lazy_summer_cloudy_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_summer_cloudy_day_v01.webp | boon-koi/home_bedroom_stare_summer_cloudy_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_summer_cloudy_day_v01.webp | boon-koi/home_bedroom_draw_summer_cloudy_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_summer_cloudy_day_v01.webp | boon-koi/home_bedroom_read_summer_cloudy_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_summer_cloudy_day_v01.webp | boon-koi/home_bedroom_game_summer_cloudy_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_summer_cloudy_day_v01.webp | boon-koi/home_bedroom_music_summer_cloudy_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_summer_cloudy_day_v01.webp | boon-koi/home_bedroom_window_summer_cloudy_day_v01.webp |

## 夏季 · 多云 · 落日（summer_cloudy_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_summer_cloudy_sunset_v01.webp | boon-koi/home_bedroom_nap_summer_cloudy_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_summer_cloudy_sunset_v01.webp | boon-koi/home_bedroom_lazy_summer_cloudy_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_summer_cloudy_sunset_v01.webp | boon-koi/home_bedroom_stare_summer_cloudy_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_summer_cloudy_sunset_v01.webp | boon-koi/home_bedroom_draw_summer_cloudy_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_summer_cloudy_sunset_v01.webp | boon-koi/home_bedroom_read_summer_cloudy_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_summer_cloudy_sunset_v01.webp | boon-koi/home_bedroom_game_summer_cloudy_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_summer_cloudy_sunset_v01.webp | boon-koi/home_bedroom_music_summer_cloudy_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_summer_cloudy_sunset_v01.webp | boon-koi/home_bedroom_window_summer_cloudy_sunset_v01.webp |

## 夏季 · 多云 · 夜晚（summer_cloudy_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_summer_cloudy_night_v01.webp | boon-koi/home_bedroom_nap_summer_cloudy_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_summer_cloudy_night_v01.webp | boon-koi/home_bedroom_lazy_summer_cloudy_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_summer_cloudy_night_v01.webp | boon-koi/home_bedroom_stare_summer_cloudy_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_summer_cloudy_night_v01.webp | boon-koi/home_bedroom_draw_summer_cloudy_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_summer_cloudy_night_v01.webp | boon-koi/home_bedroom_read_summer_cloudy_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_summer_cloudy_night_v01.webp | boon-koi/home_bedroom_game_summer_cloudy_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_summer_cloudy_night_v01.webp | boon-koi/home_bedroom_music_summer_cloudy_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_summer_cloudy_night_v01.webp | boon-koi/home_bedroom_window_summer_cloudy_night_v01.webp |

## 夏季 · 雷雨 · 日间（summer_storm_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_summer_storm_day_v01.webp | boon-koi/home_bedroom_nap_summer_storm_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_summer_storm_day_v01.webp | boon-koi/home_bedroom_lazy_summer_storm_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_summer_storm_day_v01.webp | boon-koi/home_bedroom_stare_summer_storm_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_summer_storm_day_v01.webp | boon-koi/home_bedroom_draw_summer_storm_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_summer_storm_day_v01.webp | boon-koi/home_bedroom_read_summer_storm_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_summer_storm_day_v01.webp | boon-koi/home_bedroom_game_summer_storm_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_summer_storm_day_v01.webp | boon-koi/home_bedroom_music_summer_storm_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_summer_storm_day_v01.webp | boon-koi/home_bedroom_window_summer_storm_day_v01.webp |

## 夏季 · 雷雨 · 落日（summer_storm_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_summer_storm_sunset_v01.webp | boon-koi/home_bedroom_nap_summer_storm_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_summer_storm_sunset_v01.webp | boon-koi/home_bedroom_lazy_summer_storm_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_summer_storm_sunset_v01.webp | boon-koi/home_bedroom_stare_summer_storm_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_summer_storm_sunset_v01.webp | boon-koi/home_bedroom_draw_summer_storm_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_summer_storm_sunset_v01.webp | boon-koi/home_bedroom_read_summer_storm_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_summer_storm_sunset_v01.webp | boon-koi/home_bedroom_game_summer_storm_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_summer_storm_sunset_v01.webp | boon-koi/home_bedroom_music_summer_storm_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_summer_storm_sunset_v01.webp | boon-koi/home_bedroom_window_summer_storm_sunset_v01.webp |

## 夏季 · 雷雨 · 夜晚（summer_storm_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_summer_storm_night_v01.webp | boon-koi/home_bedroom_nap_summer_storm_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_summer_storm_night_v01.webp | boon-koi/home_bedroom_lazy_summer_storm_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_summer_storm_night_v01.webp | boon-koi/home_bedroom_stare_summer_storm_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_summer_storm_night_v01.webp | boon-koi/home_bedroom_draw_summer_storm_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_summer_storm_night_v01.webp | boon-koi/home_bedroom_read_summer_storm_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_summer_storm_night_v01.webp | boon-koi/home_bedroom_game_summer_storm_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_summer_storm_night_v01.webp | boon-koi/home_bedroom_music_summer_storm_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_summer_storm_night_v01.webp | boon-koi/home_bedroom_window_summer_storm_night_v01.webp |

## 秋季 · 晴朗 · 日间（autumn_clear_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_autumn_clear_day_v01.webp | boon-koi/home_bedroom_nap_autumn_clear_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_autumn_clear_day_v01.webp | boon-koi/home_bedroom_lazy_autumn_clear_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_autumn_clear_day_v01.webp | boon-koi/home_bedroom_stare_autumn_clear_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_autumn_clear_day_v01.webp | boon-koi/home_bedroom_draw_autumn_clear_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_autumn_clear_day_v01.webp | boon-koi/home_bedroom_read_autumn_clear_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_autumn_clear_day_v01.webp | boon-koi/home_bedroom_game_autumn_clear_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_autumn_clear_day_v01.webp | boon-koi/home_bedroom_music_autumn_clear_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_autumn_clear_day_v01.webp | boon-koi/home_bedroom_window_autumn_clear_day_v01.webp |

## 秋季 · 晴朗 · 落日（autumn_clear_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_autumn_clear_sunset_v01.webp | boon-koi/home_bedroom_nap_autumn_clear_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_autumn_clear_sunset_v01.webp | boon-koi/home_bedroom_lazy_autumn_clear_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_autumn_clear_sunset_v01.webp | boon-koi/home_bedroom_stare_autumn_clear_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_autumn_clear_sunset_v01.webp | boon-koi/home_bedroom_draw_autumn_clear_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_autumn_clear_sunset_v01.webp | boon-koi/home_bedroom_read_autumn_clear_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_autumn_clear_sunset_v01.webp | boon-koi/home_bedroom_game_autumn_clear_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_autumn_clear_sunset_v01.webp | boon-koi/home_bedroom_music_autumn_clear_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_autumn_clear_sunset_v01.webp | boon-koi/home_bedroom_window_autumn_clear_sunset_v01.webp |

## 秋季 · 晴朗 · 夜晚（autumn_clear_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_autumn_clear_night_v01.webp | boon-koi/home_bedroom_nap_autumn_clear_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_autumn_clear_night_v01.webp | boon-koi/home_bedroom_lazy_autumn_clear_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_autumn_clear_night_v01.webp | boon-koi/home_bedroom_stare_autumn_clear_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_autumn_clear_night_v01.webp | boon-koi/home_bedroom_draw_autumn_clear_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_autumn_clear_night_v01.webp | boon-koi/home_bedroom_read_autumn_clear_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_autumn_clear_night_v01.webp | boon-koi/home_bedroom_game_autumn_clear_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_autumn_clear_night_v01.webp | boon-koi/home_bedroom_music_autumn_clear_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_autumn_clear_night_v01.webp | boon-koi/home_bedroom_window_autumn_clear_night_v01.webp |

## 秋季 · 下雨 · 日间（autumn_rain_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_autumn_rain_day_v01.webp | boon-koi/home_bedroom_nap_autumn_rain_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_autumn_rain_day_v01.webp | boon-koi/home_bedroom_lazy_autumn_rain_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_autumn_rain_day_v01.webp | boon-koi/home_bedroom_stare_autumn_rain_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_autumn_rain_day_v01.webp | boon-koi/home_bedroom_draw_autumn_rain_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_autumn_rain_day_v01.webp | boon-koi/home_bedroom_read_autumn_rain_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_autumn_rain_day_v01.webp | boon-koi/home_bedroom_game_autumn_rain_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_autumn_rain_day_v01.webp | boon-koi/home_bedroom_music_autumn_rain_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_autumn_rain_day_v01.webp | boon-koi/home_bedroom_window_autumn_rain_day_v01.webp |

## 秋季 · 下雨 · 落日（autumn_rain_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_autumn_rain_sunset_v01.webp | boon-koi/home_bedroom_nap_autumn_rain_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_autumn_rain_sunset_v01.webp | boon-koi/home_bedroom_lazy_autumn_rain_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_autumn_rain_sunset_v01.webp | boon-koi/home_bedroom_stare_autumn_rain_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_autumn_rain_sunset_v01.webp | boon-koi/home_bedroom_draw_autumn_rain_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_autumn_rain_sunset_v01.webp | boon-koi/home_bedroom_read_autumn_rain_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_autumn_rain_sunset_v01.webp | boon-koi/home_bedroom_game_autumn_rain_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_autumn_rain_sunset_v01.webp | boon-koi/home_bedroom_music_autumn_rain_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_autumn_rain_sunset_v01.webp | boon-koi/home_bedroom_window_autumn_rain_sunset_v01.webp |

## 秋季 · 下雨 · 夜晚（autumn_rain_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_autumn_rain_night_v01.webp | boon-koi/home_bedroom_nap_autumn_rain_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_autumn_rain_night_v01.webp | boon-koi/home_bedroom_lazy_autumn_rain_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_autumn_rain_night_v01.webp | boon-koi/home_bedroom_stare_autumn_rain_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_autumn_rain_night_v01.webp | boon-koi/home_bedroom_draw_autumn_rain_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_autumn_rain_night_v01.webp | boon-koi/home_bedroom_read_autumn_rain_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_autumn_rain_night_v01.webp | boon-koi/home_bedroom_game_autumn_rain_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_autumn_rain_night_v01.webp | boon-koi/home_bedroom_music_autumn_rain_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_autumn_rain_night_v01.webp | boon-koi/home_bedroom_window_autumn_rain_night_v01.webp |

## 冬季 · 晴朗 · 日间（winter_clear_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_clear_day_v01.webp | boon-koi/home_bedroom_nap_winter_clear_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_clear_day_v01.webp | boon-koi/home_bedroom_lazy_winter_clear_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_clear_day_v01.webp | boon-koi/home_bedroom_stare_winter_clear_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_clear_day_v01.webp | boon-koi/home_bedroom_draw_winter_clear_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_clear_day_v01.webp | boon-koi/home_bedroom_read_winter_clear_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_clear_day_v01.webp | boon-koi/home_bedroom_game_winter_clear_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_clear_day_v01.webp | boon-koi/home_bedroom_music_winter_clear_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_clear_day_v01.webp | boon-koi/home_bedroom_window_winter_clear_day_v01.webp |

## 冬季 · 晴朗 · 落日（winter_clear_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_clear_sunset_v01.webp | boon-koi/home_bedroom_nap_winter_clear_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_clear_sunset_v01.webp | boon-koi/home_bedroom_lazy_winter_clear_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_clear_sunset_v01.webp | boon-koi/home_bedroom_stare_winter_clear_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_clear_sunset_v01.webp | boon-koi/home_bedroom_draw_winter_clear_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_clear_sunset_v01.webp | boon-koi/home_bedroom_read_winter_clear_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_clear_sunset_v01.webp | boon-koi/home_bedroom_game_winter_clear_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_clear_sunset_v01.webp | boon-koi/home_bedroom_music_winter_clear_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_clear_sunset_v01.webp | boon-koi/home_bedroom_window_winter_clear_sunset_v01.webp |

## 冬季 · 晴朗 · 夜晚（winter_clear_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_clear_night_v01.webp | boon-koi/home_bedroom_nap_winter_clear_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_clear_night_v01.webp | boon-koi/home_bedroom_lazy_winter_clear_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_clear_night_v01.webp | boon-koi/home_bedroom_stare_winter_clear_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_clear_night_v01.webp | boon-koi/home_bedroom_draw_winter_clear_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_clear_night_v01.webp | boon-koi/home_bedroom_read_winter_clear_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_clear_night_v01.webp | boon-koi/home_bedroom_game_winter_clear_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_clear_night_v01.webp | boon-koi/home_bedroom_music_winter_clear_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_clear_night_v01.webp | boon-koi/home_bedroom_window_winter_clear_night_v01.webp |

## 冬季 · 多云 · 日间（winter_cloudy_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_cloudy_day_v01.webp | boon-koi/home_bedroom_nap_winter_cloudy_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_cloudy_day_v01.webp | boon-koi/home_bedroom_lazy_winter_cloudy_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_cloudy_day_v01.webp | boon-koi/home_bedroom_stare_winter_cloudy_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_cloudy_day_v01.webp | boon-koi/home_bedroom_draw_winter_cloudy_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_cloudy_day_v01.webp | boon-koi/home_bedroom_read_winter_cloudy_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_cloudy_day_v01.webp | boon-koi/home_bedroom_game_winter_cloudy_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_cloudy_day_v01.webp | boon-koi/home_bedroom_music_winter_cloudy_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_cloudy_day_v01.webp | boon-koi/home_bedroom_window_winter_cloudy_day_v01.webp |

## 冬季 · 多云 · 落日（winter_cloudy_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_cloudy_sunset_v01.webp | boon-koi/home_bedroom_nap_winter_cloudy_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_cloudy_sunset_v01.webp | boon-koi/home_bedroom_lazy_winter_cloudy_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_cloudy_sunset_v01.webp | boon-koi/home_bedroom_stare_winter_cloudy_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_cloudy_sunset_v01.webp | boon-koi/home_bedroom_draw_winter_cloudy_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_cloudy_sunset_v01.webp | boon-koi/home_bedroom_read_winter_cloudy_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_cloudy_sunset_v01.webp | boon-koi/home_bedroom_game_winter_cloudy_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_cloudy_sunset_v01.webp | boon-koi/home_bedroom_music_winter_cloudy_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_cloudy_sunset_v01.webp | boon-koi/home_bedroom_window_winter_cloudy_sunset_v01.webp |

## 冬季 · 多云 · 夜晚（winter_cloudy_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_cloudy_night_v01.webp | boon-koi/home_bedroom_nap_winter_cloudy_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_cloudy_night_v01.webp | boon-koi/home_bedroom_lazy_winter_cloudy_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_cloudy_night_v01.webp | boon-koi/home_bedroom_stare_winter_cloudy_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_cloudy_night_v01.webp | boon-koi/home_bedroom_draw_winter_cloudy_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_cloudy_night_v01.webp | boon-koi/home_bedroom_read_winter_cloudy_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_cloudy_night_v01.webp | boon-koi/home_bedroom_game_winter_cloudy_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_cloudy_night_v01.webp | boon-koi/home_bedroom_music_winter_cloudy_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_cloudy_night_v01.webp | boon-koi/home_bedroom_window_winter_cloudy_night_v01.webp |

## 冬季 · 降雪 · 日间（winter_snow_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_snow_day_v01.webp | boon-koi/home_bedroom_nap_winter_snow_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_snow_day_v01.webp | boon-koi/home_bedroom_lazy_winter_snow_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_snow_day_v01.webp | boon-koi/home_bedroom_stare_winter_snow_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_snow_day_v01.webp | boon-koi/home_bedroom_draw_winter_snow_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_snow_day_v01.webp | boon-koi/home_bedroom_read_winter_snow_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_snow_day_v01.webp | boon-koi/home_bedroom_game_winter_snow_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_snow_day_v01.webp | boon-koi/home_bedroom_music_winter_snow_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_snow_day_v01.webp | boon-koi/home_bedroom_window_winter_snow_day_v01.webp |

## 冬季 · 降雪 · 落日（winter_snow_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_snow_sunset_v01.webp | boon-koi/home_bedroom_nap_winter_snow_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_snow_sunset_v01.webp | boon-koi/home_bedroom_lazy_winter_snow_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_snow_sunset_v01.webp | boon-koi/home_bedroom_stare_winter_snow_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_snow_sunset_v01.webp | boon-koi/home_bedroom_draw_winter_snow_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_snow_sunset_v01.webp | boon-koi/home_bedroom_read_winter_snow_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_snow_sunset_v01.webp | boon-koi/home_bedroom_game_winter_snow_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_snow_sunset_v01.webp | boon-koi/home_bedroom_music_winter_snow_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_snow_sunset_v01.webp | boon-koi/home_bedroom_window_winter_snow_sunset_v01.webp |

## 冬季 · 降雪 · 夜晚（winter_snow_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_snow_night_v01.webp | boon-koi/home_bedroom_nap_winter_snow_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_snow_night_v01.webp | boon-koi/home_bedroom_lazy_winter_snow_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_snow_night_v01.webp | boon-koi/home_bedroom_stare_winter_snow_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_snow_night_v01.webp | boon-koi/home_bedroom_draw_winter_snow_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_snow_night_v01.webp | boon-koi/home_bedroom_read_winter_snow_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_snow_night_v01.webp | boon-koi/home_bedroom_game_winter_snow_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_snow_night_v01.webp | boon-koi/home_bedroom_music_winter_snow_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_snow_night_v01.webp | boon-koi/home_bedroom_window_winter_snow_night_v01.webp |

## 冬季 · 雪后 · 日间（winter_post_snow_day）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_post_snow_day_v01.webp | boon-koi/home_bedroom_nap_winter_post_snow_day_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_post_snow_day_v01.webp | boon-koi/home_bedroom_lazy_winter_post_snow_day_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_post_snow_day_v01.webp | boon-koi/home_bedroom_stare_winter_post_snow_day_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_post_snow_day_v01.webp | boon-koi/home_bedroom_draw_winter_post_snow_day_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_post_snow_day_v01.webp | boon-koi/home_bedroom_read_winter_post_snow_day_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_post_snow_day_v01.webp | boon-koi/home_bedroom_game_winter_post_snow_day_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_post_snow_day_v01.webp | boon-koi/home_bedroom_music_winter_post_snow_day_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_post_snow_day_v01.webp | boon-koi/home_bedroom_window_winter_post_snow_day_v01.webp |

## 冬季 · 雪后 · 落日（winter_post_snow_sunset）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_post_snow_sunset_v01.webp | boon-koi/home_bedroom_nap_winter_post_snow_sunset_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_post_snow_sunset_v01.webp | boon-koi/home_bedroom_lazy_winter_post_snow_sunset_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_post_snow_sunset_v01.webp | boon-koi/home_bedroom_stare_winter_post_snow_sunset_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_post_snow_sunset_v01.webp | boon-koi/home_bedroom_draw_winter_post_snow_sunset_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_post_snow_sunset_v01.webp | boon-koi/home_bedroom_read_winter_post_snow_sunset_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_post_snow_sunset_v01.webp | boon-koi/home_bedroom_game_winter_post_snow_sunset_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_post_snow_sunset_v01.webp | boon-koi/home_bedroom_music_winter_post_snow_sunset_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_post_snow_sunset_v01.webp | boon-koi/home_bedroom_window_winter_post_snow_sunset_v01.webp |

## 冬季 · 雪后 · 夜晚（winter_post_snow_night）

| 居家状态 | 玉兔 | 锦鲤 |
| --- | --- | --- |
| sleep · 睡觉 | jade-rabbit/home_bedroom_nap_winter_post_snow_night_v01.webp | boon-koi/home_bedroom_nap_winter_post_snow_night_v01.webp |
| lazy · 小憩 | jade-rabbit/home_bedroom_lazy_winter_post_snow_night_v01.webp | boon-koi/home_bedroom_lazy_winter_post_snow_night_v01.webp |
| stare · 发呆 | jade-rabbit/home_bedroom_stare_winter_post_snow_night_v01.webp | boon-koi/home_bedroom_stare_winter_post_snow_night_v01.webp |
| drawing · 涂涂画画 | jade-rabbit/home_bedroom_draw_winter_post_snow_night_v01.webp | boon-koi/home_bedroom_draw_winter_post_snow_night_v01.webp |
| reading · 看书 | jade-rabbit/home_bedroom_read_winter_post_snow_night_v01.webp | boon-koi/home_bedroom_read_winter_post_snow_night_v01.webp |
| gaming · 打游戏 | jade-rabbit/home_bedroom_game_winter_post_snow_night_v01.webp | boon-koi/home_bedroom_game_winter_post_snow_night_v01.webp |
| music · 听音乐 | jade-rabbit/home_bedroom_music_winter_post_snow_night_v01.webp | boon-koi/home_bedroom_music_winter_post_snow_night_v01.webp |
| window · 看窗外 | jade-rabbit/home_bedroom_window_winter_post_snow_night_v01.webp | boon-koi/home_bedroom_window_winter_post_snow_night_v01.webp |

## 锦鲤动作约束

- 睡觉、小憩：像鱼一样侧卧或贴地休息，不能以人形姿势躺床。
- 看书、游戏、画画：只能使用既定的分离淡青蓝灵魂手；不得出现实体手臂、肉色人手或靴子误作手。
- 看窗外、听音乐、发呆：优先使用自然鱼鳍。
