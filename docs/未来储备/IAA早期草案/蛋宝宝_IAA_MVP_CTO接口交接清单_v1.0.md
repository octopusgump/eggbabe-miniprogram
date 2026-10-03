# 蛋宝宝 IAA MVP｜CTO 接口交接清单 v1.0

> 状态：前端合同草案，供 CTO 评审
>
> 日期：2026-09-19
>
> 基线：`origin/main` @ `739270a`
>
> 适用范围：前端静态项目与未来正式服务之间的字段、状态和交接方式
>
> 本文只定义前端需要什么，不指定 CTO 的数据库、框架、部署方式或内部算法。

## 一、双方怎么配合

前端先按固定 fixture 完成全部页面和失败状态。CTO 接入时只需让 adapter 获得同形状数据，不要求页面理解服务端内部模型。

```text
前端交付
页面截图 + 状态清单 + fixture + adapter + 合同测试
  ↓
CTO 回传
字段映射 + 枚举 + 错误码 + 样例响应 + 测试环境
  ↓
联调
只替换 adapter 数据源，不重写页面
```

## 二、前端需要的六类能力

| 合同能力 | 前端需要的结果 | CTO 负责的业务事实 |
| --- | --- | --- |
| 今日状态 | 宠物动作、是否在家、对白、明日提示 | 日期、服务端时间、内容调度和正式状态选择 |
| 完成陪伴 | 成功、今日已领、失败及最新星星数 | 幂等、防刷、有效互动判定和审计 |
| 纪念内容 | 锁定、已解锁、新解锁及展示素材 | 解锁资格、持久化、跨设备一致性和内容下发 |
| 激励广告 | 可用、完成、取消、失败及奖励结果 | 广告位、SDK、校验、反作弊和结算 |
| 埋点 | 前端事件是否接收 | 入库、去重、留存指标和数据治理 |
| 合规内容 | 当前有效版本和展示文本 | 法务定稿、版本管理、记录与服务端合规 |

## 三、统一响应外壳

```json
{
  "contractVersion": "iaa-mvp-v1",
  "requestId": "req_example_001",
  "serverNow": "2026-09-19T20:00:00+08:00",
  "data": {},
  "error": null
}
```

失败时：

```json
{
  "contractVersion": "iaa-mvp-v1",
  "requestId": "req_example_002",
  "serverNow": "2026-09-19T20:00:01+08:00",
  "data": null,
  "error": {
    "code": "TEMPORARILY_UNAVAILABLE",
    "message": "暂时没有记下来，请稍后再试",
    "retryable": true
  }
}
```

前端展示文案不能依赖服务端自由文本；`code` 决定界面状态，`message` 只用于日志和联调诊断。

## 四、关键请求与响应形状

路径名称可由 CTO 调整，但字段语义和枚举变化需要双方同步更新合同版本与样例。

### 1. 读取今日状态

```json
{
  "dateKey": "2026-09-19",
  "pet": {
    "id": "pet_001",
    "name": "玉兔",
    "activity": "DRAWING",
    "atHome": true
  },
  "today": {
    "dayType": "NORMAL",
    "line": "我还没画完，明天再给你看。",
    "tomorrowHint": "桌上还压着半张没有画完的纸。"
  },
  "star": {
    "balance": 2,
    "dailyClaimStatus": "AVAILABLE",
    "nextUnlockAt": 3
  },
  "newlyUnlockedMemory": null,
  "rewardedAd": {
    "status": "AVAILABLE",
    "placement": "extra-memory"
  }
}
```

### 2. 提交一次陪伴互动

前端发送：

```json
{
  "interactionId": "client_generated_unique_id",
  "dateKey": "2026-09-19",
  "type": "TOUCH"
}
```

CTO 返回：

```json
{
  "result": "STAR_GRANTED",
  "starBalance": 3,
  "dailyClaimStatus": "CLAIMED",
  "grantedStars": 1,
  "newlyUnlockedMemory": {
    "id": "memory_unfinished_drawing",
    "name": "没画完的画",
    "line": "它说还差一点，第二天真的把颜色补完了。",
    "rarity": "SPECIAL",
    "imageUrl": "https://example.invalid/memory.webp"
  }
}
```

`interactionId` 用于服务端幂等。重复提交必须返回同一业务结果，不能再次增加星星。

### 3. 读取纪念册

```json
{
  "items": [
    {
      "id": "memory_unfinished_drawing",
      "status": "UNLOCKED",
      "name": "没画完的画",
      "date": "2026-09-19",
      "location": "房间",
      "character": "玉兔",
      "line": "它说还差一点，第二天真的把颜色补完了。",
      "rarity": "SPECIAL",
      "imageUrl": "https://example.invalid/memory.webp"
    },
    {
      "id": "memory_first_snow",
      "status": "LOCKED",
      "silhouetteUrl": "https://example.invalid/silhouette.webp"
    }
  ]
}
```

### 4. 确认激励广告结果

前端只上报平台返回的结果和必要凭证，不在本机决定奖励成功：

```json
{
  "interactionId": "client_generated_unique_id",
  "placement": "extra-memory",
  "clientResult": "COMPLETED",
  "platformEvidence": "opaque_platform_value"
}
```

CTO 返回 `REWARD_GRANTED`、`ALREADY_GRANTED`、`NOT_COMPLETED` 或 `VERIFY_FAILED`。只有前两种可进入奖励 Reveal。

## 五、最小错误码

| code | 前端行为 |
| --- | --- |
| INVALID_REQUEST | 保留当前页并提示无法完成，不自动重试 |
| UNAUTHORIZED | 进入现有登录 / 授权失效流程 |
| ALREADY_CLAIMED | 刷新星星状态，不重复播放得星动画 |
| TEMPORARILY_UNAVAILABLE | 显示轻量失败提示并允许重试 |
| AD_NOT_COMPLETED | 返回原场景，不发奖励 |
| AD_VERIFY_FAILED | 显示暂时无法发放，不在本地补发 |
| CONTRACT_VERSION_MISMATCH | 阻止继续写入并记录诊断信息，不猜字段 |

未知错误一律按失败处理，不能降级为成功。

## 六、前端交给 CTO 的材料

1. 当前合同版本和本文；
2. 所有 fixture 文件及每个状态对应的页面截图；
3. adapter 方法签名和合同测试；
4. 开发态状态切换器的状态列表；
5. 前端实际使用的事件名和触发时机；
6. 未执行的真实验证清单，明确哪些只能在测试环境或真机完成。

## 七、CTO 回给前端的材料

1. 字段映射和正式枚举；
2. 每个成功 / 失败状态的一份真实样例响应；
3. 幂等规则：唯一键、重复请求和超时重试的行为；
4. 可重试与不可重试错误码；
5. 测试环境地址、测试账号和必要凭据的安全交付方式；
6. 广告能力可用条件和真机验证步骤；
7. 正式内容与合规文案的版本号。

运行凭据不进入文档、fixture、Git 提交或截图。

## 八、联调验收

1. 同一个 `interactionId` 重复提交不会重复增加星星；
2. 服务端时间跨日后，前端刷新得到新的 `dateKey` 和领取状态；
3. 超时后重试能得到确定结果，不会出现界面失败但服务端已重复发奖；
4. 未登录、今日已领、临时故障和合同版本不匹配均进入对应前端状态；
5. 广告取消、未看完和校验失败均不发奖励；
6. 接口返回未知枚举时前端失败关闭，不猜测展示；
7. fixture 与真实响应通过同一份合同测试；
8. 联调完成后，正式构建仍不包含测试凭据和开发态切换器。
