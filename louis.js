import createLiblouis from './vendor/liblouis/liblouis.js';

// translation mode flags from liblouis.h
var dotsIO = 4;
var ucBrl = 64;

var blankCell = '\u2800';
var utf16Decoder = new TextDecoder('utf-16le');

var liblouisPromise;

var loadLiblouis = function() {
  if (!liblouisPromise) {
    liblouisPromise = createLiblouis({
      // the build embeds the tables here
      preRun: [function(lib) { lib.ENV.LOUIS_TABLEPATH = '/liblouis/tables'; }]
    }).then(function(lib) {
      if (lib._lou_charSize() !== 2) {
        throw new Error('liblouis must be built with 2 byte characters');
      }
      return lib;
    });
  }
  return liblouisPromise;
};

var withCString = function(lib, text, callback) {
  var size = lib.lengthBytesUTF8(text) + 1;
  var pointer = lib._malloc(size);
  try {
    lib.stringToUTF8(text, pointer, size);
    return callback(pointer);
  } finally {
    lib._free(pointer);
  }
};

// Runs lou_translate on one line of text.
// Returns the braille and, for each braille cell, the index of the input character it came from.
var translateLine = function(lib, table, line) {
  var maxCells = line.length * 4 + 64;

  while (true) {
    var result = withCString(lib, table, function(tablePointer) {
      var inBuffer = lib._malloc(line.length * 2);
      var outBuffer = lib._malloc(maxCells * 2);
      var inLength = lib._malloc(4);
      var outLength = lib._malloc(4);
      var inputPos = lib._malloc(maxCells * 4);
      try {
        for (var i = 0; i < line.length; i++) {
          lib.HEAPU16[(inBuffer >> 1) + i] = line.charCodeAt(i);
        }
        lib.HEAP32[inLength >> 2] = line.length;
        lib.HEAP32[outLength >> 2] = maxCells;

        var ok = lib._lou_translate(tablePointer, inBuffer, inLength, outBuffer, outLength,
            0, 0, 0, inputPos, 0, dotsIO | ucBrl);
        if (!ok) {
          throw new Error('liblouis could not translate with table ' + table);
        }

        // the heap can move when it grows, so read it again after the call
        var consumed = lib.HEAP32[inLength >> 2];
        var cellCount = lib.HEAP32[outLength >> 2];
        var cells = utf16Decoder.decode(
            lib.HEAPU16.subarray(outBuffer >> 1, (outBuffer >> 1) + cellCount));
        var positions = Array.from(lib.HEAP32.subarray(inputPos >> 2, (inputPos >> 2) + cellCount));
        return {complete: consumed >= line.length, cells: cells, positions: positions};
      } finally {
        lib._free(inBuffer);
        lib._free(outBuffer);
        lib._free(inLength);
        lib._free(outLength);
        lib._free(inputPos);
      }
    });

    // the output buffer was too small, try again with a bigger one
    if (result.complete) return result;
    maxCells *= 2;
  }
};

// Puts the original text after the braille cells it turned into, like ⠠⠓H⠑e⠇l⠇l⠕o
var withOriginal = function(line, cells, positions) {
  var result = '';
  var i = 0;
  while (i < cells.length) {
    var start = positions[i];
    var j = i + 1;
    while (j < cells.length && positions[j] === start) j++;
    var end = j < cells.length ? positions[j] : line.length;

    result += cells.slice(i, j);
    var original = end > start ? line.slice(start, end) : '';
    if (original.trim().length > 0) result += original;
    i = j;
  }
  return result;
};

var translateText = function(lib, table, text, showOriginal) {
  // keep the text's own whitespace, so pages still wrap and pre blocks keep their lines
  var match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  var body = match[2].split(/(\n)/).map(function(line) {
    if (line === '\n' || line.trim().length === 0) return line;
    var result = translateLine(lib, table, line);
    var braille = showOriginal ? withOriginal(line, result.cells, result.positions) : result.cells;
    // liblouis writes spaces as blank cells, which don't wrap
    return braille.split(blankCell).join(' ');
  }).join('');
  return match[1] + body + match[3];
};

export var translate = async function(table, texts, showOriginal) {
  var lib = await loadLiblouis();
  return texts.map(function(text) {
    return translateText(lib, table, text, showOriginal);
  });
};
