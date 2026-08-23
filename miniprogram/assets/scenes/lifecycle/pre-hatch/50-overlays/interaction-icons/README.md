# 破壳前 · 互动入口图标

这里保存从旧 `assets/scenes/incubation/svg/` 迁移的 8 个入口图标。小程序运行时统一读取 PNG；SVG 仅作为历史源文件保留。运行时路径统一由 `miniprogram/config/pre-hatch-assets.js` 管理。

图标仅用于原生交互入口，不参与房间、窗景、天气、窝垫或蛋体的位图合成。旧 `incubation` 目录删除后，不得重新引用其路径。
