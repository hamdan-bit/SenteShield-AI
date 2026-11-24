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
  assert.match(css, /\.brand-icon > svg\.brand-mark\{display:block;width:100%;height:100%;stroke:none/);
  assert.match(css, /\.brand-icon \.brand-mark__tile\{fill:var\(--brand-logo-fill\);stroke:var\(--brand-logo-stroke\);stroke-width:2/);
  assert.match(css, /\.brand-icon \.brand-mark__shield\{fill:none;stroke:var\(--brand-logo-stroke\);stroke-width:2\.3/);
});

test('brand logo assets are SVG, locally referenced and script-free', () => {
  for(const name of ['senteshield-mark.svg','favicon.svg','senteshield-logo-dark.svg','senteshield-logo-light.svg','favicon-light.svg','favicon-dark.svg','senteshield-mark-light.svg','senteshield-mark-dark.svg']){
    const svg=read('../public/'+name);
    assert.match(svg, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /viewBox="0 0 /);
    assert.doesNotMatch(svg, /<script|foreignObject|xlink:href=|href="https?:/i);
  }
});

test('theme toggle switches favicon assets and sidebar SVG outline', () => {
  const app=read('../public/app.js');
  assert.match(app, /favicon\.href=settings\.theme==='light'\?'\.\/favicon-light\.svg':'\.\/favicon-dark\.svg'/);
  assert.match(html, /class="brand-mark__tile" x="4" y="4" width="56" height="56"/);
  assert.match(read('../public/favicon-light.svg'), /--logo-fill:#ffffff;--logo-stroke:#3b7a35/);
  assert.match(read('../public/favicon-dark.svg'), /--logo-fill:#0d1320;--logo-stroke:#ffffff/);
});
