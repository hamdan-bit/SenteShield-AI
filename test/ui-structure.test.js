import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const html=read('../public/index.html');
const css=read('../public/styles.css');
const js=read('../public/app.js');

test('scanner and app workspace expose working controls',()=>{
  for(const id of ['message','analyze','results','view-links','linkInput','linkContext','checkLink','linkResults','linkFindings','liveSignals','signalCount','view-activity','view-safety','appDialog','loadingOverlay','cancelScan','toast','menuBtn']){
    assert.match(html,new RegExp(`id="${id}"`),`Missing UI control ${id}`);
  }
  assert.match(html,/aria-labelledby="mainTitle"/);
  assert.match(html,/aria-live="polite"/);
});

test('assets use relative paths and mobile layouts exist',()=>{
  assert.match(html,/href="\.\/styles\.css"/);
  assert.match(html,/src="\.\/app\.js"/);
  for(const bp of ['1030','760','480','350'])assert.ok(css.includes(`max-width:${bp}px`));
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/focus-visible/);
});

test('frontend exposes expected user flows without including credentials',()=>{
  for(const feature of ['runScan','runLinkScan','renderLinkResult','openDialog','changeView','renderHistory','renderSignals','abort'])assert.ok(js.includes(feature));
  assert.doesNotMatch(js,/AQ\.Ab8RN6J4|AIza[0-9A-Za-z_-]{10,}/);
});
