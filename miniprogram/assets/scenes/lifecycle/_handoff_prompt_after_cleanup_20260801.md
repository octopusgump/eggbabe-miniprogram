# 蛋宝宝小程序图片续作提示词（删除旧 incubation 后）

下面代码块可直接完整复制到新的 Codex 对话框。

```text
请接续执行“蛋宝宝微信小程序正式多图层图片素材”任务，直接生成、转换、质检并保存文件，不要只给计划或提示词。

一、当前状态（必须先确认）

项目目录：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP

正式素材目录：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP/miniprogram/assets/scenes/lifecycle

旧目录 `miniprogram/assets/scenes/incubation/` 已经完整删除。旧版四季昼夜合成 WebP、旧蛋体以及旧目录结构均已淘汰：

- 不得恢复、重建或重新引用 `assets/scenes/incubation/`；
- 不得把房间、窗景、天气、窝垫和蛋体重新合成一张图；
- 现在必须继续使用 `lifecycle` 多图层结构。

当前运行时五层顺序：

1. 窗外天气背景；
2. 雨、雪、雾透明效果；
3. 房间基础层；
4. 窝垫；
5. 蛋体或角色。

运行时素材映射：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP/miniprogram/config/pre-hatch-assets.js

二、开始前必须完整读取

1. 主 PRD：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/PRD归档/蛋宝宝_日常陪伴系统_结构说明_v0.3.md

重点读取 §11。

2. 辅助 PRD：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/PRD归档/蛋宝宝小程序_V3_6_PRD.md

重点读取 §10.11。

3. 视觉风格指南：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ai-skills/eggbabe/蛋宝宝_CG魔幻冒险视觉风格指南.md

4. 分层规范：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP/miniprogram/assets/scenes/lifecycle/README.md

5. 生成清单及历史提示词：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP/miniprogram/assets/scenes/lifecycle/_generation_manifest.md

优先级：用户本提示词 > 主 PRD > 辅助 PRD > lifecycle/README > 其他历史说明。

三、费用和生成方式

用户不接受单独计费的 OpenAI API：

- 不要要求 OPENAI_API_KEY；
- 不要调用需要 API Key 的图片脚本；
- 直接使用当前 Codex 内置 imagegen 能力；
- 可以读取本地参考图并执行本地格式转换、抠图和质检。

若无法直接生成可靠透明图，使用已经验证的折中流程：

1. 生成均匀纯洋红 `#FF00FF` 中间稿；
2. 本地去除洋红背景和溢色；
3. 导出真正带 Alpha 的 WebP；
4. 用棋盘格和实际房间背景检查边缘；
5. 洋红中间稿不得作为正式文件。

四、已完成且禁止覆盖的正式素材

固定清单共 47 张，当前已就绪 19 张，剩余 28 张。

以下 19 张不得重新生成或覆盖：

1. 7 张窗景：
   - shared/10-background/window-weather/w_01_clear_day.webp
   - shared/10-background/window-weather/w_02_clear_sunset.webp
   - shared/10-background/window-weather/w_03_clear_night.webp
   - shared/10-background/window-weather/w_04_cloudy_day.webp
   - shared/10-background/window-weather/w_05_cloudy_night.webp
   - shared/10-background/window-weather/w_06_snow_day.webp
   - shared/10-background/window-weather/w_07_snow_night.webp

2. 雾、雨、雪已改为首页窗户 Canvas 绘制，不再生成或放入透明天气 overlay 图片。

3. 房间与窝垫：
   - pre-hatch/10-background/incubation-room/room_base.webp
   - pre-hatch/20-room-objects/window-and-nest/nest_pad.webp

4. 4 件破壳前互动小物：
   - pre-hatch/20-room-objects/interactive-props/table_lamp.webp
   - pre-hatch/20-room-objects/interactive-props/coffee_machine.webp
   - pre-hatch/20-room-objects/interactive-props/drawing_paper_set.webp
   - pre-hatch/20-room-objects/interactive-props/scarf.webp

5. 2 张角色基准：
   - post-hatch/30-character/jade-rabbit/stare.webp
   - post-hatch/30-character/boon-koi/stare.webp

6. 正面蛋体：
   - pre-hatch/30-character/egg/egg_on_nest.webp

此外，当前运行时房间使用：
pre-hatch/10-background/incubation-room/room_base_candidate_v2.webp

它已经符合“左墙宽度稳定、右侧无窗帘、木色不漂移”的最新确认标准，也不得覆盖。8 个 `pre-hatch/50-overlays/interaction-icons/*.svg` 已从旧目录迁移完成，同样不要重做。

五、只需继续生成以下 28 张

A. 蛋体背影（1 张，优先）

保存到：pre-hatch/30-character/egg/

- egg_window_back.webp

参考：
- 同目录 egg_on_nest.webp：唯一比例、尺寸、纹理、光向与锚点基准；
- 同目录 egg_base_chroma_reference.png：仅作原始造型参考。

要求：1254×1254；同一枚奶白织物蛋；整体缩放、轮廓宽高和中心锚点不得漂移；必须是真正背影，不出现闭眼、嘴、腮红或其他正面五官；透明底；不含房间、窗户、桌面、窝垫或整图投影。

B. 破壳后背景（2 张）

- post-hatch/10-background/left-living/left_living.webp
- post-hatch/10-background/right-decor/right_decor.webp

必须属于当前房间同一空间、同一机位体系：奶油墙面、浅蜂蜜木色、柔和右上方自然光。左屏包含小木床、浅蓝被子、白枕、圆球小夜灯和无文字线稿画，但不含角色和可切换被子前景。右屏为干净装扮区，不烘焙用户家具、角色或 UI。出现窗洞时必须是真实 Alpha。

C. 玉兔姿态（6 张）

保存到：post-hatch/30-character/jade-rabbit/

- sleep.webp
- lazy.webp
- tea.webp
- drawing.webp
- gaming.webp
- window_back.webp

标准角色参考：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/01_IP角色设计/01_玉兔 Jade Moon Rabbit/00_View_References/01_Character_Turnaround/JadeRabbit_ReferenceSheet_Standard_02.webp

以同目录 stare.webp 为正式画布、缩放、落地点、材质和光向基准。参考图优先于任何文字描述。

D. 锦鲤姿态（6 张）

保存到：post-hatch/30-character/boon-koi/

- sleep.webp
- lazy.webp
- tea.webp
- drawing.webp
- gaming.webp
- window_back.webp

标准角色参考：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/01_IP角色设计/02_锦鲤 Boon Koi/00_View_References/01_Character_Turnaround/Koi_ReferenceSheet_Standard_02.png

以同目录 stare.webp 为正式画布、缩放、落地点、材质和光向基准。参考图优先于任何文字描述。

E. 互动反馈（8 张）

左屏：post-hatch/20-room-objects/left-living/

- blanket_open.webp
- blanket_covered.webp
- lamp_dark_overlay.webp

中屏：post-hatch/20-room-objects/center-desk/

- paper_back.webp
- paper_front.webp
- game_screen_idle.webp
- game_screen_active.webp

前景：post-hatch/40-interaction-fx/

- tea_steam.webp

两张被子使用相同画布和锚点；lamp_dark_overlay 是透明深蓝夜色层；paper_front 只保留无文字涂鸦；游戏画面只能是无品牌、无文字的抽象微光；蒸汽必须真实透明。

F. 魔法窗景区（3 张）

保存到：post-hatch/50-overlays/magic-window/

- dali.webp
- beijing.webp
- xishuangbanna.webp

严格遵循辅助 PRD §10.11.5。原创景观，不含窗框、角色、文字、招牌、Logo 或 UI；四边预留约 15% 出血；边缘仅有克制柔和的魔法光晕和细小光点。

G. 魔法窗角色背影（2 张）

保存到：post-hatch/50-overlays/magic-window/

- jade_rabbit_back_silhouette.webp
- boon_koi_back_silhouette.webp

角色位于 1254×1254 透明画布下方，只呈现真正背面轮廓和背面材质；不含景区、窗框、文字、正面五官或额外光效。角色比例必须分别对齐正式 stare.webp。

六、不可漂移标准

房间：

- 左侧墙面可见宽度保持当前确认版本；
- 只允许左侧薄纱窗帘，右侧不得新增窗帘；
- 桌面及家具保持浅蜂蜜木色，不得偏橙、偏红或变暗；
- 房间、窗景、天气、窝垫、角色必须独立分层；
- 透明窗洞必须具有真实 Alpha。

玉兔：

- 奶油白短绒毛绒质感；
- 大圆头、两只修长直立圆耳、紧凑梨形身体、短四肢；
- 超大黑白高光眼、蓝灰三角鼻、小嘴；
- 左右脸颊各三道蓝灰纹样；
- 不增加衣服、配饰、花纹或新结构；
- 不改变头身比、耳长、体宽、眼睛和四肢尺寸；
- 必须真实落地，不能悬浮。

锦鲤：

- 奶油白椭圆鱼身、织物压纹和细鳞质感；
- 大眼睛与弧形微笑；
- 棕橙色条纹胸鳍、背鳍和下鳍；
- 奶油白分叉尾、极短双腿、芥末黄色靴子；
- 不增加手臂、服装、配件或新结构；
- 不改变鱼身长宽比、眼睛大小、鱼鳍位置、腿长和靴子比例。

所有角色：

- 固定 1254×1254 画布；
- 对齐对应 stare.webp 的角色外接框、脚底锚点和底部约 8% 安全区；
- 保持相同右上方柔和暖光、白位、黑位和饱和度；
- 透明底、四角 Alpha=0；
- 不含场景、窗框、床、桌、UI 或整体投影；
- 只有动作确实需要时才允许小型手持物；
- window_back 必须是真正背面，不能出现正面五官。

统一视觉：温暖治愈的精致 3D CG、低饱和奶油色、真实柔软的织物/毛绒、浅蜂蜜木材和陶瓷触感、柔和自然光、轻微浅景深、干净不杂乱、魔法感克制。

通用禁止项：真人、文字、UI、按钮、商标、招牌、二维码、Logo、水印、第三方平台图片、假透明棋盘格、白底、绿色底、洋红正式底、整张画布投影。

七、执行与落盘规则

1. 先扫描上述 28 个目标路径和对应 README，不要假设文件缺失。
2. 目标不存在才生成；若已存在，先检查。合格则复用，不合格则保留原文件并输出 `_candidate_v2.webp`，不得直接覆盖。
3. 每次只处理 1–4 张同类素材；每小批完成后立即转换、质检并落盘，不要一次生成全部后再分类。
4. 每张必须检查：路径、WebP、尺寸、Alpha、四角透明、色边、角色比例、脚底锚点、窗洞透明、文字/UI/Logo、多余结构、文件大小及真实背景合成效果。
5. 不修改页面结构、业务逻辑、Tab 或交互代码。当前多图层代码已经迁移并通过回归。
6. 不删除、reset、checkout、覆盖或归档现有用户文件；工作区包含其他未提交改动，全部保留。
7. 每完成一批，更新：
   - lifecycle/_generation_manifest.md
   - 对应子目录 README.md
8. 清单必须记录完整提示词、来源参考、尺寸、字节数、Alpha 结果以及正式/候选状态。
9. 最后运行项目既定校验和 `git diff --check`。

八、建议执行顺序

1. 读取规范，扫描并核对 19 张已完成与 28 张待生成；
2. 先生成 egg_window_back.webp；
3. 再生成两张破壳后背景；
4. 玉兔按 1–3 张一批生成并对齐 stare.webp；
5. 锦鲤按 1–3 张一批生成并对齐 stare.webp；
6. 生成 8 张互动反馈；
7. 生成 3 张魔法窗景区；
8. 生成 2 张魔法窗角色背影；
9. 全量执行 Alpha、尺寸、文件大小和合成预览检查；
10. 更新 manifest 与 README；
11. 汇报新增正式数量、候选数量、复用数量、失败/跳过原因和最终剩余数量。

请现在直接开始执行。不要重新生成已完成的 19 张，不要恢复旧 incubation 目录，不要改走单独计费 API，也不要只回复计划。
```
