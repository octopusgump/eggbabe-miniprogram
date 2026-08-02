# 破壳后 · 魔法窗上层

正式待补：`dali.webp`、`beijing.webp`、`xishuangbanna.webp`。

要求：只含窗外旅途画面，不含房间窗框和正面角色。当前 `magic_window_dali_with_jade_rabbit_back_placeholder.png` 暂代大理方向；它仍含背面玉兔，因此只作占位。北京、西双版纳使用代码占位层。

## 东京分层技术样板

`tokyo-v01/` 目前作为魔法窗分层与弱动效的技术样板：

- `magic_window_tokyo_base_v01.webp`：无云静态远景底图；
- `magic_window_tokyo_clouds_v03.webp`：无外发光、透明边缘干净的独立云层；
- `magic_window_tokyo_koi_walk_standard_v02.webp`：独立透明锦鲤行走层。

锦鲤唯一造型基准为 `Koi_ReferenceSheet_Standard_02.png`。运行时代码只引用 `standard_v02`；旧的东京 v01 及大理、北京、西双版纳旧锦鲤合成预览均已删除。云层移动、地面反光、锦鲤位移、起伏、点击轻跳与落脚涟漪均由 `pages/life-scene` 的代码层绘制。弱动效模式停在静态代表帧，离页时移除连续动效节点。
