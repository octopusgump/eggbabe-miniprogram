# eggbabe 收藏卡 H5

本目录包含收藏卡与角色档案两个移动端 H5 视图。H5 只负责展示、切换档案和生成分享长图，不在浏览器内随机生成姓名、插画、编号或角色属性。

卡面采用三段式 9:16 模板：顶部只保留名字与放大的系列序号，中部为服务端已选定的 4:5 水彩插画，底部依次显示「类型 / 生日 / 星座 / 性别 / 血型 / MBTI」六个两列三行信息块，并在其下完整展示可换行的性情独白。插画使用 cover 方式铺满视口，卡面不使用黑色内描边，三段内容距卡片四边等距。名字按需加载 Google Fonts OFL 版 `ZCOOL KuaiLe` 的 `text=` 子集，失败时回退 PingFang SC。

角色档案里的“修改名字”会通过微信 H5 桥回到小程序昵称页；保存后本地卡面与云端卡片记录会同步更新。

## 本地预览

在项目根目录启动任意静态文件服务器，然后打开：

`/h5/birth-card/index.html?preview=1&view=card`

档案页把 `view` 改为 `profile`。预览固定读取 `sample/card.json`。

第一季系列收藏卡预览：

`/h5/birth-card/index.html?preview=collectible`

该预览读取 `sample/collectible-card.json`，正面显示名字、六个身份信息块、完整性情独白和系列内编号；全局编号只进入分享图脚注。

## 数据入口

页面按以下顺序读取数据：

1. `card_data`：仅供内部开发预览注入的 URL 编码 JSON，不作为用户入口。
2. `card_id`：正式卡通过 `runtime-config.js` 固定的可信 API 读取 `GET {apiBase}/cards/{card_id}?mode=live`。页面不接受 URL 传入 API 地址，防止切换到伪造服务。
3. `preview=1` 或 `preview=collectible`：仅本地预览固定样例。

字段契约和合法性由 `card-model.js` 统一校验；姓名为空时只展示“未命名”，不会在 H5 随机起名。

## 上线接入

1. 将本目录发布到已备案的 HTTPS 域名。
2. 在微信公众平台把该域名加入小程序“业务域名”。
3. 在 `miniprogram/config/v2.js` 配置 `birthCardH5Url` 和 `birthCardApiBase`；前者用于打开 H5，后者用于正式模式启用前的安全门禁。
4. H5 未部署或地址不可用时，小程序会用相同的已定稿数据打开原生完整卡面；不会再把用户留在“配置后开放”的提示上。
4. 在 H5 的 `runtime-config.js` 固定填写同一可信 `apiBase`，并部署卡片查询接口；正式模式缺少接口时会安全回退原生页或显示错误。
5. 如需后台更新款式素材，在 `runtime-config.js` 配置 `assetManifestUrl`，返回与 `asset-config.js` 相同结构的 JSON。
6. 配置 `miniProgramCodeUrl` 或在卡片接口返回 `mini_program_code_url`；任何模式缺少真实小程序码时都会阻止导出，不生成占位码。

在上述配置未完成前，小程序自动使用原生收藏卡和档案页，不会出现空白 `web-view`。
