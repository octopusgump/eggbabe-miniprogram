---
name: ui-quick-mockup
description: 几分钟出一张「和现在的产品长得一样」的 UI 草图给用户看方向——用项目真实的样式写一个简单 HTML，截图发出去，用户说改哪就改哪再截。当用户说「先出个 UI 方案看看」「画个大概的样子」「出个草图」「这个界面怎么排」「给我看看效果」「要和现在的版本一致」，或者一个新功能 / 改版在写需求文档、动手写代码之前需要先对齐交互和布局时，必须使用本 skill。也适用于：用户对着截图说「这里不对、那里删掉、挪到这边」这类来回改图的场景。不用于：已经有 Figma 等设计定稿、要像素级还原的页面；整体视觉改版（那是设计师的活）。
---

# UI 快速草图

## 这是什么、不是什么

- **是**：方向草图。几分钟一张，用来对齐「放在哪、有几步、点什么、翻到哪」。
- **不是**：最终设计稿，也不是线上代码。草图定了之后，交互写进需求文档，视觉细节交给设计稿。
- 草图不改项目里的任何页面代码。草图文件放临时目录（有 scratchpad 就放 scratchpad），不提交进仓库。

## 四步做法

1. **找项目真实的样式**。先在项目里找全局样式的来源：设计变量 / 全局 CSS（如 `design-system.css`、`globals.css`、`tokens.css`、`theme.css`），或 Tailwind 配置里的颜色和圆角。草图页面先 `<link>` 引这份真实样式，再把本文末尾「草图公共样式」整段抄进草图的 `<style>`。
   - 公共样式里的颜色都写成 `var(--color-accent, #默认值)`：项目用同名变量就自动跟着变；变量名不一样，就在 `<style>` 开头写 `:root { --color-accent: 项目的主色; … }` 把项目的值抄过来。
   - 项目里完全找不到样式（新项目）就直接用默认值。
   - **不自己编颜色、不引外部 UI 库**，这样截出来才「和现在的版本一致」。
2. **写一个简单 HTML**（放临时目录）。照真实页面的骨架搭：顶栏 `.top`、左侧栏 `.side`、遮罩 `.mask`、弹窗 `.panel`（内含 `.panel-head` / `.panel-body` / `.panel-foot`）、按钮 `.btn` / `.btn.pri` / `.btn.ghost`。图片一律用 `.photo` 灰色块（加 `.b2` `.b3` 换色），不找真图。每个要解释的点贴一张黄色便签 `.note`（编号 ①②③，用 `style="left:…;top:…"` 摆在空白处，不挡要看的控件）。
3. **截图，自己先看，再发**。整段跑（第一次会下载浏览器，之后就快了）：
   ```bash
   npx -y playwright install chromium && npx -y playwright screenshot --viewport-size=1440,900 "file://<草图绝对路径>.html" <草图>.png
   ```
   截完**先自己看一遍图**：有没有错位、重叠、文字挤出框。然后把图片发给用户（能发文件就发文件，不能就给路径）。实在截不了图，就把 HTML 路径给用户，让他用浏览器打开。
4. **用户说改哪就改哪，再截**。一次只改他说的那一处，改完马上发新图。**不要自作主张加东西**：他没要的预览、筛选、第二个设置入口一律不加。

## 画草图时守的规矩

- **越简单越好**。能在最终页面里直接看到的效果，不要在弹窗里再做一份预览；同一个设置只放一个地方；用不上的筛选、选项全删。
- **一次只讲一件事**。弹窗 / 卡片一次只处理一个对象（例如一节、一条记录），用「上一个 / 下一个」翻，不要一屏堆所有对象。
- 按钮文案、字段名尽量用产品里已有的说法；新增的控件在便签里标「新增」。
- 便签只写「这是什么、怎么用」，不写实现细节。
- 发图时回复写清楚：这版改了什么（一两句）、要他定的一件事。

## 定稿之后

1. 把草图体现的交互写进需求文档，引用户原话逐字照录；草图 PNG 可以附在文档旁边。
2. 再动手写代码，页面样式照项目自己的设计规范。

## 来历

2026-09-24 在「标看看」项目里给一个配图弹窗来回画了七八版草图，用户说：「我很喜欢你快速出图的这种方式……以后这种场景可否都这么出？或者变成一个 skill」。上面「越简单越好」「一次只讲一件事」两条，就是那几轮里用户一句句改出来的：「你又做复杂了……画蛇添足，直接在页面中用户能看到最终效果就好了」「上面的『全部 30 节』这类的 option 都删掉 完全不需要」。

## 草图公共样式（整段抄进草图的 <style>）

```css
/* ui-quick-mockup 草图公共样式。叠在项目真实样式之上；项目有同名变量就跟着项目走，没有就用括号里的默认值。 */
body{margin:0;background:var(--color-bg-page,#f5f6f8);font-family:"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",system-ui,sans-serif;color:var(--color-text-primary,#1f2329)}
/* 顶栏 */
.top{height:64px;background:#fff;border-bottom:1px solid var(--color-border,#e3e5e8);display:flex;align-items:center;justify-content:space-between;padding:0 32px}
.crumb{font-size:13px;color:var(--color-accent,#2e5e8e)}
.btns{display:flex;gap:10px}
/* 按钮：.btn 描边，.btn.pri 实心主按钮，.btn.ghost 灰色次要 */
.btn{display:inline-block;border-radius:var(--radius-button,16px);padding:7px 16px;font-size:13px;border:1px solid var(--color-accent,#2e5e8e);color:var(--color-accent,#2e5e8e);background:#fff}
.btn.pri{background:var(--color-accent,#2e5e8e);color:#fff}
.btn.ghost{border-color:var(--color-border,#e3e5e8);color:var(--color-text-secondary,#5c6370)}
/* 左侧栏 */
.side{position:absolute;left:0;top:64px;bottom:0;width:270px;background:#fff;border-right:1px solid var(--color-border,#e3e5e8);padding:16px;font-size:13px;box-sizing:border-box}
.side div{padding:9px 4px;border-bottom:1px solid var(--color-divider,#eef0f2)}
/* 遮罩与弹窗 */
.mask{position:absolute;inset:64px 0 0 0;background:rgba(0,0,0,.3)}
.panel{position:absolute;left:340px;right:80px;top:84px;bottom:20px;background:#fff;border-radius:var(--radius-panel,14px);display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,.18);overflow:hidden}
.panel-head{padding:18px 24px 12px;border-bottom:1px solid var(--color-divider,#eef0f2)}
.panel-head h2{margin:0;font-size:20px;display:flex;justify-content:space-between}
.panel-body{flex:1;padding:16px 24px;overflow:hidden}
.panel-foot{border-top:1px solid var(--color-divider,#eef0f2);padding:12px 24px;display:flex;justify-content:space-between;align-items:center;font-size:13px}
.muted{color:var(--color-text-muted,#8a9099);font-size:12px}
/* 灰色占位图：.photo，再加 .b2 / .b3 换色，避免一排都一样 */
.photo{border-radius:8px;background:linear-gradient(160deg,#c9cfd6,#8e9aa6 55%,#6c7a88);position:relative;overflow:hidden;min-height:60px}
.photo::after{content:"";position:absolute;left:12%;right:12%;bottom:18%;height:28%;background:linear-gradient(90deg,#5d6b78 0 20%,transparent 20% 30%,#5d6b78 30% 55%,transparent 55% 62%,#5d6b78 62%);opacity:.55}
.photo.b2{background:linear-gradient(160deg,#d9d2c3,#a89a7e 55%,#7d705a)}
.photo.b3{background:linear-gradient(160deg,#cbd6cf,#8fa597 55%,#667d6e)}
/* 说明便签：只给看草图的人看，不是界面的一部分。用 style="left:…;top:…" 摆在空白处 */
.note{position:absolute;background:#fff8d6;border:1px dashed #c99a00;color:#6b5200;font-size:12px;padding:6px 9px;border-radius:6px;width:220px;line-height:1.5}
```
