# 蛋宝宝破壳后聊天 App 改造与 CTO 服务端接入说明 v1.0

> 文档日期：2026-08-12
> 适用版本：`3.7.0-ordinary`
> 文档性质：当前 App 实现说明与 CTO 联调合同，不替代产品 PRD、隐私政策或服务端安全方案。
> 当前状态：App 端 9 项优化已完成；正式服务、法务文案和 iOS / Android 真机端到端验收待完成。

## 1. 目的

本文向 CTO 说明以下事项：

1. 本轮 App 实际修改了哪些部分；
2. App 现在严格接受什么请求和响应结构；
3. CTO 需要实现哪些服务端能力；
4. 各错误码会触发什么 App 行为；
5. staging / production 应如何接入和验收；
6. 哪些规则绝对不能下放到 App。

正式聊天仍遵循“App 无内容规则、服务端全决策”：App 只负责入口、页面状态、最小请求、响应校验和展示；输入审核、危机判断、模型上下文、人设、输出审核、幂等、限流、保存和删除均由服务端完成。

## 2. 当前结论

- App 端 A1–A9 已完成并通过自动化回归。
- `develop` 使用独立本地 demo fixture，不访问正式聊天服务。
- `trial` 和 `release` 固定为 live；当前两个 `apiBase` 仍为空，因此会明确阻断，不会回退 demo。
- 本仓库没有服务端代码，不能据此判断鉴权、幂等、内容安全、危机策略或落库已经完成。
- CTO 完成本文合同前，正式聊天不可判定为可上线。

## 3. App 本轮修改总览

| App 项目 | 已修改内容 | 主要文件 | CTO 接入影响 |
| --- | --- | --- | --- |
| A1 本机正文清理 | bootstrap 不再向 pet 注入消息；保存 pet 时强制删除 `messages`；读取旧缓存时立即迁移清除 | `miniprogram/app.js`、`miniprogram/utils/pet-store.js` | 聊天正文只能通过 `getChatHistory` 返回，不能再依赖 bootstrap 消息缓存 |
| A2 危机标签移除 | 删除 `chat_reply_result` 安全结果埋点；App 不保存或上传 `crisis` / safety 标签 | `miniprogram/pages/chat/chat.js`、`miniprogram/services/analytics.js` | 危机最小审计必须全部在服务端合规链路完成 |
| A3 成功合同收紧 | 严格校验 `result_type`、角色、安全结果、双方消息 ID、双方时间、幂等回显和 `fallback_used` | `miniprogram/services/chat-service.js`、`miniprogram/pages/chat/chat.js` | 任一必填字段缺失都会被 App 视为 `CHAT_REPLY_INVALID`，不会展示回复 |
| A4 错误状态机 | 将输入拒绝、权限变化、限流、致命错误和可重试错误分开处理 | `miniprogram/pages/chat/chat.js`、`miniprogram/services/cloud-api.js` | CTO 必须稳定返回本文错误码和服务端审核文案 |
| A5 `chat_access` 保守策略 | 缺字段、非法枚举、缺 message、非法时间都降级为同步失败；不再根据本地场景拼文案 | `miniprogram/services/post-hatch-companion.js` | `away/unavailable.message` 必须由服务端提供 |
| A6 历史合同加固 | 校验 role、ID、服务端时间、用户 `client_message_id`、排序、页内重复、页大小和游标 | `miniprogram/services/post-hatch-companion.js`、`miniprogram/pages/chat/chat.js` | 畸形历史页会整页拒绝并显示加载失败 |
| A7 内容边界清理 | 未读明信片不再注入聊天流，也不再由聊天页标记已读；账号或蛋变化时清空旧会话 | `miniprogram/pages/chat/chat.js` | `getChatHistory` 只返回聊天消息，不能混入明信片、留言或系统推荐 |
| A8 自动化门禁 | 增加畸形响应、错误路由、正文存储、危机标签、环境隔离等负向测试 | `miniprogram/services/tests/chat-*.test.js`、`scripts/verify-chat.js` | CTO staging fixture 应与这些合同一致 |
| A9 UI 与资源 | 中性不可聊天页、SVG 发送箭头、去“在线”绿点、静默输入聚焦、头像瘦身；聊天顶部与生活空间左下入口共用同一对锦鲤/玉兔头像，保留资源内安全留白，不再回退空白蛋形；外出/不可聊天时左下缩为低饱和小状态按钮，场景中央展示可轻触收起的外出状态卡片 | `miniprogram/pages/chat/`、`miniprogram/pages/life-scene/`、`miniprogram/assets/ui/3d-scene-actions/runtime/` | 服务端 `prototype` 应返回标准值；外出/不可聊天 `message` 必须提供审核后可直接展示的说明 |

## 4. 关键实现文件索引

| 文件 | 当前职责 |
| --- | --- |
| `miniprogram/pages/chat/chat.js` | 页面状态机、发送、重试、错误路由、取消、账号/蛋切换保护 |
| `miniprogram/pages/chat/chat.wxml` | 聊天、历史、不可聊天、输入拒绝和限流提示的页面结构 |
| `miniprogram/pages/chat/chat.wxss` | 消息状态、触控、安全区、输入框和弱动效视觉 |
| `miniprogram/services/chat-service.js` | live `chatReply` 最小请求及严格成功响应校验 |
| `miniprogram/services/chat-demo-fixture.js` | 仅供 develop/demo 的本地固定回复；trial/release 不得使用 |
| `miniprogram/services/post-hatch-companion.js` | `chat_access`、历史和页面服务适配 |
| `miniprogram/services/cloud-api.js` | 通用 HTTPS envelope、环境字段、session、10 秒聊天超时和 abort |
| `miniprogram/services/runtime-context.js` | live/demo 模式与当前 session ID |
| `miniprogram/utils/pet-store.js` | 用户/蛋本机缓存；现在禁止保存聊天正文 |
| `miniprogram/config/v2.js` | staging/production API 地址和请求超时 |
| `scripts/verify-chat.js` | 聊天专项聚合门禁，目前共 16 项 |

## 5. 环境与地址配置

### 5.1 构建映射

| 微信环境 | App 模式 | 数据来源 | 后端未配置时 |
| --- | --- | --- | --- |
| `develop` | `demo` | `chat-demo-fixture.js` 和本地 demo snapshot | 允许内部验收；不访问正式服务 |
| `trial` | `live` | staging | 明确阻断，不回退 demo |
| `release` | `live` | production | 明确阻断，不回退 demo |
| 未知环境 | `live` | 按 release 处理 | 安全阻断 |

### 5.2 CTO 需交付

CTO 需要提供：

- staging HTTPS 根地址；
- production HTTPS 根地址；
- 两个地址对应的微信小程序合法域名资料；
- staging 测试账号；
- 分别覆盖未绑定、未破壳、已破壳居家、已破壳外出的测试蛋；
- 服务端监控、报警、灰度和回滚说明。

地址最终填写位置：

```js
// miniprogram/config/v2.js
const API_BASES = {
  trial: 'https://staging.example.com',
  release: 'https://api.example.com'
};
```

在地址正式确认前不要填写占位域名，也不要把 production 指向 staging。

## 6. 通用请求与响应约定

### 6.1 请求方式

- 方法：`POST`
- Content-Type：`application/json`
- 路径：`${apiBase}/${serviceName}`
- 普通请求超时：15 秒
- `chatReply` 超时：10 秒
- App 离开聊天页时会调用底层请求的 `abort()`；服务端仍需依赖幂等保证晚到请求不会重复落库。

### 6.2 App 自动附加字段

所有 live 请求都会附加：

```json
{
  "mode": "live",
  "client_version": "3.7.0-ordinary",
  "session_id": "server-issued-session-id",
  "request_id": "request-id"
}
```

`chatReply.request_id` 固定等于本条消息的 `client_message_id`，重试不会改变。

### 6.3 成功 envelope

```json
{
  "success": true,
  "request_id": "request-id",
  "server_time": "2026-08-12T12:00:01+08:00",
  "data": {
    "mode": "live"
  },
  "error": null
}
```

### 6.4 失败 envelope

```json
{
  "success": false,
  "request_id": "request-id",
  "server_time": "2026-08-12T12:00:01+08:00",
  "data": {
    "mode": "live",
    "result_type": "INPUT_REJECTED"
  },
  "error": {
    "code": "INPUT_TOO_LONG",
    "message": "服务端审核后的用户提示",
    "detail": null
  }
}
```

重要：当前 App 对非 2xx HTTP 响应统一转换为 `HTTP_状态码`。需要让 App 精确路由的业务错误——例如 `AUTH_REQUIRED`、`EGG_FORBIDDEN`、`TALK_NOT_AVAILABLE`、`INPUT_REJECTED` 和 `RATE_LIMITED`——应使用 HTTP 2xx 加 `success:false` envelope。真正的网关或服务异常可以使用 5xx，App 会将其作为可重试失败处理。

## 7. `bootstrap` 会话前置合同

聊天请求依赖 `bootstrap` 返回服务端签发的 session。最小成功结构：

```json
{
  "success": true,
  "request_id": "bootstrap-request-id",
  "server_time": "2026-08-12T12:00:00+08:00",
  "data": {
    "mode": "live",
    "session_id": "signed-session-id",
    "user": {
      "id": "user-id",
      "public_id": "EB-USER-ID",
      "nickname": "微信用户",
      "avatar_url": ""
    },
    "pet": {
      "_id": "egg-id",
      "mode": "live",
      "user_id": "user-id",
      "lifecycle_stage": "HATCHED",
      "hatch_at": "2026-08-01T12:00:00+08:00",
      "prototype": "玉兔",
      "display_name": "蛋宝宝"
    }
  },
  "error": null
}
```

`pet.prototype` 推荐只返回标准中文值 `玉兔` 或 `锦鲤`。为兼容既有数据，App 也会识别 `YT`、`jade-rabbit`、`moon-rabbit`、`KOI` 和 `boon-koi`；缺失或未知值按当前产品默认原型玉兔显示。聊天页不会再使用空白蛋形占位头像。

服务端要求：

- `session_id` 必须由服务端签发、可撤销、可过期；
- 后续接口必须根据 session 得出用户身份，不能信任 App 自带的用户 ID；
- 若 bootstrap 未返回 session，App 可能仍携带本机生成的 `session-*` 诊断标识；服务端必须拒绝它，不能将其视为已登录会话；
- bootstrap 不得再返回供本机保存的聊天正文；即使返回 `messages`，当前 App 也不会导入 pet 缓存。

## 8. `getPostHatchHome` 接入合同

### 8.1 请求

```json
{
  "egg_id": "egg-id",
  "mode": "live",
  "client_version": "3.7.0-ordinary",
  "session_id": "signed-session-id",
  "request_id": "generated-request-id"
}
```

### 8.2 最小成功响应

```json
{
  "success": true,
  "request_id": "generated-request-id",
  "server_time": "2026-08-12T12:00:00+08:00",
  "data": {
    "mode": "live",
    "mood": {
      "mood": "平静",
      "line": "我想慢慢待一会儿。"
    },
    "current_state": {
      "major_scene_id": "home",
      "small_scene_id": "reading",
      "slot_index": 12,
      "slot_start": "2026-08-12T08:00:00+08:00",
      "slot_end": "2026-08-12T13:00:00+08:00",
      "line": "这一页讲到月亮，我把耳朵靠近一点听。",
      "action_done": false
    },
    "chat_access": {
      "status": "available",
      "reason": "AT_HOME",
      "message": "",
      "next_available_at": null
    }
  },
  "error": null
}
```

### 8.3 `chat_access` 必填规则

| 字段 | CTO 必须返回 | App 当前行为 |
| --- | --- | --- |
| `status` | `available`、`away`、`unavailable` 三选一 | 只有 `available` 放行聊天 |
| `reason` | 非空原因码，建议使用 `AT_HOME`、`AWAY`、`LIFECYCLE`、`SYSTEM` | 仅用于状态与排障，不直接展示 |
| `message` | `away/unavailable` 时为非空、已审核用户文案；`available` 可为空 | 原样展示，不根据 reason 改写 |
| `next_available_at` | `null` 或带时区 ISO 8601 | 不猜测；非法值会使整项降级 unavailable；当前 UI 暂不显示该时间 |

以下情况 App 会统一降级为：

```json
{
  "status": "unavailable",
  "reason": "CHAT_ACCESS_UNSYNCED",
  "message": "聊天权限正在同步，请稍后再试。"
}
```

- `chat_access` 缺失；
- status 非法；
- reason 为空；
- `away/unavailable` 的 message 为空；
- `next_available_at` 不是 null 或合法 ISO 8601。

### 8.4 服务端权限要求

`getPostHatchHome` 必须根据当前 session 再检查：

1. 用户已登录；
2. 蛋存在；
3. 蛋属于当前用户；
4. 生命周期为 `HATCHED`；
5. 当前服务状态是否允许聊天。

App 的 `atHome`、`major_scene_id`、本地时间或历史场景不能作为权限依据。

居家 `small_scene_id` 当前支持：`sleep`、`lazy`、`stare`、`drawing`、`reading`、`gaming`、`music`、`window`。CTO 返回的场景键必须与 App 固定映射一致，否则整个 snapshot 会被视为无效。

## 9. `chatReply` 接入合同

### 9.1 App 实际请求

```json
{
  "egg_id": "egg-id",
  "message": "用户原始输入，不截断、不改写",
  "client_message_id": "chat-stable-message-id",
  "request_id": "chat-stable-message-id",
  "mode": "live",
  "client_version": "3.7.0-ordinary",
  "session_id": "signed-session-id"
}
```

App 不会上传：

- `history`；
- `scene_context`；
- `atHome` 或可聊天结论；
- 用户画像或记忆；
- 输入标签、安全结论或危机判断；
- 模型参数、人设提示词或规则版本。

### 9.2 普通回复成功结构

```json
{
  "success": true,
  "request_id": "chat-stable-message-id",
  "server_time": "2026-08-12T12:00:01+08:00",
  "data": {
    "mode": "live",
    "result_type": "REPLY",
    "user_message": {
      "message_id": "server-user-message-id",
      "client_message_id": "chat-stable-message-id",
      "role": "user",
      "text": "用户原始输入",
      "created_at": "2026-08-12T12:00:00+08:00"
    },
    "reply": {
      "message_id": "server-assistant-message-id",
      "role": "assistant",
      "text": "服务端完成输出审核后的回复",
      "safety_result": "passed",
      "fallback_used": false,
      "created_at": "2026-08-12T12:00:01+08:00"
    }
  },
  "error": null
}
```

### 9.3 危机安全回复成功结构

```json
{
  "success": true,
  "request_id": "chat-stable-message-id",
  "server_time": "2026-08-12T12:00:01+08:00",
  "data": {
    "mode": "live",
    "result_type": "CRISIS_REPLY",
    "user_message": {
      "message_id": "server-user-message-id",
      "client_message_id": "chat-stable-message-id",
      "role": "user",
      "text": "用户原始输入",
      "created_at": "2026-08-12T12:00:00+08:00"
    },
    "reply": {
      "message_id": "server-crisis-reply-id",
      "role": "assistant",
      "text": "产品与法务审核后的安全文本",
      "safety_result": "crisis",
      "fallback_used": false,
      "created_at": "2026-08-12T12:00:01+08:00"
    }
  },
  "error": null
}
```

### 9.4 App 的严格成功条件

以下条件必须同时满足，否则 App 将结果转换为 `CHAT_REPLY_INVALID`，用户消息保留为 `failed`，回复不会展示：

- `success=true`；
- `data.mode=live`；
- 外层 `request_id` 等于请求的 `client_message_id`；
- `result_type` 为 `REPLY` 或 `CRISIS_REPLY`；
- `REPLY` 必须对应 `safety_result=passed`；
- `CRISIS_REPLY` 必须对应 `safety_result=crisis`；
- `user_message.role=user`；
- `reply.role=assistant`；
- 两条消息都有非空且不同的服务端 `message_id`；
- `user_message.client_message_id` 与请求完全相同；
- 两条消息都有可解析、带日期和 `T` 的 ISO 8601 `created_at`；
- `reply.text` 非空；
- `fallback_used` 必须是布尔值，不能缺失，也不能使用字符串 `"false"`。

特别提醒：App 不再使用 `Date.now()`、`user-${clientId}`、`assistant-${Date.now()}` 或“我在听。”补齐正式响应。

### 9.5 服务端处理顺序

CTO 必须按以下顺序处理：

1. 校验 mode、client version 和正式 session；
2. 从 session 取得当前用户；
3. 校验 `egg_id` 存在且属于当前用户；
4. 校验服务端生命周期为 `HATCHED`；
5. 重新计算并校验当前 `chat_access.status=available`；
6. 以 `egg_id + client_message_id` 查询幂等记录；
7. 执行空白、120 Unicode 字符、个人敏感信息和一般违规检查；
8. 执行危机判断；
9. 由服务端读取已确认历史、当前场景、人设和允许使用的记忆；
10. 调用模型或审核过的服务端兜底；
11. 输出安全审核；
12. 原子保存用户消息与回复；
13. 返回权威 ID、时间和幂等结果。

不得信任 App 先前拿到的 `chat_access`。用户停留在聊天页期间状态可能变化，因此 `chatReply` 必须二次拦截。

## 10. `chatReply` 错误码与 App 行为

| 服务端结果 | HTTP / envelope | App 当前行为 | 是否显示重试 |
| --- | --- | --- | --- |
| `AUTH_REQUIRED` | 2xx + `success:false` | 清空当前聊天展示，提示重新登录 | 否 |
| `EGG_FORBIDDEN` | 2xx + `success:false` | 清空聊天，提示返回首页 | 否 |
| `NOT_HATCHED` | 2xx + `success:false` | 清空聊天，提示破壳后开放并返回首页 | 否 |
| `TALK_NOT_AVAILABLE` | 2xx + `success:false` | 移除 pending、恢复草稿、切换不可聊天页并展示服务端 message | 否 |
| `INPUT_EMPTY` | 2xx + `result_type=INPUT_REJECTED` | 移除 pending、恢复草稿、显示服务端提示 | 否 |
| `INPUT_TOO_LONG` | 同上 | 同上 | 否 |
| `SENSITIVE_INFO` | 同上 | 同上 | 否 |
| `CONTENT_REJECTED` | 同上 | 同上 | 否 |
| 未来新增输入拒绝码 | 2xx + `result_type=INPUT_REJECTED` | 即使 code 未内置，也按输入拒绝处理 | 否 |
| `RATE_LIMITED` | 2xx + `success:false` | 移除 pending、恢复草稿、显示轻提示 | 不提供原消息重试按钮 |
| `SERVICE_UNAVAILABLE` | 2xx 失败或 5xx | 原消息变为 failed | 是，复用同一 ID |
| `REQUEST_TIMEOUT` | 网络超时 | 原消息变为 failed | 是，复用同一 ID |
| `NETWORK_ERROR` / `HTTP_5xx` | 网络/网关错误 | 原消息变为 failed | 是，复用同一 ID |
| 未知错误 | 失败 envelope | 保守按 failed 处理 | 是，复用同一 ID |

输入拒绝示例：

```json
{
  "success": false,
  "request_id": "chat-stable-message-id",
  "server_time": "2026-08-12T12:00:01+08:00",
  "data": {
    "mode": "live",
    "result_type": "INPUT_REJECTED"
  },
  "error": {
    "code": "INPUT_TOO_LONG",
    "message": "服务端审核后的提示",
    "detail": null
  }
}
```

权限变化示例：

```json
{
  "success": false,
  "request_id": "chat-stable-message-id",
  "server_time": "2026-08-12T12:00:01+08:00",
  "data": {
    "mode": "live"
  },
  "error": {
    "code": "TALK_NOT_AVAILABLE",
    "message": "蛋宝宝现在暂时不能聊天，晚一点再来看看。",
    "detail": null
  }
}
```

所有 `error.message` 都必须是已审核、可直接面向用户的文案，不得包含模型、审核策略、供应商、数据库、堆栈或内部状态名称。

## 11. 幂等与原子落库要求

幂等键：

```text
egg_id + client_message_id
```

必须满足：

- 同一消息首次发送、网络超时后重试、页面原地重试都使用同一 `client_message_id` 和 `request_id`；
- 同一幂等键重复请求不得重复内容审核、重复调用模型或重复落库；
- 已有最终成功结果时，返回完全相同的用户消息 ID、回复 ID、正文、时间、result type 和安全结果；
- 已有最终输入拒绝结果时，返回相同拒绝结果，不得第二次进入模型；
- 用户消息和回复必须在同一事务或可恢复的一致性流程中提交；
- 不允许只落用户消息、未落回复却向 App 返回成功；
- 两个并发相同幂等请求只能有一个实际执行者；
- App abort 不等于服务端事务一定取消，服务端仍必须完成幂等收敛。

建议数据库唯一约束至少覆盖：

```text
UNIQUE (egg_id, client_message_id)
UNIQUE (message_id)
```

## 12. `getChatHistory` 接入合同

### 12.1 请求

首屏：

```json
{
  "egg_id": "egg-id",
  "cursor": "",
  "limit": 20,
  "mode": "live",
  "client_version": "3.7.0-ordinary",
  "session_id": "signed-session-id",
  "request_id": "generated-request-id"
}
```

后续分页只替换服务端返回的 opaque cursor。

### 12.2 成功响应

```json
{
  "success": true,
  "request_id": "generated-request-id",
  "server_time": "2026-08-12T12:10:00+08:00",
  "data": {
    "mode": "live",
    "messages": [
      {
        "message_id": "server-user-message-id",
        "client_message_id": "chat-stable-message-id",
        "role": "user",
        "text": "你好",
        "created_at": "2026-08-12T12:00:00+08:00"
      },
      {
        "message_id": "server-assistant-message-id",
        "role": "assistant",
        "text": "你好呀。",
        "created_at": "2026-08-12T12:00:01+08:00"
      }
    ],
    "next_cursor": "opaque-cursor-for-older-page",
    "has_more": true
  },
  "error": null
}
```

### 12.3 App 严格校验规则

- `messages` 必须是数组；
- 单页不能超过请求 limit，当前 limit 最大 20；
- role 只能是 `user` 或 `assistant`，不能返回 `system`、`model`、`bot` 等别名；
- 每条消息必须有非空且页内唯一的 `message_id`；
- 每条消息必须有非空 text；
- 每条消息必须有合法 ISO 8601 `created_at`；
- user 消息必须有 `client_message_id`；
- 单页固定按时间从旧到新排序；
- `has_more` 必须是真正的 boolean；
- `has_more=true` 时 `next_cursor` 必须非空；
- cursor 必须稳定、不透明，新消息写入不能导致旧页漏读或重复；
- 后续页只返回更早记录；
- 实时 `chatReply` 与历史接口必须使用同一组 message ID 和 created_at。

任一记录非法、页内重复或排序错误时，当前 App 会拒绝整页，而不是猜测修复。

### 12.4 内容边界

历史接口只能返回已确认聊天消息。不得混入：

- 明信片；
- 写信、留言或回信；
- 场景开场白；
- 模型内部 system prompt；
- 审核标签或风险分数；
- 推荐、广告、奖励或成长记录。

没有历史时返回空数组。App 可以在本次页面内展示一次场景开场白，但不会把它回传、持久化或要求服务端落库。

## 13. 数据安全与隐私边界

### 13.1 App 已完成

- 不在 pet storage 保存聊天正文；
- 读取旧版本 pet 缓存时清理遗留 `messages`；
- 不持久化 draft、pending 或 failed 正文；
- 不记录危机标签、安全评分或正文 analytics；
- 不把历史、场景、安全结论或人设上传给 `chatReply`；
- 账号或蛋变化时清空当前页面聊天状态；
- 危机回复只原样展示服务端结果。

### 13.2 CTO 必须完成

- 输入和输出均先审核、后展示、后落库；
- 危机判断和安全回复只在服务端执行；
- 日志、链路追踪和报警不得记录正文，必要字段必须脱敏；
- 危机最小审计与普通 analytics 隔离；
- 聊天正文不得进入画像、广告、推荐、成长值或角色关系系统；
- 删除、注销、备份、日志和第三方模型数据处理必须一致；
- 保存期限、危机审计例外和删除承诺必须与法务最终政策一致。

## 14. CTO 实施清单

### 14.1 P0：会话与权限

- [ ] `bootstrap` 返回正式签发的 `session_id`；
- [ ] 所有聊天接口只信任 session 身份；
- [ ] 校验蛋归属和 `HATCHED`；
- [ ] `getPostHatchHome` 返回权威 `chat_access`；
- [ ] `chatReply` 再次计算并拦截不可聊天状态；
- [ ] 业务错误以 2xx + `success:false` envelope 返回，确保 App 可以正确路由。

### 14.2 P0：内容与模型

- [ ] 服务端执行空白和 120 Unicode 字符上限；
- [ ] 服务端执行敏感个人信息和一般违规检查；
- [ ] 服务端执行危机判断及审核回复；
- [ ] 服务端读取权威场景、历史、人设和允许使用的记忆；
- [ ] 输出完成内容安全检查后才允许展示/落库；
- [ ] 模型故障转换为审核通过的 `REPLY`，并返回 `fallback_used=true`；
- [ ] 不向 App 返回供应商错误或未经审核的原始模型文本。

### 14.3 P0：幂等与数据

- [ ] `egg_id + client_message_id` 唯一；
- [ ] 重试不重复审核、模型调用或落库；
- [ ] 用户消息和回复原子提交；
- [ ] 实时与历史 ID、时间完全一致；
- [ ] 历史支持稳定 cursor 和每页最多 20 条；
- [ ] 账号注销与聊天删除真正联动；
- [ ] 危机审计、备份和日志遵守法务确认期限。

### 14.4 P0：环境与运维

- [ ] trial 只连接 staging；
- [ ] release 只连接 production；
- [ ] 域名完成微信合法域名配置；
- [ ] 提供已破壳居家/外出测试蛋；
- [ ] 监控鉴权失败、超时、5xx、限流、审核故障、模型兜底和幂等冲突；
- [ ] 提供灰度、熔断和回滚操作说明。

## 15. 推荐联调顺序

### 阶段 1：会话和 snapshot

1. 配置 trial staging 地址；
2. 完成 `bootstrap`，确认 App 收到服务端 session；
3. 完成 `getPostHatchHome`；
4. 验证 available、away、unavailable、缺字段和非法字段；
5. 验证未绑定、错归属和未破壳不能进入输入状态。

完成标准：生活空间和聊天直链都只以服务端 `chat_access` 决定是否可输入。

### 阶段 2：普通 chatReply

1. 先使用不接模型的服务端审核 fixture 返回完整 `REPLY`；
2. 对齐 request ID、双方 message ID、双方 created_at 和 `fallback_used`；
3. 验证 pending → sent；
4. 验证超时后同 ID 重试；
5. 验证数据库只有一组消息。

完成标准：重复请求三次只产生一次服务端处理和一组落库记录。

### 阶段 3：拒绝、危机与故障

依次联调：

1. `INPUT_EMPTY`；
2. `INPUT_TOO_LONG`；
3. `SENSITIVE_INFO`；
4. `CONTENT_REJECTED`；
5. `RATE_LIMITED`；
6. `TALK_NOT_AVAILABLE`；
7. `CRISIS_REPLY`；
8. 模型故障安全兜底；
9. 5xx 和超时。

完成标准：每类结果只进入本文指定 App 状态，正文和危机标签不进入本机 storage/analytics。

### 阶段 4：历史和跨端连续性

1. 首屏最近 20 条；
2. 向上加载至少三页；
3. 新消息写入后继续使用旧 cursor；
4. 模拟响应已落库但 App 未收到；
5. 回到前台后由历史确认同一 `client_message_id`；
6. 切账号、切蛋、跨设备检查隔离。

完成标准：不丢失、不重复、不串账号、不串蛋、时间顺序稳定。

### 阶段 5：production 灰度

1. 将 release 地址配置为 production；
2. 验证 release 不访问 staging；
3. 使用灰度账号完成完整链路；
4. 检查监控、报警、幂等计数和数据库记录；
5. 完成产品、CTO、App、测试和法务签字。

## 16. 联调验收用例

| 编号 | 场景 | 服务端预期 | App 预期 |
| --- | --- | --- | --- |
| I01 | available 居家 | snapshot 返回完整 chat_access | 可进入聊天并显示输入框 |
| I02 | away | 返回审核 message | 入口置灰，轻触只显示 message |
| I03 | SYSTEM unavailable | 返回中性审核 message | 不显示“不在家”误导文案 |
| I04 | chat_access 缺失 | 畸形 fixture | App 显示“权限正在同步”，不放行 |
| I05 | 空白绕过 App | `INPUT_EMPTY + INPUT_REJECTED` | 移除 pending、恢复草稿 |
| I06 | 121 Unicode 字符 | `INPUT_TOO_LONG` | 同上，不由 App 截断 |
| I07 | 一般违规 | `CONTENT_REJECTED` | 只展示服务端提示 |
| I08 | 危机表达 | `CRISIS_REPLY/crisis` | 原样展示服务端安全文本，不本地判断 |
| I09 | 模型故障 | 审核过 `REPLY`，`fallback_used=true` | 按成功显示，不暴露供应商错误 |
| I10 | 发送中状态变 away | `TALK_NOT_AVAILABLE` | 移除 pending、保留草稿、切不可聊天页 |
| I11 | 会话过期 | `AUTH_REQUIRED` | 清空聊天并引导登录 |
| I12 | 错账号访问蛋 | `EGG_FORBIDDEN` | 清空聊天并返回首页 |
| I13 | 未破壳 | `NOT_HATCHED` | 返回首页，不显示历史和输入框 |
| I14 | 限流 | `RATE_LIMITED` | 恢复草稿、轻提示，无 failed 重试按钮 |
| I15 | 超时后重试三次 | 相同幂等结果 | 页面只有一个用户气泡和一条回复 |
| I16 | 畸形成功响应 | 缺 result_type / ID / 时间等 | App 拒绝确认，不展示回复 |
| I17 | 历史页乱序或重复 | 畸形 fixture | App 拒绝整页并提供历史重试 |
| I18 | 杀进程重进 | 服务端返回已确认历史 | 正文从网络恢复，不从本机恢复 |
| I19 | 账号切换 | 返回新账号数据 | 不出现旧账号聊天 |
| I20 | release 构建 | production | 不访问 demo 或 staging |

## 17. App 自动化验证

聊天专项命令：

```bash
node scripts/verify-chat.js
```

当前结果：16 项通过，覆盖：

- 空白交互保护及服务端输入拒绝路由；
- 危机表达只交给服务端；
- 历史首屏、分页、严格字段、排序和去重；
- 稳定消息 ID 与幂等键；
- 页面 pending / sent / failed；
- timeout、abort 和旧回调隔离；
- 原地重试；
- 致命错误、限流和权限变化；
- 本机正文与危机标签禁存；
- develop/trial/release 隔离；
- 正式后端未配置时安全阻断；
- 项目核心回归。

全部 service 测试命令：

```bash
for test_file in miniprogram/services/tests/*.test.js; do
  node "$test_file" || exit 1
done
```

当前结果：全部通过。

这些测试只能证明 App 行为与 fixture 合同，不能替代 staging 服务端测试、数据库核验、日志核验或真机验收。

## 18. 当前尚未完成的发布阻断

- trial staging `apiBase` 未配置；
- release production `apiBase` 未配置；
- 服务端正式 session 未联调；
- `getPostHatchHome.chat_access` 未与真实服务联调；
- `chatReply` 鉴权、二次权限、输入/输出安全、危机策略、模型、幂等和原子落库无本仓库实现证据；
- `getChatHistory` 的正式保存、cursor 和跨设备一致性未联调；
- 注销、保存期限和危机审计例外待产品/法务确认；
- iOS / Android 键盘、安全区、长消息和弱动效待微信真机验收。

以上项目关闭前，不得以 develop demo、App mock 或自动化通过作为“正式聊天已上线”的证明。

## 19. 本轮文件变更清单

### 19.1 业务实现

- `miniprogram/app.js`
- `miniprogram/utils/pet-store.js`
- `miniprogram/services/analytics.js`
- `miniprogram/services/cloud-api.js`
- `miniprogram/services/chat-service.js`
- `miniprogram/services/chat-demo-fixture.js`（新增）
- `miniprogram/services/post-hatch-companion.js`
- `miniprogram/pages/chat/chat.js`
- `miniprogram/pages/chat/chat.wxml`
- `miniprogram/pages/chat/chat.wxss`

### 19.2 视觉资源

- `miniprogram/assets/icons/send-up.svg`（聊天页改为使用现有 SVG）
- `miniprogram/assets/ui/3d-scene-actions/runtime/ui_3d_scene_chat_boon_koi_96_v02.png`（新增，聊天页与生活空间入口共用）
- `miniprogram/assets/ui/3d-scene-actions/runtime/ui_3d_scene_chat_jade_rabbit_96_v02.png`（新增，聊天页与生活空间入口共用）

`miniprogram/assets/ui/chat-avatars/*.webp` 当前没有运行时代码或配置引用，不属于本轮正式聊天资源清单；不得因文件存在而标记为已接入。原始 v01 头像未覆盖。

### 19.3 测试与门禁

- `miniprogram/services/tests/chat-input-validation.test.js`
- `miniprogram/services/tests/chat-history.test.js`
- `miniprogram/services/tests/chat-message-id.test.js`
- `miniprogram/services/tests/chat-page-presentation.test.js`
- `miniprogram/services/tests/chat-request-lifecycle.test.js`
- `miniprogram/services/tests/chat-retry.test.js`
- `miniprogram/services/tests/chat-error-routing.test.js`（新增）
- `miniprogram/services/tests/chat-privacy-storage.test.js`（新增）
- `miniprogram/services/tests/post-hatch-companion.test.js`
- `scripts/verify-chat.js`
- `scripts/verify-v2.js`
- `scripts/verify-v211.js`

## 20. 责任边界

### App 已完成

- 页面入口与不可聊天展示；
- pending / sent / failed；
- timeout、abort、晚到响应隔离；
- 同 ID 原地重试；
- 严格成功响应与历史校验；
- 错误码页面路由；
- 本机正文和危机标签禁存；
- demo/live 隔离；
- 自动化门禁与 UI 优化。

### CTO 必须完成

- 正式会话；
- 蛋归属、HATCHED 和聊天权限校验；
- `chat_access` 权威合同；
- 幂等、限流、输入/输出安全、危机判断；
- 人设、上下文、记忆和模型兜底；
- 原子落库、游标历史和服务端时间；
- 删除、保存期限、审计和日志脱敏；
- staging / production、监控、灰度和回滚。

### 产品 / 法务必须确认

- 输入拒绝、限流和不可聊天的最终文案；
- 危机回复、未成年人策略和官方求助资源；
- 聊天与危机审计保存期限；
- 注销删除例外和隐私披露；
- 正式人设、记忆范围和安全规则版本。
