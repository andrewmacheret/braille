import assert from 'node:assert/strict';
import test from 'node:test';

import { translate } from '../louis.js';

var one = async function(table, text, showOriginal) {
  return (await translate(table, [text], showOriginal))[0];
};

test('UEB grade 1 spells out every letter', async function() {
  assert.equal(await one('en-ueb-g1.ctb', 'Hello world'), '⠠⠓⠑⠇⠇⠕ ⠺⠕⠗⠇⠙');
  assert.equal(await one('en-ueb-g1.ctb', 'the'), '⠞⠓⠑');
});

test('UEB grade 2 uses contractions', async function() {
  assert.equal(await one('en-ueb-g2.ctb', 'the'), '⠮');
  assert.equal(await one('en-ueb-g2.ctb', 'and'), '⠯');
  assert.equal(await one('en-ueb-g2.ctb', 'knowledge'), '⠅');
});

test('EBAE grades translate', async function() {
  assert.equal(await one('en-us-g1.ctb', 'the'), '⠞⠓⠑');
  assert.equal(await one('en-us-g2.ctb', 'the'), '⠮');
});

test('grade 3 is shorter than grade 2', async function() {
  var text = 'The quick brown fox jumps over the lazy dog because it wanted to.';
  var grade2 = await one('en-us-g2.ctb', text);
  var grade3 = await one('en-g3.ctb', text);
  assert.match(grade3, /^[\u2800-\u28ff ]+$/);
  assert.ok(grade3.length < grade2.length, grade3 + ' vs ' + grade2);
});

test('keeps the surrounding whitespace and line breaks', async function() {
  assert.equal(await one('en-ueb-g1.ctb', '  a\nb '), '  ⠁\n⠃ ');
});

test('show original puts each piece of text after its braille', async function() {
  assert.equal(await one('en-ueb-g1.ctb', 'Hi', true), '⠠⠓H⠊i');
  assert.equal(await one('en-ueb-g2.ctb', 'the cat', true), '⠮the ⠉c⠁a⠞t');
});
