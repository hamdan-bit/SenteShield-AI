import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const html=read('../public/index.html');
const css=read('../public/styles.css');

test('site sidebar uses the original SenteShield SVG mark', () => {
  assert.match(html, /<img src="\.\/senteshield-mark\.svg" alt="" width="43" height="43"/);
  assert.match(css, /\.brand-icon img\{display:block;width:100%;height:100%;object-fit:contain\}/);
});

test('brand logo assets are SVG, locally referenced and script-free', () => {
  for(const name of ['senteshield-mark.svg','favicon.svg','senteshield-logo-dark.svg','senteshield-logo-light.svg']){
    const svg=read('../public/'+name);
    assert.match(svg, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /viewBox="0 0 /);
    assert.doesNotMatch(svg, /<script|foreignObject|xlink:href=|href="https?:/i);
  }
});
