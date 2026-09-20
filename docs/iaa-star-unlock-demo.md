# IAA 陪伴星星与纪念解锁｜开发验收说明

本页是独立的前端静态演示，不挂到现有正式导航，不接云函数、数据库、账号、远程 AI 或正式接口。

在微信开发者工具中新建编译模式，启动页面填写 `pages/iaa-star-unlock/iaa-star-unlock`。可选启动参数为 `state=AVAILABLE`。

develop 构建右上角“验收”入口覆盖：

- `AVAILABLE`：首次有效互动演示 `+1`，当前 fixture 从 2 星达到 3 星并解锁纪念；
- `CLAIMED`：重复互动只给陪伴反馈，不重复增加；
- `UNLOCKED`：直接检查新纪念弹层；
- `ERROR`：互动失败后保留当前余额，用户主动重试成功后才演示 `+1`。

页面只通过 `miniprogram/services/iaa-star-unlock-adapter.js` 消费 `iaa-mvp-v1` 视图模型。正式的每日幂等、服务端时间、星星写入、跨设备同步和纪念解锁判定均由 CTO 后续实现；本地 fixture 不证明这些能力已经上线。
