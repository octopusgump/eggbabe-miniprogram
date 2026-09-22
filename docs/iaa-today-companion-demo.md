# 今日陪伴｜实现与验收说明

今日陪伴是每日陪伴主循环的第一段，属于正式用户功能：在 `develop`、`trial`、`release` 中，点击破壳后房间左上角现有的“今日心情”卡，即可在当前房间上方打开信件 overlay；不跳转到第二张场景图，不新增按钮或解释文案。

本功能是房间内的前端静态 overlay，不接云函数、数据库、远程 AI 或正式业务接口。内容为 COO 已确认的本地静态 fixture，可进入正式版，但不代表 CTO 服务已经接入。

## 在微信开发者工具验收

正式用户路径（三个环境一致）：

1. 导入仓库根目录，确认 `miniprogramRoot` 为 `miniprogram/`。
2. 进入破壳后房间 `pages/life-scene/life-scene`。
3. 点击左上角“今日心情”卡打开信件；点击信件外的房间区域关闭。

验收记录：2026-09-22 COO 在开发者工具与手机“预览”中人工验收通过（信件四项内容、“明天呢？”展开、信件内 `+1`、关闭后左上角 `+1`）。注意：开发者工具“预览”扫码在微信里仍属开发状态（develop），会显示“验收：工具”钮；正式状态（体验版 / 正式版）由 CTO 接口调试阶段上传体验版后预览确认，本次不上传后台。

开发状态补充入口（仅 `develop`）：编译参数 `entry=iaa-core-review` 可用内存 fixture 直达房间；`pages/iaa-core-review/iaa-core-review` 提供四段对比入口和 fixture 切换。`trial` / `release` 命中旧的 `pages/iaa-today-companion` 路径会回到房间正式入口。

## 静态边界

- 所有内容来自 `miniprogram/fixtures/iaa-today-companion.js`。
- 房间 overlay 只通过 `miniprogram/services/iaa-today-companion-adapter.js` 消费统一视图模型。
- 轻互动在本次小程序运行内存中同步房间左上角星星状态，不写入本地存储、纪念册或任何远程数据。
- 信件内保留本次 `+1`，关闭信件回到房间时，左上角“陪伴星星”同步展示 `+1`；同日重复进入不重复增加。页面内防重复点击只是前端保护，不是正式服务端幂等。
- “明天呢？”初始可见，点击后只展开一句明日内容；完成陪伴不会自动展开。
- 正式接口接入时由 CTO 保持 `iaa-mvp-v1` 返回形状并替换 adapter，页面不直接读取服务端专属字段。
