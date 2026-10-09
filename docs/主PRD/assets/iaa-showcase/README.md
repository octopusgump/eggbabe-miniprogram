# IAA 手机预览 · 可选真机截图

正式对外可读稿为单文件 [`02_蛋宝宝_IAA陪伴_手机预览.html`](../../02_蛋宝宝_IAA陪伴_手机预览.html)（`node scripts/build-iaa-mobile-prd-html.js` 从 `miniprogram/` 内嵌素材生成）。

本目录仅用于将来补充 COO 真机验收截图；当前构建不依赖此处文件。

建议命名（WebP 或 PNG，宽度约 750–1170）：

| 文件名 | 内容 |
|---|---|
| `01-room-hud.png` | 破壳后房间左上星+天数、左下信 |
| `02-letter-award.png` | 信纸 + 上方 +X 收星（动效中帧亦可） |
| `03-letter-tomorrow-role.png` | 明天呢展开 + 角色探出 |
| `04-doodle-companion.png` | 一起画页 + 画好了 |
| `05-album-tabs.png` | 纪念册 回忆/活动 |
| `06-tea-flow.png` | 茶会确认与结果 |

若需把真机图并入 HTML，在 `scripts/build-iaa-mobile-prd-html.js` / `scripts/iaa-prd-html-blocks.js` 中增加 data URI 引用即可。
