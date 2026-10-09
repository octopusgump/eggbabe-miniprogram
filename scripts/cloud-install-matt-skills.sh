#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
npx --yes skills@latest add mattpocock/skills -a cursor -g -y --copy
mkdir -p "${HOME}/.cursor/skills" "${REPO_ROOT}/.cursor/skills"
for d in "${HOME}"/.agents/skills/*/; do
  name=$(basename "$d")
  rm -rf "${HOME}/.cursor/skills/${name}" "${REPO_ROOT}/.cursor/skills/${name}"
  cp -R "$d" "${HOME}/.cursor/skills/${name}"
  cp -R "$d" "${REPO_ROOT}/.cursor/skills/${name}"
done
bash "${REPO_ROOT}/scripts/patch-skills-for-cursor.sh" "${REPO_ROOT}/.cursor/skills"
bash "${REPO_ROOT}/scripts/patch-skills-for-cursor.sh" "${HOME}/.cursor/skills"
