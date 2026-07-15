# H5 自托管字体目录

完整字体由 `h5/birth-card` 的网页运行时加载，不要重复放进 `miniprogram/assets/`。原生卡面在 `miniprogram/assets/fonts/zcool-kuaile/font.wxss` 中内嵌性情独白所需的小型 TTF 子集；原生保存图使用同一字体预渲染的 2x 透明 PNG，避免旧版 Canvas 静默回退系统字体。小程序包内同时携带独立 `OFL.txt`。

推荐目录结构：

```text
fonts/
├── google-sans/                       # 运行时文件，纳入 Git
│   ├── GoogleSans-Variable.woff2
│   └── OFL.txt
├── noto-sans-sc/                       # 设备无 PingFang SC 时加载
│   ├── NotoSansSC-Variable.woff2
│   └── OFL.txt
└── zcool-kuaile/                       # 收藏卡名字与性情独白字体
    ├── ZCOOLKuaiLe-Regular.woff2
    └── OFL.txt
```

- 每个字体家族必须保留它下载包内原始的 `OFL.txt`；不要把一个家族的许可证复制给另一个家族。
- 本机下载的完整 TTF 源包目录 `Google_Sans/`、`Noto_Sans_SC/`、`ZCOOL_KuaiLe/` 已由 `.gitignore` 排除；源文件留在本机，不随 H5 部署。
- 运行时只提交由源包转换出的三个 WOFF2 与每个家族自己的 `OFL.txt`，避免把约 149 MB 的全部字重打进部署包。
- `Google Sans` 只用于英文、数字与 MBTI；不能承担中文字形。
- 中文正文仍优先使用 `PingFang SC`；设备缺少 PingFang SC 时，按需加载本地 `Noto Sans SC`，再回退系统字体。
- 收藏卡名字与性情独白需要 Google Fonts 的 OFL 版 `ZCOOL KuaiLe`。只有前两包时会回退到 `PingFang SC`，不得用 Google Sans 或 Noto Sans SC 冒充。

整包静态字体就位后可这样配置：

```js
window.EGGBABE_H5_CONFIG = {
  googleSansFontUrl: './assets/fonts/google-sans/GoogleSans-Variable.woff2',
  notoSansScFontUrl: './assets/fonts/noto-sans-sc/NotoSansSC-Variable.woff2',
  nameFontUrl: './assets/fonts/zcool-kuaile/ZCOOLKuaiLe-Regular.woff2'
};
```

以后接入服务端动态 ZCOOL KuaiLe 子集时，填写 `nameFontUrlTemplate`；前端会同时传入名字与性情独白的字符，它会优先于 `nameFontUrl`。线上地址必须来自备案域名/CDN，不依赖 Google Fonts CDN。
