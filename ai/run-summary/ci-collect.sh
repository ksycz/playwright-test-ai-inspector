#!/usr/bin/env bash
# Build analyze:summary args from downloaded CI JSON artifacts.
# Prefers: artifacts/playwright-json-<suite>/playwright-results.json
set -euo pipefail

root="${1:-artifacts}"
args=()
found_suites=()

if [[ ! -d "$root" ]]; then
  echo "Artifact root does not exist or is not a directory: ${root}" >&2
  exit 1
fi

find_suite_report() {
  local suite="$1"
  local exact="${root}/playwright-json-${suite}/playwright-results.json"

  if [[ -f "$exact" ]]; then
    printf '%s\n' "$exact"
    return 0
  fi

  # Deterministic fallback: exact directory segment playwright-json-<suite>
  local match
  match="$(
    find "$root" -type f -path "*/playwright-json-${suite}/playwright-results.json" 2>/dev/null \
      | LC_ALL=C sort \
      | head -n 1 \
      || true
  )"

  if [[ -n "${match}" ]]; then
    printf '%s\n' "$match"
    return 0
  fi

  return 1
}

for suite in smoke e2e api visual; do
  if candidate="$(find_suite_report "$suite")"; then
    args+=(--suite "$suite" "$candidate")
    found_suites+=("$suite")
  else
    echo "No playwright-results.json found for suite '${suite}' under ${root}" >&2
  fi
done

if [[ ${#args[@]} -eq 0 ]]; then
  echo "No playwright-results.json artifacts found under ${root}" >&2
  exit 1
fi

echo "Collecting suites: ${found_suites[*]}" >&2

title="${SUMMARY_TITLE:-Playwright CI summary}"
out="${SUMMARY_OUT:-ai-reports/run-summary.md}"

npm run analyze:summary -- --title "$title" --out "$out" "${args[@]}"
