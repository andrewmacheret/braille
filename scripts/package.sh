#!/usr/bin/env bash
# Zips the extension into dist/braille.zip for the Chrome Web Store.
# Run scripts/build-liblouis.sh first.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f vendor/liblouis/liblouis.js ]; then
  echo "vendor/liblouis/liblouis.js is missing, run scripts/build-liblouis.sh first" >&2
  exit 1
fi

mkdir -p dist
rm -f dist/braille.zip
python3 -m zipfile -c dist/braille.zip \
  manifest.json \
  background.js \
  louis.js \
  content.js \
  popup.html \
  popup.css \
  popup.js \
  icons \
  vendor
