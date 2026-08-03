# 蛋宝宝 · 百宝箱 3D UI 生成日志

日期：2026-08-03

## 批次范围

本批次重做百宝箱中的 4 个入口：

1. 我的 / 设置
2. 收藏卡
3. 明信片
4. ta 带回来的东西

其中“我的”同时替换小程序 Tab 与百宝箱内的旧蛋形金属徽章。

## 执行方式

- 使用 Codex 内置 ImageGen，每件物品独立生成；未使用 CLI 或网页端代操作。
- 以已确认的 8 个收藏物风格 3D UI 联系表作为强制视觉参考。
- 原图生成在纯 `#00ff00` 色键背景上，本地去色键后统一为透明正方形资产。
- PNG 母版与对应 WebP 使用同一透明源，避免结构、比例或颜色漂移。

## 视觉与辨识标准

- 面向手机端 54rpx 显示，优先使用大轮廓、大色块和极少细节。
- 暖木色、象牙白、朱红、蜂蜜黄、钴蓝；不使用苔藓绿主体。
- 温暖精致的 3D 微缩收藏物材质，右上方柔和棚拍光。
- 无场景、人物、手、标签、Logo、水印或可辨认文字。

## 最终造型

- 我的：完全正面的蛋形木牌，取消金属边框、挂环和令牌结构；中央使用大面积钴蓝头像。
- 收藏卡：两张厚质圆角收藏卡，前卡为朱红边框、象牙白卡面和蓝色玉兔头像。
- 明信片：暖白厚纸明信片，蓝色山水、黄色太阳、红色邮票与两条抽象地址线。
- ta 带回来的东西：打开的暖木纪念物盒，内含蓝色兔子徽章、黄色圆形纪念物和红绳。

## 正式文件

“我的”位于 `../3d-actions/`：

- `png/ui_3d_profile_wood_plaque_v05.png` — 1024×1024 RGBA PNG
- `webp/ui_3d_profile_wood_plaque_v05.webp` — 1024×1024 Alpha WebP
- `runtime/ui_3d_profile_wood_plaque_256_v05.webp` — 256×256 Alpha WebP
- `runtime/ui_3d_profile_wood_plaque_96_v05.png` — 96×96 RGBA PNG
- `runtime/ui_3d_profile_wood_plaque_96_v05.webp` — 96×96 Alpha WebP

百宝箱其余 3 项：

- `png/ui_3d_toolbox_collection_cards_v01.png`
- `png/ui_3d_toolbox_postcard_v01.png`
- `png/ui_3d_toolbox_keepsake_box_v01.png`
- `webp/ui_3d_toolbox_collection_cards_v01.webp`
- `webp/ui_3d_toolbox_postcard_v01.webp`
- `webp/ui_3d_toolbox_keepsake_box_v01.webp`
- `runtime/ui_3d_toolbox_collection_cards_96_v01.png`／`.webp`
- `runtime/ui_3d_toolbox_postcard_96_v01.png`／`.webp`
- `runtime/ui_3d_toolbox_keepsake_box_96_v01.png`／`.webp`

WebP 母版参数：质量 92，Alpha 质量 100。运行时 WebP：质量 90，Alpha 质量 100。

## 接入记录

- `pages/life-scene/life-scene.wxml`：百宝箱 4 个入口均改为透明 3D 图片。
- `pages/life-scene/life-scene.wxss`：删除旧文字令牌样式，图标显示尺寸由 54rpx 调整为 64rpx。
- `app.json`、`custom-tab-bar/index.js`：Tab“我的”切换到正面木牌 v05。
- 旧 v04 金属徽章保留为历史版本，没有覆盖或删除。

## QA

- 4/4 母版均为 1024×1024 RGBA，四角 Alpha 为 0。
- 4/4 运行时 PNG 均为 96×96 RGBA。
- 透明联系表：`01_MiniProgram_MVP/tmp/imagegen/ui-3d-toolbox-v01/previews/ui_3d_toolbox_contact_sheet_v01.png`（960×960 PNG）。

---

## 两色正面重制批次（当前百宝箱正式版本）

日期：2026-08-03

用户确认后，正式替换以下 3 个百宝箱入口；“ta 带回来的东西”继续使用 v01，不作修改：

1. 我的 / 设置：正面八齿齿轮，蜂蜜木色＋钴蓝。
2. 收藏卡：完全正面卡片，象牙白＋钴蓝。
3. 明信片：完全正面横卡，象牙白＋朱红。

### 正式 WebP

1024×1024 Alpha WebP：

- `webp/ui_3d_toolbox_settings_gear_v02.webp`
- `webp/ui_3d_toolbox_collection_card_front_v02.webp`
- `webp/ui_3d_toolbox_postcard_two_color_front_v02.webp`

96×96 运行时 Alpha WebP：

- `runtime/ui_3d_toolbox_settings_gear_96_v02.webp`
- `runtime/ui_3d_toolbox_collection_card_front_96_v02.webp`
- `runtime/ui_3d_toolbox_postcard_two_color_front_96_v02.webp`

本批次遵循项目 WebP 偏好：PNG 只保存在 `tmp/imagegen/ui-3d-toolbox-redesign-v02/` 作为色键处理与预览中间文件，没有复制到正式资源目录。

### 接入

- `pages/life-scene/life-scene.wxml` 中 `my`、`card`、`postcards` 已切换到上述 v02 运行时 WebP。
- `keepsakes` 仍引用 `runtime/ui_3d_toolbox_keepsake_box_96_v01.png`，保持用户确认的原图。
- 底部 Tab“我的”仍使用正面木牌 v05，不随百宝箱设置齿轮一起改变。
