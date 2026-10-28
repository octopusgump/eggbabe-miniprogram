# 百宝箱开合动画（前端交付）

## 资源
| 帧 | 文件 | 开盖时刻 |
|---|---|---|
| 0 合盖 | chest-0-closed.png | 0ms |
| 1 微开（透光） | chest-1-ajar.png | 60ms |
| 2 半开 | chest-2-half.png | 140ms |
| 3 全开 | chest-3-open.png | 360ms（之后保持） |

- 根目录为 512×512 透明 PNG（底边对齐 y=488、水平居中，四帧可直接叠放互换不跳位）。
- `96/` 为 96×96 版本，适合 30pt 图标 @3x，小程序里建议用这一套。
- 可选：`chest-open.webp` / `chest-open.apng`（192px，播一次，切帧 0/60/140/360ms），`chest-close.webp`（倒放）。小程序 `<image>` 对 apng 支持不稳，优先用逐帧方案。

## 时序
- **打开**：0→1→2→3，帧间隔 60 / 80 / 220ms（即 0、60、140、360ms 切帧），最后一帧保持；总时长 360ms，整体 ease-out。
  可选弹一下：容器 scale 1 → 0.94（0–60ms，ease-in）→ 1.06（~260ms，ease-out）→ 1（360ms）。
- **关闭**：倒放 3→2→1→0，间隔约 80 / 80 / 140ms，总 ≈300ms；可选 scale 1→0.97→1。
- 点击触发：closed 态点按 → 播打开；菜单收起 → 播关闭。动画进行中忽略重复点击（或直接跳到目标帧再反向）。

## 小程序实现建议
1. **逐帧切 src（推荐）**：四张图预加载（页面 onLoad 时放在隐藏 `<image>` 里或全部叠放用 opacity 切换），
   用 `setTimeout` 链按上面间隔 `setData({chestFrame: i})`。叠放 + opacity 切换比改 src 更不闪。
2. **缩放弹性**：容器用 `wx.createAnimation({duration:360, timingFunction:'ease-out'})` 做 scale，或 CSS
   `@keyframes chest-pop { 0%{transform:scale(1)} 17%{transform:scale(.94)} 70%{transform:scale(1.06)} 100%{transform:scale(1)} }`。
3. 纯 CSS 也可：四个 `<image>` 绝对定位叠放，用 `animation: steps` 或分别设置 `animation-delay` 切 opacity。

## Figma 对照
- 演示帧 `Motion / 百宝箱开合`（node 651:1843，页面「02 破壳后」），在 Figma 里播放时间线即可看到：0.3s 开盖 → 停留 → 1.6s 关盖，循环。
- 关键帧条 `Motion / 百宝箱开合 / 关帧`（651:1850）。
- 静态组件 `Icon / 百宝箱`（648:1903，State=Closed 648:1904 / Open 648:1906）。
