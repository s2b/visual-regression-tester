#!/usr/bin/env bash
# Sets up dev/ as a copy of visual-regression-starter for locally testing
# this library. dev/ consumes this repo's own build instead of the published
# npm package, via `npm link` (which installs dev/'s regular deps and
# symlinks this package into dev/node_modules in one go).
#
# dev/ has no .git of its own (stripped after cloning) so it can't be
# mistaken for a repo of its own. That means re-running this script discards
# and re-fetches dev/ from scratch, including any local edits you made there
# (e.g. to visualregression.config.ts) - that's the tradeoff for never having
# to `git pull`/merge inside it.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -d dev ]; then
  echo "Removing existing dev/ (any local changes there, e.g. to visualregression.config.ts, will be lost)..."
  rm -rf dev
fi
git clone --depth=1 https://github.com/s2b/visual-regression-starter.git dev
rm -rf dev/.git

npm run build
(cd dev && npm link ..)

echo "dev/ is ready and linked to your local build."
