# 四季天气完整房间地图

本目录存放破壳前首页的完整房间背景。每张图固定为 `941×1672`，包含房间、窗景与匹配的整体光照，但不包含蛋、窝垫、角色阴影、互动道具、天气粒子或 UI。

## 20 张正式地图

### 春季（5）

- `spring_clear_day.png`
- `spring_clear_sunset.png`
- `spring_clear_night.png`
- `spring_cloudy_day.png`
- `spring_rain_day.png`

### 夏季（5）

- `summer_clear_day.png`
- `summer_clear_sunset.png`
- `summer_clear_night.png`
- `summer_cloudy_day.png`
- `summer_storm_night.png`

### 秋季（4）

- `autumn_clear_day.png`
- `autumn_clear_sunset.png`
- `autumn_clear_night.png`
- `autumn_rain_day.png`

### 冬季（6）

- `winter_clear_day.png`
- `winter_clear_night.png`
- `winter_cloudy_day.png`
- `winter_snow_day.png`
- `winter_snow_night.png`
- `winter_post_snow_day.png`

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

旧的 `room_base_candidate_v2.png + window-weather/` 分层仍保留为加载失败回退，不再作为首选渲染路径。
