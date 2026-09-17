#!/usr/bin/env bash
# Sets up dev/ as a clone of visual-regression-starter for locally testing
# this library. dev/ consumes this repo's own build instead of the published
# npm package (via a node_modules symlink this script manages), so it stays
# untouched by git and can always be cleanly re-synced with `git -C dev pull`.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -d dev ]; then
  echo "dev/ already exists, pulling latest changes from visual-regression-starter..."
  git -C dev pull
else
  git clone https://github.com/s2b/visual-regression-starter.git dev
fi

npm run build
npm --prefix dev install

rm -rf dev/node_modules/@praetorius/visual-regression-tester
mkdir -p dev/node_modules/@praetorius
ln -s ../../.. dev/node_modules/@praetorius/visual-regression-tester

cat <<'EOF'

dev/ is ready and linked to your local build.
Edit dev/visualregression.config.ts to point at what you want to test, then:

  cd dev && npx playwright install --with-deps firefox   # once
  cd dev && npx playwright test

If you change files under src/, rerun `npm run dev:setup` (or just
`npm run build`) to pick up the changes.
EOF
