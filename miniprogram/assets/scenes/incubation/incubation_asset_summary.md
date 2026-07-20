# 蛋宝宝孵化素材交接总结

## 素材根目录

`miniprogram/assets/scenes/incubation/`

当前已按文件格式分目录：

- `svg/`：互动图标 SVG
- `webp/`：场景底图与蛋宝宝主体 WebP
- 根目录：说明文档

## 已交付 WebP

位于 `incubation/webp/`：

- `incubation_spring_day.webp`
- `incubation_spring_night.webp`
- `incubation_summer_day.webp`
- `incubation_summer_night.webp`
- `incubation_autumn_day.webp`
- `incubation_autumn_night.webp`
- `incubation_winter_day.webp`
- `incubation_winter_night.webp`
- `egg_base_day.webp`

8 张场景底图保持同一房间、固定镜头、圆窗、家具、U 形孵化窝和靠枕结构，只改变季节与昼夜光线。场景图实际尺寸约为 942–943 × 1667–1670。`egg_base_day.webp` 是目前唯一完成的 B 类蛋宝宝主体，具有真实 RGBA 透明通道；夜间蛋、裂纹阶段、纹样蛋壳和兜底图尚未完成。

## 已交付 SVG

位于 `incubation/svg/`：

- `interaction_touch.svg`：摸摸我
- `interaction_talk.svg`：跟我说一句话
- `interaction_quiet.svg`：安静陪我一会儿
- `interaction_window.svg`：一起看看窗外
- `interaction_wish.svg`：告诉我愿望
- `interaction_learn.svg`：今天教我一件事
- `interaction_draw.svg`：画一个小记号
- `interaction_secret.svg`：秘密暗号

8 个图标均为透明背景、统一深绿色圆润线条、少量暖黄色点缀，无文字、数字和外框。

## 动效说明

`interaction_motion_direction.md` 保留在 `incubation/` 根目录，包含：

- 待机呼吸、轻触、长按和安静陪伴
- 说话时的 5 种身体反应
- 春夏秋冬、雨雪阴天和擦窗表现层
- 轻量绘画、保护圈、小星星和选色反馈
- 四阶段破壳动效
- 可选的唯一破壳关键视频方向

## 当前接入状态

- 8 张四季昼夜场景图已经接入孵化首页，默认按服务端下发的季节、天气和昼夜枚举选择；未下发备案 CDN 地址时使用本地同名素材。
- `egg_base_day.webp` 已经替换原 CSS 蛋体，前端补充了与 U 形孵化窝同步变化的接触阴影。
- 8 个独立 SVG 已接入「一起待一会儿」自由陪伴入口，不展示每日任务编号、完成状态或奖励比例。
- 晴、阴、雨、雪表现层被限制在窗外区域；轻触、长按、说话、安静陪伴、看窗外和秘密暗号已有相应低幅度动效。
- 页面隐藏或卸载时会清理互动计时器并停止临时动效。

## 当前未做的事情

- 未制作破壳视频。
- 未继续 B 类素材批量生成；B 类只保留 `egg_base_day.webp`。
- 原来的合并版 `interaction_icons.svg` 已移除，当前只保留 8 个独立 SVG。

## 后续上线建议

1. 上线前将 8 张场景底图迁移至备案 CDN，由 CTO 侧通过既有 `backgroundImage` 字段下发 HTTPS 地址。
2. 上海天气枚举继续由服务端提供；前端仅渲染 `sunny / cloudy / rain / snow`，不申请定位权限。
3. 夜间蛋、裂纹阶段与破壳兜底图交付后，再按 `interaction_motion_direction.md` 补齐破壳四阶段。
