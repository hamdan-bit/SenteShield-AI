import test from 'node:test';
import assert from 'node:assert/strict';
import {deterministicAssessment, redactSensitiveText, normalizeAssessment,MAX_LENGTH} from '../logic.js';

test('high risk sample is classified high',()=>{
 const r=deterministicAssessment('URGENT your MTN MoMo account is blocked. Send UGX 20000 and your PIN immediately');
 assert.equal(r.risk,'High');
});
test('ordinary text remains low risk',()=>{
 assert.equal(deterministicAssessment('Hello, are we still meeting for group work on Friday?').risk,'Low');
});
test('mask phone and secret',()=>{
 const r=redactSensitiveText('My number is 0772123456, PIN: 1234, email user@example.com');
 assert.ok(!r.includes('0772123456') && !r.includes('1234') && !r.includes('user@example.com'));
});
test('normalize JSON and cap untrusted output',()=>{
 const r=normalizeAssessment('{"risk":"high","summary":"Warning","redFlags":[{"phrase":"pin","reason":"secret"}],"actions":["do not reply"]}');
 assert.equal(r.risk,'High'); assert.equal(r.model,'ai');
});
test('max length defined',()=>assert.equal(MAX_LENGTH,1600));

test('Luganda rules preview supplies Luganda guidance',()=>{
 const r=deterministicAssessment('URGENT share your PIN and send UGX 20000 to MTN now','lg');
 assert.equal(r.risk,'High');assert.ok(r.actions[0].includes('Towaayo'));
});
test('untrusted AI output is capped to prevent excessive content',()=>{
 const r=normalizeAssessment({risk:'Medium',summary:'A'.repeat(1200),redFlags:[],actions:['safe step']});
 assert.ok(r.summary.length<=450);
});
