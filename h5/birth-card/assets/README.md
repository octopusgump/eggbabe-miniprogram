# 破壳卡素材放置说明

H5 不根据图片文件名猜测款式，所有素材都通过配置显式映射。

- 角色素材：`assets/figures/`。透明角色切图推荐 PNG/WebP；自带场景背景的完整插画可以使用 JPG，但必须在素材目录表中标记为 `composite-illustration`。
- 卡面背景图：`assets/posters/`，推荐 JPG/WebP，9:16 竖图，建议至少 1080 × 1920 px。
- 统一文件名：`{角色代码}__{系列}__{场景或款式}__v{两位版本号}.{扩展名}`。
- 示例：`YT__watercolor__bath__v01.jpg`、`KOI__classic__lucky-red__v02.png`。
- 角色代码固定大写，目前使用 `YT`、`KOI`；系列、场景和款式固定使用小写英文 `kebab-case`。
- 分隔符固定使用双下划线 `__`；禁止空格、中文文件名、`final`、`new` 等无法排序的版本词。
- 升级同一素材时只递增版本号，不覆盖旧文件，例如 `v01` → `v02`。

新增角色素材后，先登记到 `assets/figures/catalog.json`；真正用于破壳卡时，再在 `asset-config.js` 或远程 manifest 中配置对应 `figure_key` / `bg_key`。素材域名必须允许跨域读取，否则页面可以显示图片，但浏览器不能把它们绘制进分享长图。

当前玉兔水彩系列 JPG 自带背景，不应再叠加成“透明角色切图”。如果直接用于 Hero，建议作为完整插画使用；如果要与独立背景海报组合，需要另行提供透明底 PNG/WebP。
