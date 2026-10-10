# Eggbabe domain glossary

Domain language for the IAA companion loop. No implementation detail.

Canonical reading surface for IAA companion product rules: `docs/主PRD/02_蛋宝宝_IAA陪伴_PRD_v1.0.md` only (HTML previews abolished).

| Term | Meaning |
|---|---|
| 一起 X 天 | User-visible continuous companion-day count. +1 only on the first time that natural day the letter paper becomes visible (envelope → paper). Opening the letter without doing the core action still +1 day and awards 0 stars. A natural day with no letter open resets the streak to 1 on the next open (**断开清零**). Tea party completion never +1. |
| 断开清零 | If a Shanghai natural day passes without opening the letter paper, the continuous day streak and §5.1 ladder restart from day 1. Spending stars only lowers balance. |
| 点开信纸 | The UI moment the envelope opens and the letter paper is visible. This is the only trigger that +1s 一起 X 天. |
| 特别奖励（reward） | Today's letter class whose core action is not “one tap and done”: must run an independent flow with a clear result. Includes creation (一起画) and activity (茶会, etc.). |
| 一起画 | Post-hatch co-drawing entered only from today's letter. v1 (shipped rule): at least one non-eraser stroke completes; no quality score. v2 (rules decided, not shipped): ≥5 strokes, ≥15s active drawing, ≥5 of ~100 canvas cells touched; failed “画好了” shows one tip, no score UI. |
| 草图一起画 | Product name for **道具简笔挑战** (PRD §6.4): co-drawing on a prop-themed letter day. Not the abolished theme-drawing tiers (§6.5). Two counters: up to 3 sketch **glimpses** (看一看) vs **3 gated exports** for the keepsake prop. Step-by-step: PRD §6.4.1. |
| 道具临摹挑战 | Same as 草图一起画. Simplified prop **wireframe** on the egg canvas (~5s flip); user accumulates 3 successful “画好了” exports each meeting v2 local gates; then the prop unlocks in album **回忆·道具**. Rules decided, not shipped (PRD §6.4). |
| 道具简笔 | Non-photo, non-persistent line-art of the day’s prop shown briefly on the canvas during 道具临摹挑战; not a separate preview window. |
| 主题画画（废止） | Superseded draft (not on `main`): square canvas, full theme reference, 60%/30%/10% random tier stars decoupled from §5.2, tier celebration copy (“一起画完啦！” / “有份小礼物！” / “惊喜加倍！” as tier titles). Replaced by §5.2 + §7.5.1 + §6.4. See PRD §6.5. |
| 看一看次数 | How many more times the user may see the prop line sketch in this challenge (UI: 「还有 X 次机会看一看」). Each glimpse shows ~5s on the egg canvas then flip-dismisses; drawing starts after dismiss. X counts remaining glimpses, not progress toward the three successful exports. |
| 窗边茶会 | Album activity: confirm completion yields a photo; no base stars; never +1s 一起 X 天. |
| 陪伴事件 | One shared experience built around a concrete small thing with the pet: something happens, the user participates, the pet responds, the user gets a result, and the moment may continue into later companionship or memories. |
| 玩法闭环 | The five ordered segments of a companion event: 事情发生 → 用户参与 → 宠物回应 → 获得结果 → 后续延续. Each event SKU must define all five before the design is complete. |
| 后续延续 | Design intent for how an event connects to the next visit or to 回忆; may be same-day closure, a “明天呢？” clue, or cross-day content—not every event must produce cross-day material immediately, and it does not imply live memory services. |
| 基础结果 | Guaranteed outcome of an event once the user completes the core action (e.g. stars per §5.2, a photo, an exported drawing). Random surprise adds on top of this; it never replaces it. |
