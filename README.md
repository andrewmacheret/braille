# Braille Translator (English)

[![Build](https://github.com/andrewmacheret/braille/actions/workflows/build.yml/badge.svg)](https://github.com/andrewmacheret/braille/actions/workflows/build.yml) [![Chrome Web Store](https://img.shields.io/chrome-web-store/price/kgngiapafahaekaelnejkmkjmcnkhmfj.svg?maxAge=2592000)](https://chromewebstore.google.com/detail/braille-translator-englis/kgngiapafahaekaelnejkmkjmcnkhmfj) [![Chrome Web Store](https://img.shields.io/chrome-web-store/rating/kgngiapafahaekaelnejkmkjmcnkhmfj.svg?maxAge=2592000)](https://chromewebstore.google.com/detail/braille-translator-englis/kgngiapafahaekaelnejkmkjmcnkhmfj) [![Chrome Web Store](https://img.shields.io/chrome-web-store/rating-count/kgngiapafahaekaelnejkmkjmcnkhmfj.svg?maxAge=2592000)](https://chromewebstore.google.com/detail/braille-translator-englis/kgngiapafahaekaelnejkmkjmcnkhmfj)

A [Chrome extension](https://chromewebstore.google.com/detail/braille-translator-englis/kgngiapafahaekaelnejkmkjmcnkhmfj) that translates web pages into braille.

Pick a grade from the toolbar popup:

- Unified English Braille, Grade 1 or Grade 2
- English Braille American Edition, Grade 1 or Grade 2
- Grade 3, an unofficial shorthand

Translation is done by [liblouis](https://liblouis.io/), compiled to WebAssembly. Nothing leaves your browser, see the [privacy policy](PRIVACY.md).

![Screenshot](screenshot.png?raw=true "Screenshot")

## Development

liblouis is built with emscripten, so you need Docker running:

```
docker run --rm -v "$PWD":/src -w /src emscripten/emsdk:4.0.10 scripts/build-liblouis.sh
docker run --rm -v "$PWD":/src -w /src emscripten/emsdk:4.0.10 node --test tests/*.test.mjs
```

Then load this folder in `chrome://extensions` with "Load unpacked".

To redraw the icons, run `python3 scripts/make-icons.py`.

## Releasing

Bump `version` in `manifest.json`, then push a matching tag:

```
git tag v2.0
git push origin v2.0
```

GitHub Actions builds `braille.zip`, signs it into `braille.crx`, and attaches both to a GitHub release. Upload `braille.crx` to the Chrome Web Store.

The store has "Verified CRX uploads" turned on, so it only accepts a `.crx` signed with the private key in the `CRX_PRIVATE_KEY` repo secret. To sign by hand, run `python3 scripts/sign-crx.py dist/braille.zip key.pem dist/braille.crx`.
