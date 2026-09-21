# IAA 今日陪伴 UI｜开发验收说明

本功能是房间内的前端静态 overlay，不接云函数、数据库、远程 AI 或正式业务接口。微信 `develop` 构建中，点击破壳后房间左上角现有的“今日心情”卡即可在当前房间上方打开信纸；不跳转到第二张场景图，不新增按钮或解释文案。`trial` / `release` 在正式接口尚未接入时不开放该入口。

## 在微信开发者工具打开

1. 导入仓库根目录，确认 `miniprogramRoot` 为 `miniprogram/`。
2. 启动破壳后房间 `pages/life-scene/life-scene`，参数使用 `entry=iaa-core-review`。
3. 点击左上角“今日心情”卡打开信纸；点击信纸外的房间区域关闭。

## 静态边界

- 所有内容来自 `miniprogram/fixtures/iaa-today-companion.js`。
- 房间 overlay 只通过 `miniprogram/services/iaa-today-companion-adapter.js` 消费统一视图模型。
- 当前轻互动会在本次小程序运行内存中同步房间左上角星星状态，不写入本地存储、纪念册或任何远程数据。
- 正式接口接入时由 CTO 保持 `iaa-mvp-v1` 返回形状并替换 adapter，页面不直接读取服务端专属字段。
