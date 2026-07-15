# 收藏卡收集系列资源投放规范

## 当前第一季

- 套装：`YT-S01`（玉兔初见·水彩日常）
- 清单：固定 10 张，全部 `BASE`
- 卡牌定义：`miniprogram/utils/life-scenes.js`
- H5 原始 Hero：`h5/birth-card/assets/figures/`
- H5 套装清单：`h5/birth-card/assets/sets/YT-S01.json`
- 小程序轻量预览：`miniprogram/assets/cards/YT-S01/`

H5 原图采用统一素材名，例如：

`YT__watercolor__hi__v01.jpg`

小程序预览图采用卡牌定义 ID，例如：

`yt-s01-001.webp`

两者通过 `heroAssetId` 关联，不依赖文件名猜测。小程序预览图只用于抽卡揭晓和卡册缩略展示；分享长图与 H5 卡面继续使用 H5 原图，避免为主包重复打包大图。

## 当前交付规则

1. 不拆角色、道具和背景，不建立独立道具层。
2. 原图保持约 `850×1070`，不插值放大。
3. 小程序预览统一导出为约 360px 宽 WebP，控制主包体积。
4. 不在 Hero 中烘焙按钮、状态栏、FUN FACT、STRENGTH 或动态用户信息。
5. 卡框、系列代码、系列内编号、名字、生日、星座和 MBTI 由界面层生成；全局唯一编号仅用于副本记录与分享图脚注。

## 下一版本

下一版 Hero 可从高分辨率源统一导出 `1600×2000`、sRGB、4:5；不要把当前低分辨率文件直接放大。新增套装必须建立新的套装代码和冻结 checklist，不得修改 `YT-S01` 已发布清单。
