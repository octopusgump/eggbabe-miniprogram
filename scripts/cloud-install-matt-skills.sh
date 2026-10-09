#!/usr/bin/env bash
set -euo pipefail
npx --yes skills@latest add mattpocock/skills -a cursor -g -y --copy
mkdir -p "${HOME}/.cursor/skills"
for d in "${HOME}"/.agents/skills/*/; do
  name=$(basename "$d")
  rm -rf "${HOME}/.cursor/skills/${name}"
  cp -R "$d" "${HOME}/.cursor/skills/${name}"
done
cat > "${HOME}/.cursor/skills/grill-with-docs/SKILL.md" << 'EOF'
---
name: grill-with-docs
description: Grill a plan or design relentlessly and write domain docs (glossary, ADRs) as you go. Use when the user invokes grill-with-docs.
---

# Grill with Docs

1. Read and follow `~/.cursor/skills/grilling/SKILL.md` — interview in rounds.
2. Read and follow `~/.cursor/skills/domain-modeling/SKILL.md` — write glossary/ADR as you go.

Ask what design to grill, then run both together.
EOF
cp "${HOME}/.cursor/skills/grill-with-docs/SKILL.md" "${HOME}/.agents/skills/grill-with-docs/SKILL.md"
