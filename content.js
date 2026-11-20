"use strict";

var defaultSettings = {grade: 'ueb-g1', showOriginal: false};

// skip tags whose text isn't visible page text, like scripts and styles
var skipTags = {SCRIPT: true, STYLE: true, NOSCRIPT: true, TEXTAREA: true};

// how many text nodes to send to the translator at once
var batchSize = 500;

// text nodes we changed, with their original text, so we can switch grades or undo
var changedNodes = new Map();

// goes up on every settings change, so late replies for old settings get ignored
var generation = 0;

var findTextNodes = function() {
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: function(node) {
      if (node.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
      if (node.parentElement && skipTags[node.parentElement.tagName]) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  var textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  return textNodes;
};

var restoreAll = function() {
  changedNodes.forEach(function(change, node) {
    // leave it alone if the page changed the text since we did
    if (node.textContent === change.translated) {
      node.textContent = change.original;
    }
  });
  changedNodes.clear();
};

var translateBatch = function(textNodes, settings, currentGeneration) {
  var originals = textNodes.map(function(node) { return node.textContent; });

  chrome.runtime.sendMessage({
    method: 'translate',
    grade: settings.grade,
    showOriginal: settings.showOriginal,
    texts: originals
  }, function(response) {
    if (chrome.runtime.lastError || !response || response.error) {
      console.error('Braille Translator:', chrome.runtime.lastError || (response && response.error));
      return;
    }
    if (currentGeneration !== generation) return;

    textNodes.forEach(function(node, i) {
      if (node.textContent !== originals[i]) return;
      node.textContent = response.texts[i];
      changedNodes.set(node, {original: originals[i], translated: response.texts[i]});
    });
  });
};

var applySettings = function(settings) {
  generation++;
  restoreAll();
  if (settings.grade === 'off' || !document.body) return;

  var textNodes = findTextNodes();
  for (var i = 0; i < textNodes.length; i += batchSize) {
    translateBatch(textNodes.slice(i, i + batchSize), settings, generation);
  }
};

var loadAndApplySettings = function() {
  chrome.storage.local.get(defaultSettings, applySettings);
};

loadAndApplySettings();

// translate again right away when the grade changes in the popup
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area === 'local') loadAndApplySettings();
});
