#!/bin/sh
# Local runs keep browsers in the repo. CI sets PLAYWRIGHT_BROWSERS_PATH
# (the Playwright container image) and this script leaves that value alone.
set -e
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
if [ -z "${PLAYWRIGHT_BROWSERS_PATH}" ]; then
  export PLAYWRIGHT_BROWSERS_PATH="${root}/.playwright-browsers"
fi
export PATH="${root}/node_modules/.bin:${PATH}"

# With CI set, playwright.config.ts starts its own dev server on port 5173 instead of reusing one
# (reuseExistingServer: !CI). If `npm run dev` is already running, Playwright only prints
# "http://localhost:5173 is already used". Say what to do instead.
if [ "$1" = "test" ] && [ -n "${CI}" ] && \
  node -e 'const s=require("node:net").connect(5173,"localhost");s.on("connect",()=>process.exit(0));s.on("error",()=>process.exit(1));setTimeout(()=>process.exit(1),500)' 2>/dev/null; then
  echo "Port 5173 is already in use (probably npm run dev)." >&2
  echo "With CI set, Playwright starts its own server there and won't reuse yours." >&2
  echo "Either stop npm run dev, or run without CI=... to reuse it." >&2
  exit 1
fi
exec playwright "$@"
