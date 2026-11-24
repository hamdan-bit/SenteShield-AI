import test from 'node:test';
import assert from 'node:assert/strict';
import {scanLink} from '../link-service.js';

test('failure logs only HTTP status and a fixed Google error category', async()=>{
  const original=console.warn, messages=[];
  console.warn=(line)=>messages.push(line);
  try {
    const result=await scanLink('https://example.org/path','',{webRiskKey:'PRIVATE_TEST_KEY',fetchImpl:async()=>({
      ok:false,status:403,json:async()=>({error:{status:'PERMISSION_DENIED',message:'PRIVATE_TEST_KEY https://example.org/path'}})
    })});
    assert.equal(result.checked.reputation,'unavailable');
    assert.match(messages.join(' '),/HTTP 403, category PERMISSION_DENIED/);
    assert.doesNotMatch(messages.join(' '),/PRIVATE_TEST_KEY|example\.org\/path/);
  }finally{console.warn=original;}
});

test('network and malformed-provider errors do not expose secrets', async()=>{
  const original=console.warn, messages=[];
  console.warn=(line)=>messages.push(line);
  try {
    const result=await scanLink('https://example.org/path','',{webRiskKey:'PRIVATE_TEST_KEY',fetchImpl:async()=>{throw new Error('PRIVATE_TEST_KEY https://example.org/path')}});
    assert.equal(result.checked.reputation,'unavailable');
    assert.match(messages.join(' '),/NETWORK_OR_RESPONSE_ERROR/);
    assert.doesNotMatch(messages.join(' '),/PRIVATE_TEST_KEY|example\.org\/path/);
  }finally{console.warn=original;}
});
