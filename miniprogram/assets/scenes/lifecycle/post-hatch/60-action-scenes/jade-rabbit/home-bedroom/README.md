# 玉兔卧室日常动作全景

本目录根层为 Jade Moon Rabbit（玉兔）正式运行时动作全景，共 24 张：八个日常动作各具 `day`、`sunset`、`night` 三个时段。

- 所有正式图均为 `2823×1672` 不透明 WebP，角色、动作与道具已烘焙。
- 文件名为 `home_bedroom_{nap|lazy|stare|read|game|window|draw|music}_{day|sunset|night}_v01.webp`。
- `nap` 是睡觉资源沿用的历史文件名；产品“小憩”使用独立内部键 `lazy`，不得复用睡觉图片。
- 破壳后只按 `day`、`sunset`、`night` 三个时段选择图片，不使用季节、天气或关灯覆盖图。
- 当前运行时不登记季节、天气或关灯扩展图；目录中的历史扩展文件仍待独立删除审核。
- 运行时只允许通过 `config/post-hatch-assets.js` 的 `resolveActionPanorama` 解析。
