import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCommand, resolveTarget } from '../search.js';

test('uses the selected engine for regular queries', () => {
  assert.equal(
    resolveTarget('grid css', 'mdn'),
    'https://developer.mozilla.org/pt-BR/search?q=grid%20css',
  );
});

test('command aliases override the selected engine', () => {
  assert.equal(
    resolveTarget('gh artemis dashboard', 'google'),
    'https://github.com/search?q=artemis%20dashboard',
  );
  assert.equal(detectCommand('yt javascript').engine.id, 'youtube');
});

test('opens secure URLs and local development addresses directly', () => {
  assert.equal(resolveTarget('example.com/docs'), 'https://example.com/docs');
  assert.equal(resolveTarget('localhost:3000'), 'http://localhost:3000');
  assert.equal(resolveTarget('https://example.com'), 'https://example.com');
});

test('returns null for an empty query', () => {
  assert.equal(resolveTarget('   '), null);
});
