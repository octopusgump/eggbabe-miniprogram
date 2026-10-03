# 蛋宝宝三面旋转与夜晚光照小样

## 测试入口

微信开发者工具自定义编译路径：

```text
pages/egg-rotation-sample/egg-rotation-sample
```

默认显示日间右 45°。点击蛋宝宝左半侧或右半侧，会在“左 45° / 正面 / 右 45°”之间逐级切换；右上角“日间 / 夜晚”按钮可查看春季晴夜版本。夜晚当前固定为右 45°，避免混用尚未生成的夜间角度。

## 当前运行素材（v2）

- 蛋层：`miniprogram/assets/scenes/lifecycle/pre-hatch/30-character/egg/rotation-sample/warm-day-v2/`
- 垫子层：`miniprogram/assets/scenes/lifecycle/pre-hatch/20-room-objects/window-and-nest/rotation-sample/warm-day-v2/`
- 三帧均使用 1254 × 1254 透明画布；蛋体按 640 × 880 安全框等比缩放并底部对齐，不拉伸面容。
- `egg_rotation_sprite.webp` 是三帧横向图集，单帧顺序为左 45°、正面、右 45°。
- v1 素材继续保留在同级 `warm-day/`，用于视觉回退和并排校验。

## 视觉校验资料

- `egg_rotation_three_view_day_calibration_v01.png`：三面身份校准图。
- `runtime-sample/warm-day/source-chroma/`：ImageGen 绿幕源图。
- `runtime-sample/warm-day/layers/`：首次透明化图层。
- `runtime-sample/warm-day/normalized/`：统一主体尺寸后的运行候选图。
- `runtime-sample/warm-day/preview_rotation_sequence.png`：三个角度在春季晴天背景中的并排预览。
- `runtime-sample/warm-day-v2/`：v2 绿幕源图、透明图层、标准化素材和实景预览。
- `runtime-sample/warm-day-v2/previews/preview_rotation_sequence_v2.png`：v2 三个角度在春季晴天背景中的并排预览。
- `runtime-sample/clear-night-v1/`：第一版夜晚角色与日间垫子组合，保留作视觉回退。
- `runtime-sample/clear-night-v2/source-chroma/`：ChatGPT 网页端重新生成的无独立投影蛋体与夜晚专用垫子原图。
- `runtime-sample/clear-night-v2/transparent/`：去除洋红背景后的独立蛋层和垫子层。
- `runtime-sample/clear-night-v2/normalized/`：保持蛋体比例、校准垫子厚度后的统一运行画布。
- `runtime-sample/clear-night-v2/background-source/`：ChatGPT 网页端生成的 941 × 1672 无桌面烘焙光束底图源文件。
- `runtime-sample/clear-night-v2/previews/egg_right_45_room.png`：春季晴夜背景、v2 垫子层和无独立投影蛋层的合成检查图。

v2 使用右上方暖窗光，保留蛋体高光纹理，并加强左下方暖色体积阴影、底部接触阴影与焦糖色软垫的厚度。

夜晚 v2 使用窗侧冷蓝月光与左侧微暖补光。蛋层移除了轮廓外的独立投影；接触阴影改由夜晚垫子顶面的冷灰蓝暗部承载。垫子使用连续短卷毛结构和低饱和冷棕灰，不再复用高饱和日间焦糖色。`spring_clear_night_v2.webp` 同时移除了桌面上的斜向光束、蓝色光池和左右冷暖分界，避免底图阴影与独立蛋/垫子图层冲突。背景、垫子、蛋体和 UI 仍保持独立分层。

源图和无损中间文件放在 `docs`，不会进入小程序运行素材目录。
