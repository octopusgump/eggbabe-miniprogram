# 蛋宝宝 V2 数据模型

正式数据统一带 `mode`，线上业务数据固定为 `live`；展会体验固定为 `demo`，不进入正式数据表。所有时间判定使用云函数返回的服务器时间，并按北京时间形成日期键。

## 云数据库集合

| 集合 | 核心字段 | 约束 |
|---|---|---|
| `users` | `openid`、`public_id`、`avatar_url`、`status` | `openid`、`public_id` 唯一 |
| `pets` | `user_id`、`mode`、`prototype`、`stage`、`progress`、`hatch_at` | `user_id + mode=live` 最多一只 |
| `activation_codes` | `code_hash`、`type`、`usage_limit`、`used_count`、`prototype`、`status` | 只保存 SHA-256，不保存明文；`code_hash` 唯一 |
| `hatch_cards` | `pet_id`、`serial`、`style`、`mbti`、`rarity`、`batch` | `pet_id`、`serial` 唯一；生成幂等 |
| `scene_card_pools` | `card_key`、`character`、`scene_id`、`name`、`rarity`、`limited_batch`、`active` | `card_key` 与客户端卡池配置一致且唯一 |
| `scene_cards` | `user_id`、`pet_id`、`mode`、`template_id`、`scene_id`、`point_id` | 仅服务器写入 |
| `scene_card_daily` | `user_id`、`date`、`count`、`attempts` | `user_id + date` 唯一；每日上限 2 |
| `daily_status` | `pet_id`、`date`、`mood`、`text`、`source` | `pet_id + date` 唯一 |
| `messages` | `pet_id`、`session_id`、`role`、`text`、`created_at` | 服务端审查及存储 |
| `analytics_events` | 通用事件属性 + 事件专属属性 | 指标查询必须过滤 `mode=live` |
| `festival_configs` | `date`、`name`、`limited_batch`、`status_pool` | 预置公历触发日 |
| `deletion_requests` | `user_id`、`requested_at`、`delete_after`、`status` | 15 天冷静期，可撤销 |

## 安全原则

- 客户端不能直接创建或修改激活码、破壳卡、场景卡及服务器时间。
- 云数据库权限默认只读或关闭，所有关键写入通过云函数。
- 激活码核销和场景卡掉落放在事务内，重复请求保持幂等。
- 头像选择后上传云存储，只将永久 `fileID` 落库。
- `demo` 数据不消耗激活码、不写用户偏好、不进入正式指标。
