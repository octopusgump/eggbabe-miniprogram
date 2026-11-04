# 一起画 · 道具简笔（看一看）

- 路径：`miniprogram/assets/keepsakes/turnarounds/line/`
- 命名：`{propId}.png`，与 `companion-prop-catalog.js` 中的 `id` 一致。
- 彩色实物图：`../png/{propId}.png`（与简笔同 id；catalog 的 `colorFile` 为 legacy 对照名）。

当前目录已包含 catalog 全部 41 个 `{propId}.png`。看一看默认只读 line；单张加载失败时由页面 `binderror` 回退彩色 png。

**底色说明**：多数 line 图导出时带浅色不透明底（常见约 `#F9F1E8`，各张略有偏差），与画板 `#F7EEE5`（彩色道具花瓣色）不一致时会露出「方框」。页面已对看一看 `<image>` 与 line overlay Canvas 使用 `mix-blend-mode: darken` 与画板对齐；长期建议导出 **透明底** line 以便去掉混合。
