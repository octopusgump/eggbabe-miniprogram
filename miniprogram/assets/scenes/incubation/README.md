# 孵化场景底图

此目录接收 v2.23 的 8 张竖版孵化场景底图：

- `incubation_spring_day.webp`
- `incubation_spring_night.webp`
- `incubation_summer_day.webp`
- `incubation_summer_night.webp`
- `incubation_autumn_day.webp`
- `incubation_autumn_night.webp`
- `incubation_winter_day.webp`
- `incubation_winter_night.webp`

建议尺寸 `1500×3250`、单张不超过 300KB。素材未交付时，首页使用已实现的 CSS 季节房间作为安全回退；上线前将大图迁至备案 CDN，由 CTO 侧在孵化环境展示数据的 `backgroundImage` 字段中下发 HTTPS 地址。

天气与昼夜不需要额外合成底图：云、雨、雪由前端粒子层表现，昼夜由光线层表现。
