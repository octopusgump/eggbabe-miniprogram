# 破壳后 · 明信片

正式旅行目的地：大理、北京、西双版纳、东京。

产品表现：

- 旅行期间三屏生活空间显示空着的家与第一人称文字，不加载目的地插画；
- ta 回家后，可在明信片列表与详情中看到预制旅途插画；
- 同一次旅程在列表中只占一个入口；进入后可左右浏览同一 `journey_id` 下的多个场景，浏览不改变 ta 当前状态；
- 东京是正式目的地，但当前 `_candidates/` 内图片仍是候选，不能直接接入运行时。
- 回放页会处理无旅程、旅程 ID 不匹配与图片加载失败，并始终提供返回；不会伪造角色走动、热点或实时状态。

发布门禁：候选图不进入 `post-hatch-assets.js`，trial / release 不渲染开发预览控件。当前微信 `packOptions.ignore` 同时作用于预览与上传，不能在保留微信开发版候选验收的同时仅对 trial / release 排除目录；发布前必须在开发者工具的上传文件清单人工确认候选目录未被带入。

正式待补：`postcard_travel_dali.webp`、`postcard_travel_beijing.webp`、`postcard_travel_xishuangbanna.webp`、东京正式动作明信片组、`postcard_work_cafe.webp`、`postcard_work_restaurant.webp`、`postcard_work_delivery.webp`、`postcard_work_carwash.webp`、`postcard_school_ai.webp`、`postcard_school_english.webp`、`postcard_school_weather.webp`。

要求：正面插画不含用户信件正文；文字由小程序原生层渲染。当前使用固定比例纸张占位。

旅行明信片的内容、画面、命名、验收与上线门禁见：

`01_MiniProgram_MVP/docs/蛋宝宝旅行明信片内容与美术规格_v1.0.md`
