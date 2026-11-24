import test from 'node:test';
import assert from 'node:assert/strict';
import apiHealth from '../api/health.js';
import apiAnalyze from '../api/analyze.js';

function res() {
  return {code:0,headers:{},payload:null,
    setHeader(key,val){this.headers[key]=val;return this;},
    status(code){this.code=code;return this;},
    json(value){this.payload=value;return this;}};
}
test('Vercel health route responds to GET', () => {
  const response=res();
  apiHealth({method:'GET'},response);
  assert.equal(response.code,200);
  assert.equal(response.payload.ok,true);
});
test('Vercel API rejects invalid or short messages', async () => {
  const response=res();
  await apiAnalyze({method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'test-1'},body:{message:'tiny'}},response);
  assert.equal(response.code,400);
});
test('Vercel API accepts a sample and returns a marked quick check when no key is configured', async () => {
  const response=res();
  await apiAnalyze({method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'test-2'},body:{message:'URGENT: send your PIN and pay UGX 20,000 now',language:'en'}},response);
  assert.equal(response.code,200);
  assert.ok(['Low','Medium','High'].includes(response.payload.result.risk));
  assert.equal(response.payload.mode,'demo');
});
test('Vercel API rejects non-POST requests', async () => {
  const response=res();
  await apiAnalyze({method:'GET',headers:{}},response);
  assert.equal(response.code,405);
});
