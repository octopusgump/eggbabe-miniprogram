# 一起画 · 道具简笔（看一看）

- 路径：`miniprogram/assets/keepsakes/turnarounds/line/`
- 命名：`{propId}.webp`，与 `companion-prop-catalog.js` 中的 `id` 一致。
- 彩色实物图：`../webp/`（或目录内既有 legacy 文件名，见 catalog 的 `colorFile`）。

当前目录已包含 catalog 全部 41 个 `{propId}.webp`。看一看默认只读 line；单张加载失败时由页面 `binderror` 回退彩色 webp。
