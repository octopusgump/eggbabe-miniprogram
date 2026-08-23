# Claude 复审提示词：eggbabe 小程序 UI 与设计规范

请对 eggbabe 微信小程序做一次独立、只读的 UI 设计一致性复审。先报告问题，不要直接修改代码、提交或推送。

## 项目位置

```text
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP
```

设计规范：

```text
docs/eggbabe-DESIGN.md
```

相关提交：

- `d91c0b1`：修改前的设计与场景工作快照
- `cd10d0c`：UI 与设计规范对齐修复
- `8ecb957`：更新 design.md 的 Git 基线和变更索引

## 复审方法

1. 完整阅读 `docs/eggbabe-DESIGN.md`，把它作为本次 UI 检查标准。
2. 阅读 `git diff d91c0b1..cd10d0c`，理解本轮实现；不要只依赖提交说明或自动测试。
3. 检查当前分支实际代码，并确认修复没有引入新的状态、交互、包体或可访问性问题。
4. 如能运行微信开发者工具，请覆盖常见手机尺寸和窄长屏；如不能运行，明确标注哪些结论仅来自静态检查。
5. 保留工作区现有未提交内容，不要清理、覆盖或纳入审查提交。

## 必查项目

请逐项确认：

1. 破壳前 36 个环境键是否分别映射同名房间、蛋体和窝垫，是否仍存在错误天气或候选图回退。
2. 房间、蛋体或窝垫失败时，是否显示持久错误、重试和安全返回，而不是拼出 CSS 房间。
3. 破壳后动作是否只使用烘焙角色、道具、接触阴影和环境光的完整全景；不得叠加透明角色、CSS 道具或色调层。
4. 找不到动作全景时，是否回到同环境空房全景，而不是复用其他角色、天气或时段。
5. 首次命名和后续改名是否都留在当前场景的底部面板中。
6. `egg-rotation-sample` 是否未注册、未进入正式包，并且只保留开发验收用途。
7. 纪念物、明信片、旅途图和收藏卡是否都有加载、失败、单项重试和可返回状态。
8. 主交互色是否为 `#002900`，一级/二级文字、分隔线和错误色是否符合 design.md。
9. 字重是否不超过 `600`，用户可见辅助文字是否不小于 `20rpx`。
10. 系统减少动态效果开启时，循环动画、位移和旋转是否正确停用。
11. 图形按钮、蛋体、工具入口、导航和协议勾选是否具有准确的 `aria-role`、`aria-label` 或状态语义。
12. 紧凑控件是否遵循 `112rpx × 112rpx`；成组控件是否使用每段 `112rpx` 的统一胶囊。
13. 常规按压是否统一为 `160–180ms`、`scale(.98)`，且回忆高光不超过 `400ms`。

## 已知素材边界

36 个环境键已有精确运行时路径，但本地目前只有 20 套正式蛋体层和 20 套正式窝垫层，分别还缺 16 套。请把以下两类结论分开：

- 代码/UI 是否正确拒绝错误素材并提供错误与重试状态；
- 正式美术素材是否已经齐全。

不要建议恢复跨天气复用来掩盖缺图。

## 建议运行的校验

```bash
for test_file in miniprogram/services/tests/*.test.js; do node "$test_file" || exit 1; done
node scripts/verify-project.js
node scripts/verify-v2.js
node scripts/verify-h5.js
node scripts/verify-v211.js
node scripts/verify-egg-shell-art.js
node scripts/verify-home-egg-layout.js
node scripts/verify-incubation-practice-v35.js
node scripts/verify-environment-assets.js
node scripts/verify-package-assets.js
git diff --check
```

## 输出格式

先给结论，再按严重程度输出发现：

| 严重度 | 问题 | design.md 规则 | 代码证据 | 影响 | 建议 |
| --- | --- | --- | --- | --- | --- |

要求：

- 每个问题引用具体文件和行号。
- 只报告可以复现或由代码直接证明的问题，不写泛化建议。
- 没有问题的检查项也要列为“通过”，避免遗漏。
- 单独列出素材缺口、无法静态验证的视觉项和建议的真机测试矩阵。
- 最后给出“是否可以按当前 design.md 发布”的明确判断。
