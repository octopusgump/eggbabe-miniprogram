# Eggbabe domain glossary

Domain language for the IAA companion loop. No implementation detail.

Canonical reading surface for IAA companion product rules: `docs/主PRD/02_蛋宝宝_IAA陪伴_PRD_v1.0.md` only (HTML previews abolished).

| Term | Meaning |
|---|---|
| 一起 X 天 | 用户看到的连续有效陪伴日数。上海自然日内第一次完成有效活动 +1；只开信或进入画纸不计日。缺一天未完成则中断，下次完成从 1 天重新算。茶会不计日。 |
| 断开清零 | 上海自然日没有完成有效活动时，连续陪伴日数中断。下一次完成从第 1 天重新算；已完成题库进度与已得星星不清零。 |
| 点开信纸 | 从信封打开到信纸可见的时刻，只表示读过今日信，不表示完成活动，也不发基础星星或计日。 |
| 特别奖励（reward） | Today's letter class whose core action is not “one tap and done”: must run an independent flow with a clear result. Includes creation (一起画) and activity (茶会, etc.). |
| 一起画 | Post-hatch co-drawing entered only from today's letter. v1 (shipped rule): at least one non-eraser stroke completes; no quality score. v2 (rules decided, not shipped): ≥5 strokes, ≥15s active drawing, ≥5 of ~100 canvas cells touched; failed “画好了” shows one tip, no score UI. |
| 道具临摹挑战 | A letter-bound co-drawing challenge: simplified prop sketch flashes briefly on the egg canvas; user has 3 “看一看” glimpses; must accumulate 3 successful “画好了” exports each meeting v2 local gates; then the prop unlocks in album **回忆**. Rules decided, not shipped (PRD §6.4). |
| 道具简笔 | Non-photo, non-persistent line-art of the day’s prop shown briefly on the canvas during 道具临摹挑战; not a separate preview window. |
| 主题画画（废止） | Superseded draft (not on `main`): square canvas, full theme reference, 60%/30%/10% random tier stars decoupled from §5.2, tier celebration copy (“一起画完啦！” / “有份小礼物！” / “惊喜加倍！” as tier titles). Replaced by §5.2 + §7.5.1 + §6.4. See PRD §6.5. |
| 看一看次数 | How many more times the user may see the prop line sketch in this challenge (UI: 「还有 X 次机会看一看」). Each glimpse shows ~5s on the egg canvas then flip-dismisses; drawing starts after dismiss. X counts remaining glimpses, not progress toward the three successful exports. |
| 窗边茶会 | Album activity: confirm completion yields a photo; no base stars; never +1s 一起 X 天. |
| 陪伴事件 | One shared experience built around a concrete small thing with the pet: something happens, the user participates, the pet responds, the user gets a result, and the moment may continue into later companionship or memories. |
| 玩法闭环 | The five ordered segments of a companion event: 事情发生 → 用户参与 → 宠物回应 → 获得结果 → 后续延续. Each event SKU must define all five before the design is complete. |
| 后续延续 | Design intent for how an event connects to the next visit or to 回忆; may be same-day closure, a “明天呢？” clue, or cross-day content—not every event must produce cross-day material immediately, and it does not imply live memory services. |
| 基础结果 | Guaranteed outcome of an event once the user completes the core action (e.g. stars per §5.2, a photo, an exported drawing). Random surprise adds on top of this; it never replaces it. |

## Language

**今日信件**：
当天呈现给用户、承载一个核心陪伴事件的信件。不同于可逐条回看的聊天记录。
_Avoid_: 历史消息队列、活动待办箱

**信件未读**：
用户尚未打开今日信纸的阅读状态，与是否完成信内活动无关。
_Avoid_: 活动未完成、回忆未收下

**待收下照片**：
用户已在陪伴中获得、尚未主动收录进纪念册的照片，属于已有结果。
_Avoid_: 未读事件、错过的活动

| Term | Meaning |
|---|---|
| 听你说 | 破壳后由宠物用生活小事邀请用户选择答案的活动，每组五题，完成后有一条宠物反馈。 |
| 题组 | 同一类别里按预设顺序编写的五道题，完整回答后推进到下一组。 |
| 匹配反馈 | 用户所选答案满足全部指定要求时可使用的预写完整反馈；不拼接句子。 |
| 保底文案 | 没有合适匹配反馈，或最高支持题数并列时使用的本组完整回应，不猜测未表达的想法。 |
| 支持题数 | 一条反馈全部要求满足后，要求中涉及的不同题目数；排除项不计数。 |
| 每日基础星星 | 当天第一次完成有效活动领取的一份星星，答题、一起画和普通信件互动共用，不重复领取。 |
| 画画小回礼 | 实际完成画画后独立判定的 +3 星回礼，保留首次必送、之后每天一次 33% 机会，不是另一份基础星星。 |
| 跳过本次 | 本次先退出答题，保留未完成组和输入；不算完成，也不领取星星。 |

**出题备注**：
供内容编写与审核使用的情境边界和编写要求，不属于宠物向用户说的话。
_Avoid_: 用户提示、题干说明
