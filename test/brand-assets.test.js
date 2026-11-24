import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const html=read('../public/index.html');
const css=read('../public/styles.css');

test('site sidebar uses a theme-aware inline SenteShield SVG', () => {
  assert.match(html, /<svg class="brand-mark" viewBox="0 0 64 64"/);
  assert.match(html, /class="brand-mark__shield"/);
  assert.match(css, /--brand-logo-fill:#0d1320;--brand-logo-stroke:#fff/);
  assert.match(css, /--brand-logo-fill:#fff;--brand-logo-stroke:#3b7a35/);
  assert.match(css, /\.brand-mark__shield\{fill:none;stroke:var\(--brand-logo-stroke\);stroke-width:1\.8/);
});

test('brand logo assets are SVG, locally referenced and script-free', () => {
  for(const name of ['senteshield-mark.svg','favicon.svg','senteshield-logo-dark.svg','senteshield-logo-light.svg']){
    const svg=read('../public/'+name);
    assert.match(svg, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /viewBox="0 0 /);
    assert.doesNotMatch(svg, /<script|foreignObject|xlink:href=|href="https?:/i);
  }
});
