# 破壳前 · 房间光影图片层

本目录用于替代旧的 CSS 黑色渐变、局部径向遮罩和 `brightness()` 降亮效果。

## 待补正式素材

- `room_night_lamp_on_overlay.webp`
- `room_night_lamp_off_overlay.webp`

## 素材规格

- 画布：`941 × 1672 px`，与 `room_base_candidate_v2.webp` 完全对齐。
- 格式：透明背景 WebP，仅保留房间内的光影与色温。
- 不得包含：窗外天气、蛋体、窝垫、时钟、用户涂画或底部交互按钮。
- 开灯图：以室内台灯为主光，光线应连续柔和，不使用边界明显的黑色圆形。
- 关灯图：保留窗外夜景的环境反光，不得使用纯黑大面积压暗。

## 启用方式

两张图全部放入后，在 `miniprogram/config/pre-hatch-assets.js` 将 `roomLighting.enabled` 改为 `true`。路径已集中管理，无需再改页面结构。
