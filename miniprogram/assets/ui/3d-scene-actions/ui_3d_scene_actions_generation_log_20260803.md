# 蛋宝宝 · 场景底部 3D 交互按钮生成日志

日期：2026-08-03

## 批次范围

本批次替换生活场景底部两个圆形按钮内部的 CSS 造型：

1. 对话入口：旧嘴巴造型改为信封原型。
2. 百宝箱入口：旧 CSS 小箱子改为收藏物风格的闭合木箱。

圆形按钮外壳、位置、点击逻辑与无障碍标签保持不变。

## 生成方式与 Prompt 摘要

- 使用 Codex 内置 ImageGen，每个物品独立生成；未使用 CLI。
- 信封：近正面、暖象牙白厚纸、朱红 V 形封口，严格两种物体颜色。
- 百宝箱：闭合的蜂蜜色圆角木箱、象牙白木扣，严格两种物体颜色；无金属、无提手。
- 两项均以暖 3D 微缩收藏物为材质参考，面向 64rpx 小尺寸辨识。
- 原图使用纯 `#00ff00` 色键背景，本地去色键并统一为透明正方形资产。

## 正式文件

PNG 母版（1024×1024 RGBA）：

- `png/ui_3d_scene_message_envelope_v01.png`
- `png/ui_3d_scene_toolbox_closed_chest_v01.png`

WebP 母版（1024×1024，Alpha，质量 92／Alpha 100）：

- `webp/ui_3d_scene_message_envelope_v01.webp`
- `webp/ui_3d_scene_toolbox_closed_chest_v01.webp`

运行时版本（96×96）：

- `runtime/ui_3d_scene_message_envelope_96_v01.png`／`.webp`
- `runtime/ui_3d_scene_toolbox_closed_chest_96_v01.png`／`.webp`

## 接入记录

- `pages/life-scene/life-scene.wxml` 已使用两张运行时 PNG。
- `pages/life-scene/life-scene.wxss` 新增 `.scene-action-icon-image`，显示尺寸为 72rpx。
- 已删除不再使用的 `.icon-mouth*` 与 `.icon-toolbox*` CSS 造型；离家状态原有写信按钮保持不变。
- `scripts/verify-project.js` 与 `scripts/verify-v2.js` 已由旧 CSS 类名检查更新为新版图片资源检查。

## QA

- 2/2 母版为 1024×1024 RGBA，四角透明。
- 2/2 运行时 PNG 为 96×96 RGBA。
- 透明联系表：`01_MiniProgram_MVP/tmp/imagegen/ui-3d-scene-actions-v01/previews/ui_3d_scene_actions_contact_sheet_v01.png`（1000×500 PNG）。
