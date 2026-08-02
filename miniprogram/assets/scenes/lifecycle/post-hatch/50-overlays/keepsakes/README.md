# 破壳后 · 纪念品

正式待补：为每个居家小状态和每个在外状态各导出一张透明 WebP，命名为 `keepsake_<small-scene-id>.webp`。

要求：一项原生动作只生成一次，不在图片上绘制数量、进度或“解锁”文字。当前回忆页使用固定尺寸的字母印记占位。

## 设计四视图

`turnarounds/` 保存纪念物的 3D 四视设计稿，不是运行时透明单件图。目前有：

- `keepsake_jade_rabbit_helmet_four_view_3d.png`：用户指定的玉兔场景衍生头盔候选，不属于 PRD §6 当前 31 件正式清单。
- `keepsake_boon_koi_paper_pinwheel_four_view_3d.png`：锦鲤定制物 K-K03 纸风车。
- `keepsake_boon_koi_paper_pinwheel_four_view_3d_v2.png`：K-K03 纸风车高饱和配色版，保留原四视结构和 3D 材质。

完整分类、排除项和本轮生成说明见 `keepsake_inventory_and_turnaround_log_20260802.md`。

## 2026-08-02 · 剩余 29 张四视图

`turnarounds/webp/` 保存本轮在 Codex 内直接生成并转换后的 29 张 WebP 四视设计稿。

- 统一尺寸：1672×941
- 统一格式：WebP（质量 92）
- 统一结构：前视 / 3/4 前视 / 右侧视 / 背视
- 统一基准：现有玉兔头盔与高饱和纸风车四视图
- 本轮范围：PRD 正式清单中除 K-K03 纸风车外的明确物件；“云南特产”因未定义具体形态暂不生成
- 注意：这些是暖白棚拍背景的四视设计图，不是小程序运行时使用的透明单件图

完整文件清单与 QA 记录见 `keepsake_29_turnarounds_generation_log_20260802.md`。
