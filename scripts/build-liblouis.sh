#!/usr/bin/env bash
# Builds liblouis to WebAssembly with just the English tables.
# Needs emscripten, so run it in the emsdk Docker image:
#   docker run --rm -v "$PWD":/src -w /src emscripten/emsdk:4.0.10 scripts/build-liblouis.sh
set -euo pipefail

LIBLOUIS_VERSION="${LIBLOUIS_VERSION:-3.39.0}"
TABLES=(en-ueb-g1.ctb en-ueb-g2.ctb en-us-g1.ctb en-us-g2.ctb en-g3.ctb)

root=$(cd "$(dirname "$0")/.." && pwd)
work="$root/build/liblouis"
src="$work/liblouis-$LIBLOUIS_VERSION"
out="$root/vendor/liblouis"

mkdir -p "$work" "$out"

if [ ! -d "$src" ]; then
  curl -fsSL "https://github.com/liblouis/liblouis/releases/download/v$LIBLOUIS_VERSION/liblouis-$LIBLOUIS_VERSION.tar.gz" |
    tar xz -C "$work"
fi

cd "$src"
if [ ! -f liblouis/.libs/liblouis.a ]; then
  emconfigure ./configure --host=wasm32-unknown-emscripten --disable-shared --enable-static --without-yaml
  emmake make -C gnulib
  emmake make -C liblouis
fi

# only bundle the tables we use, plus the files they include
rm -rf "$work/tables"
mkdir -p "$work/tables"
python3 "$root/scripts/table-files.py" tables "${TABLES[@]}" |
  while read -r file; do cp "tables/$file" "$work/tables/"; done

# SINGLE_FILE puts the wasm inside the .js, so the service worker needs no fetch.
# liblouis keeps big buffers on the stack, and the default 64KB stack overflows into its data.
emcc liblouis/.libs/liblouis.a \
  -O2 \
  -o "$out/liblouis.js" \
  -sMODULARIZE \
  -sEXPORT_ES6 \
  -sENVIRONMENT=web,worker \
  -sSINGLE_FILE \
  -sALLOW_MEMORY_GROWTH \
  -sSTACK_SIZE=4MB \
  -sEXPORTED_FUNCTIONS=_lou_translate,_lou_charSize,_malloc,_free \
  -sEXPORTED_RUNTIME_METHODS=ENV,HEAPU16,HEAP32,stringToUTF8,lengthBytesUTF8 \
  --embed-file "$work/tables@/liblouis/tables"

cp COPYING.LESSER "$out/LICENSE"
echo "$LIBLOUIS_VERSION" > "$out/VERSION"
