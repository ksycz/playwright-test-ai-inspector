#!/bin/sh
# Local runs keep browsers in the repo. CI sets PLAYWRIGHT_BROWSERS_PATH
# (the Playwright container image) and this script leaves that value alone.
set -e
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
if [ -z "${PLAYWRIGHT_BROWSERS_PATH}" ]; then
  export PLAYWRIGHT_BROWSERS_PATH="${root}/.playwright-browsers"
fi
export PATH="${root}/node_modules/.bin:${PATH}"
exec playwright "$@"
