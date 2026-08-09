# 给 Claude Code 的确认答复：UI / Design 审计

本文件回答 `docs/CLAUDE_UI_DESIGN_AUDIT_PROMPT_v2.md` 中要求先确认的问题。请将本文件视为用户已确认的审计上下文，然后继续执行 v2 的只读审计；不要再次停下来询问这些问题，也不要修改、提交或推送。

## 1. 仓库确认

本次审计仓库是：

```text
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP
```

确认结果：

- 当前分支：`release/miniprogram-mvp-v3.6-20260802`
- 当前已提交 HEAD：`8ecb957 docs: refresh design baseline`
- 远端跟踪分支与 HEAD 一致。
- 同级不存在另一个 `02_MiniProgram_MVP_20260710_GPT` 仓库。
- 同级 `eggbabeWebP` 是独立图片资产仓库，分支 `main`，HEAD `24d2f70`；它不是本次小程序代码审计对象。

因此无需等待再次选择仓库，直接在 `01_MiniProgram_MVP` 审计。

## 2. PRD 权威版本

唯一有效的主 PRD 是：

```text
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/PRD归档/蛋宝宝小程序_V3_6_PRD.md
```

冲突优先级固定为：

```text
V3.6 主 PRD → 专项实现/美术规格 → eggbabe-DESIGN.md → 当前代码
```

以下 V3.5 文件只是历史资料，不得作为当前合规依据：

```text
../PRD归档/蛋宝宝小程序_V3.5_PRD.md
docs/蛋宝宝小程序_V3.5_实现口径.md
```

处理方式：把“活动仓库内仍存在 V3.5 实现口径且可被检索到”列为 `Info` 文档风险；不要删除文件，也不要用它判定代码违规。

## 3. `8ecb957` 是否构成实现后回填规范

结论：没有新增或改写 §1–§6 的规范条款，不存在用新规则反向证明 `cd10d0c` 合规的循环。

`git diff cd10d0c..8ecb957 -- docs/eggbabe-DESIGN.md` 只有三类变更：

1. Git 基线从 `26a164d` 更新为 `cd10d0c`；
2. §7 的 08-08 变更索引补充提交号与摘要；
3. 将一条短期“未推送候选”说明改写为通用的候选资源归档规则。

`eggbabe-DESIGN.md` 的 §1–§6 全部规则在 `d91c0b1` 中已经存在，早于 `cd10d0c`。

审计输出中的“实现后回填规范条款”应写：

```text
无实质性规范条款回填；仅有基线元数据、历史索引和候选资源说明更新。§7 索引不能作为实现合规证据。
```

## 4. 动作集合的确认答复（v2 第 48 项）

当前运行时事实以 `miniprogram/utils/life-scenes.js` 为准，共 8 个居家状态：

| 状态 key | 用户名称 | 对应动作 | 屏 | 能说话 |
| --- | --- | --- | --- | --- |
| `sleep` | 睡觉 | `lamp_off` 关台灯 | 左 | 否 |
| `lazy` | 赖床 | `pull_blanket` 盖被子 | 左 | 否 |
| `stare` | 发呆 | `tap_pet` 点 ta | 中 | 是 |
| `drawing` | 涂涂画画 | `turn_paper` 点画纸 | 中 | 是 |
| `reading` | 看书 | `turn_book_page` 翻书页 | 中 | 是 |
| `gaming` | 打游戏 | `tap_screen` 点屏幕 | 中 | 否 |
| `music` | 听音乐 | `listen_together` 一起听 | 中 | 是 |
| `window` | 看窗外 | `view_daily_window` 点窗户 | 右 | 是 |

口径解释：

- V3.6 PRD §13.3.1 和结构说明 v0.3 的固定映射少了“看书、听音乐”。
- `eggbabe-DESIGN.md` §4.3 的六项是“双角色晴天三时段动作全景的正式资产覆盖”，不是完整业务状态表。
- 当前图片生产规范和运行时都按 9 个动作处理。

本次只读审计的处理决定：

1. 不把“看书、听音乐”直接判为代码缺陷；
2. 把 PRD/结构说明未同步 9 状态列为 `Info` 文档冲突；
3. 建议后续将 V3.6 PRD §13.3.1 更新为上述 9 状态表，之后再让 design.md 明确区分“业务状态全集”与“已交付动作全景子集”；
4. 不在本次审计中修改任何文档或代码。

## 5. 窗洞与天气架构的确认答复（v2 第 49 项）

当前有效架构是：

```text
36 个语义环境键的完整房间场景
+ 独立透明蛋体层
+ 独立透明窝垫层
+ 只画在窗玻璃范围内的天气 Canvas
```

结论：破壳前房间背景不再要求透明窗洞，也不再把 `7 张窗景 + 3 张天气叠加层` 拼回房间。

证据口径：

- V3.6 PRD 顶部 2026-08-04 优先修订明确 36 个正式组合；
- V3.6 PRD §10.11.2 明确完整房间环境图 + 独立蛋/窝垫 + Canvas；
- 结构说明 v0.3 §11.1 已同步相同架构，并明确 `window-weather/` 的 7 张图只用于全屏“日常窗外详情”。

仓库中仍提到 `room_base.webp` 透明窗洞或旧分层方案的 handoff / generation manifest 属于历史美术交接资料。处理方式：列为 `Info` 旧文档风险，不得据此要求代码恢复透明窗洞。

另外，主 PRD 内仍混有“20 套环境图”的旧段落，但顶部优先修订和当前运行时均为 36 键。审计应把“20 / 36 数量未完全清理”列为 `Info` 文档冲突；代码目标按 36 键检查。

## 6. 首页入口存在真实的上位文档冲突

这不是已确认通过项，Claude 必须报告：

- V3.6 PRD §5.2.1 要求“许愿池 + 早教班”在右侧 `112rpx × 248rpx` 竖向组合，画蛋壳是下方相隔 `20rpx` 的独立圆按钮；明确禁止横向大 Dock。
- `eggbabe-DESIGN.md` §4.1 与当前代码却使用许愿、早教、画蛋壳三个横向等权 `112rpx` 分段胶囊。

由于主 PRD 优先级最高，本次审计不得用 design.md 为当前横向三段 Dock 自证合规。请至少按 `Major` 报告；如果按“违反上位明文硬规则且用户可见”执行，也可以判为 `Blocker`。本轮只报告，不自动修改，等待产品负责人决定：

1. 恢复 PRD 的右侧竖向双入口 + 独立画蛋壳；或
2. 正式修改主 PRD，批准当前横向三段 Dock。

在产品负责人作出选择前，发布判断不能是无条件“可发布”。

## 7. 破壳后全景与角色层的确认答复

当前目标是单张 `2823 × 1672` 三屏连续全景；正式动作图将角色、动作道具、遮挡、接触阴影和环境光一起烘焙，运行时不再叠透明角色层。

依据：

- V3.6 PRD §10.11 的 2026-08-04 修订登记 `2823 × 1672` 连续三屏全景；
- `docs/蛋宝宝小程序_V3.6_破壳后实现口径.md` 明确完整 Pano 与烘焙动作规则；
- `eggbabe-DESIGN.md` §4.2–§4.3 同步该规则。

结构说明 v0.3 §11.2 中“三屏各自背景 + 透明角色层”是尚未完全同步的旧实现描述，应列为 `Info` 文档风险，不应据此要求恢复透明角色叠层。

## 8. 已知缺失素材的精确清单

蛋体层和窝垫层缺失的是同一组 16 个环境键：

```text
spring_cloudy_sunset
spring_cloudy_night
spring_rain_sunset
spring_rain_night
summer_cloudy_sunset
summer_cloudy_night
summer_storm_day
summer_storm_sunset
autumn_rain_sunset
autumn_rain_night
winter_clear_sunset
winter_cloudy_sunset
winter_cloudy_night
winter_snow_sunset
winter_post_snow_sunset
winter_post_snow_night
```

这些是美术交付缺口，不是跨天气复用的理由。审计应分别确认：

- 36 个运行时路径是否精确、唯一；
- 缺图是否进入持久错误、重试和安全返回；
- 发布是否必须等待 16 套蛋体和 16 套窝垫补齐。

## 9. 两个建议门禁脚本

目前不存在：

```text
scripts/verify-design-tokens.js
scripts/verify-asset-dimensions.js
```

已有 `scripts/verify-environment-assets.js` 只覆盖 36 张破壳前中央场景和 36 张破壳后空房全景的尺寸，没有完整覆盖动作全景、明信片、不透明 Alpha、全部设计 token。

按 v2 要求：只在报告中建议新增，不要在本次只读审计中实现。

## 10. 工作区未提交内容边界

审计开始时预计存在以下未提交内容，必须与 `8ecb957` 已提交代码分开报告：

- `docs/POST_HATCH_HOME_IMAGE_GENERATION_BRIEF.md` 的并行修改；
- Claude 审计提示词文件；
- `post-hatch/10-background/kitchen/candidates/` 下的厨房候选图；
- `post-hatch/90-reference-composites/originals/boon-koi-approved/` 下的锦鲤参考图。

这些候选与参考目录已经在 `project.config.json` 中排除出正式包。不要清理、移动、提交或把候选图晋级为正式资源。

## 11. 给 Claude Code 的执行指令

完整读取：

```text
docs/CLAUDE_UI_DESIGN_AUDIT_PROMPT_v2.md
docs/CLAUDE_UI_DESIGN_AUDIT_ANSWERS.md
```

本文件已经完成 v2 第 0 节所需确认。现在直接执行余下只读审计。对本文件预先给出的结论仍需用当前文件和行号复核；若当前工作区已经变化，以新证据为准并明确说明差异。
