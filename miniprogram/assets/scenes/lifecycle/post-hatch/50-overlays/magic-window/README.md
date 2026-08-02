# 破壳后 · 魔法窗上层

正式待补：`dali.webp`、`beijing.webp`、`xishuangbanna.webp`。

要求：只含窗外旅途画面，不含房间窗框和正面角色。`magic_window_dali_with_jade_rabbit_back_placeholder.png` 含背面玉兔，只作参考，不进入运行时；北京、西双版纳同样不得使用代码占位冒充正式景区图。三张正式素材未齐前，`post-hatch-assets.js` 保持入口关闭。

## 东京分层技术样板

`tokyo-v01/` 目前作为魔法窗分层与弱动效的技术样板：

- `magic_window_tokyo_base_v01.webp`：无云静态远景底图；
- `magic_window_tokyo_clouds_v03.webp`：无外发光、透明边缘干净的独立云层；
- `magic_window_tokyo_koi_walk_standard_v02.webp`：独立透明锦鲤行走层。

锦鲤唯一造型基准为 `Koi_ReferenceSheet_Standard_02.png`。东京不属于主 PRD 的正式目的地，整个 `tokyo-v01/` 只保留为未接入的技术参考，不在页面、配置或接口中暴露。
