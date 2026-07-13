# 场景卡资源投放规范

正式卡面统一放在：

`miniprogram/assets/cards/<character>/<scene>/<card-id>.<ext>`

当前玉兔建议使用以下目录：

- `miniprogram/assets/cards/jade-rabbit/grass/`
- `miniprogram/assets/cards/jade-rabbit/snow/`
- `miniprogram/assets/cards/jade-rabbit/room/`
- `miniprogram/assets/cards/jade-rabbit/seaside/`
- `miniprogram/assets/cards/jade-rabbit/desk/`
- `miniprogram/assets/cards/jade-rabbit/roof/`

文件名必须与 `miniprogram/utils/exhibition-scenes.js` 中的 `cardId` 保持一致，例如：

`miniprogram/assets/cards/jade-rabbit/grass/rabbit-grass-sun.png`

对应卡池配置：

```js
{
  cardId: 'rabbit-grass-sun',
  name: '草叶上的午后',
  rarity: '普通',
  image: '/assets/cards/jade-rabbit/grass/rabbit-grass-sun.png',
  tint: '#DDE9B9',
  mark: '草'
}
```

卡面优先使用 PNG；如需控制包体积也可使用 JPG，但必须在卡池的 `image` 字段中写入真实扩展名。推荐尺寸 `1200 × 1600 px`，同一系列保持相同比例。卡片中不要烘焙按钮、状态栏或小程序界面元素。

后续新增角色时建立独立角色目录，例如锦鲤使用 `miniprogram/assets/cards/boon-koi/`，不要把不同角色的卡面混放在同一目录。
