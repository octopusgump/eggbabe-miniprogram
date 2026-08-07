# 破壳后日常动作全景

`jade-rabbit/home-bedroom/` 存放玉兔卧室日常动作的正式运行时全景图。

- 每张为 `2823×1672`、不透明 WebP，角色、动作与道具均已烘焙。
- 只能由 `config/post-hatch-assets.js` 的 `resolveActionPanorama` 解析；不得作为 `10-background`、`30-character` 或三张切图使用。
- 仅在玉兔、对应居家状态、晴朗且 `day` / `night` 时显示；日落、其他天气或其他角色必须继续使用正式环境全景。
- 该目录由 `project.config.json` 排除出主包，运行时通过 `environmentCdnBase` 加载。
