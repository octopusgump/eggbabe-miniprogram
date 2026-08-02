# 破壳后 · 中屏桌面区后景

中屏不再单独生成，直接复用 `miniprogram/config/pre-hatch-assets.js` 中对应 scene key 的正式 `background`。
完整画布、切图、状态和验收规则见 `../THREE_PANEL_SCENE_SET_SPEC.md`。

中屏是三屏母版的机位、透视、材质和光照锚点，生成左右扩展时不得重绘或改变中屏。角色、文字、杯子、画纸和游戏屏幕的交互状态继续保持独立图层。
