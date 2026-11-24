import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');

test('Recent checks cards cannot force the page wider than their container', () => {
  assert.match(css, /\.history-item\{[^}]*max-width:100%;min-width:0;overflow:hidden/);
  assert.match(css, /\.history-list\{[^}]*min-width:0;max-width:100%/);
  assert.match(css, /\.history-text span\{[^}]*overflow-wrap:anywhere;word-break:break-word/);
});

test('Recent checks cards stack details in a two-column mobile grid', () => {
  assert.match(css, /@media\(max-width:480px\)\{[\s\S]*?\.history-item\{display:grid;grid-template-columns:37px minmax\(0,1fr\)/);
  assert.match(css, /\.history-time\{display:block;grid-column:2/);
  assert.match(css, /\.history-arrow\{display:none\}/);
});
