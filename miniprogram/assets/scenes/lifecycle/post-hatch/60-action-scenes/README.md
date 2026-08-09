# 破壳后日常动作全景

`jade-rabbit/home-bedroom/` 与 `boon-koi/home-bedroom/` 存放两个角色的正式运行时动作全景图。

- 每张为 `2823×1672`、不透明 WebP，角色、动作与道具均已烘焙。
- 玉兔与锦鲤均已登记睡觉、小憩、发呆、看书、打游戏、看窗外、画画、听音乐，共 8 个动作 × 3 个时段 = 每角色 24 张春季晴朗基础动作图。
- 小憩的内部键为 `lazy`；小憩和发呆的 `day`、`sunset`、`night` 仅对应春季晴朗三个环境键。
- 睡觉使用内部键 `sleep`，正式文件为兼容既有 CDN 路径继续沿用 `home_bedroom_nap_*` 文件名；不得将它与小憩重复计数。
- `home_bedroom_nap_lights_off_night_v01.webp` 是夜间睡觉动作完成（关灯）后的闭眼变体；只在玉兔执行 `lamp_off` 后显示。
- 只能由 `config/post-hatch-assets.js` 的 `resolveActionPanorama` 解析；不得作为 `10-background`、`30-character` 或三张切图使用。
- 仅在玉兔、对应居家状态、晴朗且 `day` / `sunset` / `night` 时显示；其他天气或其他角色必须继续使用正式环境全景。
- 该目录由 `project.config.json` 排除出主包，运行时通过 `environmentCdnBase` 加载。
