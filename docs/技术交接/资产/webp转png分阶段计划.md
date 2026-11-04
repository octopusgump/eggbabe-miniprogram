# WebP → PNG 分阶段替换与删除计划

**原则：** 每阶段 = 改代码引用 → 生成/确认 PNG → 跑单测 → 删除该批 WebP（仅当 PNG 已入库且引用已切换）。**不**在同一阶段动 lifecycle 全景与破壳前全场景。

| 阶段 | 范围 | 约文件数 | 代码改动 | 状态 |
|------|------|---------:|----------|------|
| **1** | `miniprogram/assets/ui/**` + 左下信封/宠物 stare | ~39 WebP + 2 角色 | `life-scene`、`companion-pet-image` | 待合入（PR） |
| **2** | `30-character` 破壳后头像/姿势、`cards/*` 收藏卡 | ~10 + 20 | `companion-pet-image`、demo、纪念册 | 待办 |
| **3** | `keepsakes/turnarounds/line` + 道具 catalog 彩色 | ~41 + catalog | `companion-prop-*`、PRD 同步 | 已合入（PNG canonical 路径） |
| **4** | 陪伴照片、fixtures、demo 明信片 | ~20+ | `companion-photo-catalog`、`fixtures/*` | 待办 |
| **5** | `pre-hatch` 季节场景 + 蛋/窝垫 + 窗口天气 | ~200+ | `pre-hatch-assets.js` | 待办（包体风险最高） |
| **6** | `post-hatch` 全景 + 动作全景 + archived | ~400+ | `post-hatch-assets.js` | 最后；需分包/体积评估 |

## 阶段 1 验收

- `node miniprogram/services/tests/room-ui-icon-format.test.js`
- `node miniprogram/services/tests/companion-pet-image.test.js`
- `miniprogram/assets/ui/` 下无 `.webp`（`webp/` 归档目录一并清理）
- 左下读信/聊天、右下百宝箱、TabBar、画画工具条仍指向 `runtime/*.png`

## 包体提醒

lifecycle 阶段 5–6 转 PNG 可能增加 **数百 MB** 仓库体积；每阶段合入前用微信开发者工具看「代码包大小」。
