"use strict";

var unicodeBase = 0x2800;
var numberFollows = 0b111100;
var capitalFollows = 0b100000;
var unknown = 0b111111;
var letterIndicator = 0b000110;

var brailleTranslationMode;

var characterTranslator = {
  // simple punctuation
  "'": [0b000100],
  '"': [0b100000, 0b110110],
  ',': [0b000010],
  '.': [0b110010],
  '?': [0b100110],
  '!': [0b010110],
  ';': [0b000110],
  ':': [0b010010],
  '-': [0b100100],

  // directional punctuation
  '(': [0b010000, 0b100011],
  ')': [0b010000, 0b011100],
  '[': [0b101000, 0b100011],
  ']': [0b101000, 0b011100],
  '{': [0b111000, 0b100011],
  '}': [0b111000, 0b011100],
  '<': [0b001000, 0b100011],
  '>': [0b001000, 0b011100],
  '/': [0b111000, 0b001100],
  '\\': [0b111000, 0b100001],

  // weirder punctuation
  '~': [0b001000, 0b010100],
  '@': [0b001000, 0b000001],
  '#': [0b111000, 0b111001],
  '$': [0b001000, 0b001110],
  '%': [0b101000, 0b110100],
  '^': [0b001000, 0b100010],
  '&': [0b001000, 0b101111],
  '*': [0b010000, 0b010100],
  '_': [0b101000, 0b100100],
  '=': [0b010000, 0b110110],
  '+': [0b010000, 0b010110],
  '|': [0b111000, 0b110011],
  '`': [0b101000, 0b100001],

  // digits
  '0': [0b011010], //⠚
  '1': [0b000001], //⠁
  '2': [0b000011], //⠃
  '3': [0b001001], //⠉
  '4': [0b011001], //⠙
  '5': [0b010001], //⠑
  '6': [0b001011], //⠋
  '7': [0b011011], //⠛
  '8': [0b010011], //⠓
  '9': [0b001010]  //⠊
};

// first 10 letters
characterTranslator['a'] = characterTranslator['1'];
characterTranslator['b'] = characterTranslator['2'];
characterTranslator['c'] = characterTranslator['3'];
characterTranslator['d'] = characterTranslator['4'];
characterTranslator['e'] = characterTranslator['5'];
characterTranslator['f'] = characterTranslator['6'];
characterTranslator['g'] = characterTranslator['7'];
characterTranslator['h'] = characterTranslator['8'];
characterTranslator['i'] = characterTranslator['9'];
characterTranslator['j'] = characterTranslator['0'];

// next 10 letters
characterTranslator['k'] = [characterTranslator['a'][0] | 0b000100];
characterTranslator['l'] = [characterTranslator['b'][0] | 0b000100];
characterTranslator['m'] = [characterTranslator['c'][0] | 0b000100];
characterTranslator['n'] = [characterTranslator['d'][0] | 0b000100];
characterTranslator['o'] = [characterTranslator['e'][0] | 0b000100];
characterTranslator['p'] = [characterTranslator['f'][0] | 0b000100];
characterTranslator['q'] = [characterTranslator['g'][0] | 0b000100];
characterTranslator['r'] = [characterTranslator['h'][0] | 0b000100];
characterTranslator['s'] = [characterTranslator['i'][0] | 0b000100];
characterTranslator['t'] = [characterTranslator['j'][0] | 0b000100];

// next 5 letters (excluding w)
characterTranslator['u'] = [characterTranslator['a'][0] | 0b100100];
characterTranslator['v'] = [characterTranslator['b'][0] | 0b100100];
characterTranslator['x'] = [characterTranslator['c'][0] | 0b100100];
characterTranslator['y'] = [characterTranslator['d'][0] | 0b100100];
characterTranslator['z'] = [characterTranslator['e'][0] | 0b100100];

// w is not part of the original braille (due to not being a french letter)
characterTranslator['w'] = 0b111010;



var isInRange = function(character, bottom, top) {
  return bottom <= character && character <= top;
}

var countRangeWithMax = function(text, bottom, top, max) {
  var count = 0;
  for (var i = 0; i < text.length; i++) {
    var character = text[i];
    if (isInRange(character, bottom, top)) {
      if (++count == max) {
        return count;
      }
    }
  }
  return count;
}

var toBrailleWord = function(word) {
  var numUpperCase = 0;

  var result = [];

  // is the whole word uppercase and contains at least 2 upper case letters?
  if (word == word.toUpperCase() && countRangeWithMax(word, 'A', 'Z', 2) >= 2) {
    result.push(capitalFollows);
    result.push(capitalFollows);
    word = word.toLowerCase();
  }

  var numberMode = false;

  // loop through the word
  for (var i = 0; i < word.length; i++) {
    var character = word[i];

    // check to see if we should be in number mode or letter mode
    if (isInRange(character, '0', '9')) {
      if (!numberMode) {
        // when switching to number mode, output the number follows character
        result.push(numberFollows);
        numberMode = true;
      }
    } else if (isInRange(character, 'a', 'z') || isInRange(character, 'A', 'Z')) {
      if (numberMode) {
        // when switching out of number mode, output the letter indicator character
        result.push(letterIndicator);
        numberMode = false;
      }
    }

    // if the character is uppercase, then lowercase it and mark it as a capital letter
    if (isInRange(character, 'A', 'Z')) {
      result.push(capitalFollows);
      character = character.toLowerCase();
    }

    // get the translation, and add it to the result
    // if no translation, fall back on the "unknown" character
    var translation = characterTranslator[character] || [unknown];
    for (var j = 0; j < translation.length; j++) {
      result.push(translation[j]);
    }

    if (brailleTranslationMode == 'translateWithOriginal') {
      result.push(word[i]);
    }
  }

  // finally, convert the array of binary numbers to a string
  return result.map(function(binary) {
    return (typeof binary === 'string') ? binary : String.fromCharCode(unicodeBase + binary);
  }).join('');
};

var toBraille = function(text) {
  // convert each word individually
  return text.split(/(\s+)/).map(function(word, i) {
    if ((i % 2) == 0) {
      return toBrailleWord(word);
    }
    return word;
  }).join('');
};

var translateAll = function() {

  $('body')
    .find('*')
    .contents()
    .filter(function() {
      // text nodes without whitespace
      return this.nodeType === Node.TEXT_NODE && this.textContent.trim().length > 0;
    })
    .each(function(i, textNode) {
      textNode.textContent = toBraille(textNode.textContent);
    });
};


var loadBrailleTranslationMode = function(callback) {
  chrome.runtime.sendMessage({
    method: "getLocalStorage",
    keys: ["brailleTranslationMode"]
  },
  function(response) {
    var brailleTranslationMode = response.data.brailleTranslationMode;
    console.log('brailleTranslationMode: ' + brailleTranslationMode);
    callback(brailleTranslationMode);
  });
};

loadBrailleTranslationMode(function(newBrailleTranslationMode) {
  brailleTranslationMode = newBrailleTranslationMode;
  if (brailleTranslationMode !== 'disabled') {
    translateAll();
  }
});


document.addEventListener('visibilitychange', function(){
  if (!document.hidden) {
    // tab was just focused, get the braille translation mode and see if it changed
    loadBrailleTranslationMode(function(newBrailleTranslationMode) {
      if (brailleTranslationMode != newBrailleTranslationMode) {
        // it changed... reload the page
        window.location.reload();
      }
    });
  }
});

/*
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action" ) {
      modeIndex = ((modeIndex + 1) % modes.length);
      mode = modes[modeIndex];
    }
  }
);
*/


