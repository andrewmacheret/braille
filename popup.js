"use strict";

var defaultSettings = {grade: 'ueb-g1', showOriginal: false};

var grade = document.getElementById('grade');
var showOriginal = document.getElementById('showOriginal');

chrome.storage.local.get(defaultSettings, function(settings) {
  grade.value = settings.grade;
  showOriginal.checked = settings.showOriginal;
});

var save = function() {
  chrome.storage.local.set({grade: grade.value, showOriginal: showOriginal.checked});
};

grade.addEventListener('change', save);
showOriginal.addEventListener('change', save);
