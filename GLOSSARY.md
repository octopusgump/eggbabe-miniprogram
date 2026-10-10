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
| 道具临摹挑战 | A letter-bound co-drawing challenge: simplified prop sketch flashes briefly on the egg canvas; user has 3 “看一看” glimpses; must accumulate 3 successful “画好了” exports each meeting v2 local gates; then the prop unlocks in album **回忆**. Rules decided, not shipped (PRD §6.4). |
| 道具简笔 | Non-photo, non-persistent line-art of the day’s prop shown briefly on the canvas during 道具临摹挑战; not a separate preview window. |
| 看一看次数 | How many more times the user may see the 道具简笔 flash in this challenge (UI: 「还有 X 次机会看一看」). X counts remaining glimpses, not progress toward the three successful exports. |
| 窗边茶会 | Album activity: confirm completion yields a photo; no base stars; never +1s 一起 X 天. |
