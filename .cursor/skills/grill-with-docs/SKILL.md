---
name: grill-with-docs
description: Stress-test a plan or design in numbered grilling rounds, then capture terms in GLOSSARY.md and decisions in docs/adr/ as they settle.
---

# Grill with Docs

## Start

Ask what plan, feature, or design to grill. Do not implement until the user confirms shared understanding.

## Grilling (rounds)

Map decisions as a **design tree**. Each **round**, ask every question on the **frontier** (prerequisites already settled). Number questions; give a recommended answer per question so "yes" accepts it. Wait for answers before the next round.

```
❓ **Q1** - **Title**: body

➡️ recommended answer

---
```

Look up facts yourself; only decisions go to the user. Stop when the frontier is empty and the user confirms understanding.

## Domain docs (same session)

- Challenge terms against `GLOSSARY.md` if it exists; create at repo root when the first term is settled.
- Glossary = domain language only, no implementation detail.
- Offer ADRs under `docs/adr/` only when hard to reverse, surprising without context, and a real trade-off.
- Update glossary inline as terms crystallize; do not batch.

## This repo

Eggbabe miniprogram: pure frontend UI scope per `AGENTS.md` unless the user expands the topic.
