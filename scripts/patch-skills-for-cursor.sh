#!/usr/bin/env bash
# Adapt mattpocock/skills for Cursor: slash menu + no Claude "Skill tool".
set -euo pipefail
ROOT="${1:-.cursor/skills}"
shopt -s nullglob
for skill_md in "$ROOT"/*/SKILL.md; do
  perl -i -0pe 's/^disable-model-invocation: true\n//mg' "$skill_md"
  perl -pi -e 's/call the Skill tool twice, for "grilling" and "domain-modeling"/read and follow `.cursor\/skills\/grilling\/SKILL.md` and `.cursor\/skills\/domain-modeling\/SKILL.md`/gi' "$skill_md"
  perl -pi -e 's/Call the Skill tool twice, for "grilling" and "domain-modeling"/Read and follow `.cursor\/skills\/grilling\/SKILL.md` and `.cursor\/skills\/domain-modeling\/SKILL.md`/g' "$skill_md"
  perl -pi -e 's/[Cc]all the Skill tool with "([^"]+)"/Read and follow `.cursor\/skills\/$1\/SKILL.md`/g' "$skill_md"
  perl -pi -e 's/calls the Skill tool with "([^"]+)"/reads and follows `.cursor\/skills\/$1\/SKILL.md`/g' "$skill_md"
  perl -pi -e 's/calling the Skill tool with "([^"]+)"/reading `.cursor\/skills\/$1\/SKILL.md`/g' "$skill_md"
  perl -pi -e 's/[Cc]all the Skill tool with `([^`]+)`/Read and follow `.cursor\/skills\/$1\/SKILL.md`/g' "$skill_md"
  perl -pi -e 's/calls the Skill tool with `([^`]+)`/reads and follows `.cursor\/skills\/$1\/SKILL.md`/g' "$skill_md"
  perl -pi -e 's/call the Skill tool for/ read `.cursor\/skills\/<name>\/SKILL.md` for/gi' "$skill_md"
done

cat > "$ROOT/grill-with-docs/SKILL.md" << 'EOF'
---
name: grill-with-docs
description: Stress-test a plan or design in grilling rounds and capture glossary/ADR as you go.
---

Read and follow `.cursor/skills/grilling/SKILL.md` and `.cursor/skills/domain-modeling/SKILL.md` in one session.
EOF
