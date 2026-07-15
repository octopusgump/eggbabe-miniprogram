# H5 自托管字体目录

字体由 `h5/birth-card` 的网页运行时加载，不要放进 `miniprogram/assets/`。

推荐目录结构：

```text
fonts/
├── google-sans/
│   ├── GoogleSans-Variable.woff2
│   └── OFL.txt
├── noto-sans-sc/
│   ├── NotoSansSC-Variable.woff2
│   └── OFL.txt
└── zcool-kuaile/
    ├── ZCOOLKuaiLe-Regular.woff2
    └── OFL.txt
```

- 每个字体家族必须保留它下载包内原始的 `OFL.txt`；不要把一个家族的许可证复制给另一个家族。
- 文件名可沿用下载包原名。若与示例不同，请在 `runtime-config.js` 中填写真实相对路径。
- `Google Sans` 只用于英文、数字与 MBTI；不能承担中文字形。
- 中文正文按 PRD 继续使用 `PingFang SC` 及系统 fallback。`Noto Sans SC` 先随项目保留，不默认加载。
- 收藏卡名字需要 Google Fonts 的 OFL 版 `ZCOOL KuaiLe`。只有前两包时会回退到 `PingFang SC`，不得用 Google Sans 或 Noto Sans SC 冒充。

整包静态字体就位后可这样配置：

```js
window.EGGBABE_H5_CONFIG = {
  googleSansFontUrl: './assets/fonts/google-sans/GoogleSans-Variable.woff2',
  nameFontUrl: './assets/fonts/zcool-kuaile/ZCOOLKuaiLe-Regular.woff2'
};
```

以后接入服务端按名字生成的 ZCOOL KuaiLe 子集时，填写 `nameFontUrlTemplate`；它会优先于 `nameFontUrl`。线上地址必须来自备案域名/CDN，不依赖 Google Fonts CDN。
