"use strict";

var brailleTranslationModes = ['translate', 'translateWithOriginal', 'disabled'];

chrome.action.onClicked.addListener(async function(tab) {
  // rotate the translation mode
  var stored = await chrome.storage.local.get('brailleTranslationMode');
  var currentModeIndex = brailleTranslationModes.indexOf(stored.brailleTranslationMode);
  if (currentModeIndex < 0) currentModeIndex = 0;
  var newMode = brailleTranslationModes[(currentModeIndex + 1) % brailleTranslationModes.length];
  await chrome.storage.local.set({brailleTranslationMode: newMode});

  if (tab && tab.id !== undefined) {
    chrome.tabs.reload(tab.id);
  }
});
