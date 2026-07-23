# 蛋宝宝 V2 数据模型

> ⛔ **历史 schema，已由 [普通小程序主 PRD v2.28](./蛋宝宝小程序_V2_PRD.md) 与 [普通版技术与数据接口规格](./蛋宝宝小程序_技术与数据接口规格.md) 取代。普通版 live 只采用新文档的数据白名单；本文的进度、卡池、货币、背包等字段不得建设或写入。**

正式数据统一带 `mode`，线上业务数据固定为 `live`。`demo` 只允许用于内部开发、自动化测试与 H5 样例，不设任何用户入口，也不进入正式数据表。所有时间判定使用云函数返回的服务器时间，并按北京时间形成日期键。

## 云数据库集合

| 集合 | 核心字段 | 约束 |
|---|---|---|
| `users` | `openid`、`public_id`、`avatar_url`、`status`、`mode` | `openid + mode`、`public_id + mode` 唯一 |
| `pets` | `user_id`、`mode`、`prototype`、`stage`、`progress`、`hatch_at` | `user_id + mode=live` 最多一只 |
| `activation_codes` | `code_hash`、`type`、`usage_limit`、`used_count`、`prototype`、`status`、`mode` | 只保存 SHA-256，不保存明文；`code_hash + mode` 唯一 |
| `hatch_cards` | `pet_id`、`mode`、`serial`、`style`、`mbti`、`illustration_id`、`illustration_context`、`limited_batch`、`generated_at` | `pet_id + mode`、`serial` 唯一；生成幂等；H5 只渲染 |
| `scene_card_pools` | `mode`、后续系列运营卡池 | `YT-S01` 不从该集合读取定义；冻结清单以随代码发布的版本为准 |
| `scene_cards` | `copy_id`、`owner_id`、`user_id`、`pet_id`、`mode`、`card_definition_id`、`set_code`、`collector_number`、`checklist_number`、`checklist_total`、`unique_code`、`treatment`、`hero_asset_version`、`card_template_version`、`card_snapshot_hash`、`provenance_events`、`issued_at` | 仅服务器写入；`copy_id`、`unique_code` 全局唯一且不可复用 |
| `scene_card_daily` | `user_id`、`date`、`count`、`attempts` | `user_id + date` 唯一；每日上限 2 |
| `scene_card_issue_counters` | `character`、`date`、`count` | `character + date` 唯一；在掉落事务内生成副本流水号 |
| `daily_status` | `pet_id`、`date`、`mood`、`text`、`source` | `pet_id + date` 唯一 |
| `messages` | `pet_id`、`session_id`、`role`、`text`、`created_at` | 服务端审查及存储 |
| `analytics_events` | 通用事件属性 + 事件专属属性 | 指标查询必须过滤 `mode=live` |
| `preference_events` | `user_id`、`pet_id`、`mode`、`scene_id`、`point_id`、`event_type`、`duration`、`server_ts` | 仅服务端写；正式分析固定 `mode=live` |
| `festival_configs` | `date`、`name`、`limited_batch`、`status_pool`、`mode` | 预置公历触发日 |
| `currency_balances` | `user_id`、`mode`、`amount`、`updated_at` | `user_id + mode` 唯一；余额不可为负 |
| `currency_ledger` | `user_id`、`mode`、`direction`、`source`、`amount`、`balance_after`、`server_ts` | 只追加、不可改写；earn / spend 必须与余额同事务 |
| `item_catalog` | `item_id`、`mode`、`category`、`price`、`slot`、`decorative_only`、`status` | `item_id + mode` 唯一；三类为 accessory / snack / scene-decor |
| `user_inventory` | `user_id`、`mode`、`item_id`、`quantity`、`equipped`、`slot` | `user_id + mode + item_id` 唯一 |
| `daily_earn_counters` | `counter_id`、`user_id`、`mode`、`date`、`source`、`amount` | `counter_id + mode` 唯一；服务器北京时间日切 |
| `deletion_requests` | `user_id`、`mode`、`requested_at`、`delete_after`、`status` | 15 天冷静期，可撤销 |

## 安全原则

- 客户端不能直接创建或修改激活码、破壳卡、场景卡及服务器时间。
- 云数据库权限默认只读或关闭，所有关键写入通过云函数。
- 激活码核销和场景卡掉落放在事务内，重复请求保持幂等。
- 头像选择后上传云存储，只将永久 `fileID` 落库。
- `demo` 数据不消耗激活码、不写用户偏好、不进入正式指标。
- 货币余额、流水、商品、背包与每日计数全部按 `mode` 隔离；正式记账只允许云函数事务写入。
- 露珠只有互动 / 运营发放两个入口；商品固定 `decorative_only=true`，不提供任何成长数值。
- `YT-S01` checklist 发布后冻结；清单编号不是稀有度或限量序列号。
- 数据库运营配置不得覆盖 `YT-S01` 的卡牌名称、编号、Hero 或 `BASE` treatment。
