# 破壳后日常动作全景

`jade-rabbit/home-bedroom/` 与 `boon-koi/home-bedroom/` 存放两个角色的正式运行时动作全景图。

- 每张为 `2823×1672`、不透明 WebP，角色、动作与道具均已烘焙。
- 玉兔与锦鲤均已登记睡觉、小憩、发呆、看书、打游戏、看窗外、画画、听音乐，共 8 个动作 × 3 个时段 = 每角色 24 张正式基础动作图。
- 破壳后只保留 `day`、`sunset`、`night` 三个时段，不再使用季节或天气矩阵。
- 睡觉使用内部键 `sleep`，正式文件为兼容既有 CDN 路径继续沿用 `home_bedroom_nap_*` 文件名；不得将它与小憩重复计数。
- 只能由 `config/post-hatch-assets.js` 的 `resolveActionPanorama` 解析；不得作为 `10-background`、`30-character` 或三张切图使用。
- 两个角色在对应居家状态和有效时段下，均读取各自根目录的正式基础图。
- 历史扩展图已移出本资源树，本目录不再维护扩展矩阵。
- 该目录由 `project.config.json` 排除出主包，运行时通过 `environmentCdnBase` 加载。
