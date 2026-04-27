#!/usr/bin/env bash
set -e

MESSAGE="${1:-manual checkpoint}"

echo "===== BlackDog checkpoint ====="
echo "Message: checkpoint: ${MESSAGE}"

git status --short

git add \
  browser-extension/content.js \
  browser-extension/sidepanel.js \
  browser-extension/sidepanel.css \
  browser-extension/sidepanel.html \
  browser-extension/background.js \
  src/app \
  src/components \
  src/data \
  src/types

if git diff --cached --quiet; then
  echo "No changes to checkpoint."
  exit 0
fi

git commit -m "checkpoint: ${MESSAGE}"

echo "Checkpoint created:"
git log --oneline -1

echo "Remaining working tree:"
git status --short
