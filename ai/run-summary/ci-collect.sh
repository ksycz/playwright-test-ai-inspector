#!/usr/bin/env bash
# Build analyze:summary args from downloaded CI JSON artifacts.
# Expects files like: artifacts/playwright-json-smoke/playwright-results.json
set -euo pipefail

root="${1:-artifacts}"
args=()

for suite in smoke e2e api visual; do
  candidate="$(find "$root" -type f -path "*playwright-json-${suite}*/playwright-results.json" 2>/dev/null | head -n 1 || true)"
  if [[ -n "${candidate}" ]]; then
    args+=(--suite "$suite" "$candidate")
  fi
done

if [[ ${#args[@]} -eq 0 ]]; then
  echo "No playwright-results.json artifacts found under ${root}" >&2
  exit 1
fi

title="${SUMMARY_TITLE:-Playwright CI summary}"
out="${SUMMARY_OUT:-ai-reports/run-summary.md}"

npm run analyze:summary -- --title "$title" --out "$out" "${args[@]}"
