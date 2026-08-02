# 蛋宝宝小程序图片素材续作提示词

> 本版生成于删除旧 `assets/scenes/incubation/` 之前，现已停止使用。请改用同目录的 `_handoff_prompt_after_cleanup_20260801.md`。

下面内容可直接完整复制到新的 Codex 对话框。

```text
请接续完成“蛋宝宝微信小程序正式分层图片素材”任务。不要从头重做，也不要覆盖已经合格的正式文件。

一、项目与依据

项目目录：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP

正式素材根目录：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP/miniprogram/assets/scenes/lifecycle

主 PRD：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/PRD归档/蛋宝宝_日常陪伴系统_结构说明_v0.3.md

辅助 PRD：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/PRD归档/蛋宝宝小程序_V3_6_PRD.md

视觉风格指南：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ai-skills/eggbabe/蛋宝宝_CG魔幻冒险视觉风格指南.md

原始任务说明：
/Users/octopusgump/.codex/attachments/76b60f29-52ae-4da0-993d-7185ff278b89/pasted-text.txt

当前生成清单与完整历史提示词：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP/miniprogram/assets/scenes/lifecycle/_generation_manifest.md

总视觉基准：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP/miniprogram/assets/scenes/lifecycle/README.md

开始前请完整阅读主 PRD §11、辅助 PRD §10.11、视觉风格指南、lifecycle/README.md 和 _generation_manifest.md。以主 PRD 为最高优先级。

二、费用与生成方式

用户不希望使用需要单独计费的 OpenAI API，不要要求 OPENAI_API_KEY，也不要调用 API 脚本。

优先直接使用当前 Codex/ChatGPT 提供的 imagegen 图片生成能力。若生成器不能直接输出可靠透明背景，可以继续采用已验证的折中策略：

1. 生成纯色洋红 #FF00FF 中间稿；
2. 本地移除洋红背景；
3. 输出带真实 Alpha 的 WebP；
4. 在棋盘格和实际背景上视觉检查边缘；
5. 洋红底不得作为正式文件落盘。

三、目前进度

固定任务共 47 张，目前 19 张已经就绪，剩余 28 张。

已经就绪的 19 张不得重新生成或覆盖：

1. 7 张窗外底图：
   - shared/10-background/window-weather/w_01_clear_day.webp
   - shared/10-background/window-weather/w_02_clear_sunset.webp
   - shared/10-background/window-weather/w_03_clear_night.webp
   - shared/10-background/window-weather/w_04_cloudy_day.webp
   - shared/10-background/window-weather/w_05_cloudy_night.webp
   - shared/10-background/window-weather/w_06_snow_day.webp
   - shared/10-background/window-weather/w_07_snow_night.webp

2. 雾、雨、雪已改为首页窗户 Canvas 绘制，不再生成或放入透明天气 overlay 图片。

3. 破壳前房间：
   - pre-hatch/10-background/incubation-room/room_base.webp

4. 蛋窝：
   - pre-hatch/20-room-objects/window-and-nest/nest_pad.webp

5. 四件破壳前互动小物：
   - pre-hatch/20-room-objects/interactive-props/table_lamp.webp
   - pre-hatch/20-room-objects/interactive-props/coffee_machine.webp
   - pre-hatch/20-room-objects/interactive-props/drawing_paper_set.webp
   - pre-hatch/20-room-objects/interactive-props/scarf.webp

6. 两张角色表现基准：
   - post-hatch/30-character/jade-rabbit/stare.webp
   - post-hatch/30-character/boon-koi/stare.webp

7. 正面蛋体：
   - pre-hatch/30-character/egg/egg_on_nest.webp

这些文件已经完成尺寸、格式、Alpha 或不透明通道检查。详细尺寸、字节数和完整提示词见 _generation_manifest.md。

四、下一步需要生成的 28 张

请按以下顺序继续，每一小批生成后立即转换、检查并落盘，不要只给提示词后停止。

A. 剩余一张蛋体，优先完成

目录：pre-hatch/30-character/egg/

- egg_window_back.webp

蛋体标准参考：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/02_产品与网站项目/03_蛋宝宝C端小程序/01_MiniProgram_MVP/miniprogram/assets/scenes/lifecycle/pre-hatch/30-character/egg/egg_base_chroma_reference.png

要求：严格对齐现有 egg_on_nest.webp，保持同一枚奶白色织物纹理蛋、相同 1254×1254 画布、缩放和中心锚点。egg_window_back 必须是真正背影，不出现正面五官。透明底，不含房间、窗户、桌面或整体投影。

B. 破壳后三屏背景（本段已由 2026-08-02 三屏规范替代）

不再生成两张单一通用背景。以破壳前 20 个有效状态为中屏锚点，分别生成 20 张左屏和 20 张右屏。文件名、画布、生产顺序和完整清单以 `post-hatch/10-background/THREE_PANEL_SCENE_SET_SPEC.md` 为准。

C. 玉兔剩余姿态，6 张

目录：post-hatch/30-character/jade-rabbit/

- sleep.webp
- lazy.webp
- tea.webp
- drawing.webp
- gaming.webp
- window_back.webp

玉兔标准参考：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/01_IP角色设计/01_玉兔 Jade Moon Rabbit/00_View_References/01_Character_Turnaround/JadeRabbit_ReferenceSheet_Standard_02.webp

同目录 stare.webp 是当前正式比例、画布、材质和光向基准，必须优先对齐。

D. 锦鲤剩余姿态，6 张

目录：post-hatch/30-character/boon-koi/

- sleep.webp
- lazy.webp
- tea.webp
- drawing.webp
- gaming.webp
- window_back.webp

锦鲤标准参考：
/Users/octopusgump/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCowork/蛋宝宝_eggbabe/01_IP角色设计/02_锦鲤 Boon Koi/00_View_References/01_Character_Turnaround/Koi_ReferenceSheet_Standard_02.png

同目录 stare.webp 是当前正式比例、画布、材质和光向基准，必须优先对齐。

E. 破壳后互动反馈，8 张

左屏：post-hatch/20-room-objects/left-living/

- blanket_open.webp
- blanket_covered.webp
- lamp_dark_overlay.webp

中屏：post-hatch/20-room-objects/center-desk/

- paper_back.webp
- paper_front.webp
- game_screen_idle.webp
- game_screen_active.webp

前景效果：post-hatch/40-interaction-fx/

- tea_steam.webp

两张被子必须相同画布和锚点；lamp_dark_overlay 是透明深蓝夜色层；paper_front 只有无文字涂鸦；游戏画面只能是无品牌、无文字的抽象彩色微光；蒸汽必须真实透明。

F. 魔法窗景区，3 张

目录：post-hatch/50-overlays/magic-window/

- dali.webp
- beijing.webp
- xishuangbanna.webp

严格采用辅助 PRD §10.11.5。景区画面必须原创，不含窗框、角色、文字、招牌、Logo 或 UI。预留四边 15% 出血，边缘使用克制的柔和魔法光晕和细小光点。

G. 独立魔法窗角色背影，2 张

目录：post-hatch/50-overlays/magic-window/

- jade_rabbit_back_silhouette.webp
- boon_koi_back_silhouette.webp

角色位于透明画布下方，只表现真正的背面轮廓和背面材质；不含景区、窗框、文字、正面五官或额外光效。

五、必须锁定的视觉标准

统一视觉语言：温暖治愈的精致 3D CG，柔和自然光，低饱和奶油色体系，真实但可爱的织物、毛绒、木材与陶瓷触感，浅景深，干净不杂乱，克制魔法感。

房间：

- 左侧墙面可见宽度不得漂移；
- 只保留原构图中的左侧薄纱窗帘，右侧不得新增窗帘；
- 桌面和家具保持浅蜂蜜木色，不得偏橙、偏红、过暗；
- 窗外天气和景色必须与房间分层；
- 窗洞必须是真实透明 Alpha。

玉兔：

- 奶油白短绒/毛圈材质；
- 大圆头、两只修长直立圆耳、紧凑梨形身体、短四肢；
- 超大黑白高光眼、蓝灰三角鼻、小嘴；
- 左右脸颊各三道蓝灰纹样；
- 不得增加服装、配饰或花纹；
- 不得改变头身比、耳长、体宽、四肢尺寸；
- 必须落地，不能漂浮。

锦鲤：

- 奶油白椭圆鱼身与织物压纹/细鳞质感；
- 大眼睛和弧形微笑；
- 棕橙色条纹胸鳍、背鳍和下鳍；
- 奶油白分叉尾；
- 极短双腿和芥末黄色靴子；
- 不得增加手臂、服装、配件或新结构；
- 不得改变鱼身长宽比、眼睛大小、鱼鳍位置、腿长和靴子比例。

角色统一规格：

- 1254×1254 固定画布；
- 对齐现有 stare.webp 的角色整体缩放、脚底锚点、底部约 8% 安全区、主光方向、白位、黑位和饱和度；
- 透明底、四角 Alpha=0；
- 不含床、桌、房间、窗框、屏幕或整体场景；
- 茶杯、笔等动作必需的小型手持物可以保留；
- window_back 必须是真正背影。

通用禁止项：真人、文字、UI、按钮、商标、招牌、二维码、Logo、水印、可识别商业主体、第三方平台用户图片、假透明棋盘格、白底、绿色底、整体画布投影。

六、落盘与质检规则

1. 开始前扫描上述 29 个目标路径。
2. 如果目标文件已经存在，不得直接覆盖；先检查，合格则复用，不合格则保留原文件并输出 `_candidate_v2.webp`。
3. 每张正式文件生成后立即检查：
   - 文件路径；
   - WebP 格式；
   - 宽高和同批画布；
   - RGBA/真实透明通道；
   - 四角透明；
   - 洋红、绿色或白色残边；
   - 角色比例与脚底锚点；
   - 窗洞 Alpha；
   - 是否出现文字、UI、Logo 或多余物件；
   - 文件大小；
   - 叠加到真实背景后的视觉效果。
4. 不修改页面结构、业务逻辑、底部 Tab 或交互代码。
5. 不删除、reset、checkout 或重新归档现有文件；项目工作区已有其他 dirty files，必须全部保留。
6. 每完成一批，更新：
   - lifecycle/_generation_manifest.md
   - 对应目录 README.md
7. _generation_manifest.md 必须继续逐项记录完整提示词、尺寸、格式、字节数、Alpha 结果和正式/候选状态。

七、推荐执行顺序

1. 读取并复核现有 19 张和清单；
2. 生成剩余一张蛋体背影；
3. 生成两张破壳后三屏背景；
4. 生成玉兔 6 张；
5. 生成锦鲤 6 张；
6. 生成 8 张互动反馈；
7. 生成 3 张魔法窗景区；
8. 生成 2 张角色背影；
9. 全量 Alpha、尺寸、文件大小和合成预览检查；
10. 更新清单和 README；
11. 运行项目既定校验与 git diff --check；
12. 汇报本次新增数量、正式/候选状态、跳过原因和最终剩余数量。

请直接执行生成、转换、分类落盘和视觉质检，不要只回复计划或提示词。若当前 Codex 内置图片生成入口可用，直接使用；不要改走需要单独计费的 API。
```
