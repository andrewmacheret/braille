import { translate } from './louis.js';

// grade setting -> liblouis table
var tables = {
  'ueb-g1': 'en-ueb-g1.ctb',
  'ueb-g2': 'en-ueb-g2.ctb',
  'ebae-g1': 'en-us-g1.ctb',
  'ebae-g2': 'en-us-g2.ctb',
  'g3': 'en-g3.ctb'
};

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.method !== 'translate') return false;

  var table = tables[message.grade];
  if (!table) {
    sendResponse({error: 'unknown grade ' + message.grade});
    return false;
  }

  translate(table, message.texts, message.showOriginal).then(
    function(texts) { sendResponse({texts: texts}); },
    function(error) {
      console.error(error);
      sendResponse({error: String(error)});
    });
  // keep the channel open for the async response
  return true;
});
