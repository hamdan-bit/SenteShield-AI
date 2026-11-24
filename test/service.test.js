import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeSafely} from '../analysis-service.js';

test('Detailed response uses the provider and returns the detailed mode', async () => {
  const priorFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    assert.equal(opts.headers['x-goog-api-key'], 'fake-test-key');
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({risk:'High',summary:'Suspicious payment request.',redFlags:[{phrase:'PIN',reason:'Private code requested.'}],actions:['Do not share the PIN.']})}]}}]})};
  };
  try {
    const response = await analyzeSafely('Send a PIN to this account','en',{apiKey:'fake-test-key',model:'fake-model'});
    assert.equal(response.mode,'ai');
    assert.equal(response.result.risk,'High');
  } finally {globalThis.fetch=priorFetch;}
});
test('Provider failure falls back to an explicitly marked basic check', async () => {
  const priorFetch = globalThis.fetch;
  const originalError = console.error;
  globalThis.fetch = async () => {throw new Error('Unavailable');};
  console.error = () => {};
  try {
    const response = await analyzeSafely('URGENT send your PIN right now', 'en',{apiKey:'fake-test-key',model:'fake-model'});
    assert.equal(response.mode,'demo');
    assert.equal(response.result.model,'rules');
  } finally {globalThis.fetch=priorFetch;console.error=originalError;}
});
