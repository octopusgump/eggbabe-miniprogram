# IAA 今日陪伴 UI｜开发验收说明

本页是独立的前端静态演示，不接云函数、数据库、远程 AI 或正式业务接口，也没有挂到现有正式入口。

## 在微信开发者工具打开

1. 导入仓库根目录，确认 `miniprogramRoot` 为 `miniprogram/`。
2. 新建编译模式，启动页面填写 `pages/iaa-today-companion/iaa-today-companion`。
3. 可选启动参数：`scenario=normal&state=ready`。
4. 页面右上角“验收”入口只在 develop 构建出现，可切换：
   - 今日：普通、惊喜、外出、归来；
   - 页面：内容、加载、空态、失败。

空态和失败态中的按钮会回到当前场景的内容态，用于检查重试流程。

## 静态边界

- 所有内容来自 `miniprogram/fixtures/iaa-today-companion.js`。
- 页面只通过 `miniprogram/services/iaa-today-companion-adapter.js` 消费统一视图模型。
- 当前轻互动只展示本页反馈，不写入星星、纪念册或任何远程数据。
- 正式接口接入时由 CTO 保持 `iaa-mvp-v1` 返回形状并替换 adapter，页面不直接读取服务端专属字段。
