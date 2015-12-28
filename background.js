"use strict";

var brailleTranslationModes = ['translate', 'translateWithOriginal', 'disabled'];

chrome.browserAction.onClicked.addListener(function(tab) {
  
  console.log('old brailleTranslationMode: ' + localStorage['brailleTranslationMode']);

  // rotate the translation mode
  var currentMode = localStorage['brailleTranslationMode'];
  var currentModeIndex = brailleTranslationModes.indexOf(currentMode);
  if (currentModeIndex < 0) currentModeIndex = 0;
  currentModeIndex = (currentModeIndex + 1) % brailleTranslationModes.length;
  currentMode = brailleTranslationModes[currentModeIndex];
  localStorage['brailleTranslationMode'] = currentMode;

  console.log('new brailleTranslationMode: ' + localStorage['brailleTranslationMode']);

  chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
    chrome.tabs.reload(arrayOfTabs[0].id);
  });
  
  /*
  chrome.tabs.query({}, function(tabs) {
    var tab
  });
  alert('icon clicked');
  */
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch(message.method) {
    // ...
    case "getLocalStorage":
      if(message.key) { // Single key provided
        sendResponse({data: localStorage[message.key]});
      }
      else if(message.keys) { // An array of keys requested
        var data = {};
        message.keys.forEach(function(key) {data[key] = localStorage[key];})
        sendResponse({data: data});
      }
      break;
    // ...
  }
});
