# 四季天气完整房间地图

本目录存放破壳前首页的完整房间背景。每张图固定为 `941×1672`，包含房间、窗景与匹配的整体光照，但不包含蛋、窝垫、角色阴影、互动道具、天气粒子或 UI。

## 20 张正式地图

### 春季（5）

- `spring_clear_day.webp`
- `spring_clear_sunset.webp`
- `spring_clear_night.webp`
- `spring_cloudy_day.webp`
- `spring_rain_day.webp`

### 夏季（5）

- `summer_clear_day.webp`
- `summer_clear_sunset.webp`
- `summer_clear_night.webp`
- `summer_cloudy_day.webp`
- `summer_storm_night.webp`

### 秋季（4）

- `autumn_clear_day.webp`
- `autumn_clear_sunset.webp`
- `autumn_clear_night.webp`
- `autumn_rain_day.webp`

### 冬季（6）

- `winter_clear_day.webp`
- `winter_clear_night.webp`
- `winter_cloudy_day.webp`
- `winter_snow_day.webp`
- `winter_snow_night.webp`
- `winter_post_snow_day.webp`

## 动态层规则

- `sunny`：轻微窗边光斑与云影；不改变整图明暗。
- `cloudy`：Canvas 缓慢漂移的浅色云气，不添加整屏暗层。
- `rain`：Canvas 雨线与窗上水珠。
- `snow`：Canvas 飘雪；图片只保留户外积雪。
- `fog`：Canvas 均匀流雾。
- `storm`：Canvas 雨线、水珠与低频闪电。
- `wind`：Canvas 秋叶飘落。
- `afterRain`：Canvas 少量下滑水珠与清透光斑。
- `postSnow`：雪后初晴整图 + Canvas 低强度反光光斑。

旧的 `room_base_candidate_v2.webp + window-weather/` 分层仍保留为加载失败回退，不再作为首选渲染路径。
