import test from 'node:test';
import assert from 'node:assert/strict';
import {extractLink, assessLink, scanLink, lookupWebRisk} from '../link-service.js';

const hut='https://hut8-offer.example/register?ref=UG124';
test('URL is extracted from WhatsApp-style invitation without visiting destination',()=>{
 const data=extractLink(`Join our club! ${hut} Act now.`);
 assert.equal(data.url.hostname,'hut8-offer.example');
 assert.match(data.accompanyingText,/Join our club/);
});
test('high caution for Hut 8-name investment impersonation patterns, not the brand alone',async()=>{
 const result=await scanLink(hut,'Join the Hut 8 Uganda investment; pay UGX 100,000 for guaranteed daily profit and refer friends.');
 assert.equal(result.risk,'high');
 assert.equal(result.hostname,'hut8-offer.example');
 assert.equal(result.checked.reputation,'not-configured');
 assert.equal('_url' in result,false);
 assert.ok(result.signals.some(x=>/Hut 8/.test(x.title)));
});
test('brand lookalike name alone leads to caution, not a definitive fraud accusation',()=>{
 const lookalike=assessLink('https://hut8-uganda.example/');
 assert.equal(lookalike.risk,'medium');
 assert.ok(lookalike.signals.some(x=>/imitation/.test(x.title)));
 const official=assessLink('https://www.hut8.com/investors');
 assert.ok(!official.signals.some(x=>/imitation/.test(x.title)));
});
test('MYD-style referral and deposit pitch is classified as high caution',()=>{
 const r=assessLink('https://myd-cash.example/signup?ref=INVITE123','Join our earning app, deposit UGX 50,000 and recruit 3 friends for daily task commission.');
 assert.equal(r.risk,'high');
 assert.ok(r.signals.some(x=>/Recruitment/.test(x.title)));
});
test('ordinary HTTPS links have no strong signal, never labeled safe',async()=>{
 const r=await scanLink('https://www.wikipedia.org/wiki/Uganda');
 assert.equal(r.risk,'low');assert.match(r.summary,/does not mean it is safe/);
 assert.equal(r.checked.offer,false);
});
test('shortened links conceal final destination',()=>{
 const r=assessLink('https://bit.ly/reward-demo');
 assert.ok(r.signals.some(x=>/concealed/i.test(x.title)));
});
test('login@host trick and lookalike encoded domains are flagged',()=>{
 assert.equal(assessLink('https://paypal.com@evil.example/join').risk,'high');
 assert.ok(assessLink('https://xn--80ak6aa92e.example/login').signals.some(x=>/Lookalike/.test(x.title)));
});
test('script and local/nonwebsite URLs are refused',()=>{
 for(const url of ['javascript:alert(1)','file:///etc/passwd','localhost','abc','https://'])assert.throws(()=>extractLink(url));
});
test('private IP and secret URLs never trigger Web Risk lookup',async()=>{
 for(const url of ['http://127.0.0.1:8080','https://10.0.0.5/path','https://public.example/login?token=SECRET']){
   const r=await scanLink(url,'',{webRiskKey:'TEST',fetchImpl:()=>{throw new Error('must not fetch')}});
   assert.notEqual(r.checked.reputation,'unavailable');assert.equal(r.checked.reputation,'not-checked');
 }
});
test('a configured Web Risk hit is reported as an external threat-list match',async()=>{
 let requested;
 const mock=async(u)=>{requested=new URL(u);return {ok:true,json:async()=>({threat:{threatTypes:['SOCIAL_ENGINEERING']}})}};
 const r=await scanLink('https://unsafe.example/pay','',{webRiskKey:'test',fetchImpl:mock});
 assert.equal(r.risk,'high');assert.equal(r.checked.reputation,'matched');
 assert.equal(requested.hostname,'webrisk.googleapis.com');assert.equal(requested.searchParams.get('uri'),'https://unsafe.example/pay');
});
test('missing threat-list match is not stated as proof of safety',async()=>{
 const r=await scanLink('https://www.example.org','',{webRiskKey:'test',fetchImpl:async()=>({ok:true,json:async()=>({})})});
 assert.equal(r.checked.reputation,'no-match');assert.match(r.summary,/not mean it is safe/);
});
test('network error preserves unknown reputation state',async()=>{
 const r=await scanLink('https://www.example.org','',{webRiskKey:'test',fetchImpl:async()=>{throw new Error('network')}});
 assert.equal(r.checked.reputation,'unavailable');
});
test('length limits protect scanner',()=>{
 assert.throws(()=>assessLink('https://example.org','x'.repeat(1501)));
 assert.throws(()=>extractLink('https://example.org/'+'x'.repeat(2100)));
});
