# 孵化场景素材

v2.23 前端素材已按格式归档并接入首页：

- `webp/`：8 张四季昼夜场景图与 `egg_base_day.webp`
- `svg/`：8 个自由陪伴入口图标
- `interaction_motion_direction.md`：互动与动效约束
- `incubation_asset_summary.md`：素材和前端接入状态

首页默认按服务端下发的季节与昼夜枚举读取 `webp/incubation_{season}_{period}.webp`。上海实时天气仍由 CTO 后端提供 `sunny / cloudy / rain / snow` 枚举，前端不请求定位。

开发期保留本地底图作为安全回退；上线前迁至备案 CDN，通过既有 `backgroundImage` 字段下发 HTTPS 地址。云、雨、雪与互动光效均由前端表现层生成。
