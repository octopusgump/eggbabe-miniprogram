# eggbabe 收藏卡 H5

本目录是普通版“一蛋一份”收藏卡的移动端 H5。H5 只根据 `card_id` 从受信任的服务端读取已经确定的 `live` JSON，再完成展示和分享长图渲染。

H5 不接受 URL 注入卡片 JSON，不提供预览参数，不生成名字、插画、编号、时间或其他业务字段，也不接受 `demo` 数据。

## 数据字段

必需字段为 `card_id`、`egg_id`、`mode=live`、`prototype`、`style`、`display_name`、`hatched_at`、`identity_code` 和 `illustration_key`；`source_batch` 可空。插画地址与真实小程序码由服务端返回。

## 上线接入

1. 将本目录发布到备案域名 `eggbabe.com` 下的 HTTPS 地址。
2. 在微信公众平台配置业务域名和下载域名。
3. 在 `runtime-config.js` 固定可信 `apiBase`。
4. 在小程序 `config/v2.js` 配置 `birthCardH5Url` 与 `birthCardApiBase`。
5. 服务端实现 `GET {apiBase}/cards/{card_id}?mode=live`，并保证幂等返回同一枚实体蛋的同一张有效收藏卡。
6. 真机验收相册授权、H5 `postMessage` 回传和小程序侧保存流程。

未完成 H5 接入时，小程序自动使用相同字段的原生收藏卡兜底。
